import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, AuthController.login);
router.post('/register', authLimiter, AuthController.register);
router.get('/me', authenticateToken, AuthController.me);

export default router;
