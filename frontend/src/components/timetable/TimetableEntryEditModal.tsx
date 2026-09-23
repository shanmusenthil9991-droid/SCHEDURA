import React, { useState, useEffect } from 'react';
import { TimetableEntry, Subject, Faculty, Room, DayOfWeek } from '../../types';
import { subjectService, facultyService, roomService, timetableService } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface TimetableEntryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetableId: string;
  departmentId?: string;
  entry?: TimetableEntry | null; // null if adding new entry
  defaultDay?: DayOfWeek;
  defaultSlot?: { startTime: string; endTime: string };
  onSuccess: () => void;
}

export const TimetableEntryEditModal: React.FC<TimetableEntryEditModalProps> = ({
  isOpen,
  onClose,
  timetableId,
  departmentId,
  entry,
  defaultDay = 'Monday',
  defaultSlot,
  onSuccess
}) => {
  const [day, setDay] = useState<DayOfWeek>(entry?.day || defaultDay);
  const [startTime, setStartTime] = useState<string>(entry?.startTime || defaultSlot?.startTime || '09:00');
  const [endTime, setEndTime] = useState<string>(entry?.endTime || defaultSlot?.endTime || '10:00');
  const [subjectId, setSubjectId] = useState<string>(
    typeof entry?.subjectId === 'object' ? entry.subjectId._id : (entry?.subjectId as any) || ''
  );
  const [facultyId, setFacultyId] = useState<string>(
    typeof entry?.facultyId === 'object' ? entry.facultyId._id : (entry?.facultyId as any) || ''
  );
  const [roomId, setRoomId] = useState<string>(
    typeof entry?.roomId === 'object' ? entry.roomId._id : (entry?.roomId as any) || ''
  );

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [checkingConflict, setCheckingConflict] = useState<boolean>(false);
  const [conflictErrors, setConflictErrors] = useState<string[]>([]);

  const toast = useToast();

  useEffect(() => {
    if (entry) {
      setDay(entry.day);
      setStartTime(entry.startTime);
      setEndTime(entry.endTime);
      setSubjectId(typeof entry.subjectId === 'object' ? entry.subjectId._id : (entry.subjectId as any));
      setFacultyId(typeof entry.facultyId === 'object' ? entry.facultyId._id : (entry.facultyId as any));
      setRoomId(typeof entry.roomId === 'object' ? entry.roomId._id : (entry.roomId as any));
    } else {
      setDay(defaultDay);
      if (defaultSlot) {
        setStartTime(defaultSlot.startTime);
        setEndTime(defaultSlot.endTime);
      }
    }
    setConflictErrors([]);
  }, [entry, isOpen, defaultDay, defaultSlot]);

  // Fetch dropdown records
  useEffect(() => {
    if (!isOpen) return;

    const fetchDropdowns = async () => {
      try {
        const [subRes, facRes, rmRes] = await Promise.all([
          subjectService.getAll({ departmentId }),
          facultyService.getAll({ departmentId }),
          roomService.getAll()
        ]);
        if (subRes.data) setSubjects(subRes.data);
        if (facRes.data) setFacultyList(facRes.data);
        if (rmRes.data) setRooms(rmRes.data);

        // Preselect first items if empty and adding new
        if (!entry) {
          if (subRes.data?.length > 0 && !subjectId) setSubjectId(subRes.data[0]._id);
          if (facRes.data?.length > 0 && !facultyId) setFacultyId(facRes.data[0]._id);
          if (rmRes.data?.length > 0 && !roomId) setRoomId(rmRes.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load form options:', err);
      }
    };
    fetchDropdowns();
  }, [isOpen, departmentId]);

  const handleValidateConflict = async () => {
    if (!subjectId || !facultyId || !roomId || !startTime || !endTime) return;
    setCheckingConflict(true);
    setConflictErrors([]);

    try {
      const res = await timetableService.checkConflict({
        timetableId,
        day,
        startTime,
        endTime,
        subjectId,
        facultyId,
        roomId,
        excludeEntryId: entry?._id
      });

      if (res.hasConflict) {
        setConflictErrors(res.conflicts);
        toast.warning('Schedule conflict detected', res.conflicts.join(' '));
      } else {
        toast.success('No conflicts detected', 'This time slot and resources are completely available.');
      }
    } catch (err) {
      console.error('Conflict check error:', err);
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !facultyId || !roomId) {
      toast.error('Please complete all fields');
      return;
    }

    setLoading(true);
    try {
      if (entry) {
        // Update existing entry
        await timetableService.updateEntry(entry._id, {
          day,
          startTime,
          endTime,
          subjectId,
          facultyId,
          roomId
        });
        toast.success('Timetable entry updated successfully');
      } else {
        // Add new entry
        await timetableService.addEntry(timetableId, {
          day,
          startTime,
          endTime,
          subjectId,
          facultyId,
          roomId
        });
        toast.success('Timetable entry added successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save entry';
      const conflicts = err.response?.data?.conflicts;
      if (conflicts && conflicts.length > 0) {
        setConflictErrors(conflicts);
        toast.error('Schedule Conflict', conflicts.join(' '));
      } else {
        toast.error('Save failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    if (!window.confirm('Are you sure you want to remove this timetable entry?')) return;

    setLoading(true);
    try {
      await timetableService.deleteEntry(entry._id);
      toast.success('Timetable entry deleted');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Failed to delete entry', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
      subtitle="Configure subject, faculty, room, and time slot with automatic conflict checking."
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {conflictErrors.length > 0 && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700 text-xs font-bold mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Conflict Warning
            </div>
            <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
              {conflictErrors.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Day"
            value={day}
            onChange={(e) => setDay(e.target.value as DayOfWeek)}
            options={days.map((d) => ({ value: d, label: d }))}
          />
          <Input
            label="Start Time"
            type="text"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="09:00"
          />
          <Input
            label="End Time"
            type="text"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="10:00"
          />
        </div>

        <Select
          label="Subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          options={subjects.map((s) => ({
            value: s._id,
            label: `${s.subjectName} (${s.subjectCode} • ${s.credits} Credits)`
          }))}
        />

        <Select
          label="Assigned Faculty"
          value={facultyId}
          onChange={(e) => setFacultyId(e.target.value)}
          options={facultyList.map((f) => ({
            value: f._id,
            label: `${f.name} — ${f.designation}`
          }))}
        />

        <Select
          label="Assigned Room / Laboratory"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          options={rooms.map((r) => ({
            value: r._id,
            label: `${r.roomNumber} (${r.roomType} • ${r.building} • Cap: ${r.capacity})`
          }))}
        />

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {entry && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Entry
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleValidateConflict}
              isLoading={checkingConflict}
            >
              Verify Conflict
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}>
              {entry ? 'Update Entry' : 'Add Entry'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
