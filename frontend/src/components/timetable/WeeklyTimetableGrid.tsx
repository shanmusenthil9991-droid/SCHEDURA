import React from 'react';
import { Timetable, TimetableEntry, DayOfWeek } from '../../types';
import { BookOpen, User, Building, Plus, Edit2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface WeeklyTimetableGridProps {
  timetable: Timetable;
  entries: TimetableEntry[];
  isEditable?: boolean;
  onEditEntry?: (entry: TimetableEntry) => void;
  onAddEntry?: (day: DayOfWeek, slot: { startTime: string; endTime: string }) => void;
  searchFilter?: string;
}

export const WeeklyTimetableGrid: React.FC<WeeklyTimetableGridProps> = ({
  timetable,
  entries,
  isEditable = false,
  onEditEntry,
  onAddEntry,
  searchFilter = ''
}) => {
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const timeSlots = [
    { type: 'class', startTime: '09:00', endTime: '10:00', label: '09:00 – 10:00' },
    { type: 'class', startTime: '10:00', endTime: '11:00', label: '10:00 – 11:00' },
    { type: 'break', startTime: '11:00', endTime: '11:15', label: 'Short Break' },
    { type: 'class', startTime: '11:15', endTime: '12:15', label: '11:15 – 12:15' },
    { type: 'break', startTime: '12:15', endTime: '01:15', label: 'Lunch Break' },
    { type: 'class', startTime: '01:15', endTime: '02:15', label: '01:15 – 02:15' },
    { type: 'class', startTime: '02:15', endTime: '03:15', label: '02:15 – 03:15' }
  ];

  // Subject color palette generator for visually rich differentiation
  const getSubjectColor = (code: string = '') => {
    const colors = [
      'border-l-blue-600 bg-blue-50/50 hover:bg-blue-50 text-blue-900',
      'border-l-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900',
      'border-l-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900',
      'border-l-purple-600 bg-purple-50/50 hover:bg-purple-50 text-purple-900',
      'border-l-amber-600 bg-amber-50/50 hover:bg-amber-50 text-amber-900',
      'border-l-rose-600 bg-rose-50/50 hover:bg-rose-50 text-rose-900'
    ];
    let sum = 0;
    for (let i = 0; i < code.length; i++) sum += code.charCodeAt(i);
    return colors[sum % colors.length];
  };

  const matchesSearch = (entry: TimetableEntry) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const subName = entry.subjectId?.subjectName?.toLowerCase() || '';
    const subCode = entry.subjectId?.subjectCode?.toLowerCase() || '';
    const fac = entry.facultyId?.name?.toLowerCase() || '';
    const rm = entry.roomId?.roomNumber?.toLowerCase() || '';
    return subName.includes(q) || subCode.includes(q) || fac.includes(q) || rm.includes(q);
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-2xl border border-border shadow-card printable-area">
      <table className="w-full border-collapse text-left timetable-grid-print min-w-[900px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-border">
            <th className="p-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-28 text-center border-r border-border">
              Day / Time
            </th>
            {timeSlots.map((slot, index) => (
              <th
                key={index}
                className={`p-3.5 text-xs font-bold tracking-tight text-center border-r last:border-r-0 border-border ${
                  slot.type === 'break' ? 'w-20 bg-slate-100/70 text-slate-400 font-medium' : 'min-w-[140px] text-slate-700'
                }`}
              >
                {slot.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {days.map((day) => (
            <tr key={day} className="hover:bg-slate-50/30 transition">
              {/* Day column header */}
              <td className="p-3.5 text-xs font-bold text-slate-900 bg-slate-50/50 border-r border-border text-center">
                <span className="inline-block uppercase tracking-wider">{day.slice(0, 3)}</span>
                <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{day}</span>
              </td>

              {/* Time slot cells */}
              {timeSlots.map((slot, slotIdx) => {
                if (slot.type === 'break') {
                  return (
                    <td
                      key={slotIdx}
                      className="p-2 text-center bg-slate-50/70 text-[11px] font-medium text-slate-400 border-r border-border select-none"
                    >
                      <div className="rotate-180 writing-mode-vertical text-[10px] tracking-wider uppercase opacity-60">
                        {slot.label}
                      </div>
                    </td>
                  );
                }

                // Find entry for this day and slot
                const cellEntry = entries.find(
                  (e) => e.day === day && e.startTime === slot.startTime
                );

                const isHighlighted = cellEntry ? matchesSearch(cellEntry) : true;
                const isDimmed = !isHighlighted;

                return (
                  <td
                    key={slotIdx}
                    className="p-2 border-r last:border-r-0 border-border align-top h-28"
                  >
                    {cellEntry ? (
                      <div
                        onClick={() => isEditable && onEditEntry && onEditEntry(cellEntry)}
                        className={`h-full p-2.5 rounded-lg border-l-4 border shadow-subtle flex flex-col justify-between transition group relative ${getSubjectColor(
                          cellEntry.subjectId?.subjectCode
                        )} ${isEditable ? 'cursor-pointer hover:shadow-dropdown' : ''} ${
                          isDimmed ? 'opacity-20' : 'opacity-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[11px] font-bold uppercase tracking-tight text-slate-900 leading-tight">
                              {cellEntry.subjectId?.subjectCode || 'SUB'}
                            </span>
                            {isEditable && (
                              <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-slate-700 opacity-0 group-hover:opacity-100 transition" />
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-800 line-clamp-2 mt-0.5 leading-snug">
                            {cellEntry.subjectId?.subjectName || 'Subject'}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-black/5 mt-1 text-[11px] space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                            <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{cellEntry.facultyId?.name || 'Faculty'}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 text-[10px]">
                            <span className="flex items-center gap-1 font-mono font-medium">
                              <Building className="w-3 h-3 text-slate-400" />
                              {cellEntry.roomId?.roomNumber || 'Room'}
                            </span>
                            <span className="text-slate-400">
                              {cellEntry.subjectId?.credits ? `${cellEntry.subjectId.credits} Cr` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      isEditable && onAddEntry && (
                        <button
                          onClick={() => onAddEntry(day, slot)}
                          className="w-full h-full rounded-lg border border-dashed border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-brand-600 transition group p-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-[10px] font-semibold opacity-0 group-hover:opacity-100">Add</span>
                        </button>
                      )
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
