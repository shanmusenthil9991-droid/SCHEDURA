export type UserRole = 'ADMIN' | 'FACULTY_COORDINATOR' | 'STUDENT';
export type TimetableStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type RoomType = 'Classroom' | 'Laboratory' | 'Seminar Hall';

export interface Department {
  _id: string;
  departmentId: string;
  name: string;
  code: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassItem {
  _id: string;
  classId: string;
  name: string;
  departmentId: Department | string;
  semester: number;
  academicYear: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Section {
  _id: string;
  sectionId: string;
  name: string;
  classId: ClassItem | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Faculty {
  _id: string;
  facultyId: string;
  name: string;
  email: string;
  departmentId: Department | string;
  designation: string;
  inChargeClassId?: ClassItem | string;
  inChargeSectionId?: Section | string;
  inChargeAcademicYear?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subject {
  _id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  name?: string;
  code?: string;
  type?: string;
  departmentId: Department | string;
  semester: number;
  credits: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  _id: string;
  roomId: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  roomType: RoomType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student {
  _id: string;
  studentId: string;
  name: string;
  email: string;
  departmentId: Department | string;
  classId: ClassItem | string;
  sectionId: Section | string;
  semester: number;
  academicYear: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  facultyId?: Faculty;
  departmentId?: Department;
  classId?: ClassItem;
  sectionId?: Section;
  semester?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimetableEntry {
  _id: string;
  entryId: string;
  timetableId: string | Timetable;
  day: DayOfWeek;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:00"
  subjectId: Subject;
  facultyId: Faculty;
  roomId: Room;
  createdAt?: string;
  updatedAt?: string;
}

export interface Timetable {
  _id: string;
  timetableId: string;
  departmentId: Department;
  classId: ClassItem;
  sectionId: Section;
  semester: number;
  academicYear: string;
  version: number;
  status: TimetableStatus;
  createdBy: User;
  facultyInCharge?: {
    _id: string;
    name: string;
    facultyId: string;
    designation: string;
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  entries?: TimetableEntry[];
}

export interface FacultyScheduleEntry {
  _id: string;
  entryId: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: {
    _id: string;
    code: string;
    name: string;
    credits: number;
  };
  class: {
    _id: string;
    name: string;
    semester?: number;
  };
  section: {
    _id: string;
    name: string;
  };
  room: {
    _id: string;
    roomNumber: string;
    building: string;
    floor?: number;
    roomType?: string;
  };
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export interface FacultyAllocation {
  faculty: {
    _id: string;
    name: string;
    email: string;
    facultyId: string;
    designation: string;
    departmentId?: any;
    maxWeeklyHours?: number;
  };
  totalSlots: number;
  sessions: {
    _id: string;
    entryId: string;
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    subject: Subject;
    room: Room;
    class: ClassItem;
    section: Section;
  }[];
}

export interface DashboardStats {
  totalClasses: number;
  activeTimetables: number;
  draftTimetables: number;
  archivedTimetables: number;
  totalFaculty: number;
  assignedInChargeFaculty?: number;
  totalSubjects: number;
  totalRooms: number;
  totalStudents: number;
  totalDepartments: number;
  recentTimetables: Timetable[];
  departmentBreakdown?: {
    _id: string;
    name: string;
    code: string;
    totalClasses: number;
    activeTimetables: number;
    coveragePercent: number;
  }[];
}

export interface ConflictCheckPayload {
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

export interface ConflictResponse {
  success: boolean;
  hasConflict: boolean;
  conflicts: string[];
}
