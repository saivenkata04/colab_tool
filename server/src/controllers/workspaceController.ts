import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { db } from '../services/db.js';

export async function getWorkspaces(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const workspaces = await db.workspaces.findMany({
      where: { memberUserId: userId },
    });
    return res.json(workspaces);
  } catch (error) {
    console.error('getWorkspaces error:', error);
    return res.status(500).json({ error: 'Failed to retrieve workspaces' });
  }
}

export async function createWorkspace(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const workspace = await db.workspaces.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: userId,
      },
    });

    return res.status(201).json(workspace);
  } catch (error) {
    console.error('createWorkspace error:', error);
    return res.status(500).json({ error: 'Failed to create workspace' });
  }
}

export async function getWorkspaceById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const workspace = await db.workspaces.findUnique({ where: { id } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const isOwner = workspace.ownerId === userId;
    const isMember = workspace.members?.some((m: any) => m.userId === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'You do not have access to this workspace' });
    }

    return res.json(workspace);
  } catch (error) {
    console.error('getWorkspaceById error:', error);
    return res.status(500).json({ error: 'Failed to retrieve workspace' });
  }
}

export async function updateWorkspace(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;
    const { name, description } = req.body;

    const existing = await db.workspaces.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const isOwner = existing.ownerId === userId;
    const membership = existing.members?.find((m: any) => m.userId === userId);
    if (!isOwner && membership?.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot modify workspace settings' });
    }

    const updated = await db.workspaces.update({
      where: { id },
      data: { name: name?.trim(), description: description?.trim() },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update workspace' });
  }
}

export async function deleteWorkspace(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await db.workspaces.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (existing.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the workspace owner can delete it' });
    }

    await db.workspaces.delete({ where: { id } });
    return res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete workspace' });
  }
}
