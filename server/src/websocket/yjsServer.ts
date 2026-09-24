import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import { verifyToken, TokenPayload } from '../auth/jwt.js';
import { db } from '../services/db.js';

interface ClientConnection {
  ws: WebSocket;
  user: TokenPayload & { color: string; avatar?: string };
  workspaceId: string;
  documentId: string;
  cursor?: { line: number; column: number } | null;
  selection?: any;
}

// In-memory Y.Doc per documentId
const docMap = new Map<string, Y.Doc>();
// In-memory active connections per documentId
const roomClients = new Map<string, Set<ClientConnection>>();
// Auto-save debounce timers
const saveTimeouts = new Map<string, NodeJS.Timeout>();

const USER_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
];

function getRandomColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

async function getOrCreateYDoc(documentId: string): Promise<Y.Doc> {
  if (docMap.has(documentId)) {
    return docMap.get(documentId)!;
  }

  const ydoc = new Y.Doc();
  // Load initial content from database
  try {
    const doc = await db.documents.findUnique({ where: { id: documentId } });
    if (doc && doc.content) {
      const ytext = ydoc.getText('content');
      ytext.insert(0, doc.content);
    }
  } catch (err) {
    console.error(`Failed to load initial content for doc ${documentId}:`, err);
  }

  docMap.set(documentId, ydoc);
  return ydoc;
}

function scheduleAutoSave(documentId: string) {
  if (saveTimeouts.has(documentId)) {
    clearTimeout(saveTimeouts.get(documentId)!);
  }

  const timer = setTimeout(async () => {
    saveTimeouts.delete(documentId);
    const ydoc = docMap.get(documentId);
    if (!ydoc) return;
    const textContent = ydoc.getText('content').toString();
    try {
      await db.documents.update({
        where: { id: documentId },
        data: { content: textContent },
      });
      // Broadcast save confirmation
      broadcastToRoom(documentId, {
        type: 'save-status',
        status: 'saved',
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error(`Auto-save failed for doc ${documentId}:`, e);
    }
  }, 2000); // 2 second debounce

  saveTimeouts.set(documentId, timer);
}

function broadcastToRoom(documentId: string, message: any, excludeWs?: WebSocket) {
  const clients = roomClients.get(documentId);
  if (!clients) return;
  const payload = JSON.stringify(message);

  for (const client of clients) {
    if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function getRoomPresence(documentId: string) {
  const clients = roomClients.get(documentId);
  if (!clients) return [];
  return Array.from(clients).map((c) => ({
    userId: c.user.id,
    name: c.user.name,
    email: c.user.email,
    color: c.user.color,
    avatar: c.user.avatar,
    cursor: c.cursor,
    selection: c.selection,
  }));
}

export function setupWebSocketServer(port: number = 8080): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on('connection', async (ws: WebSocket, req) => {
    // Parse query parameters
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');
    const workspaceId = url.searchParams.get('workspaceId');
    const documentId = url.searchParams.get('documentId');

    // Authenticate token
    if (!token) {
      ws.close(1008, 'Token missing');
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      ws.close(1008, 'Invalid token');
      return;
    }

    if (!workspaceId || !documentId) {
      ws.close(1008, 'workspaceId and documentId required');
      return;
    }

    // Verify workspace authorization
    const workspace = await db.workspaces.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      ws.close(1008, 'Workspace not found');
      return;
    }

    const isOwner = workspace.ownerId === payload.id;
    const isMember = workspace.members?.some((m: any) => m.userId === payload.id);
    if (!isOwner && !isMember) {
      ws.close(1008, 'Unauthorized access to workspace');
      return;
    }

    const client: ClientConnection = {
      ws,
      user: {
        ...payload,
        color: getRandomColor(payload.name || payload.email),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(payload.name)}`,
      },
      workspaceId,
      documentId,
      cursor: null,
      selection: null,
    };

    // Add to room
    if (!roomClients.has(documentId)) {
      roomClients.set(documentId, new Set());
    }
    roomClients.get(documentId)!.add(client);

    // Get or initialize Yjs document
    const ydoc = await getOrCreateYDoc(documentId);

    // Step 1: Send initial Yjs document state as base64 update chunk
    const docState = Y.encodeStateAsUpdate(ydoc);
    ws.send(
      JSON.stringify({
        type: 'sync-init',
        documentId,
        update: Buffer.from(docState).toString('base64'),
        presence: getRoomPresence(documentId),
      })
    );

    // Step 2: Notify others in room
    broadcastToRoom(
      documentId,
      {
        type: 'user-joined',
        user: client.user,
        presence: getRoomPresence(documentId),
      },
      ws
    );

    // Handle incoming messages
    ws.on('message', async (data: string | Buffer) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          // Yjs incremental CRDT update
          case 'yjs-update': {
            if (msg.update) {
              const binaryUpdate = Buffer.from(msg.update, 'base64');
              Y.applyUpdate(ydoc, binaryUpdate);

              // Broadcast update incrementally to all other peers in the room
              broadcastToRoom(
                documentId,
                {
                  type: 'yjs-update',
                  documentId,
                  update: msg.update,
                },
                ws
              );

              // Trigger auto-save debounce
              scheduleAutoSave(documentId);
            }
            break;
          }

          // Cursor and selection awareness update
          case 'cursor-update': {
            client.cursor = msg.position;
            client.selection = msg.selection;

            broadcastToRoom(
              documentId,
              {
                type: 'cursor-update',
                userId: client.user.id,
                user: client.user,
                position: msg.position,
                selection: msg.selection,
              },
              ws
            );
            break;
          }

          // In-room comment notification
          case 'new-comment': {
            broadcastToRoom(documentId, {
              type: 'comment-added',
              comment: msg.comment,
            });
            break;
          }

          // WebRTC Voice Huddle Signaling
          case 'voice-signal': {
            broadcastToRoom(
              documentId,
              {
                type: 'voice-signal',
                senderId: client.user.id,
                senderName: client.user.name,
                signal: msg.signal,
                action: msg.action,
              },
              ws
            );
            break;
          }

          // Collaborative Architecture Whiteboard Synchronization
          case 'whiteboard-update': {
            broadcastToRoom(
              documentId,
              {
                type: 'whiteboard-update',
                nodes: msg.nodes,
                edges: msg.edges,
                senderId: client.user.id,
              },
              ws
            );
            break;
          }

          // Live AI "SyncBot" Presence & Stream Indicator
          case 'ai-presence': {
            broadcastToRoom(documentId, {
              type: 'ai-presence',
              active: msg.active,
              cursor: msg.cursor,
              status: msg.status,
            });
            break;
          }

          // Document switch
          case 'switch-document': {
            // Client changing active doc
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    // Cleanup on disconnect
    ws.on('close', () => {
      const clients = roomClients.get(documentId);
      if (clients) {
        clients.delete(client);
        if (clients.size === 0) {
          roomClients.delete(documentId);
        }
      }

      broadcastToRoom(documentId, {
        type: 'user-left',
        userId: client.user.id,
        user: client.user,
        presence: getRoomPresence(documentId),
      });
    });
  });

  console.log(`⚡ WebSocket Collaboration Server running on ws://localhost:${port}`);
  return wss;
}
