import { Router } from 'express';
import { ClassController } from '../controllers/classController.js';
import { SectionController } from '../controllers/sectionController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Authenticated read
router.get('/', ClassController.getAll);
router.get('/:id', ClassController.getById);
router.get('/:classId/sections', SectionController.getByClass);

// Admin-only management
router.post('/', authenticateToken, requireRole('ADMIN'), ClassController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), ClassController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), ClassController.delete);

export default router;
