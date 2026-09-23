import React, { useState, useEffect } from 'react';
import { facultyService, departmentService } from '../../services/api';
import { Faculty, Department, FacultyScheduleEntry, DayOfWeek, DAYS_OF_WEEK } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  GraduationCap,
  Download,
  Printer,
  Search,
  Grid,
  List,
  RefreshCw,
  Building,
  ShieldCheck,
  Compass,
  CheckCircle2,
  ArrowRight,
  Plus,
  Edit2
} from 'lucide-react';
import { FacultySlotEditModal } from '../timetable/FacultySlotEditModal';

export const FacultyMovementViewer: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');

  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);
  const [facultyData, setFacultyData] = useState<{ faculty: Faculty; entries: FacultyScheduleEntry[] } | null>(null);

  const [isSlotModalOpen, setIsSlotModalOpen] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<FacultyScheduleEntry | null>(null);

  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'agenda' | 'matrix'>('agenda');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNames: (DayOfWeek | 'Sunday')[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[currentTime.getDay()];

  // Fetch departments & initial faculty list
  useEffect(() => {
    const init = async () => {
      setLoadingList(true);
      try {
        const [dRes, fRes] = await Promise.all([
          departmentService.getAll(),
          facultyService.getAll()
        ]);
        if (dRes.data) setDepartments(dRes.data);
        if (fRes.data && fRes.data.length > 0) {
          setFacultyList(fRes.data);
          setSelectedFacultyId(fRes.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load initial faculty:', err);
      } finally {
        setLoadingList(false);
      }
    };
    init();
  }, []);

  // Filter faculty list when department changes
  useEffect(() => {
    const loadFacultyByDept = async () => {
      setLoadingList(true);
      try {
        const params = selectedDept ? { departmentId: selectedDept } : {};
        const res = await facultyService.getAll(params);
        if (res.data) {
          setFacultyList(res.data);
          if (res.data.length > 0) {
            setSelectedFacultyId(res.data[0]._id);
          } else {
            setSelectedFacultyId('');
            setFacultyData(null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    };
    if (departments.length > 0) {
      loadFacultyByDept();
    }
  }, [selectedDept]);

  // Load schedule for selected faculty
  const loadSchedule = async (id: string) => {
    if (!id) return;
    setLoadingSchedule(true);
    try {
      const res = await facultyService.getScheduleById(id);
      if (res.success && res.data) {
        setFacultyData(res.data);
      } else {
        setFacultyData(null);
      }
    } catch (err) {
      console.error('Failed to load faculty schedule:', err);
      setFacultyData(null);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (selectedFacultyId) {
      loadSchedule(selectedFacultyId);
    }
  }, [selectedFacultyId]);

  const entries = facultyData?.entries || [];

  // Filter entries by day
  const filteredEntries = entries.filter((e) => {
    if (selectedDay !== 'ALL' && e.day !== selectedDay) return false;
    return true;
  });

  // Calculate live ongoing & next class for this faculty
  const toMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const currentHours = String(currentTime.getHours()).padStart(2, '0');
  const currentMinutes = String(currentTime.getMinutes()).padStart(2, '0');
  const currentMinVal = toMinutes(`${currentHours}:${currentMinutes}`);

  const todaysSessions = entries.filter((s) => s.day === currentDay);
  const ongoingSession = todaysSessions.find((s) => {
    const start = toMinutes(s.startTime);
    const end = toMinutes(s.endTime);
    return currentMinVal >= start && currentMinVal < end;
  });
  const nextSession = todaysSessions
    .filter((s) => toMinutes(s.startTime) > currentMinVal)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))[0] || null;

  // CSV Export
  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const facName = facultyData?.faculty?.name || 'Faculty';
    const headers = ['Day', 'Time', 'Class', 'Section', 'Subject Code', 'Subject Name', 'Room', 'Building'];
    const rows = entries.map((e) => [
      `"${e.day}"`,
      `"${e.startTime} - ${e.endTime}"`,
      `"${e.class?.name || ''}"`,
      `"${e.section?.name || ''}"`,
      `"${e.subject?.code || ''}"`,
      `"${e.subject?.name || ''}"`,
      `"${e.room?.roomNumber || ''}"`,
      `"${e.room?.building || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Faculty_Movement_${facName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Faculty Movement & Room Allocation Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Institutional teaching schedule inspector: track where professors and lecturers need to go across all classrooms & labs.
            </p>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          {/* Faculty Selector */}
          <select
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
            disabled={loadingList || facultyList.length === 0}
            className="bg-white border border-brand-300 shadow-subtle rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[220px]"
          >
            {facultyList.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name} ({f.designation})
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSchedule(selectedFacultyId)}
            disabled={loadingSchedule}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loadingSchedule ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingSlot(null);
              setIsSlotModalOpen(true);
            }}
            disabled={!facultyData?.faculty}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Assign Teaching Slot
          </Button>
        </div>
      </div>

      {loadingList || loadingSchedule ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : !facultyData || !facultyData.faculty ? (
        <EmptyState
          type="timetable"
          title="No Faculty Selected"
          description="Please select a faculty member from the dropdown above to view their teaching schedule and room movement matrix."
        />
      ) : (
        <div className="space-y-6">
          {/* Faculty Profile & Live Movement Card */}
          <div className="bg-slate-50 rounded-2xl border border-border p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-base border border-purple-200">
                {facultyData.faculty.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">
                    {facultyData.faculty.name}
                  </h4>
                  <span className="font-mono text-xs font-bold text-slate-600 bg-white border border-border px-2 py-0.5 rounded">
                    {facultyData.faculty.facultyId}
                  </span>
                  <Badge variant="primary" size="sm">
                    {facultyData.faculty.designation}
                  </Badge>
                  {facultyData.faculty.inChargeClassId && (
                    <span className="flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                      In-Charge: {typeof facultyData.faculty.inChargeClassId === 'object' ? (facultyData.faculty.inChargeClassId as any).name : 'Class'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span>Department: {typeof facultyData.faculty.departmentId === 'object' ? (facultyData.faculty.departmentId as any).name : 'Department'}</span>
                  <span>•</span>
                  <span>Email: {facultyData.faculty.email}</span>
                </div>
              </div>
            </div>

            {/* Live Movement Tracker Pill */}
            <div className="self-start lg:self-center">
              {ongoingSession ? (
                <div className="bg-emerald-100 border border-emerald-300 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                  </span>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      CURRENTLY IN CLASS ({ongoingSession.startTime} – {ongoingSession.endTime})
                    </div>
                    <div className="text-xs font-bold text-emerald-950">
                      {ongoingSession.class?.name} Sec {ongoingSession.section?.name} ➔ {ongoingSession.room?.roomNumber} ({ongoingSession.room?.building})
                    </div>
                  </div>
                </div>
              ) : nextSession ? (
                <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-subtle">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      NEXT SESSION AT {nextSession.startTime}
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {nextSession.class?.name} Sec {nextSession.section?.name} ➔ {nextSession.room?.roomNumber}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600">
                  No lectures scheduled right now
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
            <div className="bg-white p-3.5 rounded-xl border border-border shadow-subtle">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Weekly Load</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{entries.length} Sessions / Week</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-border shadow-subtle">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Lectures ({currentDay})</div>
              <div className="text-xl font-extrabold text-brand-700 mt-0.5">{todaysSessions.length} Classes</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-border shadow-subtle">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Classes Taught</div>
              <div className="text-xl font-extrabold text-purple-700 mt-0.5">
                {new Set(entries.map((e) => `${e.class?._id}-${e.section?._id}`)).size} Distinct Classes
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-border shadow-subtle">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workload Compliance</div>
              <div className="text-xs font-bold text-emerald-700 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Normal ({entries.length} / 18 hrs max)
              </div>
            </div>
          </div>

          {/* Filter & View Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
            {/* Day Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedDay('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedDay === 'ALL'
                    ? 'bg-brand-600 text-white shadow-subtle'
                    : 'bg-white text-slate-600 border border-border hover:bg-slate-50'
                }`}
              >
                All Days ({entries.length})
              </button>
              {DAYS_OF_WEEK.map((day) => {
                const count = entries.filter((e) => e.day === day).length;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedDay === day
                        ? 'bg-brand-600 text-white shadow-subtle'
                        : 'bg-white text-slate-600 border border-border hover:bg-slate-50'
                    }`}
                  >
                    {day.slice(0, 3)} ({count})
                  </button>
                );
              })}
            </div>

            {/* View Mode & Export Actions */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('agenda')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === 'agenda'
                      ? 'bg-white text-slate-900 shadow-subtle'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Agenda</span>
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    viewMode === 'matrix'
                      ? 'bg-white text-slate-900 shadow-subtle'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Matrix</span>
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={entries.length === 0}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                disabled={entries.length === 0}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print
              </Button>
            </div>
          </div>

          {/* Teaching Schedule Content */}
          {entries.length === 0 ? (
            <EmptyState
              type="timetable"
              title="No Active Classes Scheduled"
              description={`No teaching sessions are currently scheduled for ${facultyData.faculty.name} in any active published timetables.`}
            />
          ) : viewMode === 'agenda' ? (
            /* Agenda View Grouped by Day */
            <div className="space-y-4">
              {(selectedDay === 'ALL' ? DAYS_OF_WEEK : [selectedDay as DayOfWeek]).map((day: DayOfWeek) => {
                const dayEntries = filteredEntries
                  .filter((e) => e.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                if (dayEntries.length === 0 && selectedDay !== 'ALL') {
                  return (
                    <div key={day} className="bg-slate-50 border border-border rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-400">No classes scheduled on {day}.</p>
                    </div>
                  );
                }

                if (dayEntries.length === 0) return null;

                return (
                  <div key={day} className="bg-white rounded-xl border border-border shadow-subtle overflow-hidden">
                    <div className="bg-slate-50/80 px-4 py-2.5 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-600" />
                        <h4 className="text-xs font-bold text-slate-900">{day}</h4>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {dayEntries.length} {dayEntries.length === 1 ? 'Slot' : 'Slots'}
                      </span>
                    </div>

                    <div className="divide-y divide-border">
                      {dayEntries.map((session) => (
                        <div
                          key={session._id}
                          className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-slate-700 font-mono text-xs font-bold whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{session.startTime} – {session.endTime}</span>
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900">
                                  {session.subject?.name}
                                </span>
                                <span className="font-mono text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                                  {session.subject?.code}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-slate-600">
                                <span className="font-semibold text-slate-800">
                                  {session.class?.name} — Section {session.section?.name}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Where they have to go: ROOM BADGE & ACTIONS */}
                          <div className="flex items-center gap-2 self-end md:self-center">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-800 rounded-xl border border-purple-200 text-xs font-bold shadow-xs">
                              <Building className="w-3.5 h-3.5 text-purple-600" />
                              <span>{session.room?.roomNumber}</span>
                              {session.room?.building && (
                                <span className="text-[11px] font-normal text-purple-600">
                                  ({session.room.building}{session.room.floor ? `, Fl ${session.room.floor}` : ''})
                                </span>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl"
                              onClick={() => {
                                setEditingSlot(session);
                                setIsSlotModalOpen(true);
                              }}
                              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Matrix Grid View */
            <div className="bg-white rounded-xl border border-border shadow-subtle overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="p-3">Day</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Class & Section</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Assigned Room / Lab (Where to Go)</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEntries
                    .sort((a, b) => {
                      const dayDiff = DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day);
                      if (dayDiff !== 0) return dayDiff;
                      return a.startTime.localeCompare(b.startTime);
                    })
                    .map((session) => (
                      <tr key={session._id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-bold text-slate-900">{session.day}</td>
                        <td className="p-3 font-mono text-slate-700 font-semibold whitespace-nowrap">
                          {session.startTime} – {session.endTime}
                        </td>
                        <td className="p-3 font-bold text-brand-700">
                          {session.class?.name} — {session.section?.name}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{session.subject?.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{session.subject?.code}</div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            <Building className="w-3 h-3 text-purple-600" />
                            {session.room?.roomNumber} ({session.room?.building})
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setEditingSlot(session);
                              setIsSlotModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200 transition"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal for Slot Assignment / Editing */}
      {facultyData?.faculty && (
        <FacultySlotEditModal
          isOpen={isSlotModalOpen}
          onClose={() => {
            setIsSlotModalOpen(false);
            setEditingSlot(null);
          }}
          faculty={facultyData.faculty}
          entry={editingSlot}
          onSuccess={() => {
            loadSchedule(selectedFacultyId);
          }}
        />
      )}
    </Card>
  );
};
