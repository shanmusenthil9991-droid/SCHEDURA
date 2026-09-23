# SCHEDURA Setup & Installation Guide

## 1. Prerequisites
Ensure the following tools are installed on your machine:
- **Node.js**: Version 20.x or later (`node -v`)
- **npm**: Version 10.x or later (`npm -v`)
- **MongoDB**: Community Edition 7.x+ running locally at `mongodb://127.0.0.1:27017` OR a MongoDB Atlas connection URI.

---

## 2. Quick Start

### Step 1: Install Dependencies
From the repository root:
```bash
npm run install:all
```
This installs root, backend, and frontend packages simultaneously.

### Step 2: Configure Environment Variables
- Backend: copy `backend/.env.example` to `backend/.env`
  ```env
  PORT=5000
  MONGO_URI=mongodb://127.0.0.1:27017/schedura
  JWT_SECRET=schedura_super_secret_jwt_key_2026
  CLIENT_URL=http://localhost:5173
  ```
- Frontend: copy `frontend/.env.example` to `frontend/.env`
  ```env
  VITE_API_URL=http://localhost:5000/api
  ```

### Step 3: Seed Database
```bash
npm run seed
```
This connects to MongoDB `schedura`, creates all collections, indexes, demo accounts, 5 departments, 20 classes, 40+ sections, 30+ faculty, 40+ subjects, 30+ rooms, 200+ students, 50+ timetable versions, and 1000+ conflict-free entries.

*(Note: If you start the backend without manual seeding, the server auto-detects an empty database and seeds it automatically.)*

### Step 4: Run Application
To run both backend and frontend concurrently:
```bash
npm run dev
```
- Frontend will be accessible at: `http://localhost:5173`
- Backend API will be accessible at: `http://localhost:5000/api`

---

## 3. Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `Admin@123` | Full system access, all departments |
| **Faculty Coordinator** | `faculty.coordinator@college.edu` | `Faculty@123` | Dr. Arun Kumar (CSE Dept Timetable Lead) |
| **Student** | `student@college.edu` | `Student@123` | II CSE - Section A (Semester 3) |
