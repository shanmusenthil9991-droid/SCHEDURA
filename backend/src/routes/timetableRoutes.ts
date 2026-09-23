import { Router } from 'express';
import { TimetableController } from '../controllers/timetableController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Authenticated reads
router.get('/active', TimetableController.getActive);
router.get('/versions/:classId/:sectionId', TimetableController.getVersions);
router.post('/check-conflict', TimetableController.checkConflict);
router.get('/', TimetableController.getAll);
router.get('/:id', TimetableController.getById);

// Admin-only Faculty Allocation projection
router.get(
  '/:id/faculty-allocation',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.getFacultyAllocation
);

// Timetable creation, lifecycle and metadata management (ADMIN ONLY)
router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.create
);

router.put(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.update
);

router.post(
  '/:id/publish',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.publish
);

router.post(
  '/:id/archive',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.archive
);

router.post(
  '/:id/duplicate',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.duplicate
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.delete
);

// Timetable Entries CRUD & Batch Sync (ADMIN ONLY)
router.post(
  '/:id/entries/sync',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.syncEntries
);

router.post(
  '/:id/entries',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.addEntry
);

router.put(
  '/entries/:id',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.updateEntry
);

router.delete(
  '/entries/:id',
  authenticateToken,
  requireRole('ADMIN'),
  TimetableController.deleteEntry
);

export default router;
