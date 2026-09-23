import { Request, Response, NextFunction } from 'express';
import { Class } from '../models/Class.js';
import { Section } from '../models/Section.js';
import { classSchema } from '../validators/masterValidator.js';

export class ClassController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, semester, academicYear } = req.query;
      const filter: any = {};
      if (departmentId) filter.departmentId = departmentId;
      if (semester) filter.semester = Number(semester);
      if (academicYear) filter.academicYear = academicYear;

      const classes = await Class.find(filter)
        .populate('departmentId', 'name code')
        .sort({ name: 1 });

      res.status(200).json({ success: true, count: classes.length, data: classes });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cls = await Class.findById(req.params.id).populate('departmentId', 'name code');
      if (!cls) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
      }
      res.status(200).json({ success: true, data: cls });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = classSchema.parse(req.body);
      const count = await Class.countDocuments();
      const classId = `CLS${String(count + 1).padStart(3, '0')}`;

      const newClass = new Class({
        ...data,
        classId
      });
      await newClass.save();

      // Automatically generate default sections A and B if requested
      const sectionA = new Section({ sectionId: `SEC${Date.now().toString().slice(-4)}1`, name: 'A', classId: newClass._id });
      const sectionB = new Section({ sectionId: `SEC${Date.now().toString().slice(-4)}2`, name: 'B', classId: newClass._id });
      await Promise.all([sectionA.save(), sectionB.save()]);

      res.status(201).json({ success: true, message: 'Class created with sections A & B', data: newClass });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = classSchema.partial().parse(req.body);
      const updatedClass = await Class.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!updatedClass) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Class updated', data: updatedClass });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cls = await Class.findByIdAndDelete(req.params.id);
      if (!cls) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
      }
      await Section.deleteMany({ classId: cls._id });
      res.status(200).json({ success: true, message: 'Class and associated sections deleted' });
    } catch (error) {
      next(error);
    }
  }
}
