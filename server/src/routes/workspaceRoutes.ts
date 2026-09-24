import { Router } from 'express';
import {
  getWorkspaces,
  createWorkspace,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspaceController.js';
import { getDocuments, createDocument } from '../controllers/documentController.js';
import { getMembers, addMember, removeMember } from '../controllers/memberController.js';
import { getWorkspaceMessages, sendWorkspaceMessage } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Workspaces
router.get('/', getWorkspaces);
router.post('/', createWorkspace);
router.get('/:id', getWorkspaceById);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);

// Documents under workspace
router.get('/:workspaceId/documents', getDocuments);
router.post('/:workspaceId/documents', createDocument);

// Members under workspace
router.get('/:id/members', getMembers);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

// Chat messages under workspace
router.get('/:workspaceId/messages', getWorkspaceMessages);
router.post('/:workspaceId/messages', sendWorkspaceMessage);

export default router;
