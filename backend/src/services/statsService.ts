import { Class } from '../models/Class.js';
import { Section } from '../models/Section.js';
import { Timetable } from '../models/Timetable.js';
import { Faculty } from '../models/Faculty.js';
import { Subject } from '../models/Subject.js';
import { Room } from '../models/Room.js';
import { Student } from '../models/Student.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';

export class StatsService {
  static async getOverviewStats(departmentId?: string) {
    const filter = departmentId ? { departmentId } : {};

    const [
      totalClasses,
      activeTimetables,
      draftTimetables,
      archivedTimetables,
      totalFaculty,
      assignedInChargeFaculty,
      totalSubjects,
      totalRooms,
      totalStudents,
      totalDepartments,
      recentTimetables,
      allDepts
    ] = await Promise.all([
      Class.countDocuments(filter),
      Timetable.countDocuments({ ...filter, status: 'ACTIVE' }),
      Timetable.countDocuments({ ...filter, status: 'DRAFT' }),
      Timetable.countDocuments({ ...filter, status: 'ARCHIVED' }),
      Faculty.countDocuments(filter),
      Faculty.countDocuments({ ...filter, inChargeClassId: { $ne: null } }),
      Subject.countDocuments(filter),
      Room.countDocuments(),
      Student.countDocuments(filter),
      Department.countDocuments(),
      Timetable.find(filter)
        .sort({ updatedAt: -1 })
        .limit(6)
        .populate('departmentId', 'name code')
        .populate('classId', 'name semester academicYear')
        .populate('sectionId', 'name')
        .populate('createdBy', 'name email'),
      Department.find().sort({ code: 1 })
    ]);

    // Build department breakdown based on total sections
    const departmentBreakdown = await Promise.all(
      allDepts.map(async (d) => {
        const deptClasses = await Class.find({ departmentId: d._id });
        const classIds = deptClasses.map((c) => c._id);
        const [secCount, activeTtCount] = await Promise.all([
          Section.countDocuments({ classId: { $in: classIds } }),
          Timetable.countDocuments({ departmentId: d._id, status: 'ACTIVE' })
        ]);
        return {
          _id: d._id,
          name: d.name,
          code: d.code,
          totalClasses: deptClasses.length,
          totalSections: secCount,
          activeTimetables: activeTtCount,
          coveragePercent: secCount > 0 ? Math.min(100, Math.round((activeTtCount / secCount) * 100)) : 0
        };
      })
    );

    return {
      totalClasses,
      activeTimetables,
      draftTimetables,
      archivedTimetables,
      totalFaculty,
      assignedInChargeFaculty,
      totalSubjects,
      totalRooms,
      totalStudents,
      totalDepartments,
      recentTimetables,
      departmentBreakdown
    };
  }
}
