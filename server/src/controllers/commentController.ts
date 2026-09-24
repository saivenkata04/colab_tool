import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { db } from '../services/db.js';

export async function getComments(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id); // documentId
    const comments = await db.comments.findMany({ where: { documentId: id } });
    return res.json(comments);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve comments' });
  }
}

export async function createComment(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id); // documentId
    const userId = req.user!.id;
    const { content, lineNumber } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const doc = await db.documents.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const comment = await db.comments.create({
      data: {
        documentId: id,
        userId,
        content: content.trim(),
        lineNumber: Number(lineNumber) || 1,
      },
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error('createComment error:', error);
    return res.status(500).json({ error: 'Failed to create comment' });
  }
}

export async function updateComment(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id); // commentId
    const { content, resolved } = req.body;

    const updated = await db.comments.update({
      where: { id },
      data: { content, resolved },
    });

    if (!updated) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update comment' });
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response) {
  try {
    const id = String(req.params.id);
    await db.comments.delete({ where: { id } });
    return res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
}
