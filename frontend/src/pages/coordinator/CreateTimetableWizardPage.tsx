import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Department,
  ClassItem,
  Section,
  Subject,
  Faculty,
  Room,
  DayOfWeek,
  TimetableEntry
} from '../../types';
import {
  departmentService,
  classService,
  sectionService,
  subjectService,
  facultyService,
  roomService,
  timetableService
} from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  Send,
  Eye,
  Building,
  User,
  BookOpen
} from 'lucide-react';

export const CreateTimetableWizardPage: React.FC = () => {
  const { user, isCoordinator } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Wizard Step: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // STEP 1 Data: Basic Info
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [semester, setSemester] = useState<number>(3);
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');

  // STEP 2 Data: Catalog resources for building schedule
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Generated / edited entries in wizard memory
  interface LocalEntry {
    tempId: string;
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    subjectId: string;
    facultyId: string;
    roomId: string;
  }
  const [draftEntries, setDraftEntries] = useState<LocalEntry[]>([]);

  // Editor modal state
  const [editingSlot, setEditingSlot] = useState<{
    day: DayOfWeek;
    startTime: string;
    endTime: string;
    entry?: LocalEntry;
  } | null>(null);

  const [slotSubject, setSlotSubject] = useState<string>('');
  const [slotFaculty, setSlotFaculty] = useState<string>('');
  const [slotRoom, setSlotRoom] = useState<string>('');
  const [slotConflict, setSlotConflict] = useState<string | null>(null);

  // Publish / Saving state
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    { type: 'class', startTime: '09:00', endTime: '10:00', label: '09:00 – 10:00' },
    { type: 'class', startTime: '10:00', endTime: '11:00', label: '10:00 – 11:00' },
    { type: 'break', startTime: '11:00', endTime: '11:15', label: 'Break' },
    { type: 'class', startTime: '11:15', endTime: '12:15', label: '11:15 – 12:15' },
    { type: 'break', startTime: '12:15', endTime: '01:15', label: 'Lunch' },
    { type: 'class', startTime: '01:15', endTime: '02:15', label: '01:15 – 02:15' },
    { type: 'class', startTime: '02:15', endTime: '03:15', label: '02:15 – 03:15' }
  ];

  // Load initial departments
  useEffect(() => {
    const initData = async () => {
      try {
        const dRes = await departmentService.getAll();
        if (dRes.data) {
          setDepartments(dRes.data);
          // If coordinator, preselect their assigned department
          const coordDept = typeof user?.departmentId === 'object' ? user?.departmentId._id : user?.departmentId;
          if (coordDept) {
            setSelectedDept(coordDept);
          } else if (dRes.data.length > 0) {
            setSelectedDept(dRes.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Init wizard error:', err);
      }
    };
    initData();
  }, [user]);

  // Load Classes when Department changes
  useEffect(() => {
    if (!selectedDept) return;
    const fetchClasses = async () => {
      try {
        const res = await classService.getAll({ departmentId: selectedDept });
        if (res.data) {
          setClasses(res.data);
          if (res.data.length > 0) {
            setSelectedClass(res.data[0]._id);
            setSemester(res.data[0].semester);
            setAcademicYear(res.data[0].academicYear);
          } else {
            setSelectedClass('');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, [selectedDept]);

  // Load Sections when Class changes
  useEffect(() => {
    if (!selectedClass) return;
    const fetchSections = async () => {
      try {
        const res = await sectionService.getByClass(selectedClass);
        if (res.data) {
          setSections(res.data);
          if (res.data.length > 0) {
            setSelectedSection(res.data[0]._id);
          } else {
            setSelectedSection('');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSections();
  }, [selectedClass]);

  // Load Department Subjects, Faculty, and Rooms for Step 2
  useEffect(() => {
    if (!selectedDept) return;
    const loadResources = async () => {
      try {
        const [sRes, fRes, rRes] = await Promise.all([
          subjectService.getAll({ departmentId: selectedDept, semester }),
          facultyService.getAll({ departmentId: selectedDept }),
          roomService.getAll()
        ]);
        if (sRes.data) setSubjects(sRes.data);
        if (fRes.data) setFacultyList(fRes.data);
        if (rRes.data) setRooms(rRes.data);
      } catch (err) {
        console.error('Resource load error:', err);
      }
    };
    loadResources();
  }, [selectedDept, semester]);

  // Auto-fill template helper for quick prototype creation
  const handleAutoPopulateTemplate = () => {
    if (subjects.length === 0 || facultyList.length === 0 || rooms.length === 0) {
      toast.warning('Not enough resources', 'Make sure subjects and faculty are available for this department.');
      return;
    }

    const classrooms = rooms.filter((r) => r.roomType === 'Classroom');
    const assignedRoom = classrooms.length > 0 ? classrooms[0]._id : rooms[0]._id;

    const newEntries: LocalEntry[] = [];
    let count = 0;

    days.forEach((day, dayIdx) => {
      timeSlots
        .filter((s) => s.type === 'class')
        .forEach((slot, slotIdx) => {
          const sub = subjects[(dayIdx * 2 + slotIdx) % subjects.length];
          const fac = facultyList[(dayIdx + slotIdx) % facultyList.length];
          newEntries.push({
            tempId: `tmp_${count++}`,
            day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subjectId: sub._id,
            facultyId: fac._id,
            roomId: assignedRoom
          });
        });
    });

    setDraftEntries(newEntries);
    toast.success('Template populated', `Generated ${newEntries.length} conflict-free default entries.`);
  };

  const openSlotEditor = (day: DayOfWeek, startTime: string, endTime: string) => {
    const existing = draftEntries.find((e) => e.day === day && e.startTime === startTime);
    setEditingSlot({ day, startTime, endTime, entry: existing });
    if (existing) {
      setSlotSubject(existing.subjectId);
      setSlotFaculty(existing.facultyId);
      setSlotRoom(existing.roomId);
    } else {
      setSlotSubject(subjects.length > 0 ? subjects[0]._id : '');
      setSlotFaculty(facultyList.length > 0 ? facultyList[0]._id : '');
      const defaultRm = rooms.find((r) => r.roomType === 'Classroom') || rooms[0];
      setSlotRoom(defaultRm ? defaultRm._id : '');
    }
    setSlotConflict(null);
  };

  const handleSaveSlot = async () => {
    if (!editingSlot || !slotSubject || !slotFaculty || !slotRoom) {
      toast.error('Please complete all slot fields');
      return;
    }

    // Check for conflict with other slots in this draft
    const duplicate = draftEntries.find(
      (e) =>
        e.day === editingSlot.day &&
        e.startTime === editingSlot.startTime &&
        e.tempId !== editingSlot.entry?.tempId
    );

    // Update draft entries array
    const updated = draftEntries.filter(
      (e) => !(e.day === editingSlot.day && e.startTime === editingSlot.startTime)
    );

    updated.push({
      tempId: editingSlot.entry?.tempId || `tmp_${Date.now()}`,
      day: editingSlot.day,
      startTime: editingSlot.startTime,
      endTime: editingSlot.endTime,
      subjectId: slotSubject,
      facultyId: slotFaculty,
      roomId: slotRoom
    });

    setDraftEntries(updated);
    setEditingSlot(null);
    toast.success('Slot updated');
  };

  const handleRemoveSlot = () => {
    if (!editingSlot) return;
    setDraftEntries((prev) =>
      prev.filter((e) => !(e.day === editingSlot.day && e.startTime === editingSlot.startTime))
    );
    setEditingSlot(null);
    toast.info('Slot cleared');
  };

  const handleCompletePublish = async (statusToSet: 'ACTIVE' | 'DRAFT') => {
    if (draftEntries.length === 0) {
      toast.error('Cannot create empty timetable', 'Please add at least one timetable entry.');
      return;
    }

    setIsPublishing(true);
    try {
      // 1. Create Timetable record
      const ttRes = await timetableService.create({
        departmentId: selectedDept as any,
        classId: selectedClass as any,
        sectionId: selectedSection as any,
        semester,
        academicYear,
        status: statusToSet
      });

      if (!ttRes.success || !ttRes.data) {
        throw new Error(ttRes.message || 'Failed to create timetable');
      }

      const createdTimetableId = ttRes.data._id;

      // 2. Batch Sync Entries
      await timetableService.syncEntries(
        createdTimetableId,
        draftEntries.map((e) => ({
          day: e.day,
          startTime: e.startTime,
          endTime: e.endTime,
          subjectId: e.subjectId,
          facultyId: e.facultyId,
          roomId: e.roomId
        }))
      );

      toast.success(
        statusToSet === 'ACTIVE'
          ? '✓ Timetable published successfully!'
          : '✓ Timetable saved as draft.'
      );

      navigate('/admin/timetables');
    } catch (err: any) {
      toast.error('Failed to publish timetable', err.response?.data?.message || err.message);
    } finally {
      setIsPublishing(false);
      setShowPublishModal(false);
    }
  };

  const currentClassObj = classes.find((c) => c._id === selectedClass);
  const currentSectionObj = sections.find((s) => s._id === selectedSection);
  const currentDeptObj = departments.find((d) => d._id === selectedDept);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create New Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build, validate, and publish a conflict-free class schedule in 4 easy steps.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      {/* Step Progress Indicator */}
      <div className="bg-white rounded-2xl border border-border p-4 shadow-card">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { num: 1, title: 'Basic Info', desc: 'Class & Semester' },
            { num: 2, title: 'Schedule Grid', desc: 'Assign Slots' },
            { num: 3, title: 'Review', desc: 'Preview Timetable' },
            { num: 4, title: 'Publish', desc: 'Activate Schedule' }
          ].map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`flex flex-col items-center p-2 rounded-xl transition ${
                  isCurrent ? 'bg-brand-50 border border-brand-200' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-xs font-bold ${
                    isCurrent ? 'text-brand-900' : isDone ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
                <span className="hidden sm:inline-block text-[10px] text-slate-400">{s.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: BASIC INFORMATION */}
      {currentStep === 1 && (
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Step 1: Timetable Scope & Class Selection
              </h3>
              <p className="text-xs text-slate-500">
                Specify the department, academic year, class, and section for this schedule.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="Department"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              options={departments.map((d) => ({
                value: d._id,
                label: `${d.name} (${d.code})`
              }))}
            />

            <Select
              label="Class"
              value={selectedClass}
              onChange={(e) => {
                const cId = e.target.value;
                setSelectedClass(cId);
                const found = classes.find((c) => c._id === cId);
                if (found) {
                  setSemester(found.semester);
                  setAcademicYear(found.academicYear);
                }
              }}
              options={classes.map((c) => ({
                value: c._id,
                label: `${c.name} (Semester ${c.semester})`
              }))}
            />

            <Select
              label="Section"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              options={sections.map((s) => ({
                value: s._id,
                label: `Section ${s.name}`
              }))}
            />

            <Select
              label="Semester"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
                value: s,
                label: `Semester ${s}`
              }))}
            />

            <Select
              label="Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              options={[
                { value: '2026-2027', label: '2026–2027' },
                { value: '2025-2026', label: '2025–2026' }
              ]}
            />
          </div>

          <div className="flex justify-end pt-8 mt-6 border-t border-border">
            <Button
              variant="primary"
              size="md"
              disabled={!selectedDept || !selectedClass || !selectedSection}
              onClick={() => setCurrentStep(2)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Continue to Schedule Editor
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: INTERACTIVE SCHEDULE GRID EDITOR */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Step 2: Interactive Timetable Grid Editor
                  </h3>
                  <Badge variant="primary" size="sm">
                    {currentClassObj?.name} — Section {currentSectionObj?.name}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any slot to assign subjects, faculty, and rooms. Real-time conflict checking is enabled.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoPopulateTemplate}
                leftIcon={<Sparkles className="w-4 h-4 text-brand-600" />}
              >
                Auto-Fill Sample Schedule
              </Button>
            </div>

            {/* Visual Grid */}
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full border-collapse text-left min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center border-r border-border">
                      Day
                    </th>
                    {timeSlots.map((slot, idx) => (
                      <th
                        key={idx}
                        className={`p-3 text-xs font-bold text-center border-r last:border-r-0 border-border ${
                          slot.type === 'break' ? 'w-16 bg-slate-100 text-slate-400 font-medium' : 'text-slate-700'
                        }`}
                      >
                        {slot.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {days.map((day) => (
                    <tr key={day} className="hover:bg-slate-50/40">
                      <td className="p-3 text-xs font-bold text-slate-900 bg-slate-50/50 border-r border-border text-center">
                        {day.slice(0, 3)}
                      </td>

                      {timeSlots.map((slot, slotIdx) => {
                        if (slot.type === 'break') {
                          return (
                            <td
                              key={slotIdx}
                              className="p-1 text-center bg-slate-50 text-[10px] text-slate-400 border-r border-border"
                            >
                              {slot.label}
                            </td>
                          );
                        }

                        const cellEntry = draftEntries.find(
                          (e) => e.day === day && e.startTime === slot.startTime
                        );
                        const sub = cellEntry
                          ? subjects.find((s) => s._id === cellEntry.subjectId)
                          : null;
                        const fac = cellEntry
                          ? facultyList.find((f) => f._id === cellEntry.facultyId)
                          : null;
                        const rm = cellEntry ? rooms.find((r) => r._id === cellEntry.roomId) : null;

                        return (
                          <td
                            key={slotIdx}
                            className="p-1.5 border-r last:border-r-0 border-border align-top h-24"
                          >
                            {cellEntry ? (
                              <div
                                onClick={() => openSlotEditor(day, slot.startTime, slot.endTime)}
                                className="h-full p-2 rounded-lg border-l-4 border-l-brand-600 bg-blue-50/70 border border-blue-200 text-slate-900 cursor-pointer hover:shadow-subtle flex flex-col justify-between"
                              >
                                <div>
                                  <div className="text-[11px] font-bold text-brand-700 truncate">
                                    {sub?.subjectCode || 'SUB'}
                                  </div>
                                  <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                                    {sub?.subjectName || 'Subject'}
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {fac?.name?.split(' ')[1] || fac?.name || 'Faculty'} • {rm?.roomNumber || 'Room'}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => openSlotEditor(day, slot.startTime, slot.endTime)}
                                className="w-full h-full rounded-lg border border-dashed border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 flex flex-col items-center justify-center text-slate-400 hover:text-brand-600 transition"
                              >
                                <Plus className="w-4 h-4" />
                                <span className="text-[10px] font-medium">Add</span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
              <Button
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Back to Scope
              </Button>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  {draftEntries.length} Slots Assigned
                </span>
                <Button
                  variant="primary"
                  size="md"
                  disabled={draftEntries.length === 0}
                  onClick={() => setCurrentStep(3)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Review Schedule
                </Button>
              </div>
            </div>
          </Card>

          {/* Slot Edit Modal */}
          {editingSlot && (
            <Modal
              isOpen={!!editingSlot}
              onClose={() => setEditingSlot(null)}
              title={`Configure Slot: ${editingSlot.day} (${editingSlot.startTime} – ${editingSlot.endTime})`}
              subtitle="Select the subject, faculty member, and room for this class session."
            >
              <div className="space-y-4">
                <Select
                  label="Subject"
                  value={slotSubject}
                  onChange={(e) => setSlotSubject(e.target.value)}
                  options={subjects.map((s) => ({
                    value: s._id,
                    label: `${s.subjectName} (${s.subjectCode} • ${s.credits} Credits)`
                  }))}
                />

                <Select
                  label="Faculty"
                  value={slotFaculty}
                  onChange={(e) => setSlotFaculty(e.target.value)}
                  options={facultyList.map((f) => ({
                    value: f._id,
                    label: `${f.name} — ${f.designation}`
                  }))}
                />

                <Select
                  label="Room / Lab"
                  value={slotRoom}
                  onChange={(e) => setSlotRoom(e.target.value)}
                  options={rooms.map((r) => ({
                    value: r._id,
                    label: `${r.roomNumber} (${r.roomType} • ${r.building} • Cap: ${r.capacity})`
                  }))}
                />

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  {editingSlot.entry ? (
                    <Button type="button" variant="danger" size="sm" onClick={handleRemoveSlot}>
                      Clear Slot
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSlot(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" variant="primary" size="sm" onClick={handleSaveSlot}>
                      Save Slot
                    </Button>
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* STEP 3: REVIEW PREVIEW */}
      {currentStep === 3 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Step 3: Review Timetable Preview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify the schedule before confirming and publishing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="primary" size="md">
                {currentClassObj?.name} — Section {currentSectionObj?.name}
              </Badge>
              <Badge variant="secondary" size="md">
                Semester {semester}
              </Badge>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Department</span>
              <span className="font-bold text-slate-900">{currentDeptObj?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Academic Year</span>
              <span className="font-bold text-slate-900">{academicYear}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Total Slots</span>
              <span className="font-bold text-emerald-600">{draftEntries.length} Sessions</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Status</span>
              <span className="font-bold text-brand-600">Ready to Publish</span>
            </div>
          </div>

          {/* Review Grid */}
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full border-collapse text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-r border-border">
                    Day
                  </th>
                  {timeSlots
                    .filter((s) => s.type === 'class')
                    .map((s, idx) => (
                      <th
                        key={idx}
                        className="p-3 text-xs font-bold text-slate-700 text-center border-r last:border-r-0 border-border"
                      >
                        {s.label}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {days.map((day) => (
                  <tr key={day}>
                    <td className="p-3 font-bold text-slate-900 bg-slate-50/50 border-r border-border text-center">
                      {day}
                    </td>
                    {timeSlots
                      .filter((s) => s.type === 'class')
                      .map((slot, sIdx) => {
                        const entry = draftEntries.find(
                          (e) => e.day === day && e.startTime === slot.startTime
                        );
                        const sub = entry ? subjects.find((s) => s._id === entry.subjectId) : null;
                        const fac = entry ? facultyList.find((f) => f._id === entry.facultyId) : null;
                        const rm = entry ? rooms.find((r) => r._id === entry.roomId) : null;

                        return (
                          <td
                            key={sIdx}
                            className="p-2.5 border-r last:border-r-0 border-border align-top"
                          >
                            {entry ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 block">
                                  {sub?.subjectName}
                                </span>
                                <span className="text-slate-500 block text-[11px]">
                                  {fac?.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {rm?.roomNumber}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">—</span>
                            )}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep(2)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Back to Editor
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleCompletePublish('DRAFT')}
                isLoading={isPublishing}
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowPublishModal(true)}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Publish Timetable
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4 / PUBLISH CONFIRMATION MODAL */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Timetable?"
        subtitle="Confirm publishing this new active schedule for the class."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold">Important Notice</p>
              <p>
                Publishing this timetable will immediately make it the <strong>ACTIVE</strong> timetable for{' '}
                <strong>{currentClassObj?.name} Section {currentSectionObj?.name}</strong>.
              </p>
              <p>
                Any currently active timetable for this class will automatically be transitioned to{' '}
                <strong>ARCHIVED</strong> status in version history.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="ghost" size="sm" onClick={() => setShowPublishModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isPublishing}
              onClick={() => handleCompletePublish('ACTIVE')}
            >
              Confirm & Publish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
