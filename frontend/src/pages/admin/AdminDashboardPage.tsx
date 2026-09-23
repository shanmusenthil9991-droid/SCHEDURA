import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { statsService, timetableService } from '../../services/api';
import { DashboardStats, Timetable } from '../../types';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { RecentUpdatesList } from '../../components/dashboard/RecentUpdatesList';
import { FacultyMovementViewer } from '../../components/dashboard/FacultyMovementViewer';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarPlus,
  Layers,
  CheckCircle2,
  Users,
  BookOpen,
  Building,
  GraduationCap,
  ArrowRight,
  Eye,
  ShieldCheck,
  Sparkles,
  Calendar,
  UserCheck,
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTimetables, setActiveTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [sRes, tRes] = await Promise.all([
          statsService.getOverview(),
          timetableService.getAll({ status: 'ACTIVE' })
        ]);
        if (sRes.data) setStats(sRes.data);
        if (tRes.data) setActiveTimetables(tRes.data.slice(0, 6));
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const currentHours = String(currentTime.getHours()).padStart(2, '0');
  const currentMinutes = String(currentTime.getMinutes()).padStart(2, '0');
  const currentSeconds = String(currentTime.getSeconds()).padStart(2, '0');

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Institutional Admin Dashboard 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            College-wide academic schedule operations, timetable publishing, and faculty assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {currentHours}:{currentMinutes}:{currentSeconds}
            </span>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/admin/create-timetable')}
            leftIcon={<CalendarPlus className="w-4 h-4" />}
          >
            + Create Timetable
          </Button>
        </div>
      </div>

      {/* System Health & Conflict Guard Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  SCHEDURA Engine Active
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  Zero Conflicts
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Single Source of Truth Timetable Architecture
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Dynamic dual projections for students and faculty across {stats?.totalDepartments || 5} academic departments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/student"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-blue-300" />
              <span>Student Schedule View</span>
            </Link>
            <Link
              to="/admin/timetables"
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-subtle transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Manage Timetables</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Statistics Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Classes"
            value={stats?.totalClasses || 0}
            subtitle="Across 5 Departments"
            icon={<Layers className="w-5 h-5" />}
            variant="blue"
          />
          <StatsCard
            title="Active Timetables"
            value={stats?.activeTimetables || 0}
            subtitle="Published & Student-Facing"
            icon={<CheckCircle2 className="w-5 h-5" />}
            variant="emerald"
          />
          <StatsCard
            title="Faculty Members"
            value={stats?.totalFaculty || 0}
            subtitle={`${stats?.assignedInChargeFaculty || 0} Assigned In-Charge`}
            icon={<Users className="w-5 h-5" />}
            variant="purple"
          />
          <StatsCard
            title="Courses & Subjects"
            value={stats?.totalSubjects || 0}
            subtitle="Approved Syllabus Catalog"
            icon={<BookOpen className="w-5 h-5" />}
            variant="amber"
          />
        </div>
      )}

      {/* Timetable Lifecycle Status Pills */}
      {!loading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/timetables"
            className="p-4 bg-emerald-50/60 hover:bg-emerald-50 rounded-xl border border-emerald-200/80 transition flex items-center justify-between group"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Active Timetables
              </span>
              <div className="text-2xl font-extrabold text-emerald-950 mt-0.5">
                {stats.activeTimetables}
              </div>
              <p className="text-[11px] text-emerald-600 mt-0.5">Live for enrolled students</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </Link>

          <Link
            to="/admin/timetables"
            className="p-4 bg-amber-50/60 hover:bg-amber-50 rounded-xl border border-amber-200/80 transition flex items-center justify-between group"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Draft Timetables
              </span>
              <div className="text-2xl font-extrabold text-amber-950 mt-0.5">
                {stats.draftTimetables}
              </div>
              <p className="text-[11px] text-amber-600 mt-0.5">Under planning / review</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </Link>

          <Link
            to="/admin/timetables"
            className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition flex items-center justify-between group"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Archived Versions
              </span>
              <div className="text-2xl font-extrabold text-slate-800 mt-0.5">
                {stats.archivedTimetables}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Historical timetable records</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-200/70 text-slate-700 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </Link>
        </div>
      )}

      {/* Departmental Timetable Coverage Matrix */}
      {stats?.departmentBreakdown && stats.departmentBreakdown.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Department Schedule Coverage</h3>
              <p className="text-xs text-slate-500">
                Timetable publication completion across academic branches
              </p>
            </div>
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
              Academic Year 2026–2027
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.departmentBreakdown.map((dept) => (
              <div
                key={dept._id}
                className="p-4 rounded-xl border border-border bg-slate-50/50 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{dept.name}</span>
                    <span className="text-[11px] font-mono text-slate-500 ml-1.5">({dept.code})</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {dept.coveragePercent}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dept.coveragePercent >= 100
                        ? 'bg-emerald-500'
                        : dept.coveragePercent >= 50
                        ? 'bg-brand-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${dept.coveragePercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{dept.activeTimetables} Active Timetables</span>
                  <span>{dept.totalClasses} Total Classes</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Master Records Shortcuts Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Master Records & Navigation
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/admin/timetables"
            className="p-4 bg-white rounded-xl border border-border shadow-subtle hover:border-brand-300 hover:shadow-card transition flex flex-col items-center text-center group"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-brand-600 group-hover:scale-110 transition-transform mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900">Timetables</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Dual View & Publish</div>
          </Link>

          <Link
            to="/admin/classes"
            className="p-4 bg-white rounded-xl border border-border shadow-subtle hover:border-brand-300 hover:shadow-card transition flex flex-col items-center text-center group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform mb-2">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900">Classes & Sec</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stats?.totalClasses || 0} Classes</div>
          </Link>

          <Link
            to="/admin/faculty"
            className="p-4 bg-white rounded-xl border border-border shadow-subtle hover:border-brand-300 hover:shadow-card transition flex flex-col items-center text-center group"
          >
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform mb-2">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900">Faculty & In-Charge</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stats?.totalFaculty || 0} Members</div>
          </Link>

          <Link
            to="/admin/subjects"
            className="p-4 bg-white rounded-xl border border-border shadow-subtle hover:border-brand-300 hover:shadow-card transition flex flex-col items-center text-center group"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform mb-2">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900">Subjects</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stats?.totalSubjects || 0} Courses</div>
          </Link>

          <Link
            to="/admin/rooms"
            className="p-4 bg-white rounded-xl border border-border shadow-subtle hover:border-brand-300 hover:shadow-card transition flex flex-col items-center text-center group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform mb-2">
              <Building className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900">Rooms & Labs</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stats?.totalRooms || 0} Facilities</div>
          </Link>

          <Link
            to="/admin/users"
            className="p-4 bg-white rounded-xl border border-border shadow-subtle hover:border-brand-300 hover:shadow-card transition flex flex-col items-center text-center group"
          >
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform mb-2">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900">User Accounts</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Role Management</div>
          </Link>
        </div>
      </div>

      {/* Faculty Movement & Schedule Viewer (Where Faculty Have To Go) */}
      <FacultyMovementViewer />

      {/* Active Timetables Master Grid */}
      <Card className="p-6">
        <CardHeader
          title="Active Timetables Overview"
          subtitle="Real-time published schedules across college branches."
          action={
            <Link
              to="/admin/timetables"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />

        {loading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : activeTimetables.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No active timetables found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTimetables.map((tt) => (
              <div
                key={tt._id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-card transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-base font-bold text-slate-900">
                      {tt.classId?.name || 'Class'} — Sec {tt.sectionId?.name || 'A'}
                    </h4>
                    <Badge variant="active" size="sm" dot>
                      ACTIVE
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {tt.departmentId?.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Semester {tt.semester} • v{tt.version} • {tt.academicYear}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <Link
                    to={`/admin/timetables?id=${tt._id}`}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Dual Schedule</span>
                  </Link>

                  <span className="text-[10px] text-slate-400">
                    {tt.publishedAt ? new Date(tt.publishedAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Updates */}
      <RecentUpdatesList timetables={stats?.recentTimetables || []} />
    </div>
  );
};
