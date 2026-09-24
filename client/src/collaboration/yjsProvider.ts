import * as Y from 'yjs';

export interface PresenceUser {
  userId: string;
  name: string;
  email: string;
  color: string;
  avatar?: string;
  cursor?: { line: number; column: number } | null;
  selection?: any;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

export class YjsWebSocketProvider {
  public ydoc: Y.Doc;
  private ws: WebSocket | null = null;
  private url: string;
  private isDestroyed = false;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;

  public status: ConnectionStatus = 'connecting';
  public presence: PresenceUser[] = [];

  private onStatusChangeCallbacks = new Set<(status: ConnectionStatus) => void>();
  private onPresenceChangeCallbacks = new Set<(presence: PresenceUser[]) => void>();
  private onSaveStatusCallbacks = new Set<(status: string) => void>();
  private onVoiceSignalCallbacks = new Set<(data: any) => void>();
  private onWhiteboardUpdateCallbacks = new Set<(data: any) => void>();
  private onAIPresenceCallbacks = new Set<(data: any) => void>();

  constructor({
    wsUrl,
    token,
    workspaceId,
    documentId,
    ydoc = new Y.Doc(),
  }: {
    wsUrl?: string;
    token: string;
    workspaceId: string;
    documentId: string;
    ydoc?: Y.Doc;
  }) {
    this.ydoc = ydoc;

    const computedWsUrl =
      wsUrl ||
      (import.meta.env.VITE_WS_URL as string) ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080`
        : 'ws://localhost:8080');

    this.url = `${computedWsUrl}?token=${encodeURIComponent(token)}&workspaceId=${encodeURIComponent(workspaceId)}&documentId=${encodeURIComponent(documentId)}`;

    // Listen for local Y.Doc changes to send incremental CRDT updates
    this.ydoc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'remote' && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const base64Update = btoa(String.fromCharCode(...update));
        this.ws.send(
          JSON.stringify({
            type: 'yjs-update',
            update: base64Update,
          })
        );
      }
    });

    this.connect();
  }

  private connect() {
    if (this.isDestroyed) return;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            // Initial document sync
            case 'sync-init': {
              if (msg.update) {
                const binary = Uint8Array.from(atob(msg.update), (c) => c.charCodeAt(0));
                Y.applyUpdate(this.ydoc, binary, 'remote');
              }
              if (msg.presence) {
                this.setPresence(msg.presence);
              }
              break;
            }

            // Incremental Yjs CRDT update from remote peer
            case 'yjs-update': {
              if (msg.update) {
                const binary = Uint8Array.from(atob(msg.update), (c) => c.charCodeAt(0));
                Y.applyUpdate(this.ydoc, binary, 'remote');
              }
              break;
            }

            // Presence updates
            case 'user-joined':
            case 'user-left': {
              if (msg.presence) {
                this.setPresence(msg.presence);
              }
              break;
            }

            // Cursor movement from peer
            case 'cursor-update': {
              const updated = this.presence.map((p) =>
                p.userId === msg.userId ? { ...p, cursor: msg.position, selection: msg.selection } : p
              );
              this.setPresence(updated);
              break;
            }

            // Document save confirmation
            case 'save-status': {
              this.onSaveStatusCallbacks.forEach((cb) => cb(msg.status));
              break;
            }

            // WebRTC Voice Huddle signal
            case 'voice-signal': {
              this.onVoiceSignalCallbacks.forEach((cb) => cb(msg));
              break;
            }

            // Collaborative Architecture Whiteboard update
            case 'whiteboard-update': {
              this.onWhiteboardUpdateCallbacks.forEach((cb) => cb(msg));
              break;
            }

            // Live AI SyncBot Presence
            case 'ai-presence': {
              this.onAIPresenceCallbacks.forEach((cb) => cb(msg));
              break;
            }
          }
        } catch (err) {
          console.error('Error handling WS message in Yjs provider:', err);
        }
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          this.setStatus('disconnected');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        if (this.ws) this.ws.close();
      };
    } catch (e) {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed || this.reconnectTimer) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  public sendCursor(position: { line: number; column: number } | null, selection: any = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'cursor-update',
          position,
          selection,
        })
      );
    }
  }

  public sendVoiceSignal(action: string, signal: any = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'voice-signal',
          action,
          signal,
        })
      );
    }
  }

  public sendWhiteboardUpdate(nodes: any[], edges: any[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'whiteboard-update',
          nodes,
          edges,
        })
      );
    }
  }

  public sendAIPresence(active: boolean, cursor: any = null, status: string = '') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'ai-presence',
          active,
          cursor,
          status,
        })
      );
    }
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.onStatusChangeCallbacks.forEach((cb) => cb(status));
  }

  private setPresence(presence: PresenceUser[]) {
    this.presence = presence;
    this.onPresenceChangeCallbacks.forEach((cb) => cb(presence));
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.onStatusChangeCallbacks.add(callback);
    callback(this.status);
    return () => this.onStatusChangeCallbacks.delete(callback);
  }

  public onPresenceChange(callback: (presence: PresenceUser[]) => void) {
    this.onPresenceChangeCallbacks.add(callback);
    callback(this.presence);
    return () => this.onPresenceChangeCallbacks.delete(callback);
  }

  public onSaveStatus(callback: (status: string) => void) {
    this.onSaveStatusCallbacks.add(callback);
    return () => this.onSaveStatusCallbacks.delete(callback);
  }

  public onVoiceSignal(callback: (data: any) => void) {
    this.onVoiceSignalCallbacks.add(callback);
    return () => this.onVoiceSignalCallbacks.delete(callback);
  }

  public onWhiteboardUpdate(callback: (data: any) => void) {
    this.onWhiteboardUpdateCallbacks.add(callback);
    return () => this.onWhiteboardUpdateCallbacks.delete(callback);
  }

  public onAIPresence(callback: (data: any) => void) {
    this.onAIPresenceCallbacks.add(callback);
    return () => this.onAIPresenceCallbacks.delete(callback);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onStatusChangeCallbacks.clear();
    this.onPresenceChangeCallbacks.clear();
    this.onSaveStatusCallbacks.clear();
    this.onVoiceSignalCallbacks.clear();
    this.onWhiteboardUpdateCallbacks.clear();
    this.onAIPresenceCallbacks.clear();
  }
}
