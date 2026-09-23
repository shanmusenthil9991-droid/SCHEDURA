import { Router } from 'express';
import { StatsController } from '../controllers/statsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/overview', authenticateToken, StatsController.getOverview);

export default router;
