import React, { useState } from 'react';
import { Timetable, TimetableEntry, DayOfWeek } from '../../types';
import { Clock, User, Building, BookOpen, ChevronRight, Edit2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface DailyTimetableTimelineProps {
  timetable: Timetable;
  entries: TimetableEntry[];
  isEditable?: boolean;
  onEditEntry?: (entry: TimetableEntry) => void;
  searchFilter?: string;
}

export const DailyTimetableTimeline: React.FC<DailyTimetableTimelineProps> = ({
  timetable,
  entries,
  isEditable = false,
  onEditEntry,
  searchFilter = ''
}) => {
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Default to today's day if Mon-Sat, otherwise default to Monday
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[new Date().getDay()];
  const initialDay = (days.includes(todayName as DayOfWeek) ? todayName : 'Monday') as DayOfWeek;

  const [activeDay, setActiveDay] = useState<DayOfWeek>(initialDay);

  const dayEntries = entries
    .filter((e) => e.day === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const filteredEntries = dayEntries.filter((e) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const subName = e.subjectId?.subjectName?.toLowerCase() || '';
    const subCode = e.subjectId?.subjectCode?.toLowerCase() || '';
    const fac = e.facultyId?.name?.toLowerCase() || '';
    const rm = e.roomId?.roomNumber?.toLowerCase() || '';
    return subName.includes(q) || subCode.includes(q) || fac.includes(q) || rm.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border no-print">
        {days.map((d) => {
          const isSelected = d === activeDay;
          const count = entries.filter((e) => e.day === d).length;
          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-border'
              }`}
            >
              <span>{d}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Schedule Chronological Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
          No classes scheduled for {activeDay} matching your criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry, index) => (
            <div
              key={entry._id || index}
              onClick={() => isEditable && onEditEntry && onEditEntry(entry)}
              className={`bg-white rounded-xl border border-border p-4 shadow-subtle hover:border-brand-300 hover:shadow-card transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                isEditable ? 'cursor-pointer' : ''
              }`}
            >
              {/* Time Column */}
              <div className="flex items-center gap-3 sm:w-48 flex-shrink-0">
                <div className="p-2 rounded-lg bg-blue-50 text-brand-600 font-bold text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{entry.startTime} – {entry.endTime}</span>
                </div>
              </div>

              {/* Subject Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {entry.subjectId?.subjectCode}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {entry.subjectId?.subjectName}
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {entry.facultyId?.name} ({entry.facultyId?.designation})
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {entry.roomId?.roomNumber} ({entry.roomId?.building})
                  </span>
                </div>
              </div>

              {/* Action / Credits Badge */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Badge variant="primary" size="sm">
                  {entry.subjectId?.credits || 3} Credits
                </Badge>
                {isEditable && (
                  <button className="p-1.5 text-slate-400 group-hover:text-brand-600 rounded-lg hover:bg-slate-100 transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
