![Uploading Screenshot 2026-09-23 135041.png…]()

---

## 🌟 Overview
**SCHEDURA** is an enterprise-grade, database-driven academic timetable and schedule viewer built for colleges and universities. It enables administrators and faculty coordinators to design, validate, manage, and publish conflict-free schedules, while offering students an intuitive real-time schedule viewer with live ongoing/next class detection, weekly and daily views, and fast search.

---

## 🚀 Key Features

- **Strict PS63 Requirement Fulfillment**:
  - Timetable creation with Day, Time slot, Subject, and Faculty.
  - Organized by Department, Class, Section, Semester, and Academic Year.
  - Dynamic interactive class/section selector with sticky session state.
  - Live updates and conflict-checked entry corrections by coordinators.
  - Clear `ACTIVE` status indication with ongoing class detection.
  - Granular Day-specific and full Weekly Grid schedule views.
  - Distinguishable `ACTIVE` (🟢) vs `ARCHIVED` (⚪) versions with full audit history.
- **Conflict Prevention Engine**: Real-time validation preventing faculty double-booking, room conflicts, and class collisions.
- **Dynamic Data-Driven Architecture**: 100% database-driven from MongoDB; zero hardcoded options in UI.
- **Export & Print**: Native browser print formatting, CSV timetable export, and client-side PDF document generation.
- **Role-Based Access Control**:
  - `ADMIN`: Global administration of departments, classes, sections, faculty, subjects, rooms, users, and timetables.
  - `FACULTY_COORDINATOR`: Department-level timetable design, entry modification, publishing, and archiving.
  - `STUDENT`: Read-only schedule exploration, real-time ongoing/next class tracking, and search.
- **Modern Light Theme**: Premium visual design with clean typography (`Inter`), generous whitespace, and responsive mobile/desktop layouts.

---

## 👥 Demo Credentials

| Role | Email | Password | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@college.edu` | `Admin@123` | System-wide Administrator |
| **Faculty Coordinator** | `faculty.coordinator@college.edu` | `Faculty@123` | Dr. Arun Kumar (CSE Department) |
| **Student** | `student@college.edu` | `Student@123` | II CSE - Section A (Semester 3) |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Lucide React, Axios, React Hook Form, Zod, jsPDF.
- **Backend**: Node.js, Express, TypeScript, Mongoose ODM, JWT, bcryptjs, Helmet, CORS, express-rate-limit.
- **Database**: MongoDB (Local or MongoDB Atlas).

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment
Copy `.env.example` to `.env` in both `backend` and `frontend` folders:
```bash
# Backend .env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/schedura
JWT_SECRET=schedura_secret_key_2026
CLIENT_URL=http://localhost:5173

# Frontend .env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Database
```bash
npm run seed
```
*(Backend also auto-seeds automatically on initial startup if database is empty).*

### 4. Start Development Servers
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

---

## 📁 Repository Structure
```
SCHEDURA/
├── frontend/             # React + Vite + TypeScript Frontend
├── backend/              # Node.js + Express + TypeScript Backend
├── data/                 # Generated realistic JSON seed datasets
├── docs/                 # API, Database, and Setup Documentation
├── .src/                 # Architecture & Implementation specifications
├── requirements.txt      # System prerequisites specification
└── README.md             # Project documentation
```
<img width="655" height="592" alt="Screenshot 2026-09-23 135041" src="https://github.com/user-attachments/assets/d3e1d9d3-b3e8-4524-b0aa-825b13c745a8" />



---


## 📜 License
© 2026 SCHEDURA. Smart Class Timetable & Schedule Management.

