import { Router } from 'express';
import { handleAIAssist } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/assist', handleAIAssist);

export default router;
