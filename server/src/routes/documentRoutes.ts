import { Router } from 'express';
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentVersions,
  createDocumentVersion,
  restoreDocumentVersion,
} from '../controllers/documentController.js';
import { getComments, createComment } from '../controllers/commentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/:id', getDocumentById);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

// Document Version History
router.get('/:id/versions', getDocumentVersions);
router.post('/:id/versions', createDocumentVersion);
router.post('/:id/restore', restoreDocumentVersion);

// Comments under document
router.get('/:id/comments', getComments);
router.post('/:id/comments', createComment);

export default router;
