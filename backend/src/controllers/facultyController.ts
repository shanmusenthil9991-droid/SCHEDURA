import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { Faculty } from '../models/Faculty.js';
import { Timetable } from '../models/Timetable.js';
import { TimetableEntry } from '../models/TimetableEntry.js';
import { facultySchema } from '../validators/masterValidator.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export class FacultyController {
  /**
   * Get all faculty members (with in-charge class and section populated)
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, search } = req.query;
      const filter: any = {};
      if (departmentId) filter.departmentId = departmentId;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { designation: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const faculty = await Faculty.find(filter)
        .populate('departmentId', 'name code')
        .populate('inChargeClassId', 'name semester academicYear')
        .populate('inChargeSectionId', 'name')
        .sort({ name: 1 });

      res.status(200).json({ success: true, count: faculty.length, data: faculty });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single faculty member by ID
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fac = await Faculty.findById(req.params.id)
        .populate('departmentId', 'name code')
        .populate('inChargeClassId', 'name semester academicYear')
        .populate('inChargeSectionId', 'name');

      if (!fac) {
        res.status(404).json({ success: false, message: 'Faculty not found' });
        return;
      }
      res.status(200).json({ success: true, data: fac });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/faculty/me/schedule
   * Returns the logged-in faculty member's personal teaching schedule from ACTIVE timetables
   */
  static async getMySchedule(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const facultyId = req.user?.facultyId;

      if (!facultyId) {
        res.status(400).json({
          success: false,
          message: 'No faculty profile is linked to this account.'
        });
        return;
      }

      // Fetch all entries for this faculty member across all timetables
      const entries = await TimetableEntry.find({ facultyId })
        .populate('subjectId', 'subjectName subjectCode credits')
        .populate('roomId', 'roomNumber building floor roomType capacity')
        .populate({
          path: 'timetableId',
          populate: [
            { path: 'classId', select: 'name semester academicYear' },
            { path: 'sectionId', select: 'name' },
            { path: 'departmentId', select: 'name code' }
          ]
        });

      // Filter only entries that belong to ACTIVE timetables
      const activeEntries = entries.filter((e) => {
        const tt = e.timetableId as any;
        return tt && tt.status === 'ACTIVE';
      });

      // Map to clean, structured faculty schedule format
      const schedule = activeEntries.map((e) => {
        const tt = e.timetableId as any;
        const sub = e.subjectId as any;
        const rm = e.roomId as any;
        const cls = tt?.classId as any;
        const sec = tt?.sectionId as any;

        return {
          _id: e._id,
          entryId: e.entryId,
          day: e.day,
          startTime: e.startTime,
          endTime: e.endTime,
          subject: {
            _id: sub?._id,
            code: sub?.subjectCode || 'SUB',
            name: sub?.subjectName || 'Subject',
            credits: sub?.credits || 3
          },
          class: {
            _id: cls?._id,
            name: cls?.name || 'Class',
            semester: cls?.semester
          },
          section: {
            _id: sec?._id,
            name: sec?.name || 'A'
          },
          room: {
            _id: rm?._id,
            roomNumber: rm?.roomNumber || 'Room',
            building: rm?.building || '',
            floor: rm?.floor,
            roomType: rm?.roomType || 'Classroom'
          }
        };
      });

      // Sort by day and start time
      const dayOrder: Record<string, number> = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
        Sunday: 7
      };

      schedule.sort((a, b) => {
        const dayDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      });

      const facultyProfile = await Faculty.findById(facultyId)
        .populate('departmentId', 'name code')
        .populate('inChargeClassId', 'name semester academicYear')
        .populate('inChargeSectionId', 'name');

      res.status(200).json({
        success: true,
        count: schedule.length,
        data: {
          faculty: facultyProfile,
          entries: schedule
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/faculty/:id/schedule (Admin query to see where any specific faculty has to go)
   */
  static async getScheduleById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const faculty = await Faculty.findById(id)
        .populate('departmentId', 'name code')
        .populate('inChargeClassId', 'name semester academicYear')
        .populate('inChargeSectionId', 'name');

      if (!faculty) {
        res.status(404).json({ success: false, message: 'Faculty member not found' });
        return;
      }

      // Fetch all entries for this faculty member across all timetables
      const entries = await TimetableEntry.find({ facultyId: id })
        .populate('subjectId', 'subjectName subjectCode credits')
        .populate('roomId', 'roomNumber building floor roomType capacity')
        .populate({
          path: 'timetableId',
          populate: [
            { path: 'classId', select: 'name semester academicYear' },
            { path: 'sectionId', select: 'name' },
            { path: 'departmentId', select: 'name code' }
          ]
        });

      // Filter only entries that belong to ACTIVE timetables
      const activeEntries = entries.filter((e) => {
        const tt = e.timetableId as any;
        return tt && tt.status === 'ACTIVE';
      });

      const dayOrder: Record<string, number> = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
        Sunday: 7
      };

      const schedule = activeEntries.map((e) => {
        const tt = e.timetableId as any;
        const sub = e.subjectId as any;
        const rm = e.roomId as any;
        const cls = tt?.classId as any;
        const sec = tt?.sectionId as any;

        return {
          _id: e._id,
          entryId: e.entryId,
          day: e.day,
          startTime: e.startTime,
          endTime: e.endTime,
          subject: {
            _id: sub?._id,
            code: sub?.subjectCode || 'SUB',
            name: sub?.subjectName || 'Subject',
            credits: sub?.credits || 3
          },
          class: {
            _id: cls?._id,
            name: cls?.name || 'Class',
            semester: cls?.semester
          },
          section: {
            _id: sec?._id,
            name: sec?.name || 'A'
          },
          room: {
            _id: rm?._id,
            roomNumber: rm?.roomNumber || 'Room',
            building: rm?.building || '',
            floor: rm?.floor,
            roomType: rm?.roomType || 'Classroom'
          }
        };
      });

      schedule.sort((a, b) => {
        const dayDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      });

      res.status(200).json({
        success: true,
        count: schedule.length,
        data: {
          faculty,
          entries: schedule
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/faculty/me/in-charge-timetable
   * Returns the active timetable for the faculty member's assigned in-charge class and section
   */
  static async getMyInChargeTimetable(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const facultyId = req.user?.facultyId;

      if (!facultyId) {
        res.status(400).json({
          success: false,
          message: 'No faculty profile is linked to this account.'
        });
        return;
      }

      const faculty = await Faculty.findById(facultyId)
        .populate('departmentId', 'name code')
        .populate('inChargeClassId', 'name semester academicYear')
        .populate('inChargeSectionId', 'name');

      if (!faculty) {
        res.status(404).json({ success: false, message: 'Faculty record not found' });
        return;
      }

      const inChargePayload = {
        class: faculty.inChargeClassId as any,
        section: faculty.inChargeSectionId as any,
        academicYear: faculty.inChargeAcademicYear
      };

      if (!faculty.inChargeClassId || !faculty.inChargeSectionId) {
        res.status(200).json({
          success: true,
          data: {
            inCharge: inChargePayload,
            timetable: null
          }
        });
        return;
      }

      const classId = typeof faculty.inChargeClassId === 'object' ? (faculty.inChargeClassId as any)._id : faculty.inChargeClassId;
      const sectionId = typeof faculty.inChargeSectionId === 'object' ? (faculty.inChargeSectionId as any)._id : faculty.inChargeSectionId;

      // Query active timetable
      const timetable = await Timetable.findOne({
        classId,
        sectionId,
        status: 'ACTIVE'
      })
        .populate('departmentId', 'name code')
        .populate('classId', 'name semester academicYear')
        .populate('sectionId', 'name')
        .populate('createdBy', 'name email');

      if (!timetable) {
        res.status(200).json({
          success: true,
          data: {
            inCharge: inChargePayload,
            timetable: null
          }
        });
        return;
      }

      const entries = await TimetableEntry.find({ timetableId: timetable._id })
        .populate('subjectId', 'subjectName subjectCode credits')
        .populate('facultyId', 'name email designation')
        .populate('roomId', 'roomNumber building floor roomType capacity')
        .sort({ day: 1, startTime: 1 });

      res.status(200).json({
        success: true,
        data: {
          inCharge: inChargePayload,
          timetable: {
            ...timetable.toObject(),
            facultyInCharge: {
              _id: faculty._id,
              name: faculty.name,
              facultyId: faculty.facultyId,
              designation: faculty.designation
            },
            entries
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create faculty record (Admin only)
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = facultySchema.parse(req.body);
      const count = await Faculty.countDocuments();
      const facultyId = data.facultyId || `FAC${String(count + 1).padStart(3, '0')}`;

      const fac = new Faculty({
        ...data,
        facultyId,
        inChargeClassId: data.inChargeClassId ? new Types.ObjectId(data.inChargeClassId) : undefined,
        inChargeSectionId: data.inChargeSectionId ? new Types.ObjectId(data.inChargeSectionId) : undefined
      });
      await fac.save();

      res.status(201).json({ success: true, message: 'Faculty created', data: fac });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update faculty record (Admin only)
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = facultySchema.partial().parse(req.body);
      const updatePayload: any = { ...data };
      if (data.inChargeClassId !== undefined) {
        updatePayload.inChargeClassId = data.inChargeClassId ? new Types.ObjectId(data.inChargeClassId) : null;
      }
      if (data.inChargeSectionId !== undefined) {
        updatePayload.inChargeSectionId = data.inChargeSectionId ? new Types.ObjectId(data.inChargeSectionId) : null;
      }

      const fac = await Faculty.findByIdAndUpdate(req.params.id, updatePayload, { new: true })
        .populate('departmentId', 'name code')
        .populate('inChargeClassId', 'name semester academicYear')
        .populate('inChargeSectionId', 'name');

      if (!fac) {
        res.status(404).json({ success: false, message: 'Faculty not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Faculty updated', data: fac });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete faculty member (Admin only)
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fac = await Faculty.findByIdAndDelete(req.params.id);
      if (!fac) {
        res.status(404).json({ success: false, message: 'Faculty not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Faculty deleted' });
    } catch (error) {
      next(error);
    }
  }
}
