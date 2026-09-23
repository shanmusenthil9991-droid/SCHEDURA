import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { Timetable, ITimetable } from '../models/Timetable.js';
import { TimetableEntry, ITimetableEntry } from '../models/TimetableEntry.js';
import { TimetableService } from '../services/timetableService.js';
import {
  createTimetableSchema,
  updateTimetableSchema,
  timetableEntrySchema,
  syncEntriesSchema,
  checkConflictSchema
} from '../validators/timetableValidator.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export class TimetableController {
  /**
   * Get all timetables (filter by department, class, section, semester, year, status)
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, classId, sectionId, semester, academicYear, status, search } = req.query;
      const filter: any = {};

      if (departmentId) filter.departmentId = departmentId;
      if (classId) filter.classId = classId;
      if (sectionId) filter.sectionId = sectionId;
      if (semester) filter.semester = Number(semester);
      if (academicYear) filter.academicYear = academicYear;
      if (status) filter.status = status;

      const timetables = await Timetable.find(filter)
        .populate('departmentId', 'name code')
        .populate('classId', 'name semester academicYear')
        .populate('sectionId', 'name')
        .populate('createdBy', 'name email role')
        .sort({ updatedAt: -1 });

      res.status(200).json({ success: true, count: timetables.length, data: timetables });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single timetable by ID with all populated entries
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const timetable = await Timetable.findById(req.params.id)
        .populate('departmentId', 'name code')
        .populate('classId', 'name semester academicYear')
        .populate('sectionId', 'name')
        .populate('createdBy', 'name email role');

      if (!timetable) {
        res.status(404).json({ success: false, message: 'Timetable not found' });
        return;
      }

      // Fetch and populate entries
      const entries = await TimetableEntry.find({ timetableId: timetable._id })
        .populate('subjectId', 'subjectName subjectCode credits')
        .populate('facultyId', 'name email designation')
        .populate('roomId', 'roomNumber building floor roomType capacity')
        .sort({ day: 1, startTime: 1 });

      res.status(200).json({
        success: true,
        data: {
          ...timetable.toObject(),
          entries
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ACTIVE timetable for a given class/section/semester/year
   */
  static async getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, classId, sectionId, semester, academicYear } = req.query;

      if (!classId || !sectionId) {
        res.status(400).json({
          success: false,
          message: 'classId and sectionId are required'
        });
        return;
      }

      const query: any = {
        classId,
        sectionId,
        status: 'ACTIVE'
      };
      if (departmentId) query.departmentId = departmentId;
      if (semester) query.semester = Number(semester);
      if (academicYear) query.academicYear = academicYear;

      const timetable = await Timetable.findOne(query)
        .populate('departmentId', 'name code')
        .populate('classId', 'name semester academicYear')
        .populate('sectionId', 'name')
        .populate('createdBy', 'name email');

      if (!timetable) {
        res.status(404).json({
          success: false,
          message: 'No active timetable found for the selected class and section'
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
          ...timetable.toObject(),
          entries
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get version history for a class and section
   */
  static async getVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId, sectionId } = req.params;

      const versions = await Timetable.find({ classId, sectionId })
        .populate('departmentId', 'name code')
        .populate('classId', 'name')
        .populate('sectionId', 'name')
        .populate('createdBy', 'name email')
        .sort({ version: -1 });

      res.status(200).json({ success: true, count: versions.length, data: versions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new timetable
   */
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createTimetableSchema.parse(req.body);
      const userId = req.user?._id;

      // Determine next version number for this class/section
      const existingLatest = await Timetable.findOne({
        departmentId: data.departmentId,
        classId: data.classId,
        sectionId: data.sectionId,
        semester: data.semester,
        academicYear: data.academicYear
      }).sort({ version: -1 });

      const version = existingLatest ? existingLatest.version + 1 : 1;
      const count = await Timetable.countDocuments();
      const timetableId = `TT${String(count + 1).padStart(3, '0')}`;

      const timetable = new Timetable({
        timetableId,
        ...data,
        version,
        status: data.status || 'DRAFT',
        createdBy: userId
      });

      await timetable.save();

      // If created as ACTIVE, archive previous active versions
      if (timetable.status === 'ACTIVE') {
        await TimetableService.publishTimetable(timetable._id.toString(), userId?.toString() || '');
      }

      const populated = await Timetable.findById(timetable._id)
        .populate('departmentId', 'name code')
        .populate('classId', 'name semester academicYear')
        .populate('sectionId', 'name')
        .populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Timetable created successfully',
        data: populated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update timetable metadata
   */
  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateTimetableSchema.parse(req.body);
      const timetable = await Timetable.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!timetable) {
        res.status(404).json({ success: false, message: 'Timetable not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Timetable updated', data: timetable });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish a timetable (Archive previous active version and activate this version)
   */
  static async publish(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id?.toString() || '';
      const published = await TimetableService.publishTimetable(String(req.params.id), userId);
      if (!published) {
        res.status(404).json({ success: false, message: 'Timetable not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Timetable published successfully. Previous active version is now archived.',
        data: published
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Archive a timetable
   */
  static async archive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const timetable = await Timetable.findById(req.params.id);
      if (!timetable) {
        res.status(404).json({ success: false, message: 'Timetable not found' });
        return;
      }

      timetable.status = 'ARCHIVED';
      await timetable.save();

      res.status(200).json({ success: true, message: 'Timetable marked as archived', data: timetable });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate timetable into a new version draft
   */
  static async duplicate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id?.toString() || '';
      const duplicated = await TimetableService.duplicateTimetable(String(req.params.id), userId);
      if (!duplicated) {
        res.status(404).json({ success: false, message: 'Source timetable not found' });
        return;
      }

      const populated = await Timetable.findById(duplicated._id)
        .populate('departmentId', 'name code')
        .populate('classId', 'name semester academicYear')
        .populate('sectionId', 'name');

      res.status(201).json({
        success: true,
        message: `Created new draft version ${duplicated.version} from existing timetable`,
        data: populated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete timetable and all its entries
   */
  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const timetable = await Timetable.findByIdAndDelete(req.params.id);
      if (!timetable) {
        res.status(404).json({ success: false, message: 'Timetable not found' });
        return;
      }
      await TimetableEntry.deleteMany({ timetableId: timetable._id });
      res.status(200).json({ success: true, message: 'Timetable and all entries deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check schedule conflict (standalone validation)
   */
  static async checkConflict(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = checkConflictSchema.parse(req.body);
      const result = await TimetableService.checkConflict(params);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch sync / replace all entries for a timetable
   */
  static async syncEntries(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { entries } = syncEntriesSchema.parse(req.body);

      const timetable = await Timetable.findById(id);
      if (!timetable) {
        res.status(404).json({ success: false, message: 'Timetable not found' });
        return;
      }

      // Check each entry for conflicts with other entries in the same batch
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = entries[i];
          const b = entries[j];
          if (a.day === b.day && a.startTime < b.endTime && a.endTime > b.startTime) {
            if (a.facultyId === b.facultyId) {
              res.status(400).json({
                success: false,
                message: `Conflict in submission: Same faculty assigned twice on ${a.day} at overlapping time.`
              });
              return;
            }
            if (a.roomId === b.roomId) {
              res.status(400).json({
                success: false,
                message: `Conflict in submission: Same room occupied twice on ${a.day} at overlapping time.`
              });
              return;
            }
          }
        }
      }

      // Clear existing entries
      await TimetableEntry.deleteMany({ timetableId: timetable._id });

      let entryNum = 1;
      const docsToInsert = entries.map((e) => ({
        entryId: `TTE${Date.now().toString().slice(-6)}${entryNum++}`,
        timetableId: timetable._id,
        day: e.day,
        startTime: e.startTime,
        endTime: e.endTime,
        subjectId: new Types.ObjectId(e.subjectId),
        facultyId: new Types.ObjectId(e.facultyId),
        roomId: new Types.ObjectId(e.roomId)
      }));

      await TimetableEntry.insertMany(docsToInsert);

      // Return fully populated entries
      const populatedEntries = await TimetableEntry.find({ timetableId: timetable._id })
        .populate('subjectId', 'subjectName subjectCode credits')
        .populate('facultyId', 'name email designation')
        .populate('roomId', 'roomNumber building floor roomType capacity')
        .sort({ day: 1, startTime: 1 });

      res.status(200).json({
        success: true,
        message: 'Timetable entries updated successfully',
        data: populatedEntries
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a single timetable entry
   */
  static async addEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = timetableEntrySchema.parse(req.body);

      const timetable = await Timetable.findById(id);
      if (!timetable) {
        res.status(404).json({ success: false, message: 'Timetable not found' });
        return;
      }

      // Check conflict
      const conflictCheck = await TimetableService.checkConflict({
        timetableId: String(id),
        classId: timetable.classId.toString(),
        ...data
      });

      if (conflictCheck.hasConflict) {
        res.status(409).json({
          success: false,
          message: 'Schedule conflict detected',
          conflicts: conflictCheck.conflicts
        });
        return;
      }

      const count = await TimetableEntry.countDocuments();
      const entryId = `TTE${String(count + 1).padStart(5, '0')}`;

      const entry = new TimetableEntry({
        entryId,
        timetableId: timetable._id,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: new Types.ObjectId(data.subjectId),
        facultyId: new Types.ObjectId(data.facultyId),
        roomId: new Types.ObjectId(data.roomId)
      });

      await entry.save();

      const populated = await TimetableEntry.findById(entry._id)
        .populate('subjectId', 'subjectName subjectCode credits')
        .populate('facultyId', 'name email designation')
        .populate('roomId', 'roomNumber building floor roomType capacity');

      res.status(201).json({
        success: true,
        message: 'Timetable entry added successfully',
        data: populated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a specific entry
   */
  static async updateEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = timetableEntrySchema.parse(req.body);

      const entry = await TimetableEntry.findById(id);
      if (!entry) {
        res.status(404).json({ success: false, message: 'Timetable entry not found' });
        return;
      }

      const conflictCheck = await TimetableService.checkConflict({
        timetableId: entry.timetableId.toString(),
        excludeEntryId: String(id),
        ...data
      });

      if (conflictCheck.hasConflict) {
        res.status(409).json({
          success: false,
          message: 'Schedule conflict detected',
          conflicts: conflictCheck.conflicts
        });
        return;
      }

      entry.day = data.day;
      entry.startTime = data.startTime;
      entry.endTime = data.endTime;
      entry.subjectId = new Types.ObjectId(data.subjectId);
      entry.facultyId = new Types.ObjectId(data.facultyId);
      entry.roomId = new Types.ObjectId(data.roomId);

      await entry.save();

      const populated = await TimetableEntry.findById(entry._id)
        .populate('subjectId', 'subjectName subjectCode credits')
        .populate('facultyId', 'name email designation')
        .populate('roomId', 'roomNumber building floor roomType capacity');

      res.status(200).json({
        success: true,
        message: 'Timetable entry updated successfully',
        data: populated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an entry
   */
  static async deleteEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const entry = await TimetableEntry.findByIdAndDelete(id);
      if (!entry) {
        res.status(404).json({ success: false, message: 'Timetable entry not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Timetable entry deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Faculty Allocation breakdown for a timetable (Admin projection)
   */
  static async getFacultyAllocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const timetable = await Timetable.findById(id)
        .populate('departmentId', 'name code')
        .populate('classId', 'name semester')
        .populate('sectionId', 'name');

      if (!timetable) {
        res.status(404).json({ success: false, message: 'Timetable not found' });
        return;
      }

      const entries = await TimetableEntry.find({ timetableId: id })
        .populate('subjectId', 'name code credits type')
        .populate('facultyId', 'name email designation facultyId departmentId maxWeeklyHours')
        .populate('roomId', 'roomNumber building floor roomType capacity')
        .sort({ day: 1, startTime: 1 });

      const facultyMap: { [key: string]: { faculty: any; totalSlots: number; slots: any[]; sessions: any[] } } = {};

      for (const entry of entries) {
        if (!entry.facultyId) continue;
        const fac: any = entry.facultyId;
        const facId = String(fac._id);

        if (!facultyMap[facId]) {
          facultyMap[facId] = {
            faculty: {
              _id: fac._id,
              facultyId: fac.facultyId,
              name: fac.name,
              email: fac.email,
              designation: fac.designation,
              departmentId: fac.departmentId,
              maxWeeklyHours: fac.maxWeeklyHours || 18
            },
            totalSlots: 0,
            slots: [],
            sessions: []
          };
        }

        const slotObj = {
          _id: entry._id,
          entryId: entry.entryId,
          day: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
          subject: entry.subjectId,
          subjectId: entry.subjectId,
          room: entry.roomId,
          roomId: entry.roomId,
          class: timetable.classId,
          classId: timetable.classId,
          section: timetable.sectionId,
          sectionId: timetable.sectionId
        };

        facultyMap[facId].totalSlots += 1;
        facultyMap[facId].slots.push(slotObj);
        facultyMap[facId].sessions.push(slotObj);
      }

      const allocations = Object.values(facultyMap);

      res.status(200).json({
        success: true,
        data: {
          timetableId: timetable._id,
          class: timetable.classId,
          section: timetable.sectionId,
          semester: timetable.semester,
          academicYear: timetable.academicYear,
          allocations
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
