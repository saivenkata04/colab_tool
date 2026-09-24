import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { db } from '../services/db.js';

export async function getWorkspaceMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = String(req.params.workspaceId);
    const messages = await db.messages.findMany({ where: { workspaceId } });
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve workspace messages' });
  }
}

export async function sendWorkspaceMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = String(req.params.workspaceId);
    const userId = req.user!.id;
    const { content, isCode } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await db.messages.create({
      data: {
        workspaceId,
        userId,
        content: content.trim(),
        isCode: Boolean(isCode),
      },
    });

    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
