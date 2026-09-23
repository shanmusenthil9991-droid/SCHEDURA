import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { userManagementSchema } from '../validators/masterValidator.js';

export class UserController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, departmentId, search } = req.query;
      const filter: any = {};
      if (role) filter.role = role;
      if (departmentId) filter.departmentId = departmentId;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(filter)
        .select('-password')
        .populate('departmentId', 'name code')
        .populate('classId', 'name')
        .populate('sectionId', 'name')
        .populate('facultyId', 'name designation')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.params.id)
        .select('-password')
        .populate('departmentId', 'name code')
        .populate('classId', 'name')
        .populate('sectionId', 'name')
        .populate('facultyId', 'name designation');

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = userManagementSchema.parse(req.body);
      const existing = await User.findOne({ email: data.email.toLowerCase() });
      if (existing) {
        res.status(409).json({ success: false, message: 'Email is already registered' });
        return;
      }

      const rawPassword = data.password || 'Schedura@123';
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const user = new User({
        ...data,
        email: data.email.toLowerCase(),
        password: hashedPassword
      });
      await user.save();

      const userObject = user.toObject();
      delete (userObject as any).password;

      res.status(201).json({ success: true, message: 'User created successfully', data: userObject });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = userManagementSchema.partial().parse(req.body);
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      } else {
        delete data.password;
      }

      const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'User updated successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      user.isActive = !user.isActive;
      await user.save();
      res.status(200).json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { id: user._id, isActive: user.isActive }
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
