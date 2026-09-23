import { Request, Response, NextFunction } from 'express';
import { Student } from '../models/Student.js';

export class StudentController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, classId, sectionId, semester, academicYear, search } = req.query;
      const filter: any = {};
      if (departmentId) filter.departmentId = departmentId;
      if (classId) filter.classId = classId;
      if (sectionId) filter.sectionId = sectionId;
      if (semester) filter.semester = Number(semester);
      if (academicYear) filter.academicYear = academicYear;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const students = await Student.find(filter)
        .populate('departmentId', 'name code')
        .populate('classId', 'name')
        .populate('sectionId', 'name')
        .sort({ studentId: 1 })
        .limit(100);

      const totalCount = await Student.countDocuments(filter);

      res.status(200).json({ success: true, count: totalCount, data: students });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await Student.findById(req.params.id)
        .populate('departmentId', 'name code')
        .populate('classId', 'name')
        .populate('sectionId', 'name');

      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }
      res.status(200).json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  }
}
