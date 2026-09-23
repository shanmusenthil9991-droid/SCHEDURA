import { Request, Response, NextFunction } from 'express';
import { Department } from '../models/Department.js';
import { departmentSchema } from '../validators/masterValidator.js';

export class DepartmentController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await Department.find().sort({ name: 1 });
      res.status(200).json({ success: true, count: departments.length, data: departments });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await Department.findById(req.params.id);
      if (!department) {
        res.status(404).json({ success: false, message: 'Department not found' });
        return;
      }
      res.status(200).json({ success: true, data: department });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = departmentSchema.parse(req.body);
      const count = await Department.countDocuments();
      const departmentId = `DEPT${String(count + 1).padStart(3, '0')}`;

      const department = new Department({
        ...data,
        departmentId
      });
      await department.save();

      res.status(201).json({ success: true, message: 'Department created', data: department });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = departmentSchema.partial().parse(req.body);
      const department = await Department.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!department) {
        res.status(404).json({ success: false, message: 'Department not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Department updated', data: department });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await Department.findByIdAndDelete(req.params.id);
      if (!department) {
        res.status(404).json({ success: false, message: 'Department not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Department deleted' });
    } catch (error) {
      next(error);
    }
  }
}
