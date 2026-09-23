import { z } from 'zod';

export const createTimetableSchema = z.object({
  departmentId: z.string().min(1, 'Department ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  semester: z.number().int().min(1).max(8),
  academicYear: z.string().min(4, 'Academic year is required'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional()
});

export const updateTimetableSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  academicYear: z.string().optional(),
  semester: z.number().int().min(1).max(8).optional()
});

export const timetableEntrySchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  facultyId: z.string().min(1, 'Faculty ID is required'),
  roomId: z.string().min(1, 'Room ID is required')
});

export const syncEntriesSchema = z.object({
  entries: z.array(timetableEntrySchema)
});

export const checkConflictSchema = z.object({
  timetableId: z.string().optional(),
  classId: z.string().optional(),
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: z.string(),
  endTime: z.string(),
  subjectId: z.string(),
  facultyId: z.string(),
  roomId: z.string(),
  excludeEntryId: z.string().optional()
});
