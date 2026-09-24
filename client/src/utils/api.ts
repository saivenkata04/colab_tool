import { User, Workspace, Document, WorkspaceMember, Comment, AuthResponse } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

// Initial Mock Seed Data for Vercel Static Deployments
const STORAGE_KEYS = {
  USER: 'synccode_user',
  WORKSPACES: 'synccode_workspaces',
  DOCUMENTS: 'synccode_documents',
  COMMENTS: 'synccode_comments',
};

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
}

// In-Memory / LocalStorage Mock Handler for when backend is offline or on static Vercel (405 fallback)
function handleMockFallback<T>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  // 1. Auth endpoints
  if (endpoint === '/auth/login' || endpoint === '/auth/register' || endpoint === '/auth/github') {
    const email = body.email || 'developer@synccode.dev';
    const name = body.name || email.split('@')[0] || 'Developer';
    const user: User = {
      id: 'u-' + Math.random().toString(36).substring(2, 7),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocalData(STORAGE_KEYS.USER, user);
    return { token: 'mock-jwt-token-' + Date.now(), user } as unknown as T;
  }

  if (endpoint === '/auth/me') {
    const user = getLocalData<User>(STORAGE_KEYS.USER, {
      id: 'u-demo',
      name: 'Raju Developer',
      email: 'raju@gmail.com',
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return user as unknown as T;
  }

  // 2. Workspaces endpoints
  if (endpoint === '/workspaces' && method === 'GET') {
    const workspaces = getLocalData<Workspace[]>(STORAGE_KEYS.WORKSPACES, [
      {
        id: 'ws-demo-lab',
        name: 'SyncCode Distributed Lab',
        description: 'Real-time CRDT & System Architecture Collaboration Studio',
        ownerId: 'u-demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    return workspaces as unknown as T;
  }

  if (endpoint === '/workspaces' && method === 'POST') {
    const workspaces = getLocalData<Workspace[]>(STORAGE_KEYS.WORKSPACES, []);
    const newWs: Workspace = {
      id: 'ws-' + Date.now(),
      name: body.name || 'Untitled Workspace',
      description: body.description || '',
      ownerId: 'u-demo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    workspaces.unshift(newWs);
    setLocalData(STORAGE_KEYS.WORKSPACES, workspaces);
    return newWs as unknown as T;
  }

  if (endpoint.startsWith('/workspaces/') && !endpoint.includes('/documents') && !endpoint.includes('/members') && method === 'GET') {
    const wsId = endpoint.split('/')[2];
    const workspaces = getLocalData<Workspace[]>(STORAGE_KEYS.WORKSPACES, [
      {
        id: 'ws-demo-lab',
        name: 'SyncCode Distributed Lab',
        description: 'Real-time CRDT & System Architecture Collaboration Studio',
        ownerId: 'u-demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    const found = workspaces.find((w) => w.id === wsId) || workspaces[0];
    return found as unknown as T;
  }

  if (endpoint.startsWith('/workspaces/') && endpoint.endsWith('/documents') && method === 'GET') {
    const wsId = endpoint.split('/')[2];
    const allDocs = getLocalData<Document[]>(STORAGE_KEYS.DOCUMENTS, [
      {
        id: 'doc-algo',
        workspaceId: wsId,
        name: 'lru_cache.py',
        type: 'code',
        language: 'python',
        createdBy: 'u-demo',
        content: `# SyncCode Real-Time Algorithm Lab
# Problem: LRU Cache Implementation with O(1) Operations

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.order = []

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.order.remove(key)
        self.order.append(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.capacity:
            oldest = self.order.pop(0)
            del self.cache[oldest]
        self.cache[key] = value
        self.order.append(key)

cache = LRUCache(2)
cache.put(1, 100)
cache.put(2, 200)
print("Cache Key 1:", cache.get(1))
`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'doc-notes',
        workspaceId: wsId,
        name: 'architecture_specs.md',
        type: 'note',
        language: 'markdown',
        createdBy: 'u-demo',
        content: `# SyncCode Architecture & CRDT Specifications

## Overview
SyncCode is a 2026 developer collaboration platform powered by:
- **Yjs CRDTs**: Automatic conflict-free multi-user merges.
- **WebRTC P2P Audio**: Native voice huddle with frequency visualizer.
- **SyncBot (AI)**: In-room live peer typing code directly to CRDT.
- **Time-Travel Keystroke Replay**: Interactive scrubber slider.
- **Architecture Whiteboard**: Draggable node system diagramming.
`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    return allDocs.filter((d) => d.workspaceId === wsId || d.workspaceId === 'ws-demo-lab') as unknown as T;
  }

  if (endpoint.startsWith('/workspaces/') && endpoint.endsWith('/documents') && method === 'POST') {
    const wsId = endpoint.split('/')[2];
    const docs = getLocalData<Document[]>(STORAGE_KEYS.DOCUMENTS, []);
    const newDoc: Document = {
      id: 'doc-' + Date.now(),
      workspaceId: wsId,
      name: body.name || 'untitled.py',
      type: body.type || 'code',
      language: body.language || 'python',
      createdBy: 'u-demo',
      content: body.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    docs.push(newDoc);
    setLocalData(STORAGE_KEYS.DOCUMENTS, docs);
    return newDoc as unknown as T;
  }

  // 3. Members endpoint
  if (endpoint.includes('/members') && method === 'GET') {
    const wsId = endpoint.split('/')[2] || 'ws-demo-lab';
    const members: WorkspaceMember[] = [
      {
        id: 'm-1',
        workspaceId: wsId,
        userId: 'u-self',
        role: 'owner',
        joinedAt: new Date().toISOString(),
        user: { id: 'u-self', name: 'Raju (You)', email: 'raju@gmail.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      },
      {
        id: 'm-2',
        workspaceId: wsId,
        userId: 'u-alice',
        role: 'editor',
        joinedAt: new Date().toISOString(),
        user: { id: 'u-alice', name: 'Alice Engineer', email: 'alice@synccode.dev', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      },
      {
        id: 'm-3',
        workspaceId: wsId,
        userId: 'u-syncbot',
        role: 'editor',
        joinedAt: new Date().toISOString(),
        user: { id: 'u-syncbot', name: 'SyncBot (AI)', email: 'bot@synccode.ai', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      },
    ];
    return members as unknown as T;
  }

  // 4. Comments
  if (endpoint.includes('/comments') && method === 'GET') {
    const comments: Comment[] = [
      {
        id: 'c-1',
        documentId: 'doc-algo',
        userId: 'u-alice',
        content: 'Check for potential key eviction order edge cases when capacity is 0.',
        lineNumber: 16,
        resolved: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        user: { id: 'u-alice', name: 'Alice Engineer', email: 'alice@synccode.dev', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      },
    ];
    return comments as unknown as T;
  }

  // 5. AI Assist
  if (endpoint === '/ai/assist') {
    return {
      result: `\n# Generated by SyncBot (AI Live Collaborator)\ndef optimize_lru_cache(cache_instance):\n    """O(1) amortized double-linked list optimization."""\n    return cache_instance\n`,
    } as unknown as T;
  }

  // Generic fallback
  return {} as T;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('collab_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // If endpoint responds with 405 (Vercel static deploy without backend), 404, or 502:
    if (response.status === 405 || response.status === 404 || response.status === 502) {
      console.warn(`[SyncCode API] ${endpoint} returned ${response.status}. Using smart offline/demo storage.`);
      return handleMockFallback<T>(endpoint, options);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If unauthorized or specific API error, fallback gracefully on static hosting
      if (response.status === 401 && endpoint !== '/auth/login') {
        throw new Error(data.error || 'Authentication session expired');
      }
      return handleMockFallback<T>(endpoint, options);
    }

    return data as T;
  } catch (err: any) {
    // If backend is unreachable (e.g. network failure on Vercel), fall back to client mock
    console.warn(`[SyncCode API] Network call to ${endpoint} failed. Activating seamless local mode:`, err.message);
    return handleMockFallback<T>(endpoint, options);
  }
}

export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};
