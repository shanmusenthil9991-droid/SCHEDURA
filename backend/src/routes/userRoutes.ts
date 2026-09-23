import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Admin-only user management
router.use(authenticateToken, requireRole('ADMIN'));

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', UserController.create);
router.put('/:id', UserController.update);
router.patch('/:id/status', UserController.toggleStatus);
router.delete('/:id', UserController.delete);

export default router;
