export type UserRole = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: UserRole;
  joinedAt: string | Date;
  user?: User;
}

export interface Document {
  id: string;
  workspaceId: string;
  name: string;
  type: 'code' | 'note';
  language: string;
  content: string;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  creator?: User;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  lineNumber: number;
  resolved: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: User;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  owner?: User;
  members?: WorkspaceMember[];
  documents?: Document[];
  _count?: {
    members: number;
    documents: number;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface CollaboratorPresence {
  userId: string;
  name: string;
  color: string;
  avatar?: string | null;
  activeDocumentId?: string | null;
  cursor?: CursorPosition | null;
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  } | null;
  lastActive: number;
}
