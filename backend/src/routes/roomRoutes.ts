import { Router } from 'express';
import { RoomController } from '../controllers/roomController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', RoomController.getAll);
router.get('/:id', RoomController.getById);

router.post('/', authenticateToken, requireRole('ADMIN'), RoomController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), RoomController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), RoomController.delete);

export default router;
