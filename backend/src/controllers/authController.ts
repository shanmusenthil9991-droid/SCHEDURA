import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { ENV } from '../config/env.js';
import { loginSchema, registerSchema } from '../validators/authValidator.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await User.findOne({ email: email.toLowerCase() })
        .populate('departmentId', 'name code')
        .populate('classId', 'name semester academicYear')
        .populate('sectionId', 'name')
        .populate('facultyId', 'name designation');

      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Admin.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const userObject = user.toObject();
      delete (userObject as any).password;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: userObject
      });
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);

      const existing = await User.findOne({ email: data.email.toLowerCase() });
      if (existing) {
        res.status(409).json({ success: false, message: 'A user with this email already exists' });
        return;
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = new User({
        ...data,
        email: data.email.toLowerCase(),
        password: hashedPassword
      });
      await user.save();

      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const userObject = user.toObject();
      delete (userObject as any).password;

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: userObject
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await User.findById(req.user._id)
        .select('-password')
        .populate('departmentId', 'name code')
        .populate('classId', 'name semester academicYear')
        .populate('sectionId', 'name')
        .populate('facultyId', 'name designation');

      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }
}
