import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { facultyService } from '../../services/api';
import { FacultyScheduleEntry, Timetable, DayOfWeek } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  BookOpen,
  Building,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  PlayCircle
} from 'lucide-react';

export const FacultyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState<FacultyScheduleEntry[]>([]);
  const [inChargeTimetable, setInChargeTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNames: (DayOfWeek | 'Sunday')[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[currentTime.getDay()];

  useEffect(() => {
    const fetchFacultyData = async () => {
      setLoading(true);
      try {
        const [schedRes, inChargeRes] = await Promise.all([
          facultyService.getMySchedule().catch(() => ({ success: false, data: null })),
          facultyService.getMyInChargeTimetable().catch(() => ({ success: false, data: null }))
        ]);
        if (schedRes.data?.entries) {
          setSchedule(schedRes.data.entries);
        } else if (Array.isArray(schedRes.data)) {
          setSchedule(schedRes.data);
        } else {
          setSchedule([]);
        }

        if (inChargeRes.data?.timetable) {
          setInChargeTimetable(inChargeRes.data.timetable);
        } else if (inChargeRes.data && !inChargeRes.data.inCharge) {
          setInChargeTimetable(inChargeRes.data);
        } else {
          setInChargeTimetable(null);
        }
      } catch (err) {
        console.error('Failed to load faculty dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFacultyData();
  }, []);

  // Compute live ongoing & next class from personal teaching schedule
  const toMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const currentHours = String(currentTime.getHours()).padStart(2, '0');
  const currentMinutes = String(currentTime.getMinutes()).padStart(2, '0');
  const currentTimeString = `${currentHours}:${currentMinutes}`;
  const currentMinVal = toMinutes(currentTimeString);

  const safeSchedule = Array.isArray(schedule) ? schedule : [];
  const todaysSessions = safeSchedule.filter((s) => s.day === currentDay);

  const ongoingSession = todaysSessions.find((s) => {
    const start = toMinutes(s.startTime);
    const end = toMinutes(s.endTime);
    return currentMinVal >= start && currentMinVal < end;
  });

  const nextUpcomingSession = todaysSessions
    .filter((s) => toMinutes(s.startTime) > currentMinVal)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))[0] || null;

  const facultyObj = user?.facultyId as any;
  const facultyName = facultyObj?.name || user?.name || 'Faculty Member';
  const facultyIdCode = facultyObj?.facultyId || 'FAC';
  const deptName = facultyObj?.departmentId?.name || (user?.departmentId as any)?.name || 'Department';

  const inChargeClassDisplay = inChargeTimetable
    ? `${inChargeTimetable.classId?.name} — Section ${inChargeTimetable.sectionId?.name}`
    : facultyObj?.inChargeClassId?.name
    ? `${facultyObj.inChargeClassId.name} — Section ${facultyObj.inChargeSectionId?.name || 'A'}`
    : 'Assigned Cohort';

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Good morning, {facultyName} 👋
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs">
            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              ID: {facultyIdCode}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-medium">Department of {deptName}</span>
            <span className="text-slate-400">•</span>
            <span className="text-brand-700 font-semibold bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              In-Charge: {inChargeClassDisplay}
            </span>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {currentDay}, {currentTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="font-mono text-sm font-bold text-slate-800">
            {currentHours}:{currentMinutes}:{String(currentTime.getSeconds()).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Ongoing / Next Class Live Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Clock className="w-5 h-5 text-blue-200 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                Live Teaching Tracker
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                {ongoingSession
                  ? 'Active Class Session Underway'
                  : nextUpcomingSession
                  ? 'Upcoming Class Preparation'
                  : 'No Active Sessions Right Now'}
              </h3>
            </div>
          </div>

          <div>
            {ongoingSession ? (
              <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-3 sm:px-4 sm:py-2.5 flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    ONGOING ({ongoingSession.startTime} – {ongoingSession.endTime})
                  </div>
                  <div className="text-sm font-bold text-white">
                    {ongoingSession.class?.name} Sec {ongoingSession.section?.name} • {ongoingSession.subject?.name} • Room {ongoingSession.room?.roomNumber}
                  </div>
                </div>
              </div>
            ) : nextUpcomingSession ? (
              <div className="bg-white/10 border border-white/15 rounded-xl p-3 sm:px-4 sm:py-2.5 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div>
                  <div className="text-[11px] font-medium text-amber-200">
                    Next Teaching Session at <strong className="text-white font-bold">{nextUpcomingSession.startTime}</strong>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {nextUpcomingSession.class?.name} Sec {nextUpcomingSession.section?.name} • {nextUpcomingSession.subject?.name} ({nextUpcomingSession.room?.roomNumber})
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-xs text-blue-100">
                {currentDay === 'Sunday'
                  ? 'No classes scheduled on Sunday.'
                  : 'You have completed all scheduled classes for today.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Statistics Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Classes</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{todaysSessions.length} Sessions</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-brand-600 border border-blue-100">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekly Classes</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{schedule.length} Sessions</div>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <BookOpen className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In-Charge Class</span>
              <div className="text-base font-extrabold text-slate-900 mt-1 truncate max-w-[140px]">
                {inChargeClassDisplay}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <GraduationCap className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Class</span>
              <div className="text-base font-extrabold text-slate-900 mt-1">
                {nextUpcomingSession ? nextUpcomingSession.startTime : 'None Today'}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </Card>
        </div>
      )}

      {/* TWO PRIMARY PORTAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: MY CLASS TIMETABLE */}
        <Card hoverEffect className="p-6 sm:p-8 flex flex-col justify-between border-brand-100 bg-white">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-3 rounded-xl bg-brand-50 text-brand-600">
                <GraduationCap className="w-6 h-6" />
              </div>
              <Badge variant="active" size="md" dot>
                IN-CHARGE CLASS
              </Badge>
            </div>

            <h3 className="text-xl font-bold text-slate-900 tracking-tight">My Class Timetable</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your officially assigned class and section. View full weekly and daily schedules.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-4 space-y-1 text-xs">
              <div className="font-bold text-slate-900 text-sm">{inChargeClassDisplay}</div>
              <div className="text-slate-500">{deptName} • Academic Year 2026–2027</div>
              <div className="text-emerald-700 font-semibold text-[11px] pt-1">
                Active Student Timetable Published
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <Button
              variant="primary"
              size="md"
              className="w-full justify-between"
              onClick={() => navigate('/faculty/class-timetable')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Class Timetable
            </Button>
          </div>
        </Card>

        {/* CARD 2: MY TEACHING SCHEDULE */}
        <Card hoverEffect className="p-6 sm:p-8 flex flex-col justify-between border-purple-100 bg-white">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <Badge variant="primary" size="md">
                {schedule.length} TOTAL SESSIONS
              </Badge>
            </div>

            <h3 className="text-xl font-bold text-slate-900 tracking-tight">My Teaching Schedule</h3>
            <p className="text-xs text-slate-500 mt-1">
              Classes you need to attend and teach across all sections and lecture rooms.
            </p>

            <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100 mt-4 space-y-1 text-xs">
              <div className="font-bold text-purple-900 text-sm">
                {todaysSessions.length} classes scheduled for today ({currentDay})
              </div>
              <div className="text-slate-600">
                {nextUpcomingSession
                  ? `Next session: ${nextUpcomingSession.startTime} • ${nextUpcomingSession.class?.name} Sec ${nextUpcomingSession.section?.name} (${nextUpcomingSession.room?.roomNumber})`
                  : 'All classes completed for today.'}
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              className="w-full justify-between border-purple-300 text-purple-900 hover:bg-purple-50"
              onClick={() => navigate('/faculty/teaching-schedule')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View My Teaching Schedule
            </Button>
          </div>
        </Card>
      </div>

      {/* Today's Schedule Chronological Feed */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Teaching Schedule ({currentDay})</h3>
            <p className="text-xs text-slate-500">Chronological timeline of your lectures for today</p>
          </div>

          <Link
            to="/faculty/teaching-schedule"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Full Week Grid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todaysSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {currentDay === 'Sunday'
              ? 'Sunday is a holiday. No classes scheduled.'
              : 'No teaching sessions scheduled for today.'}
          </div>
        ) : (
          <div className="space-y-3">
            {todaysSessions.map((session) => (
              <div
                key={session._id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-card transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-brand-600 font-bold text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{session.startTime} – {session.endTime}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {session.class?.name} — Section {session.section?.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                        {session.subject?.code}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">
                      {session.subject?.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    <Building className="w-3.5 h-3.5 text-purple-500" />
                    {session.room?.roomNumber} ({session.room?.building})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
