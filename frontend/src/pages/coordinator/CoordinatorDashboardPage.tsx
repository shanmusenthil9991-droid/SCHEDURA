import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { statsService, timetableService } from '../../services/api';
import { DashboardStats, Timetable } from '../../types';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { RecentUpdatesList } from '../../components/dashboard/RecentUpdatesList';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  History,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  BookOpen,
  ArrowRight,
  Eye
} from 'lucide-react';

export const CoordinatorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTimetables, setActiveTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const deptId = typeof user?.departmentId === 'object' ? user.departmentId._id : user?.departmentId;
  const deptName = typeof user?.departmentId === 'object' ? user.departmentId.name : 'Your Department';

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [statsRes, ttRes] = await Promise.all([
          statsService.getOverview(deptId),
          timetableService.getAll({ departmentId: deptId, status: 'ACTIVE' })
        ]);
        if (statsRes.data) setStats(statsRes.data);
        if (ttRes.data) setActiveTimetables(ttRes.data);
      } catch (err) {
        console.error('Failed to load coordinator dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [deptId]);

  return (
    <div className="space-y-8 pb-12">
      {/* Coordinator Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Good morning, {user?.name || 'Coordinator'} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              Faculty Coordinator
            </span>
            <span className="text-xs text-slate-500">
              Department of {deptName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/coordinator/create-timetable')}
            leftIcon={<CalendarPlus className="w-4 h-4" />}
          >
            Create Timetable
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active Timetables"
            value={stats?.activeTimetables || 0}
            subtitle="Published & Live"
            icon={<CheckCircle2 className="w-5 h-5" />}
            variant="emerald"
          />
          <StatsCard
            title="Draft Schedules"
            value={stats?.draftTimetables || 0}
            subtitle="Under revision"
            icon={<Clock className="w-5 h-5" />}
            variant="amber"
          />
          <StatsCard
            title="Department Classes"
            value={stats?.totalClasses || 0}
            subtitle="Under coordination"
            icon={<Layers className="w-5 h-5" />}
            variant="blue"
          />
          <StatsCard
            title="Faculty Members"
            value={stats?.totalFaculty || 0}
            subtitle="In department"
            icon={<Users className="w-5 h-5" />}
            variant="purple"
          />
        </div>
      )}

      {/* Active Timetables Section */}
      <Card className="p-6">
        <CardHeader
          title="Department Active Timetables"
          subtitle="Currently published schedules actively visible to students."
          action={
            <Link
              to="/admin/timetables"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-xl" count={3} />
          </div>
        ) : activeTimetables.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No active timetables published yet for {deptName}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTimetables.map((tt) => (
              <div
                key={tt._id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-card transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-base font-bold text-slate-900">
                      {tt.classId?.name || 'Class'} — Sec {tt.sectionId?.name || 'A'}
                    </h4>
                    <Badge variant="active" size="sm" dot>
                      ACTIVE
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Semester {tt.semester} • Academic Year {tt.academicYear}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Version {tt.version} • Published on {tt.publishedAt ? new Date(tt.publishedAt).toLocaleDateString() : 'Active'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <Link
                    to={`/admin/timetables?id=${tt._id}`}
                    className="text-xs font-semibold text-slate-700 hover:text-brand-600 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View & Edit</span>
                  </Link>

                  <Link
                    to={`/coordinator/versions?classId=${typeof tt.classId === 'object' ? tt.classId._id : tt.classId}&sectionId=${typeof tt.sectionId === 'object' ? tt.sectionId._id : tt.sectionId}`}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Version History</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Updates Feed */}
      <RecentUpdatesList timetables={stats?.recentTimetables || []} />
    </div>
  );
};
