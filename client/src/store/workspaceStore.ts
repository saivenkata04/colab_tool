import { create } from 'zustand';
import { apiRequest } from '../utils/api';
import { Workspace, Document, WorkspaceMember, Comment } from '../types';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  documents: Document[];
  currentDocument: Document | null;
  members: WorkspaceMember[];
  comments: Comment[];
  isLoading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  fetchWorkspaceById: (id: string) => Promise<void>;
  updateWorkspace: (id: string, name: string, description?: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;

  fetchDocuments: (workspaceId: string) => Promise<void>;
  createDocument: (workspaceId: string, name: string, type: 'code' | 'note', language?: string) => Promise<Document>;
  selectDocument: (doc: Document) => void;
  updateDocumentContent: (id: string, content: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  fetchMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, email: string, role: string) => Promise<void>;
  removeMember: (workspaceId: string, userId: string) => Promise<void>;

  fetchComments: (documentId: string) => Promise<void>;
  createComment: (documentId: string, content: string, lineNumber: number) => Promise<void>;
  toggleResolveComment: (commentId: string, resolved: boolean) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  documents: [],
  currentDocument: null,
  members: [],
  comments: [],
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await apiRequest<Workspace[]>('/workspaces');
      set({ workspaces, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createWorkspace: async (name: string, description?: string) => {
    const ws = await apiRequest<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    set((state) => ({ workspaces: [ws, ...state.workspaces] }));
    return ws;
  },

  fetchWorkspaceById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const ws = await apiRequest<Workspace>(`/workspaces/${id}`);
      const docs = ws.documents || [];
      set({
        currentWorkspace: ws,
        documents: docs,
        members: ws.members || [],
        currentDocument: docs[0] || null,
        isLoading: false,
      });
      if (docs[0]) {
        get().fetchComments(docs[0].id);
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateWorkspace: async (id: string, name: string, description?: string) => {
    const updated = await apiRequest<Workspace>(`/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    });
    set((state) => ({
      currentWorkspace: updated,
      workspaces: state.workspaces.map((w) => (w.id === id ? updated : w)),
    }));
  },

  deleteWorkspace: async (id: string) => {
    await apiRequest(`/workspaces/${id}`, { method: 'DELETE' });
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace: null,
    }));
  },

  fetchDocuments: async (workspaceId: string) => {
    const docs = await apiRequest<Document[]>(`/workspaces/${workspaceId}/documents`);
    set({ documents: docs });
  },

  createDocument: async (workspaceId: string, name: string, type: 'code' | 'note', language = 'javascript') => {
    const doc = await apiRequest<Document>(`/workspaces/${workspaceId}/documents`, {
      method: 'POST',
      body: JSON.stringify({ name, type, language }),
    });
    set((state) => ({
      documents: [...state.documents, doc],
      currentDocument: doc,
    }));
    return doc;
  },

  selectDocument: (doc: Document) => {
    set({ currentDocument: doc });
    get().fetchComments(doc.id);
  },

  updateDocumentContent: async (id: string, content: string) => {
    await apiRequest<Document>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? { ...d, content } : d)),
      currentDocument: state.currentDocument?.id === id ? { ...state.currentDocument, content } : state.currentDocument,
    }));
  },

  deleteDocument: async (id: string) => {
    await apiRequest(`/documents/${id}`, { method: 'DELETE' });
    set((state) => {
      const remaining = state.documents.filter((d) => d.id !== id);
      return {
        documents: remaining,
        currentDocument: state.currentDocument?.id === id ? remaining[0] || null : state.currentDocument,
      };
    });
  },

  fetchMembers: async (workspaceId: string) => {
    const members = await apiRequest<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
    set({ members });
  },

  inviteMember: async (workspaceId: string, email: string, role: string) => {
    const newMember = await apiRequest<WorkspaceMember>(`/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
    set((state) => ({
      members: [...state.members.filter((m) => m.userId !== newMember.userId), newMember],
    }));
  },

  removeMember: async (workspaceId: string, userId: string) => {
    await apiRequest(`/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' });
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    }));
  },

  fetchComments: async (documentId: string) => {
    try {
      const comments = await apiRequest<Comment[]>(`/documents/${documentId}/comments`);
      set({ comments });
    } catch (e) {
      set({ comments: [] });
    }
  },

  createComment: async (documentId: string, content: string, lineNumber: number) => {
    const comment = await apiRequest<Comment>(`/documents/${documentId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, lineNumber }),
    });
    set((state) => ({ comments: [...state.comments, comment] }));
  },

  toggleResolveComment: async (commentId: string, resolved: boolean) => {
    const updated = await apiRequest<Comment>(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ resolved }),
    });
    set((state) => ({
      comments: state.comments.map((c) => (c.id === commentId ? updated : c)),
    }));
  },

  deleteComment: async (commentId: string) => {
    await apiRequest(`/comments/${commentId}`, { method: 'DELETE' });
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== commentId),
    }));
  },
}));
