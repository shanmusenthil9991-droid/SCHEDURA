import { Router } from 'express';
import { FacultyController } from '../controllers/facultyController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Dedicated Faculty Personal Endpoints
router.get('/me/schedule', authenticateToken, requireRole('FACULTY_COORDINATOR', 'ADMIN'), FacultyController.getMySchedule);
router.get('/me/in-charge-timetable', authenticateToken, requireRole('FACULTY_COORDINATOR', 'ADMIN'), FacultyController.getMyInChargeTimetable);

// General Faculty Catalog Read Endpoints
router.get('/', FacultyController.getAll);
router.get('/:id/schedule', authenticateToken, requireRole('ADMIN', 'FACULTY_COORDINATOR'), FacultyController.getScheduleById);
router.get('/:id', FacultyController.getById);

// Admin-only Faculty Management
router.post('/', authenticateToken, requireRole('ADMIN'), FacultyController.create);
router.put('/:id', authenticateToken, requireRole('ADMIN'), FacultyController.update);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), FacultyController.delete);

export default router;
