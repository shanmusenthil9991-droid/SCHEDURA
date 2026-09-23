import React, { useState, useEffect } from 'react';
import {
  Department,
  ClassItem,
  Section,
  Subject,
  Room,
  Faculty,
  FacultyScheduleEntry,
  DayOfWeek,
  DAYS_OF_WEEK
} from '../../types';
import {
  classService,
  sectionService,
  subjectService,
  roomService,
  timetableService
} from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { useToast } from '../../contexts/ToastContext';
import {
  Calendar,
  Clock,
  BookOpen,
  Building,
  GraduationCap,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Users
} from 'lucide-react';

interface FacultySlotEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: Faculty;
  entry?: FacultyScheduleEntry | null;
  onSuccess: () => void;
}

const DEFAULT_TIME_SLOTS = [
  { label: '08:00 – 09:00 (Period 1)', start: '08:00', end: '09:00' },
  { label: '09:00 – 10:00 (Period 2)', start: '09:00', end: '10:00' },
  { label: '10:15 – 11:15 (Period 3)', start: '10:15', end: '11:15' },
  { label: '11:15 – 12:15 (Period 4)', start: '11:15', end: '12:15' },
  { label: '01:15 – 02:15 (Period 5)', start: '01:15', end: '02:15' },
  { label: '02:15 – 03:15 (Period 6)', start: '02:15', end: '03:15' },
  { label: '03:30 – 04:30 (Period 7)', start: '03:30', end: '04:30' }
];

export const FacultySlotEditModal: React.FC<FacultySlotEditModalProps> = ({
  isOpen,
  onClose,
  faculty,
  entry,
  onSuccess
}) => {
  const toast = useToast();

  const isEditing = !!entry;

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [timeSlotIndex, setTimeSlotIndex] = useState<number>(0);
  const [customStartTime, setCustomStartTime] = useState<string>('09:00');
  const [customEndTime, setCustomEndTime] = useState<string>('10:00');
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);

  const [conflicts, setConflicts] = useState<string[]>([]);
  const [checkingConflict, setCheckingConflict] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Load master records
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [cRes, rRes] = await Promise.all([
          classService.getAll(),
          roomService.getAll()
        ]);
        if (cRes.data) setClasses(cRes.data);
        if (rRes.data) setRooms(rRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (isOpen) {
      loadMasterData();
    }
  }, [isOpen]);

  // When class changes, load sections and subjects for that class/department
  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      setSubjects([]);
      return;
    }
    const loadClassDetails = async () => {
      try {
        const targetClass = classes.find((c) => c._id === selectedClassId);
        const deptId = targetClass
          ? typeof targetClass.departmentId === 'object'
            ? targetClass.departmentId._id
            : targetClass.departmentId
          : undefined;

        const [sRes, subRes] = await Promise.all([
          sectionService.getByClass(selectedClassId),
          subjectService.getAll(deptId ? { departmentId: deptId } : {})
        ]);

        if (sRes.data) {
          setSections(sRes.data);
          if (!selectedSectionId && sRes.data.length > 0) {
            setSelectedSectionId(sRes.data[0]._id);
          }
        }
        if (subRes.data) {
          setSubjects(subRes.data);
          if (!selectedSubjectId && subRes.data.length > 0) {
            setSelectedSubjectId(subRes.data[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadClassDetails();
  }, [selectedClassId, classes]);

  // Populate initial state if editing
  useEffect(() => {
    if (entry) {
      setSelectedClassId(entry.class?._id || '');
      setSelectedSectionId(entry.section?._id || '');
      setSelectedSubjectId(entry.subject?._id || '');
      setSelectedRoomId(entry.room?._id || '');
      setSelectedDay(entry.day);

      const foundSlotIdx = DEFAULT_TIME_SLOTS.findIndex(
        (s) => s.start === entry.startTime && s.end === entry.endTime
      );
      if (foundSlotIdx !== -1) {
        setTimeSlotIndex(foundSlotIdx);
        setIsCustomTime(false);
      } else {
        setIsCustomTime(true);
        setCustomStartTime(entry.startTime);
        setCustomEndTime(entry.endTime);
      }
    } else {
      // Defaults for new entry
      if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0]._id);
      }
      if (rooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(rooms[0]._id);
      }
      setSelectedDay('Monday');
      setTimeSlotIndex(0);
      setIsCustomTime(false);
    }
  }, [entry, classes, rooms]);

  const effectiveStartTime = isCustomTime
    ? customStartTime
    : DEFAULT_TIME_SLOTS[timeSlotIndex]?.start || '09:00';
  const effectiveEndTime = isCustomTime
    ? customEndTime
    : DEFAULT_TIME_SLOTS[timeSlotIndex]?.end || '10:00';

  // Conflict validation check
  const checkConflict = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedRoomId) return false;
    setCheckingConflict(true);
    try {
      const res = await timetableService.checkConflict({
        classId: selectedClassId,
        day: selectedDay,
        startTime: effectiveStartTime,
        endTime: effectiveEndTime,
        subjectId: selectedSubjectId,
        facultyId: faculty._id,
        roomId: selectedRoomId,
        excludeEntryId: entry?._id
      });
      if (res.hasConflict) {
        setConflicts(res.conflicts);
        return false;
      }
      setConflicts([]);
      return true;
    } catch (err) {
      console.error(err);
      return true;
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSectionId || !selectedSubjectId || !selectedRoomId) {
      toast.error('Please fill all required schedule fields');
      return;
    }

    const isValid = await checkConflict();
    if (!isValid && conflicts.length > 0) {
      toast.error('Schedule Conflict Detected', conflicts[0]);
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && entry) {
        // Update existing entry
        await timetableService.updateEntry(entry._id, {
          day: selectedDay,
          startTime: effectiveStartTime,
          endTime: effectiveEndTime,
          subjectId: selectedSubjectId,
          facultyId: faculty._id,
          roomId: selectedRoomId
        });
        toast.success('Teaching slot updated successfully');
      } else {
        // Find or create active timetable for target class & section
        const activeTtRes = await timetableService.getActive({
          classId: selectedClassId,
          sectionId: selectedSectionId
        });

        let targetTimetableId: string;
        if (activeTtRes.success && activeTtRes.data?._id) {
          targetTimetableId = activeTtRes.data._id;
        } else {
          // If no active timetable exists for this class, check if any timetable exists
          const allTtRes = await timetableService.getAll({
            classId: selectedClassId,
            sectionId: selectedSectionId
          });
          if (allTtRes.data && allTtRes.data.length > 0) {
            targetTimetableId = allTtRes.data[0]._id;
          } else {
            // Auto-create active timetable for this class and section
            const targetCls = classes.find((c) => c._id === selectedClassId);
            const deptId = targetCls
              ? typeof targetCls.departmentId === 'object'
                ? targetCls.departmentId._id
                : targetCls.departmentId
              : '';
            const newTtRes = await timetableService.create({
              departmentId: deptId as any,
              classId: selectedClassId as any,
              sectionId: selectedSectionId as any,
              semester: targetCls?.semester || 1,
              academicYear: '2026-2027',
              status: 'ACTIVE'
            });
            targetTimetableId = newTtRes.data._id;
          }
        }

        // Add entry to timetable
        await timetableService.addEntry(targetTimetableId, {
          day: selectedDay,
          startTime: effectiveStartTime,
          endTime: effectiveEndTime,
          subjectId: selectedSubjectId,
          facultyId: faculty._id,
          roomId: selectedRoomId
        });

        toast.success(`Assigned teaching slot to ${faculty.name}`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save slot', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    if (!window.confirm('Delete this scheduled class session from the timetable?')) return;
    setDeleting(true);
    try {
      await timetableService.deleteEntry(entry._id);
      toast.success('Teaching slot removed successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Failed to delete slot', err.response?.data?.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Teaching Slot for ${faculty.name}` : `Assign Teaching Slot to ${faculty.name}`}
      subtitle={`Configure where ${faculty.name} (${faculty.designation}) has to go to conduct lectures.`}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Faculty Header Pill */}
        <div className="bg-purple-50 rounded-xl p-3.5 border border-purple-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{faculty.name}</div>
              <div className="text-[11px] text-slate-500">{faculty.designation} • {faculty.facultyId}</div>
            </div>
          </div>
        </div>

        {/* Class & Section Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Target Class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            options={classes.map((c) => ({ value: c._id, label: `${c.name} (Sem ${c.semester})` }))}
            required
          />

          <Select
            label="Section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            options={sections.map((s) => ({ value: s._id, label: `Section ${s.name}` }))}
            disabled={!selectedClassId || sections.length === 0}
            required
          />
        </div>

        {/* Subject & Room Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Subject / Course"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            options={subjects.map((sub) => ({
              value: sub._id,
              label: `${sub.subjectCode || sub.code} — ${sub.subjectName || sub.name}`
            }))}
            disabled={!selectedClassId || subjects.length === 0}
            required
          />

          <Select
            label="Assigned Room / Lab (Where to Go)"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            options={rooms.map((r) => ({
              value: r._id,
              label: `${r.roomNumber} (${r.building} • Cap: ${r.capacity})`
            }))}
            required
          />
        </div>

        {/* Day & Time Slot */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Day of Week"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
              options={DAYS_OF_WEEK.map((d) => ({ value: d, label: d }))}
              required
            />

            {!isCustomTime ? (
              <Select
                label="Academic Period / Time Slot"
                value={String(timeSlotIndex)}
                onChange={(e) => setTimeSlotIndex(Number(e.target.value))}
                options={DEFAULT_TIME_SLOTS.map((s, idx) => ({
                  value: String(idx),
                  label: s.label
                }))}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Start Time"
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  required
                />
                <Input
                  label="End Time"
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsCustomTime(!isCustomTime)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
            >
              {isCustomTime ? 'Use Standard Periods' : 'Set Custom Time'}
            </button>
          </div>
        </div>

        {/* Live Conflict Warning Alert */}
        {conflicts.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-700 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Schedule Conflict Detected</span>
            </div>
            {conflicts.map((msg, i) => (
              <p key={i} className="text-[11px] pl-5">• {msg}</p>
            ))}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          {isEditing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="text-red-600 hover:bg-red-50"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Slot
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || checkingConflict}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Slot' : 'Assign Teaching Slot'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
