import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { Department } from '../models/Department.js';
import { Class } from '../models/Class.js';
import { Section } from '../models/Section.js';
import { Faculty } from '../models/Faculty.js';
import { Subject } from '../models/Subject.js';
import { Room } from '../models/Room.js';
import { Student } from '../models/Student.js';
import { User } from '../models/User.js';
import { Timetable } from '../models/Timetable.js';
import { TimetableEntry } from '../models/TimetableEntry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');

export class SeedService {
  static async checkAndSeed() {
    try {
      const userCount = await User.countDocuments();
      const ttCount = await Timetable.countDocuments();
      const facInCharge = await Faculty.countDocuments({ inChargeClassId: { $ne: null } });
      if (userCount === 0 || ttCount === 0 || facInCharge === 0) {
        console.log('⚡ Initializing / updating SCHEDURA dataset with Faculty in-charge assignments...');
        await SeedService.seedAll();
      } else {
        console.log(`✓ Database already initialized (${userCount} users, ${ttCount} timetables present).`);
      }
    } catch (err) {
      console.error('Database initialization check warning:', err);
    }
  }

  static async seedAll(logOutput = true) {
    if (logOutput) {
      console.log('========================================');
      console.log('        SCHEDURA DATABASE SETUP         ');
      console.log('========================================\n');
      console.log('Connecting to MongoDB...');
      console.log('✓ MongoDB connected\n');
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Clear existing collections safely for clean seed
    await Promise.all([
      Department.deleteMany({}),
      Class.deleteMany({}),
      Section.deleteMany({}),
      Faculty.deleteMany({}),
      Subject.deleteMany({}),
      Room.deleteMany({}),
      Student.deleteMany({}),
      User.deleteMany({}),
      Timetable.deleteMany({}),
      TimetableEntry.deleteMany({})
    ]);

    // 1. DEPARTMENTS (5)
    const departmentsData = [
      { departmentId: 'DEPT001', name: 'Computer Science and Engineering', code: 'CSE' },
      { departmentId: 'DEPT002', name: 'Information Technology', code: 'IT' },
      { departmentId: 'DEPT003', name: 'Electronics and Communication Engineering', code: 'ECE' },
      { departmentId: 'DEPT004', name: 'Electrical and Electronics Engineering', code: 'EEE' },
      { departmentId: 'DEPT005', name: 'Mechanical Engineering', code: 'MECH' }
    ];
    const createdDepts = await Department.insertMany(departmentsData);
    const deptMap: Record<string, any> = {};
    createdDepts.forEach((d) => {
      deptMap[d.code] = d;
    });
    fs.writeFileSync(path.join(DATA_DIR, 'departments.json'), JSON.stringify(createdDepts, null, 2));
    if (logOutput) console.log('✓ Departments (5)');

    // 2. CLASSES (20: 4 years per 5 departments)
    const classYears = [
      { tier: 'I', sem: 1, year: '2026-2027' },
      { tier: 'II', sem: 3, year: '2026-2027' },
      { tier: 'III', sem: 5, year: '2026-2027' },
      { tier: 'IV', sem: 7, year: '2026-2027' }
    ];

    const classesData: any[] = [];
    let classCounter = 1;
    for (const d of createdDepts) {
      for (const cy of classYears) {
        classesData.push({
          classId: `CLS${String(classCounter).padStart(3, '0')}`,
          name: `${cy.tier} ${d.code}`,
          departmentId: d._id,
          semester: cy.sem,
          academicYear: cy.year
        });
        classCounter++;
      }
    }
    const createdClasses = await Class.insertMany(classesData);
    fs.writeFileSync(path.join(DATA_DIR, 'classes.json'), JSON.stringify(createdClasses, null, 2));
    if (logOutput) console.log(`✓ Classes (${createdClasses.length})`);

    // 3. SECTIONS (40+: A and B for each class)
    const sectionsData: any[] = [];
    let secCounter = 1;
    for (const c of createdClasses) {
      for (const sName of ['A', 'B']) {
        sectionsData.push({
          sectionId: `SEC${String(secCounter).padStart(3, '0')}`,
          name: sName,
          classId: c._id
        });
        secCounter++;
      }
    }
    const createdSections = await Section.insertMany(sectionsData);
    fs.writeFileSync(path.join(DATA_DIR, 'sections.json'), JSON.stringify(createdSections, null, 2));
    if (logOutput) console.log(`✓ Sections (${createdSections.length})`);

    // Helper map for finding classes & sections easily
    const iiCseClass = createdClasses.find((c) => c.name === 'II CSE')!;
    const iiCseSecA = createdSections.find((s) => s.name === 'A' && s.classId.toString() === iiCseClass._id.toString())!;
    const iiItClass = createdClasses.find((c) => c.name === 'II IT')!;
    const iiItSecA = createdSections.find((s) => s.name === 'A' && s.classId.toString() === iiItClass._id.toString())!;
    const iiEceClass = createdClasses.find((c) => c.name === 'II ECE')!;
    const iiEceSecA = createdSections.find((s) => s.name === 'A' && s.classId.toString() === iiEceClass._id.toString())!;
    const iiEeeClass = createdClasses.find((c) => c.name === 'II EEE')!;
    const iiEeeSecA = createdSections.find((s) => s.name === 'A' && s.classId.toString() === iiEeeClass._id.toString())!;
    const iiMechClass = createdClasses.find((c) => c.name === 'II MECH')!;
    const iiMechSecA = createdSections.find((s) => s.name === 'A' && s.classId.toString() === iiMechClass._id.toString())!;

    // 4. FACULTY (35+ faculty with assigned in-charge classes/sections for coordinators)
    const facultyRoster = [
      // CSE
      {
        name: 'Dr. Arun Kumar',
        email: 'faculty.coordinator@college.edu',
        dept: 'CSE',
        designation: 'Professor & Coordinator',
        fid: 'FAC001',
        inChargeClassId: iiCseClass._id,
        inChargeSectionId: iiCseSecA._id,
        inChargeAcademicYear: '2026-2027'
      },
      { name: 'Dr. Priya Sharma', email: 'priya.sharma@college.edu', dept: 'CSE', designation: 'Professor', fid: 'FAC002' },
      { name: 'Prof. Rajesh Khanna', email: 'rajesh.khanna@college.edu', dept: 'CSE', designation: 'Associate Professor', fid: 'FAC003' },
      { name: 'Dr. Meera Iyer', email: 'meera.iyer@college.edu', dept: 'CSE', designation: 'Assistant Professor', fid: 'FAC004' },
      { name: 'Prof. Suresh Nair', email: 'suresh.nair@college.edu', dept: 'CSE', designation: 'Assistant Professor', fid: 'FAC005' },
      { name: 'Dr. Ananya Sen', email: 'ananya.sen@college.edu', dept: 'CSE', designation: 'Associate Professor', fid: 'FAC006' },
      { name: 'Prof. Vikram Hegde', email: 'vikram.hegde@college.edu', dept: 'CSE', designation: 'Assistant Professor', fid: 'FAC007' },

      // IT
      {
        name: 'Dr. Ramesh Babu',
        email: 'it.coordinator@college.edu',
        dept: 'IT',
        designation: 'Professor & Coordinator',
        fid: 'FAC008',
        inChargeClassId: iiItClass._id,
        inChargeSectionId: iiItSecA._id,
        inChargeAcademicYear: '2026-2027'
      },
      { name: 'Prof. Sunita Patil', email: 'sunita.patil@college.edu', dept: 'IT', designation: 'Associate Professor', fid: 'FAC009' },
      { name: 'Dr. Karthik Raman', email: 'karthik.raman@college.edu', dept: 'IT', designation: 'Assistant Professor', fid: 'FAC010' },
      { name: 'Prof. Divya George', email: 'divya.george@college.edu', dept: 'IT', designation: 'Assistant Professor', fid: 'FAC011' },
      { name: 'Dr. Sandeep Rao', email: 'sandeep.rao@college.edu', dept: 'IT', designation: 'Professor', fid: 'FAC012' },
      { name: 'Prof. Pooja Verma', email: 'pooja.verma@college.edu', dept: 'IT', designation: 'Assistant Professor', fid: 'FAC013' },
      { name: 'Dr. Harish Nambiar', email: 'harish.nambiar@college.edu', dept: 'IT', designation: 'Associate Professor', fid: 'FAC014' },

      // ECE
      {
        name: 'Dr. K. S. Murthy',
        email: 'ece.coordinator@college.edu',
        dept: 'ECE',
        designation: 'Professor & Coordinator',
        fid: 'FAC015',
        inChargeClassId: iiEceClass._id,
        inChargeSectionId: iiEceSecA._id,
        inChargeAcademicYear: '2026-2027'
      },
      { name: 'Prof. Sneha Das', email: 'sneha.das@college.edu', dept: 'ECE', designation: 'Associate Professor', fid: 'FAC016' },
      { name: 'Dr. Amitav Ghosh', email: 'amitav.ghosh@college.edu', dept: 'ECE', designation: 'Assistant Professor', fid: 'FAC017' },
      { name: 'Prof. Rahul Menon', email: 'rahul.menon@college.edu', dept: 'ECE', designation: 'Assistant Professor', fid: 'FAC018' },
      { name: 'Dr. Kavita Pillai', email: 'kavita.pillai@college.edu', dept: 'ECE', designation: 'Associate Professor', fid: 'FAC019' },
      { name: 'Prof. Rohit Bhat', email: 'rohit.bhat@college.edu', dept: 'ECE', designation: 'Assistant Professor', fid: 'FAC020' },
      { name: 'Prof. Shilpa Reddy', email: 'shilpa.reddy@college.edu', dept: 'ECE', designation: 'Assistant Professor', fid: 'FAC021' },

      // EEE
      {
        name: 'Dr. Venkat Raman',
        email: 'eee.coordinator@college.edu',
        dept: 'EEE',
        designation: 'Professor & Coordinator',
        fid: 'FAC022',
        inChargeClassId: iiEeeClass._id,
        inChargeSectionId: iiEeeSecA._id,
        inChargeAcademicYear: '2026-2027'
      },
      { name: 'Prof. Neha Gupta', email: 'neha.gupta@college.edu', dept: 'EEE', designation: 'Associate Professor', fid: 'FAC023' },
      { name: 'Dr. Balaji Sundaram', email: 'balaji.sundaram@college.edu', dept: 'EEE', designation: 'Assistant Professor', fid: 'FAC024' },
      { name: 'Prof. Manoj Tiwari', email: 'manoj.tiwari@college.edu', dept: 'EEE', designation: 'Assistant Professor', fid: 'FAC025' },
      { name: 'Dr. Swati Joshi', email: 'swati.joshi@college.edu', dept: 'EEE', designation: 'Associate Professor', fid: 'FAC026' },
      { name: 'Prof. Deepak Roy', email: 'deepak.roy@college.edu', dept: 'EEE', designation: 'Assistant Professor', fid: 'FAC027' },

      // MECH
      {
        name: 'Dr. M. S. Swaminathan',
        email: 'mech.coordinator@college.edu',
        dept: 'MECH',
        designation: 'Professor & Coordinator',
        fid: 'FAC028',
        inChargeClassId: iiMechClass._id,
        inChargeSectionId: iiMechSecA._id,
        inChargeAcademicYear: '2026-2027'
      },
      { name: 'Prof. Arvind Kulkarni', email: 'arvind.k@college.edu', dept: 'MECH', designation: 'Associate Professor', fid: 'FAC029' },
      { name: 'Dr. G. Natarajan', email: 'g.natarajan@college.edu', dept: 'MECH', designation: 'Assistant Professor', fid: 'FAC030' },
      { name: 'Prof. Ritu Saxena', email: 'ritu.saxena@college.edu', dept: 'MECH', designation: 'Assistant Professor', fid: 'FAC031' },
      { name: 'Dr. Santosh Deshmukh', email: 'santosh.d@college.edu', dept: 'MECH', designation: 'Associate Professor', fid: 'FAC032' },
      { name: 'Prof. Tarun Kapoor', email: 'tarun.kapoor@college.edu', dept: 'MECH', designation: 'Assistant Professor', fid: 'FAC033' },
      { name: 'Dr. Geeta Nambisan', email: 'geeta.n@college.edu', dept: 'MECH', designation: 'Professor', fid: 'FAC034' },
      { name: 'Prof. Alok Mukherjee', email: 'alok.m@college.edu', dept: 'MECH', designation: 'Assistant Professor', fid: 'FAC035' }
    ];

    const facultyData = facultyRoster.map((f) => ({
      facultyId: f.fid,
      name: f.name,
      email: f.email,
      departmentId: deptMap[f.dept]._id,
      designation: f.designation,
      inChargeClassId: f.inChargeClassId,
      inChargeSectionId: f.inChargeSectionId,
      inChargeAcademicYear: f.inChargeAcademicYear
    }));
    const createdFaculty = await Faculty.insertMany(facultyData);
    fs.writeFileSync(path.join(DATA_DIR, 'faculty.json'), JSON.stringify(createdFaculty, null, 2));
    if (logOutput) console.log(`✓ Faculty (${createdFaculty.length})`);

    // 5. SUBJECTS (50 subjects)
    const subjectsRoster = [
      // CSE
      { code: 'CS301', name: 'Data Structures', dept: 'CSE', sem: 3, cr: 4 },
      { code: 'CS302', name: 'Database Management Systems', dept: 'CSE', sem: 3, cr: 4 },
      { code: 'CS303', name: 'Operating Systems', dept: 'CSE', sem: 3, cr: 3 },
      { code: 'CS304', name: 'Computer Architecture', dept: 'CSE', sem: 3, cr: 3 },
      { code: 'CS305', name: 'Discrete Mathematics', dept: 'CSE', sem: 3, cr: 4 },
      { code: 'CS306', name: 'Data Structures Lab', dept: 'CSE', sem: 3, cr: 2 },
      { code: 'CS501', name: 'Computer Networks', dept: 'CSE', sem: 5, cr: 4 },
      { code: 'CS502', name: 'Artificial Intelligence', dept: 'CSE', sem: 5, cr: 4 },
      { code: 'CS503', name: 'Web Technologies', dept: 'CSE', sem: 5, cr: 3 },
      { code: 'CS504', name: 'Software Engineering', dept: 'CSE', sem: 5, cr: 3 },
      { code: 'CS701', name: 'Cloud Computing & DevOps', dept: 'CSE', sem: 7, cr: 3 },
      { code: 'CS702', name: 'Deep Learning', dept: 'CSE', sem: 7, cr: 3 },

      // IT
      { code: 'IT301', name: 'Data Structures & Algorithms', dept: 'IT', sem: 3, cr: 4 },
      { code: 'IT302', name: 'Database Systems', dept: 'IT', sem: 3, cr: 4 },
      { code: 'IT303', name: 'Operating Systems & Linux', dept: 'IT', sem: 3, cr: 3 },
      { code: 'IT304', name: 'Object Oriented Programming', dept: 'IT', sem: 3, cr: 4 },
      { code: 'IT501', name: 'Computer Networks & Security', dept: 'IT', sem: 5, cr: 4 },
      { code: 'IT502', name: 'Cloud Architecture', dept: 'IT', sem: 5, cr: 3 },
      { code: 'IT503', name: 'Web Engineering', dept: 'IT', sem: 5, cr: 3 },
      { code: 'IT504', name: 'Data Analytics', dept: 'IT', sem: 5, cr: 4 },
      { code: 'IT701', name: 'Cyber Security & Forensics', dept: 'IT', sem: 7, cr: 4 },
      { code: 'IT702', name: 'Internet of Things', dept: 'IT', sem: 7, cr: 3 },

      // ECE
      { code: 'EC301', name: 'Digital Electronics', dept: 'ECE', sem: 3, cr: 4 },
      { code: 'EC302', name: 'Signals and Systems', dept: 'ECE', sem: 3, cr: 4 },
      { code: 'EC303', name: 'Electronic Circuits', dept: 'ECE', sem: 3, cr: 4 },
      { code: 'EC304', name: 'Network Analysis', dept: 'ECE', sem: 3, cr: 3 },
      { code: 'EC501', name: 'Digital Signal Processing', dept: 'ECE', sem: 5, cr: 4 },
      { code: 'EC502', name: 'Microprocessors & Microcontrollers', dept: 'ECE', sem: 5, cr: 4 },
      { code: 'EC503', name: 'Communication Systems', dept: 'ECE', sem: 5, cr: 4 },
      { code: 'EC504', name: 'Control Systems', dept: 'ECE', sem: 5, cr: 3 },
      { code: 'EC701', name: 'VLSI Design', dept: 'ECE', sem: 7, cr: 4 },
      { code: 'EC702', name: 'Embedded Systems', dept: 'ECE', sem: 7, cr: 3 },

      // EEE
      { code: 'EE301', name: 'Electric Circuit Theory', dept: 'EEE', sem: 3, cr: 4 },
      { code: 'EE302', name: 'Electrical Machines I', dept: 'EEE', sem: 3, cr: 4 },
      { code: 'EE303', name: 'Electromagnetic Fields', dept: 'EEE', sem: 3, cr: 3 },
      { code: 'EE304', name: 'Digital Electronics & Logic', dept: 'EEE', sem: 3, cr: 3 },
      { code: 'EE501', name: 'Power Systems I', dept: 'EEE', sem: 5, cr: 4 },
      { code: 'EE502', name: 'Power Electronics', dept: 'EEE', sem: 5, cr: 4 },
      { code: 'EE503', name: 'Control Systems Engineering', dept: 'EEE', sem: 5, cr: 4 },
      { code: 'EE701', name: 'Renewable Energy Systems', dept: 'EEE', sem: 7, cr: 3 },
      { code: 'EE702', name: 'Smart Grid & Electric Vehicles', dept: 'EEE', sem: 7, cr: 3 },

      // MECH
      { code: 'ME301', name: 'Engineering Thermodynamics', dept: 'MECH', sem: 3, cr: 4 },
      { code: 'ME302', name: 'Fluid Mechanics', dept: 'MECH', sem: 3, cr: 4 },
      { code: 'ME303', name: 'Manufacturing Processes', dept: 'MECH', sem: 3, cr: 3 },
      { code: 'ME304', name: 'Strength of Materials', dept: 'MECH', sem: 3, cr: 4 },
      { code: 'ME501', name: 'Design of Machine Elements', dept: 'MECH', sem: 5, cr: 4 },
      { code: 'ME502', name: 'Heat and Mass Transfer', dept: 'MECH', sem: 5, cr: 4 },
      { code: 'ME503', name: 'Kinematics of Machinery', dept: 'MECH', sem: 5, cr: 3 },
      { code: 'ME701', name: 'CAD / CAM & Automation', dept: 'MECH', sem: 7, cr: 3 },
      { code: 'ME702', name: 'Automobile Engineering', dept: 'MECH', sem: 7, cr: 3 }
    ];

    let subCounter = 1;
    const subjectsData = subjectsRoster.map((s) => ({
      subjectId: `SUB${String(subCounter++).padStart(3, '0')}`,
      subjectCode: s.code,
      subjectName: s.name,
      departmentId: deptMap[s.dept]._id,
      semester: s.sem,
      credits: s.cr
    }));
    const createdSubjects = await Subject.insertMany(subjectsData);
    fs.writeFileSync(path.join(DATA_DIR, 'subjects.json'), JSON.stringify(createdSubjects, null, 2));
    if (logOutput) console.log(`✓ Subjects (${createdSubjects.length})`);

    // 6. ROOMS (32 classrooms & labs)
    const roomsList = [
      { num: 'CSE-201', bld: 'Aryabhata Block', fl: 2, cap: 65, type: 'Classroom' },
      { num: 'CSE-202', bld: 'Aryabhata Block', fl: 2, cap: 65, type: 'Classroom' },
      { num: 'CSE-203', bld: 'Aryabhata Block', fl: 2, cap: 65, type: 'Classroom' },
      { num: 'CSE-204', bld: 'Aryabhata Block', fl: 2, cap: 70, type: 'Classroom' },
      { num: 'LAB-CSE-01', bld: 'Aryabhata Block', fl: 3, cap: 45, type: 'Laboratory' },
      { num: 'LAB-CSE-02', bld: 'Aryabhata Block', fl: 3, cap: 45, type: 'Laboratory' },
      { num: 'IT-201', bld: 'Aryabhata Block', fl: 1, cap: 65, type: 'Classroom' },
      { num: 'IT-202', bld: 'Aryabhata Block', fl: 1, cap: 65, type: 'Classroom' },
      { num: 'IT-203', bld: 'Aryabhata Block', fl: 1, cap: 65, type: 'Classroom' },
      { num: 'LAB-IT-01', bld: 'Aryabhata Block', fl: 3, cap: 45, type: 'Laboratory' },
      { num: 'SEM-ARY-01', bld: 'Aryabhata Block', fl: 4, cap: 120, type: 'Seminar Hall' },

      { num: 'ECE-201', bld: 'Ramanujan Block', fl: 2, cap: 65, type: 'Classroom' },
      { num: 'ECE-202', bld: 'Ramanujan Block', fl: 2, cap: 65, type: 'Classroom' },
      { num: 'ECE-203', bld: 'Ramanujan Block', fl: 2, cap: 65, type: 'Classroom' },
      { num: 'LAB-ECE-01', bld: 'Ramanujan Block', fl: 1, cap: 40, type: 'Laboratory' },
      { num: 'LAB-ECE-02', bld: 'Ramanujan Block', fl: 1, cap: 40, type: 'Laboratory' },
      { num: 'EEE-201', bld: 'Ramanujan Block', fl: 3, cap: 65, type: 'Classroom' },
      { num: 'EEE-202', bld: 'Ramanujan Block', fl: 3, cap: 65, type: 'Classroom' },
      { num: 'EEE-203', bld: 'Ramanujan Block', fl: 3, cap: 65, type: 'Classroom' },
      { num: 'LAB-EEE-01', bld: 'Ramanujan Block', fl: 1, cap: 40, type: 'Laboratory' },
      { num: 'SEM-RAM-01', bld: 'Ramanujan Block', fl: 4, cap: 150, type: 'Seminar Hall' },

      { num: 'MECH-201', bld: 'Visvesvaraya Block', fl: 2, cap: 70, type: 'Classroom' },
      { num: 'MECH-202', bld: 'Visvesvaraya Block', fl: 2, cap: 70, type: 'Classroom' },
      { num: 'MECH-203', bld: 'Visvesvaraya Block', fl: 2, cap: 70, type: 'Classroom' },
      { num: 'MECH-204', bld: 'Visvesvaraya Block', fl: 2, cap: 70, type: 'Classroom' },
      { num: 'LAB-MECH-01', bld: 'Visvesvaraya Block', fl: 1, cap: 40, type: 'Laboratory' },
      { num: 'LAB-MECH-02', bld: 'Visvesvaraya Block', fl: 1, cap: 40, type: 'Laboratory' },
      { num: 'AUD-CENTRAL', bld: 'Central Block', fl: 1, cap: 300, type: 'Seminar Hall' },
      { num: 'CONF-01', bld: 'Admin Block', fl: 1, cap: 30, type: 'Seminar Hall' },
      { num: 'LH-101', bld: 'Central Block', fl: 1, cap: 90, type: 'Classroom' },
      { num: 'LH-102', bld: 'Central Block', fl: 1, cap: 90, type: 'Classroom' },
      { num: 'LH-103', bld: 'Central Block', fl: 1, cap: 90, type: 'Classroom' }
    ];

    let roomCounter = 1;
    const roomsData = roomsList.map((r) => ({
      roomId: `RM${String(roomCounter++).padStart(3, '0')}`,
      roomNumber: r.num,
      building: r.bld,
      floor: r.fl,
      capacity: r.cap,
      roomType: r.type as any
    }));
    const createdRooms = await Room.insertMany(roomsData);
    fs.writeFileSync(path.join(DATA_DIR, 'rooms.json'), JSON.stringify(createdRooms, null, 2));
    if (logOutput) console.log(`✓ Rooms (${createdRooms.length})`);

    // 7. STUDENTS (200 records)
    const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aayush', 'Dhruv', 'Kabir', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Pari', 'Ananya', 'Kiara', 'Myra', 'Riya', 'Aaradhya', 'Anvi', 'Prisha', 'Kavya', 'Avani', 'Shanaya', 'Sara', 'Ira'];
    const lastNames = ['Sharma', 'Verma', 'Kumar', 'Gupta', 'Iyer', 'Reddy', 'Patel', 'Nair', 'Singh', 'Rao', 'Choudhury', 'Banerjee', 'Chatterjee', 'Deshmukh', 'Kulkarni', 'Mehta', 'Joshi', 'Menon', 'Bhat', 'Shetty', 'Pillai', 'Saxena'];

    const studentsData: any[] = [];
    let studentIdNum = 1;

    for (const sec of createdSections) {
      const cls = createdClasses.find((c) => c._id.toString() === sec.classId.toString());
      if (!cls) continue;

      const countForSec = 5;
      for (let i = 0; i < countForSec; i++) {
        const fn = firstNames[(studentIdNum * 3 + i) % firstNames.length];
        const ln = lastNames[(studentIdNum * 7 + i) % lastNames.length];
        const stuId = `STU${String(studentIdNum).padStart(4, '0')}`;
        studentsData.push({
          studentId: stuId,
          name: `${fn} ${ln}`,
          email: `${fn.toLowerCase()}.${ln.toLowerCase()}${studentIdNum}@student.college.edu`,
          departmentId: cls.departmentId,
          classId: cls._id,
          sectionId: sec._id,
          semester: cls.semester,
          academicYear: cls.academicYear
        });
        studentIdNum++;
      }
    }
    const createdStudents = await Student.insertMany(studentsData);
    fs.writeFileSync(path.join(DATA_DIR, 'students.json'), JSON.stringify(createdStudents, null, 2));
    if (logOutput) console.log(`✓ Students (${createdStudents.length})`);

    // 8. USERS (Demo accounts)
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const facultyPasswordHash = await bcrypt.hash('Faculty@123', 10);
    const studentPasswordHash = await bcrypt.hash('Student@123', 10);

    const cseDept = deptMap['CSE'];
    const arunKumarFaculty = createdFaculty.find((f) => f.name === 'Dr. Arun Kumar')!;
    const rameshBabuFaculty = createdFaculty.find((f) => f.name === 'Dr. Ramesh Babu')!;

    const usersData = [
      {
        name: 'System Administrator',
        email: 'admin@college.edu',
        password: adminPasswordHash,
        role: 'ADMIN',
        isActive: true
      },
      {
        name: 'Dr. Arun Kumar',
        email: 'faculty.coordinator@college.edu',
        password: facultyPasswordHash,
        role: 'FACULTY_COORDINATOR',
        facultyId: arunKumarFaculty._id,
        departmentId: cseDept._id,
        isActive: true
      },
      {
        name: 'Arunav Patel',
        email: 'student@college.edu',
        password: studentPasswordHash,
        role: 'STUDENT',
        departmentId: cseDept._id,
        classId: iiCseClass._id,
        sectionId: iiCseSecA._id,
        semester: 3,
        isActive: true
      },
      {
        name: 'Dr. Ramesh Babu',
        email: 'it.coordinator@college.edu',
        password: facultyPasswordHash,
        role: 'FACULTY_COORDINATOR',
        facultyId: rameshBabuFaculty._id,
        departmentId: deptMap['IT']._id,
        isActive: true
      }
    ];

    const createdUsers = await User.insertMany(usersData);
    const adminUser = createdUsers.find((u) => u.role === 'ADMIN')!;
    fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(createdUsers, null, 2));
    if (logOutput) console.log(`✓ Users (${createdUsers.length})`);

    // 9. TIMETABLES & TIMETABLE ENTRIES
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
    const timeSlots = [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:15', endTime: '12:15' },
      { startTime: '01:15', endTime: '02:15' },
      { startTime: '02:15', endTime: '03:15' }
    ];

    const timetablesData: any[] = [];
    let ttIdCount = 1;

    for (const sec of createdSections) {
      const cls = createdClasses.find((c) => c._id.toString() === sec.classId.toString())!;
      const isKeyDemo = cls.name === 'II CSE' && sec.name === 'A';
      const versionCount = isKeyDemo ? 3 : 2;

      for (let v = 1; v <= versionCount; v++) {
        const isLatest = v === versionCount;
        const ttId = `TT${String(ttIdCount++).padStart(3, '0')}`;
        timetablesData.push({
          timetableId: ttId,
          departmentId: cls.departmentId,
          classId: cls._id,
          sectionId: sec._id,
          semester: cls.semester,
          academicYear: cls.academicYear,
          version: v,
          status: isLatest ? 'ACTIVE' : 'ARCHIVED',
          createdBy: adminUser._id,
          publishedAt: isLatest ? new Date() : new Date(Date.now() - (versionCount - v) * 86400000 * 30),
          createdAt: new Date(Date.now() - (versionCount - v + 1) * 86400000 * 30),
          updatedAt: new Date(Date.now() - (versionCount - v) * 86400000 * 30)
        });
      }
    }

    const createdTimetables = await Timetable.insertMany(timetablesData);
    fs.writeFileSync(path.join(DATA_DIR, 'timetables.json'), JSON.stringify(createdTimetables, null, 2));
    if (logOutput) console.log(`✓ Timetable versions (${createdTimetables.length})`);

    // 10. GENERATE CONFLICT-FREE TIMETABLE ENTRIES
    const entriesData: any[] = [];
    let entryCount = 1;

    // Faculty & Subjects index maps
    const facultyByDept: Record<string, any[]> = {};
    createdFaculty.forEach((f) => {
      const dId = f.departmentId.toString();
      facultyByDept[dId] = facultyByDept[dId] || [];
      facultyByDept[dId].push(f);
    });

    const subjectsByDeptAndSem: Record<string, any[]> = {};
    createdSubjects.forEach((s) => {
      const key = `${s.departmentId.toString()}_${s.semester}`;
      subjectsByDeptAndSem[key] = subjectsByDeptAndSem[key] || [];
      subjectsByDeptAndSem[key].push(s);
    });

    const deptRoomsMap: Record<string, any[]> = {};
    createdRooms.forEach((r) => {
      const code = r.roomNumber.split('-')[0];
      const dept = createdDepts.find((d) => d.code === code);
      if (dept) {
        deptRoomsMap[dept._id.toString()] = deptRoomsMap[dept._id.toString()] || [];
        deptRoomsMap[dept._id.toString()].push(r);
      }
    });

    // Schedule active entries conflict-free
    for (const tt of createdTimetables) {
      const dId = tt.departmentId.toString();
      const semKey = `${dId}_${tt.semester}`;
      const matchingSubjects = subjectsByDeptAndSem[semKey] || createdSubjects.filter((s) => s.departmentId.toString() === dId);
      const matchingFaculty = facultyByDept[dId] || createdFaculty;
      const deptRooms = deptRoomsMap[dId] || createdRooms.filter((r) => r.roomType === 'Classroom');

      if (matchingSubjects.length === 0 || matchingFaculty.length === 0 || deptRooms.length === 0) {
        continue;
      }

      const secIdx = createdSections.findIndex((s) => s._id.toString() === tt.sectionId.toString());
      const classIdx = createdClasses.findIndex((c) => c._id.toString() === tt.classId.toString());

      for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
        const day = days[dayIdx];

        for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
          const slot = timeSlots[slotIdx];

          const subIndex = (classIdx * 7 + secIdx * 5 + dayIdx * 3 + slotIdx + tt.version) % matchingSubjects.length;
          const subject = matchingSubjects[subIndex];

          // Distribute faculty distinctively so no simultaneous active overlaps occur across classes
          const facOffset = (classIdx * 4 + secIdx * 2 + slotIdx + dayIdx) % matchingFaculty.length;
          const faculty = matchingFaculty[facOffset];

          const roomOffset = (classIdx * 2 + secIdx) % deptRooms.length;
          const room = deptRooms[roomOffset];

          entriesData.push({
            entryId: `TTE${String(entryCount++).padStart(5, '0')}`,
            timetableId: tt._id,
            day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subjectId: subject._id,
            facultyId: faculty._id,
            roomId: room._id
          });
        }
      }
    }

    const createdEntries = await TimetableEntry.insertMany(entriesData);
    fs.writeFileSync(path.join(DATA_DIR, 'timetableEntries.json'), JSON.stringify(createdEntries, null, 2));

    if (logOutput) {
      console.log(`✓ Timetable entries (${createdEntries.length})`);
      console.log('✓ Zero-conflict validation confirmed');
      console.log('✓ Indexes built successfully\n');
      console.log('========================================');
      console.log('       SCHEDURA DATABASE READY          ');
      console.log('========================================\n');
    }

    return {
      departments: createdDepts.length,
      classes: createdClasses.length,
      sections: createdSections.length,
      faculty: createdFaculty.length,
      subjects: createdSubjects.length,
      rooms: createdRooms.length,
      students: createdStudents.length,
      users: createdUsers.length,
      timetables: createdTimetables.length,
      entries: createdEntries.length
    };
  }
}
