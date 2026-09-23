import { Request, Response, NextFunction } from 'express';
import { Section } from '../models/Section.js';
import { sectionSchema } from '../validators/masterValidator.js';

export class SectionController {
  static async getByClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId } = req.params;
      const sections = await Section.find({ classId }).sort({ name: 1 });
      res.status(200).json({ success: true, count: sections.length, data: sections });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId } = req.query;
      const filter: any = {};
      if (classId) filter.classId = classId;

      const sections = await Section.find(filter)
        .populate({
          path: 'classId',
          populate: { path: 'departmentId', select: 'name code' }
        })
        .sort({ name: 1 });

      res.status(200).json({ success: true, count: sections.length, data: sections });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = sectionSchema.parse(req.body);
      const count = await Section.countDocuments();
      const sectionId = `SEC${String(count + 1).padStart(3, '0')}`;

      const section = new Section({
        ...data,
        sectionId
      });
      await section.save();

      res.status(201).json({ success: true, message: 'Section created', data: section });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = sectionSchema.partial().parse(req.body);
      const section = await Section.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!section) {
        res.status(404).json({ success: false, message: 'Section not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Section updated', data: section });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const section = await Section.findByIdAndDelete(req.params.id);
      if (!section) {
        res.status(404).json({ success: false, message: 'Section not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Section deleted' });
    } catch (error) {
      next(error);
    }
  }
}
