import { Router } from 'express';
import authRoutes from './authRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import classRoutes from './classRoutes.js';
import sectionRoutes from './sectionRoutes.js';
import facultyRoutes from './facultyRoutes.js';
import subjectRoutes from './subjectRoutes.js';
import roomRoutes from './roomRoutes.js';
import studentRoutes from './studentRoutes.js';
import userRoutes from './userRoutes.js';
import timetableRoutes from './timetableRoutes.js';
import statsRoutes from './statsRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/classes', classRoutes);
router.use('/sections', sectionRoutes);
router.use('/faculty', facultyRoutes);
router.use('/subjects', subjectRoutes);
router.use('/rooms', roomRoutes);
router.use('/students', studentRoutes);
router.use('/users', userRoutes);
router.use('/timetables', timetableRoutes);
router.use('/entries', timetableRoutes); // Handles /api/entries/:id routes directly
router.use('/stats', statsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'SCHEDURA',
    tagline: 'Smart Class Timetable & Schedule Management',
    ps63: 'Class Timetable & Schedule Viewer',
    timestamp: new Date().toISOString()
  });
});

export default router;
