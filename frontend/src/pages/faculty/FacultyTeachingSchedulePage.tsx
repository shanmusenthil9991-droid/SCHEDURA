import React, { useState, useEffect } from 'react';
import { facultyService } from '../../services/api';
import { FacultyScheduleEntry, DayOfWeek, DAYS_OF_WEEK } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import {
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
  Sparkles
} from 'lucide-react';

export const FacultyTeachingSchedulePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [facultyInfo, setFacultyInfo] = useState<any>(null);
  const [entries, setEntries] = useState<FacultyScheduleEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'matrix' | 'agenda'>('agenda');

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await facultyService.getMySchedule();
      if (res.success && res.data) {
        setFacultyInfo(res.data.faculty || null);
        setEntries(res.data.entries || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch faculty teaching schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (selectedDay !== 'ALL' && entry.day !== selectedDay) return false;
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    const subName = entry.subject?.name?.toLowerCase() || '';
    const subCode = entry.subject?.code?.toLowerCase() || '';
    const clsName = entry.class?.name?.toLowerCase() || '';
    const secName = entry.section?.name?.toLowerCase() || '';
    const roomNum = entry.room?.roomNumber?.toLowerCase() || '';
    return (
      subName.includes(q) ||
      subCode.includes(q) ||
      clsName.includes(q) ||
      secName.includes(q) ||
      roomNum.includes(q)
    );
  });

  // Calculate unique metrics
  const uniqueSubjects = new Set(entries.map((e) => e.subject?._id).filter(Boolean)).size;
  const uniqueClasses = new Set(
    entries.map((e) => `${e.class?._id}-${e.section?._id}`).filter(Boolean)
  ).size;

  // CSV Export
  const handleExportCSV = () => {
    if (entries.length === 0) return;
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
    link.setAttribute(
      'download',
      `Teaching_Schedule_${facultyInfo?.name?.replace(/\s+/g, '_') || 'Faculty'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Teaching Schedule
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personal teaching timetable across all assigned classes, sections, and active timetables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSchedule}
            disabled={loading}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={loading || entries.length === 0}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            disabled={loading || entries.length === 0}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Stats Summary Card */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
          <div className="bg-white p-4 rounded-xl border border-border shadow-subtle">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Sessions / Week
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{entries.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-border shadow-subtle">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Distinct Subjects
            </div>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">{uniqueSubjects}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-border shadow-subtle">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Classes & Sections
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{uniqueClasses}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-border shadow-subtle">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Department
            </div>
            <div className="text-sm font-bold text-slate-800 mt-2 truncate">
              {facultyInfo?.departmentId?.name || 'Assigned Dept'}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
        {/* Day Pills */}
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

        {/* Search & View Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search subject, class, room..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-white border border-border rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

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
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          type="timetable"
          title="No Teaching Sessions Assigned"
          description="You currently do not have any scheduled lecture or lab slots in any active published timetables."
        />
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <p className="text-sm font-semibold text-slate-600">No sessions match your current filter.</p>
        </div>
      ) : viewMode === 'agenda' ? (
        /* Agenda View: Grouped by Day */
        <div className="space-y-6">
          {(selectedDay === 'ALL' ? DAYS_OF_WEEK : [selectedDay as DayOfWeek]).map((day: DayOfWeek) => {
            const dayEntries = filteredEntries
              .filter((e) => e.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            if (dayEntries.length === 0 && selectedDay !== 'ALL') {
              return (
                <div key={day} className="bg-white border border-border rounded-2xl p-8 text-center">
                  <p className="text-xs text-slate-500 font-medium">No sessions scheduled for {day}.</p>
                </div>
              );
            }

            if (dayEntries.length === 0) return null;

            return (
              <div key={day} className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="bg-slate-50/80 px-5 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                    <h3 className="text-sm font-bold text-slate-900">{day}</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {dayEntries.length} {dayEntries.length === 1 ? 'Session' : 'Sessions'}
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry._id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                    >
                      <div className="flex items-start gap-4">
                        {/* Time Pill */}
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl text-slate-700 font-mono text-xs font-bold whitespace-nowrap self-start">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </div>

                        {/* Subject & Class Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">
                              {entry.subject?.name || 'Subject'}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                              {entry.subject?.code}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {entry.class?.name || 'Class'} — Section {entry.section?.name || 'A'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {entry.room?.roomNumber || 'Room'}
                                {entry.room?.building ? ` (${entry.room.building})` : ''}
                              </span>
                            </div>
                          </div>
                        </div>
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
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Day</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Class & Section</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntries
                .sort((a, b) => {
                  const dayDiff = DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day);
                  if (dayDiff !== 0) return dayDiff;
                  return a.startTime.localeCompare(b.startTime);
                })
                .map((entry) => (
                  <tr key={entry._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-bold text-slate-900">{entry.day}</td>
                    <td className="p-3.5 font-mono text-slate-700 font-semibold whitespace-nowrap">
                      {entry.startTime} - {entry.endTime}
                    </td>
                    <td className="p-3.5 font-bold text-brand-700">
                      {entry.class?.name} — {entry.section?.name}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{entry.subject?.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{entry.subject?.code}</div>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {entry.room?.roomNumber} {entry.room?.building ? `(${entry.room.building})` : ''}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
