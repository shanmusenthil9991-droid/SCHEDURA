import { Request, Response, NextFunction } from 'express';
import { Subject } from '../models/Subject.js';
import { subjectSchema } from '../validators/masterValidator.js';

export class SubjectController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, semester, search } = req.query;
      const filter: any = {};
      if (departmentId) filter.departmentId = departmentId;
      if (semester) filter.semester = Number(semester);
      if (search) {
        filter.$or = [
          { subjectName: { $regex: search, $options: 'i' } },
          { subjectCode: { $regex: search, $options: 'i' } }
        ];
      }

      const subjects = await Subject.find(filter)
        .populate('departmentId', 'name code')
        .sort({ semester: 1, subjectCode: 1 });

      res.status(200).json({ success: true, count: subjects.length, data: subjects });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subject = await Subject.findById(req.params.id).populate('departmentId', 'name code');
      if (!subject) {
        res.status(404).json({ success: false, message: 'Subject not found' });
        return;
      }
      res.status(200).json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = subjectSchema.parse(req.body);
      const count = await Subject.countDocuments();
      const subjectId = `SUB${String(count + 1).padStart(3, '0')}`;

      const subject = new Subject({
        ...data,
        subjectId
      });
      await subject.save();

      res.status(201).json({ success: true, message: 'Subject created', data: subject });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = subjectSchema.partial().parse(req.body);
      const subject = await Subject.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!subject) {
        res.status(404).json({ success: false, message: 'Subject not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Subject updated', data: subject });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subject = await Subject.findByIdAndDelete(req.params.id);
      if (!subject) {
        res.status(404).json({ success: false, message: 'Subject not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Subject deleted' });
    } catch (error) {
      next(error);
    }
  }
}
