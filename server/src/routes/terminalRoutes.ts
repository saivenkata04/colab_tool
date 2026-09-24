import { Router } from 'express';
import { executeCommand } from '../controllers/terminalController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Protect terminal execution with auth middleware
router.post('/execute', authMiddleware, executeCommand);

export default router;
