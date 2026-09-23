import { Router } from 'express';
import { SubjectController } from '../controllers/subjectController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', SubjectController.getAll);
router.get('/:id', SubjectController.getById);

router.post('/', authenticateToken, requireRole('ADMIN'), SubjectController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), SubjectController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), SubjectController.delete);

export default router;
