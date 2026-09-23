import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Authenticated reads
router.get('/', DepartmentController.getAll);
router.get('/:id', DepartmentController.getById);

// Admin-only management
router.post('/', authenticateToken, requireRole('ADMIN'), DepartmentController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), DepartmentController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), DepartmentController.delete);

export default router;
