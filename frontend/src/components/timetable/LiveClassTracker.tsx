import React, { useState, useEffect } from 'react';
import { TimetableEntry, DayOfWeek } from '../../types';
import { Clock, BookOpen, User, Building, PlayCircle, Calendar } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface LiveClassTrackerProps {
  entries: TimetableEntry[];
}

export const LiveClassTracker: React.FC<LiveClassTrackerProps> = ({ entries }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format current day
  const dayNames: (DayOfWeek | 'Sunday')[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[currentTime.getDay()];

  // Format HH:mm string for comparison
  const currentHours = String(currentTime.getHours()).padStart(2, '0');
  const currentMinutes = String(currentTime.getMinutes()).padStart(2, '0');
  const currentSeconds = String(currentTime.getSeconds()).padStart(2, '0');
  const currentTimeString = `${currentHours}:${currentMinutes}`;

  // Filter entries for today
  const todaysEntries = entries.filter((e) => e.day === currentDay);

  // Helper to convert "HH:mm" to minutes from midnight
  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutesVal = toMinutes(currentTimeString);

  // Find ongoing class
  const ongoingEntry = todaysEntries.find((e) => {
    const startMin = toMinutes(e.startTime);
    const endMin = toMinutes(e.endTime);
    return currentMinutesVal >= startMin && currentMinutesVal < endMin;
  });

  // Find next upcoming class
  const upcomingEntries = todaysEntries
    .filter((e) => toMinutes(e.startTime) > currentMinutesVal)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  const nextEntry = upcomingEntries.length > 0 ? upcomingEntries[0] : null;

  return (
    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-md mb-6 relative overflow-hidden">
      {/* Subtle Background Graphic */}
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            <Clock className="w-5 h-5 text-blue-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                {currentDay}, {currentTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="font-mono text-xs bg-white/15 px-2 py-0.5 rounded-md text-white font-bold">
                {currentHours}:{currentMinutes}:{currentSeconds}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Live Class Schedule Tracker
            </h3>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="w-full lg:w-auto">
          {ongoingEntry ? (
            <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-3 sm:px-4 sm:py-2.5 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  ONGOING SESSION ({ongoingEntry.startTime} – {ongoingEntry.endTime})
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{ongoingEntry.subjectId?.subjectName || 'Subject'}</span>
                  <span className="text-xs text-blue-200 font-normal">
                    • Room {ongoingEntry.roomId?.roomNumber || 'Room'} • {ongoingEntry.facultyId?.name || 'Faculty'}
                  </span>
                </div>
              </div>
            </div>
          ) : nextEntry ? (
            <div className="bg-white/10 border border-white/15 rounded-xl p-3 sm:px-4 sm:py-2.5 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div>
                <div className="text-[11px] font-medium text-amber-200">
                  Next Class starts at <strong className="text-white font-bold">{nextEntry.startTime}</strong>
                </div>
                <div className="text-sm font-semibold text-white">
                  {nextEntry.subjectId?.subjectName} ({nextEntry.roomId?.roomNumber})
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-xs text-blue-100">
              {currentDay === 'Sunday'
                ? 'No classes scheduled on Sunday.'
                : 'No more classes scheduled for today.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
