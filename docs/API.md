# SCHEDURA REST API Documentation

Base URL: `http://localhost:5000/api`

## Authentication & Authorization
All authenticated routes require header:
`Authorization: Bearer <JWT_TOKEN>`

### Role Permissions
- `ADMIN`: Full read/write access to all endpoints.
- `FACULTY_COORDINATOR`: Read/write access to department timetables, entries, version history, subjects, rooms, faculty.
- `STUDENT`: Read-only access to class/section catalogs and active timetables.

---

## Endpoints

### 1. Authentication (`/api/auth`)
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ token, user }`
- `POST /api/auth/register`
  - Body: `{ name, email, password, role, ... }`
- `GET /api/auth/me`
  - Response: User profile with populated relations

### 2. Timetables (`/api/timetables`)
- `GET /api/timetables` (Filterable by `departmentId`, `classId`, `sectionId`, `semester`, `academicYear`, `status`)
- `GET /api/timetables/:id` (Returns timetable with fully populated entries, faculty, subjects, rooms)
- `GET /api/timetables/active` (Query: `departmentId`, `classId`, `sectionId`, `semester`, `academicYear`)
- `POST /api/timetables` (Create new draft or timetable)
- `PUT /api/timetables/:id` (Update timetable metadata)
- `POST /api/timetables/:id/publish` (Promotes to ACTIVE, archives previous active version)
- `POST /api/timetables/:id/archive` (Transitions to ARCHIVED)
- `POST /api/timetables/:id/duplicate` (Creates new version draft cloned from existing)
- `DELETE /api/timetables/:id` (Delete timetable and associated entries)

### 3. Timetable Entries (`/api/timetables/:id/entries` & `/api/entries`)
- `POST /api/timetables/:id/entries` (Add or batch sync entries with conflict detection)
- `PUT /api/entries/:id` (Update specific timetable entry)
- `DELETE /api/entries/:id` (Delete entry)
- `POST /api/entries/check-conflict` (Validates slot conflict without persisting)

### 4. Master Catalogs
- `GET /api/departments`
- `GET /api/classes` & `POST /api/classes` & `PUT /api/classes/:id` & `DELETE /api/classes/:id`
- `GET /api/classes/:classId/sections` & `POST /api/sections` & `PUT /api/sections/:id`
- `GET /api/faculty` & `POST /api/faculty` & `PUT /api/faculty/:id` & `DELETE /api/faculty/:id`
- `GET /api/subjects` & `POST /api/subjects` & `PUT /api/subjects/:id` & `DELETE /api/subjects/:id`
- `GET /api/rooms` & `POST /api/rooms` & `PUT /api/rooms/:id` & `DELETE /api/rooms/:id`
- `GET /api/users` & `POST /api/users` & `PUT /api/users/:id` & `DELETE /api/users/:id`
- `GET /api/students` & `POST /api/students`

### 5. Statistics & Overview (`/api/stats`)
- `GET /api/stats/overview` (Aggregated statistics for admin/coordinator dashboard)
