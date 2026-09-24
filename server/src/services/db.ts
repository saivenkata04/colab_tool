import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

let prisma: PrismaClient | null = null;
let usePrisma = false;

// Local JSON-based resilient persistence for instant zero-config dev
const STORAGE_FILE = path.resolve(process.cwd(), 'local_storage.json');

interface MemoryDB {
  users: Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    avatar?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  workspaces: Array<{
    id: string;
    name: string;
    description?: string | null;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  members: Array<{
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
    joinedAt: string;
  }>;
  documents: Array<{
    id: string;
    workspaceId: string;
    name: string;
    type: 'code' | 'note';
    language: string;
    content: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }>;
  comments: Array<{
    id: string;
    documentId: string;
    userId: string;
    content: string;
    lineNumber: number;
    resolved: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  versions: Array<{
    id: string;
    documentId: string;
    name: string;
    content: string;
    createdBy: string;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    workspaceId: string;
    userId: string;
    content: string;
    isCode?: boolean;
    createdAt: string;
  }>;
}

let memoryDB: MemoryDB = {
  users: [],
  workspaces: [],
  members: [],
  documents: [],
  comments: [],
  versions: [],
  messages: [],
};

// Load existing memory database if present
function loadStorage() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      memoryDB = JSON.parse(data);
    }
  } catch (e) {
    // start fresh
  }
}

function saveStorage() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(memoryDB, null, 2));
  } catch (e) {
    // ignore
  }
}

// Initialize seed data if empty
async function initSeedData() {
  if (memoryDB.users.length === 0) {
    const pwHash = await bcrypt.hash('password123', 10);
    const user1 = {
      id: 'usr-demo-1',
      name: 'Sai Krishna',
      email: 'demo1@example.com',
      passwordHash: pwHash,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sai',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const user2 = {
      id: 'usr-demo-2',
      name: 'Rahul Sharma',
      email: 'demo2@example.com',
      passwordHash: pwHash,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rahul',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const user3 = {
      id: 'usr-demo-3',
      name: 'Anil Kumar',
      email: 'anil@example.com',
      passwordHash: pwHash,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Anil',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ws1 = {
      id: 'ws-demo-collab',
      name: 'Collaborative Coding Room',
      description: 'Main collaborative workspace for coding and architectural notes.',
      ownerId: user1.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mem1 = { id: 'mem-1', workspaceId: ws1.id, userId: user1.id, role: 'owner', joinedAt: new Date().toISOString() };
    const mem2 = { id: 'mem-2', workspaceId: ws1.id, userId: user2.id, role: 'editor', joinedAt: new Date().toISOString() };
    const mem3 = { id: 'mem-3', workspaceId: ws1.id, userId: user3.id, role: 'viewer', joinedAt: new Date().toISOString() };

    const doc1 = {
      id: 'doc-py-1',
      workspaceId: ws1.id,
      name: 'main.py',
      type: 'code' as const,
      language: 'python',
      content: `# Collaborative Python Algorithm
import math

def calculate_factors(n):
    factors = []
    for i in range(1, int(math.isqrt(n)) + 1):
        if n % i == 0:
            factors.append(i)
            if i*i != n:
                factors.append(n // i)
    factors.sort()
    return factors

number = 360
print(f"Factors of {number}: {calculate_factors(number)}")
`,
      createdBy: user1.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const doc2 = {
      id: 'doc-js-1',
      workspaceId: ws1.id,
      name: 'app.js',
      type: 'code' as const,
      language: 'javascript',
      content: `// Real-Time Collaborative Workspace
// Multiple users can edit simultaneously using Yjs CRDT!

export function mergeStreams(streamA, streamB) {
  return [...new Set([...streamA, ...streamB])].sort((a, b) => a - b);
}

const list1 = [10, 25, 45, 99];
const list2 = [25, 50, 75, 99, 120];

console.log("Merged stream result:", mergeStreams(list1, list2));
`,
      createdBy: user1.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const doc3 = {
      id: 'doc-note-1',
      workspaceId: ws1.id,
      name: 'README.md',
      type: 'note' as const,
      language: 'markdown',
      content: `# 🚀 Collaborative Coding & Note-Taking Workspace

Welcome to your real-time collaborative workspace! Powered by **Yjs CRDT** and **WebSockets**.

### 🎯 Workspace Checklist
- [x] Multi-user conflict-free editing (Yjs CRDT)
- [x] Real-time collaborator cursors & presence
- [x] Code comments with line-by-line pinning
- [x] Google Docs-style Rich Note Taking
- [ ] Peer Review & Evaluation

### 💡 Tips
> **Instant Sync:** Edits synchronize incrementally using CRDT updates so concurrent edits never overwrite each other.
`,
      createdBy: user1.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const comment1 = {
      id: 'cmt-1',
      documentId: doc1.id,
      userId: user2.id,
      content: 'Should we add memoization for larger numbers here?',
      lineNumber: 8,
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryDB.users = [user1, user2, user3];
    memoryDB.workspaces = [ws1];
    memoryDB.members = [mem1, mem2, mem3];
    memoryDB.documents = [doc1, doc2, doc3];
    memoryDB.comments = [comment1];
    saveStorage();
  }
}

loadStorage();
initSeedData();

// Try initializing Prisma
try {
  prisma = new PrismaClient();
  prisma.$connect()
    .then(() => {
      usePrisma = true;
      console.log('✓ Connected to PostgreSQL via Prisma ORM');
    })
    .catch(() => {
      usePrisma = false;
      console.log('⚡ Using resilient local storage (PostgreSQL standby / Docker available via docker-compose up -d)');
    });
} catch (e) {
  usePrisma = false;
}

export const db = {
  // Users
  users: {
    async findUnique({ where }: { where: { email?: string; id?: string } }) {
      if (usePrisma && prisma) {
        try {
          return await (prisma as any).user.findUnique({ where });
        } catch (e) {}
      }
      return memoryDB.users.find((u) => (where.email ? u.email === where.email : u.id === where.id)) || null;
    },
    async create({ data }: { data: any }) {
      if (usePrisma && prisma) {
        try {
          return await (prisma as any).user.create({ data });
        } catch (e) {}
      }
      const user = {
        id: data.id || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryDB.users.push(user);
      saveStorage();
      return user;
    },
    async findMany() {
      return memoryDB.users;
    }
  },

  // Workspaces
  workspaces: {
    async findMany({ where }: { where?: { ownerId?: string; memberUserId?: string } }) {
      const allWs = memoryDB.workspaces.filter((w) => {
        if (!where) return true;
        if (where.ownerId && w.ownerId === where.ownerId) return true;
        if (where.memberUserId) {
          const isMember = memoryDB.members.some((m) => m.workspaceId === w.id && m.userId === where.memberUserId);
          return isMember || w.ownerId === where.memberUserId;
        }
        return true;
      });

      return allWs.map((ws) => {
        const owner = memoryDB.users.find((u) => u.id === ws.ownerId);
        const members = memoryDB.members.filter((m) => m.workspaceId === ws.id);
        const documents = memoryDB.documents.filter((d) => d.workspaceId === ws.id);
        return {
          ...ws,
          owner,
          _count: {
            members: members.length,
            documents: documents.length,
          },
        };
      });
    },

    async findUnique({ where }: { where: { id: string } }) {
      const ws = memoryDB.workspaces.find((w) => w.id === where.id);
      if (!ws) return null;

      const owner = memoryDB.users.find((u) => u.id === ws.ownerId);
      const members = memoryDB.members
        .filter((m) => m.workspaceId === ws.id)
        .map((m) => ({
          ...m,
          user: memoryDB.users.find((u) => u.id === m.userId),
        }));
      const documents = memoryDB.documents.filter((d) => d.workspaceId === ws.id);

      return {
        ...ws,
        owner,
        members,
        documents,
      };
    },

    async create({ data }: { data: any }) {
      const newWs = {
        id: data.id || `ws-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: data.name,
        description: data.description || '',
        ownerId: data.ownerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryDB.workspaces.push(newWs);

      // Auto-add owner as member
      memoryDB.members.push({
        id: `mem-${Date.now()}`,
        workspaceId: newWs.id,
        userId: data.ownerId,
        role: 'owner',
        joinedAt: new Date().toISOString(),
      });

      // Create default starter document
      const defaultDoc = {
        id: `doc-${Date.now()}`,
        workspaceId: newWs.id,
        name: 'main.js',
        type: 'code' as const,
        language: 'javascript',
        content: `// Welcome to ${newWs.name}\n// Collaborate with your team in real time!\n\nconsole.log("Ready to code!");\n`,
        createdBy: data.ownerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryDB.documents.push(defaultDoc);

      saveStorage();
      return this.findUnique({ where: { id: newWs.id } });
    },

    async update({ where, data }: { where: { id: string }; data: any }) {
      const ws = memoryDB.workspaces.find((w) => w.id === where.id);
      if (!ws) return null;
      if (data.name) ws.name = data.name;
      if (data.description !== undefined) ws.description = data.description;
      ws.updatedAt = new Date().toISOString();
      saveStorage();
      return this.findUnique({ where });
    },

    async delete({ where }: { where: { id: string } }) {
      memoryDB.workspaces = memoryDB.workspaces.filter((w) => w.id !== where.id);
      memoryDB.members = memoryDB.members.filter((m) => m.workspaceId !== where.id);
      memoryDB.documents = memoryDB.documents.filter((d) => d.workspaceId !== where.id);
      saveStorage();
      return { success: true };
    },
  },

  // Documents
  documents: {
    async findMany({ where }: { where: { workspaceId: string } }) {
      return memoryDB.documents.filter((d) => d.workspaceId === where.workspaceId);
    },

    async findUnique({ where }: { where: { id: string } }) {
      const doc = memoryDB.documents.find((d) => d.id === where.id);
      if (!doc) return null;
      const comments = memoryDB.comments
        .filter((c) => c.documentId === doc.id)
        .map((c) => ({
          ...c,
          user: memoryDB.users.find((u) => u.id === c.userId),
        }));
      const creator = memoryDB.users.find((u) => u.id === doc.createdBy);
      return {
        ...doc,
        creator,
        comments,
      };
    },

    async create({ data }: { data: any }) {
      const newDoc = {
        id: data.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        workspaceId: data.workspaceId,
        name: data.name,
        type: (data.type || 'code') as 'code' | 'note',
        language: data.language || (data.type === 'note' ? 'markdown' : 'javascript'),
        content: data.content || (data.type === 'note' ? `# ${data.name}\n\nStart writing notes collaboratively...` : `// ${data.name}\n`),
        createdBy: data.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryDB.documents.push(newDoc);
      saveStorage();
      return this.findUnique({ where: { id: newDoc.id } });
    },

    async update({ where, data }: { where: { id: string }; data: any }) {
      const doc = memoryDB.documents.find((d) => d.id === where.id);
      if (!doc) return null;
      if (data.name !== undefined) doc.name = data.name;
      if (data.content !== undefined) doc.content = data.content;
      if (data.language !== undefined) doc.language = data.language;
      if (data.type !== undefined) doc.type = data.type;
      doc.updatedAt = new Date().toISOString();
      saveStorage();
      return this.findUnique({ where });
    },

    async delete({ where }: { where: { id: string } }) {
      memoryDB.documents = memoryDB.documents.filter((d) => d.id !== where.id);
      memoryDB.comments = memoryDB.comments.filter((c) => c.documentId !== where.id);
      saveStorage();
      return { success: true };
    },
  },

  // Members
  members: {
    async findMany({ where }: { where: { workspaceId: string } }) {
      return memoryDB.members
        .filter((m) => m.workspaceId === where.workspaceId)
        .map((m) => ({
          ...m,
          user: memoryDB.users.find((u) => u.id === m.userId),
        }));
    },

    async create({ data }: { data: any }) {
      const existing = memoryDB.members.find(
        (m) => m.workspaceId === data.workspaceId && m.userId === data.userId
      );
      if (existing) {
        existing.role = data.role || existing.role;
        saveStorage();
        return existing;
      }
      const newMember = {
        id: `mem-${Date.now()}`,
        workspaceId: data.workspaceId,
        userId: data.userId,
        role: data.role || 'editor',
        joinedAt: new Date().toISOString(),
      };
      memoryDB.members.push(newMember);
      saveStorage();
      return {
        ...newMember,
        user: memoryDB.users.find((u) => u.id === newMember.userId),
      };
    },

    async delete({ where }: { where: { workspaceId_userId: { workspaceId: string; userId: string } } }) {
      memoryDB.members = memoryDB.members.filter(
        (m) => !(m.workspaceId === where.workspaceId_userId.workspaceId && m.userId === where.workspaceId_userId.userId)
      );
      saveStorage();
      return { success: true };
    },
  },

  // Comments
  comments: {
    async findMany({ where }: { where: { documentId: string } }) {
      return memoryDB.comments
        .filter((c) => c.documentId === where.documentId)
        .map((c) => ({
          ...c,
          user: memoryDB.users.find((u) => u.id === c.userId),
        }));
    },

    async create({ data }: { data: any }) {
      const newComment = {
        id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        documentId: data.documentId,
        userId: data.userId,
        content: data.content,
        lineNumber: Number(data.lineNumber) || 1,
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryDB.comments.push(newComment);
      saveStorage();
      return {
        ...newComment,
        user: memoryDB.users.find((u) => u.id === newComment.userId),
      };
    },

    async update({ where, data }: { where: { id: string }; data: any }) {
      const comment = memoryDB.comments.find((c) => c.id === where.id);
      if (!comment) return null;
      if (data.content !== undefined) comment.content = data.content;
      if (data.resolved !== undefined) comment.resolved = Boolean(data.resolved);
      comment.updatedAt = new Date().toISOString();
      saveStorage();
      return {
        ...comment,
        user: memoryDB.users.find((u) => u.id === comment.userId),
      };
    },

    async delete({ where }: { where: { id: string } }) {
      memoryDB.comments = memoryDB.comments.filter((c) => c.id !== where.id);
      saveStorage();
      return { success: true };
    },
  },

  // Document Versions (Checkpoints / Snapshots)
  versions: {
    async findMany({ where }: { where: { documentId: string } }) {
      return (memoryDB.versions || [])
        .filter((v) => v.documentId === where.documentId)
        .map((v) => ({
          ...v,
          user: memoryDB.users.find((u) => u.id === v.createdBy),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    async findUnique({ where }: { where: { id: string } }) {
      const ver = (memoryDB.versions || []).find((v) => v.id === where.id);
      if (!ver) return null;
      return {
        ...ver,
        user: memoryDB.users.find((u) => u.id === ver.createdBy),
      };
    },

    async create({ data }: { data: any }) {
      if (!memoryDB.versions) memoryDB.versions = [];
      const newVersion = {
        id: `ver-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        documentId: data.documentId,
        name: data.name || `Snapshot ${new Date().toLocaleTimeString()}`,
        content: data.content,
        createdBy: data.createdBy,
        createdAt: new Date().toISOString(),
      };
      memoryDB.versions.push(newVersion);
      saveStorage();
      return {
        ...newVersion,
        user: memoryDB.users.find((u) => u.id === newVersion.createdBy),
      };
    },
  },

  // Workspace Chat Messages
  messages: {
    async findMany({ where }: { where: { workspaceId: string } }) {
      return (memoryDB.messages || [])
        .filter((m) => m.workspaceId === where.workspaceId)
        .map((m) => ({
          ...m,
          user: memoryDB.users.find((u) => u.id === m.userId),
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    async create({ data }: { data: any }) {
      if (!memoryDB.messages) memoryDB.messages = [];
      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        workspaceId: data.workspaceId,
        userId: data.userId,
        content: data.content,
        isCode: Boolean(data.isCode),
        createdAt: new Date().toISOString(),
      };
      memoryDB.messages.push(newMsg);
      saveStorage();
      return {
        ...newMsg,
        user: memoryDB.users.find((u) => u.id === newMsg.userId),
      };
    },
  },
};
