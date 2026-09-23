import { Request, Response, NextFunction } from 'express';
import { StatsService } from '../services/statsService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export class StatsController {
  static async getOverview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      let departmentId: string | undefined;

      // If faculty coordinator, constrain by their assigned department unless an admin
      if (user && user.role === 'FACULTY_COORDINATOR' && user.departmentId) {
        departmentId = user.departmentId.toString();
      }

      // If query param overrides explicitly (for Admin viewing a department filter)
      if (req.query.departmentId && (!user || user.role === 'ADMIN')) {
        departmentId = req.query.departmentId as string;
      }

      const stats = await StatsService.getOverviewStats(departmentId);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}
