# SCHEDURA Database Architecture & Schema Specification

## Database Details
- **Database Engine**: MongoDB 7.0+
- **Database Name**: `schedura`
- **Default Connection**: `mongodb://127.0.0.1:27017/schedura`

---

## Collections & Schemas

### 1. `users`
Represents application accounts with role-based access.
- `name` (String, required)
- `email` (String, required, unique, indexed)
- `password` (String, bcrypt hashed, required)
- `role` (String: `'ADMIN'` | `'FACULTY_COORDINATOR'` | `'STUDENT'`)
- `facultyId` (ObjectId ref `'Faculty'`, optional)
- `departmentId` (ObjectId ref `'Department'`, optional)
- `classId` (ObjectId ref `'Class'`, optional)
- `sectionId` (ObjectId ref `'Section'`, optional)
- `semester` (Number, optional)
- `isActive` (Boolean, default: `true`)
- `timestamps` (`createdAt`, `updatedAt`)

### 2. `departments`
- `departmentId` (String, unique, e.g. `'DEPT001'`)
- `name` (String, e.g. `'Computer Science and Engineering'`)
- `code` (String, unique, uppercase, e.g. `'CSE'`)

### 3. `classes`
- `classId` (String, unique, e.g. `'CLS002'`)
- `name` (String, e.g. `'II CSE'`)
- `departmentId` (ObjectId ref `'Department'`)
- `semester` (Number, e.g. `3`)
- `academicYear` (String, e.g. `'2026-2027'`)

### 4. `sections`
- `sectionId` (String, unique, e.g. `'SEC001'`)
- `name` (String, e.g. `'A'` or `'B'`)
- `classId` (ObjectId ref `'Class'`)

### 5. `faculty`
- `facultyId` (String, unique, e.g. `'FAC001'`, indexed)
- `name` (String, e.g. `'Dr. Arun Kumar'`)
- `email` (String, unique)
- `departmentId` (ObjectId ref `'Department'`)
- `designation` (String, e.g. `'Professor & HOD'`)

### 6. `subjects`
- `subjectId` (String, unique, e.g. `'SUB001'`)
- `subjectCode` (String, unique, indexed, e.g. `'CS301'`)
- `subjectName` (String, e.g. `'Data Structures'`)
- `departmentId` (ObjectId ref `'Department'`)
- `semester` (Number, e.g. `3`)
- `credits` (Number, e.g. `4`)

### 7. `rooms`
- `roomId` (String, unique, e.g. `'RM001'`)
- `roomNumber` (String, unique, e.g. `'CSE-201'`)
- `building` (String, e.g. `'Aryabhata Block'`)
- `floor` (Number, e.g. `2`)
- `capacity` (Number, e.g. `60`)
- `roomType` (String: `'Classroom'` | `'Laboratory'` | `'Seminar Hall'`)

### 8. `students`
- `studentId` (String, unique, indexed, e.g. `'STU001'`)
- `name` (String)
- `email` (String, unique, indexed)
- `departmentId` (ObjectId ref `'Department'`)
- `classId` (ObjectId ref `'Class'`)
- `sectionId` (ObjectId ref `'Section'`)
- `semester` (Number)
- `academicYear` (String)

### 9. `timetables`
- `timetableId` (String, unique, e.g. `'TT001'`)
- `departmentId` (ObjectId ref `'Department'`, indexed)
- `classId` (ObjectId ref `'Class'`, indexed)
- `sectionId` (ObjectId ref `'Section'`, indexed)
- `semester` (Number, indexed)
- `academicYear` (String, indexed)
- `version` (Number, default: `1`)
- `status` (String: `'DRAFT'` | `'ACTIVE'` | `'ARCHIVED'`, indexed)
- `createdBy` (ObjectId ref `'User'`)
- `publishedAt` (Date, optional)
- `timestamps` (`createdAt`, `updatedAt`)

### 10. `timetableentries`
- `entryId` (String, unique, e.g. `'TTE001'`)
- `timetableId` (ObjectId ref `'Timetable'`, indexed)
- `day` (String: `'Monday'` | `'Tuesday'` | `'Wednesday'` | `'Thursday'` | `'Friday'` | `'Saturday'`, indexed)
- `startTime` (String, e.g. `'09:00'`, indexed)
- `endTime` (String, e.g. `'10:00'`, indexed)
- `subjectId` (ObjectId ref `'Subject'`)
- `facultyId` (ObjectId ref `'Faculty'`)
- `roomId` (ObjectId ref `'Room'`)

---

## Indexing Strategy
- Compound Index on `Timetable`: `{ departmentId: 1, classId: 1, sectionId: 1, semester: 1, academicYear: 1, status: 1 }`
- Compound Index on `TimetableEntry`: `{ timetableId: 1, day: 1, startTime: 1 }`
- Unique Index on `User.email`, `Student.studentId`, `Faculty.facultyId`, `Subject.subjectCode`, `Room.roomNumber`.
