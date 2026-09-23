import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').toUpperCase()
});

export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  departmentId: z.string().min(1, 'Department is required'),
  semester: z.number().int().min(1).max(8),
  academicYear: z.string().min(4, 'Academic year is required')
});

export const sectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  classId: z.string().min(1, 'Class ID is required')
});

export const facultySchema = z.object({
  facultyId: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  departmentId: z.string().min(1, 'Department ID is required'),
  designation: z.string().min(2, 'Designation is required'),
  inChargeClassId: z.string().optional().nullable(),
  inChargeSectionId: z.string().optional().nullable(),
  inChargeAcademicYear: z.string().optional().nullable()
});

export const subjectSchema = z.object({
  subjectCode: z.string().min(2, 'Subject code is required').toUpperCase(),
  subjectName: z.string().min(2, 'Subject name is required'),
  departmentId: z.string().min(1, 'Department is required'),
  semester: z.number().int().min(1).max(8),
  credits: z.number().int().min(1).max(6)
});

export const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required').toUpperCase(),
  building: z.string().min(1, 'Building is required'),
  floor: z.number().int(),
  capacity: z.number().int().min(1),
  roomType: z.enum(['Classroom', 'Laboratory', 'Seminar Hall'])
});

export const userManagementSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'FACULTY_COORDINATOR', 'STUDENT']),
  facultyId: z.string().optional(),
  departmentId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  semester: z.number().optional(),
  isActive: z.boolean().optional()
});
