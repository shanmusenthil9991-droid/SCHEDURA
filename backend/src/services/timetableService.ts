import mongoose, { Types } from 'mongoose';
import { Timetable, ITimetable, TimetableStatus } from '../models/Timetable.js';
import { TimetableEntry, ITimetableEntry, DayOfWeek } from '../models/TimetableEntry.js';
import { Faculty } from '../models/Faculty.js';
import { Subject } from '../models/Subject.js';
import { Room } from '../models/Room.js';

export interface ConflictCheckParams {
  timetableId?: string;
  classId?: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subjectId: string;
  facultyId: string;
  roomId: string;
  excludeEntryId?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: string[];
}

export class TimetableService {
  /**
   * Check for schedule conflicts across Class, Faculty, and Room
   */
  static async checkConflict(params: ConflictCheckParams): Promise<ConflictResult> {
    const conflicts: string[] = [];
    const { timetableId, day, startTime, endTime, facultyId, roomId, excludeEntryId } = params;

    // 1. Get active or target timetable to know classId
    let classId = params.classId;
    if (!classId && timetableId) {
      const tt = await Timetable.findById(timetableId);
      if (tt) {
        classId = tt.classId.toString();
      }
    }

    // Convert strings to ObjectIds safely if possible
    const facultyObjId = mongoose.Types.ObjectId.isValid(facultyId) ? new Types.ObjectId(facultyId) : null;
    const roomObjId = mongoose.Types.ObjectId.isValid(roomId) ? new Types.ObjectId(roomId) : null;
    const ttObjId = timetableId && mongoose.Types.ObjectId.isValid(timetableId) ? new Types.ObjectId(timetableId) : null;

    // Time slot overlap helper: slot overlaps if not (slot.endTime <= startTime or slot.startTime >= endTime)
    const timeOverlapCondition = {
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    };

    // A. Check if the current timetable already has an entry at the same time slot (Class double-booking)
    if (ttObjId) {
      const classConflictQuery: any = {
        timetableId: ttObjId,
        day,
        ...timeOverlapCondition
      };
      if (excludeEntryId && mongoose.Types.ObjectId.isValid(excludeEntryId)) {
        classConflictQuery._id = { $ne: new Types.ObjectId(excludeEntryId) };
      }

      const classOverlap = await TimetableEntry.findOne(classConflictQuery)
        .populate('subjectId', 'subjectName subjectCode')
        .populate('roomId', 'roomNumber');

      if (classOverlap) {
        const subName = (classOverlap.subjectId as any)?.subjectName || 'Another Subject';
        conflicts.push(`Class already has "${subName}" scheduled at ${classOverlap.startTime} - ${classOverlap.endTime} on ${day}.`);
      }
    }

    // B. Check if Faculty is already booked in another ACTIVE timetable at the same time
    if (facultyObjId) {
      const facultyQuery: any = {
        facultyId: facultyObjId,
        day,
        ...timeOverlapCondition
      };
      if (excludeEntryId && mongoose.Types.ObjectId.isValid(excludeEntryId)) {
        facultyQuery._id = { $ne: new Types.ObjectId(excludeEntryId) };
      }
      if (ttObjId) {
        facultyQuery.timetableId = { $ne: ttObjId };
      }

      const facultyOverlaps = await TimetableEntry.find(facultyQuery)
        .populate({
          path: 'timetableId',
          match: { status: 'ACTIVE' },
          populate: { path: 'classId', select: 'name' }
        })
        .populate('facultyId', 'name');

      const activeFacultyOverlap = facultyOverlaps.find(o => o.timetableId != null);
      if (activeFacultyOverlap) {
        const facName = (activeFacultyOverlap.facultyId as any)?.name || 'Faculty member';
        const className = (activeFacultyOverlap.timetableId as any)?.classId?.name || 'another class';
        conflicts.push(`${facName} is already assigned to ${className} at ${activeFacultyOverlap.startTime} - ${activeFacultyOverlap.endTime} on ${day}.`);
      }
    }

    // C. Check if Room is already booked in another ACTIVE timetable at the same time
    if (roomObjId) {
      const roomQuery: any = {
        roomId: roomObjId,
        day,
        ...timeOverlapCondition
      };
      if (excludeEntryId && mongoose.Types.ObjectId.isValid(excludeEntryId)) {
        roomQuery._id = { $ne: new Types.ObjectId(excludeEntryId) };
      }
      if (ttObjId) {
        roomQuery.timetableId = { $ne: ttObjId };
      }

      const roomOverlaps = await TimetableEntry.find(roomQuery)
        .populate({
          path: 'timetableId',
          match: { status: 'ACTIVE' },
          populate: { path: 'classId', select: 'name' }
        })
        .populate('roomId', 'roomNumber');

      const activeRoomOverlap = roomOverlaps.find(o => o.timetableId != null);
      if (activeRoomOverlap) {
        const rmNum = (activeRoomOverlap.roomId as any)?.roomNumber || 'Room';
        const className = (activeRoomOverlap.timetableId as any)?.classId?.name || 'another class';
        conflicts.push(`Room ${rmNum} is already occupied by ${className} at ${activeRoomOverlap.startTime} - ${activeRoomOverlap.endTime} on ${day}.`);
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Publish a timetable:
   * 1. Finds existing ACTIVE timetable for (departmentId, classId, sectionId, semester, academicYear)
   * 2. Sets its status to ARCHIVED
   * 3. Sets target timetable status to ACTIVE and sets publishedAt = new Date()
   */
  static async publishTimetable(timetableId: string, userId: string): Promise<ITimetable | null> {
    const target = await Timetable.findById(timetableId);
    if (!target) return null;

    // Archive previous ACTIVE version for this specific class/section/semester/year
    await Timetable.updateMany(
      {
        _id: { $ne: target._id },
        departmentId: target.departmentId,
        classId: target.classId,
        sectionId: target.sectionId,
        semester: target.semester,
        academicYear: target.academicYear,
        status: 'ACTIVE'
      },
      {
        $set: { status: 'ARCHIVED' }
      }
    );

    target.status = 'ACTIVE';
    target.publishedAt = new Date();
    await target.save();

    return target;
  }

  /**
   * Duplicate a timetable to a new version in DRAFT status
   */
  static async duplicateTimetable(timetableId: string, userId: string): Promise<ITimetable | null> {
    const source = await Timetable.findById(timetableId);
    if (!source) return null;

    // Find the latest version number for this class/section
    const highestVersionDoc = await Timetable.findOne({
      departmentId: source.departmentId,
      classId: source.classId,
      sectionId: source.sectionId,
      semester: source.semester,
      academicYear: source.academicYear
    }).sort({ version: -1 });

    const newVersion = (highestVersionDoc?.version || source.version) + 1;
    const newTimetableId = `TT${Date.now().toString().slice(-6)}`;

    const newTimetable = new Timetable({
      timetableId: newTimetableId,
      departmentId: source.departmentId,
      classId: source.classId,
      sectionId: source.sectionId,
      semester: source.semester,
      academicYear: source.academicYear,
      version: newVersion,
      status: 'DRAFT',
      createdBy: new Types.ObjectId(userId)
    });

    await newTimetable.save();

    // Copy all entries from source timetable
    const sourceEntries = await TimetableEntry.find({ timetableId: source._id });
    if (sourceEntries.length > 0) {
      const newEntries = sourceEntries.map((e, idx) => ({
        entryId: `TTE${Date.now().toString().slice(-6)}${idx}`,
        timetableId: newTimetable._id,
        day: e.day,
        startTime: e.startTime,
        endTime: e.endTime,
        subjectId: e.subjectId,
        facultyId: e.facultyId,
        roomId: e.roomId
      }));
      await TimetableEntry.insertMany(newEntries);
    }

    return newTimetable;
  }
}
