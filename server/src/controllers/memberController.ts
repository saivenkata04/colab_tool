import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { db } from '../services/db.js';

export async function getMembers(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id); // workspaceId
    const members = await db.members.findMany({ where: { workspaceId: id } });
    return res.json(members);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve workspace members' });
  }
}

export async function addMember(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id); // workspaceId
    const { email, role } = req.body;
    const currentUserId = req.user!.id;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Collaborator email is required' });
    }

    const workspace = await db.workspaces.findUnique({ where: { id } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== currentUserId) {
      return res.status(403).json({ error: 'Only the workspace owner can invite members' });
    }

    let targetUser = await db.users.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!targetUser) {
      targetUser = await db.users.create({
        data: {
          name: email.split('@')[0],
          email: email.toLowerCase().trim(),
          passwordHash: '$2a$10$e5Z2mKkHh8J3Mv3v.placeholder',
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        },
      });
    }

    const member = await db.members.create({
      data: {
        workspaceId: id,
        userId: targetUser.id,
        role: role === 'viewer' ? 'viewer' : 'editor',
      },
    });

    return res.status(201).json(member);
  } catch (error) {
    console.error('addMember error:', error);
    return res.status(500).json({ error: 'Failed to add workspace member' });
  }
}

export async function removeMember(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    const userId = String(req.params.userId);
    const currentUserId = req.user!.id;

    const workspace = await db.workspaces.findUnique({ where: { id } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== currentUserId && currentUserId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to remove this member' });
    }

    await db.members.delete({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });

    return res.json({ message: 'Member removed successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove member' });
  }
}
