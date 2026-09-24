import { Router } from 'express';
import { updateComment, deleteComment } from '../controllers/commentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

export default router;
