import { Router } from 'express';
import { SectionController } from '../controllers/sectionController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', SectionController.getAll);
router.post('/', authenticateToken, requireRole('ADMIN'), SectionController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), SectionController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), SectionController.delete);

export default router;
