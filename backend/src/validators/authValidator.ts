import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'FACULTY_COORDINATOR', 'STUDENT']),
  facultyId: z.string().optional(),
  departmentId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  semester: z.number().optional()
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional()
});
