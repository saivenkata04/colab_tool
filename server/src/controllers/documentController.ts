import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { db } from '../services/db.js';

export async function getDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = String(req.params.workspaceId);
    const documents = await db.documents.findMany({ where: { workspaceId } });
    return res.json(documents);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve documents' });
  }
}

export async function createDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = String(req.params.workspaceId);
    const userId = req.user!.id;
    const { name, type, language, content } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Document name is required' });
    }

    const workspace = await db.workspaces.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const isOwner = workspace.ownerId === userId;
    const member = workspace.members?.find((m: any) => m.userId === userId);
    if (!isOwner && member?.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot create documents' });
    }

    const doc = await db.documents.create({
      data: {
        workspaceId,
        name: name.trim(),
        type: type || 'code',
        language: language || 'javascript',
        content: content || '',
        createdBy: userId,
      },
    });

    return res.status(201).json(doc);
  } catch (error) {
    console.error('createDocument error:', error);
    return res.status(500).json({ error: 'Failed to create document' });
  }
}

export async function getDocumentById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const doc = await db.documents.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    return res.json(doc);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve document' });
  }
}

export async function updateDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;
    const { name, content, language, type } = req.body;

    const doc = await db.documents.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const workspace = await db.workspaces.findUnique({ where: { id: doc.workspaceId } });
    const isOwner = workspace?.ownerId === userId;
    const member = workspace?.members?.find((m: any) => m.userId === userId);
    if (!isOwner && member?.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot edit documents' });
    }

    const updated = await db.documents.update({
      where: { id },
      data: { name, content, language, type },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update document' });
  }
}

export async function deleteDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const doc = await db.documents.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const workspace = await db.workspaces.findUnique({ where: { id: doc.workspaceId } });
    const isOwner = workspace?.ownerId === userId;
    const member = workspace?.members?.find((m: any) => m.userId === userId);
    if (!isOwner && member?.role !== 'editor') {
      return res.status(403).json({ error: 'Only owners or editors can delete documents' });
    }

    await db.documents.delete({ where: { id } });
    return res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete document' });
  }
}

export async function getDocumentVersions(req: AuthenticatedRequest, res: Response) {
  try {
    const documentId = String(req.params.id);
    const versions = await db.versions.findMany({ where: { documentId } });
    return res.json(versions);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve document versions' });
  }
}

export async function createDocumentVersion(req: AuthenticatedRequest, res: Response) {
  try {
    const documentId = String(req.params.id);
    const userId = req.user!.id;
    const { name, content } = req.body;

    const doc = await db.documents.findUnique({ where: { id: documentId } });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const version = await db.versions.create({
      data: {
        documentId,
        name: name || `Snapshot ${new Date().toLocaleTimeString()}`,
        content: content !== undefined ? content : doc.content,
        createdBy: userId,
      },
    });

    return res.status(201).json(version);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create document version' });
  }
}

export async function restoreDocumentVersion(req: AuthenticatedRequest, res: Response) {
  try {
    const documentId = String(req.params.id);
    const { versionId } = req.body;

    const version = await db.versions.findUnique({ where: { id: versionId } });
    if (!version || version.documentId !== documentId) {
      return res.status(404).json({ error: 'Version not found for this document' });
    }

    // Update document content to this version's content
    const updated = await db.documents.update({
      where: { id: documentId },
      data: { content: version.content },
    });

    return res.json({
      message: `Document restored to snapshot "${version.name}"`,
      document: updated,
      restoredContent: version.content,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to restore document version' });
  }
}
