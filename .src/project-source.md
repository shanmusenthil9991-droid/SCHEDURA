# SCHEDURA — System Architecture & Technical Specifications (PS63)

## 1. Project Overview
- **Project ID**: PS63
- **Project Title**: Class Timetable & Schedule Viewer
- **Application Name**: SCHEDURA
- **Tagline**: Smart Class Timetable & Schedule Management
- **Platform Type**: Modern Full-Stack Web Application

## 2. PS63 Requirements Compliance Matrix
1. **Creation of Timetable**: Administrators and Faculty Coordinators can construct timetables featuring Day, Time Slot, Subject, and Assigned Faculty.
2. **Class & Section Organization**: Timetables are strictly scoped by Department, Class, Section, Semester, and Academic Year.
3. **Student Viewing**: Students can dynamically pick their Department, Class, Section, Semester, and Academic Year to access their schedule.
4. **Coordinator Updates & Corrections**: Faculty Coordinators can modify or correct individual timetable entries with immediate propagation and conflict safety.
5. **Active Timetable Display**: The system explicitly flags and renders the current `ACTIVE` timetable version.
6. **Day-Specific Viewing**: Full support for daily timeline views and weekly grid views.
7. **Outdated vs Active Timetable Distinguishability**: Distinct `🟢 ACTIVE` and `⚪ ARCHIVED` badges and filters allow historical auditing and rollback.

## 3. Technology Stack & Infrastructure
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Lucide React, Axios, React Hook Form, Zod.
- **Backend**: Node.js, Express, TypeScript, Mongoose ODM, JSON Web Tokens (JWT), bcryptjs, Helmet, CORS, express-rate-limit.
- **Database**: MongoDB (database name: `schedura`), default URI: `mongodb://127.0.0.1:27017/schedura` or cloud Atlas via `MONGO_URI`.

## 4. Role Hierarchy & Access Matrix
- **ADMIN**: Full authority across all academic departments, user provisioning, master catalog management (subjects, faculty, rooms, classes, sections), and global timetable administration.
- **FACULTY_COORDINATOR**: Dedicated department-level coordinator (e.g. Dr. Arun Kumar for CSE). Can create, edit, correct, publish, archive, and duplicate departmental timetables and entries.
- **STUDENT**: Read-only interactive access. Can select any department/class/section, view current/ongoing and next classes, inspect weekly and daily schedules, perform live search, and export/print timetables.

## 5. Conflict Resolution Engine
Before saving or publishing any timetable entry, the scheduling engine validates:
- **Class Double-Booking**: No class section can have two subjects at the same time on the same day.
- **Faculty Double-Booking**: No faculty member can be scheduled for two concurrent classes.
- **Room Double-Booking**: No physical classroom or laboratory can host two sessions simultaneously.
- **Academic Integrity**: Subject and Faculty must align with the corresponding department and semester tier.

## 6. Versioning Workflow
- State machine: `DRAFT` ➔ `ACTIVE` ➔ `ARCHIVED`.
- Publishing an active timetable automatically transitions the previous active version for that exact class/section/semester/year tuple to `ARCHIVED`.
- Only exactly ONE `ACTIVE` timetable exists per unique Class/Section/Semester/Academic Year tuple.
