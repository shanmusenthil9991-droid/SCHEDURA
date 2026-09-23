import { Router } from 'express';
import { StudentController } from '../controllers/studentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', StudentController.getAll);
router.get('/:id', StudentController.getById);

export default router;
