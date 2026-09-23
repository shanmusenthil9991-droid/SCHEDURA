import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Timetable, TimetableEntry } from '../../types';
import { timetableService } from '../../services/api';
import { ClassSectionSelector, SelectionCriteria } from '../../components/timetable/ClassSectionSelector';
import { WeeklyTimetableGrid } from '../../components/timetable/WeeklyTimetableGrid';
import { DailyTimetableTimeline } from '../../components/timetable/DailyTimetableTimeline';
import { LiveClassTracker } from '../../components/timetable/LiveClassTracker';
import { ExportActions } from '../../components/timetable/ExportActions';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Calendar, Search, RefreshCw, Layers, Grid, List, Sparkles } from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Load remembered selection or default from user profile
  const [criteria, setCriteria] = useState<SelectionCriteria | null>(() => {
    const saved = sessionStorage.getItem('schedura_student_criteria');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.classId && parsed.sectionId) {
          return parsed;
        }
      } catch (e) {}
    }
    // Default to user's assigned class if student
    if (user && user.classId && user.sectionId) {
      return {
        departmentId: typeof user.departmentId === 'object' ? user.departmentId._id : user.departmentId || '',
        classId: typeof user.classId === 'object' ? user.classId._id : user.classId,
        sectionId: typeof user.sectionId === 'object' ? user.sectionId._id : user.sectionId,
        semester: user.semester || 3,
        academicYear: '2026-2027'
      };
    }
    return null;
  });

  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSelector, setShowSelector] = useState<boolean>(!criteria);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fetchActiveTimetable = async (sel: SelectionCriteria) => {
    if (!sel || !sel.classId || !sel.sectionId) return;
    setLoading(true);
    try {
      const res = await timetableService.getActive({
        departmentId: sel.departmentId,
        classId: sel.classId,
        sectionId: sel.sectionId,
        semester: sel.semester,
        academicYear: sel.academicYear
      });
      if (res.success && res.data) {
        setTimetable(res.data);
        setEntries(res.data.entries || []);
      } else {
        setTimetable(null);
        setEntries([]);
      }
    } catch (err: any) {
      console.log('No active timetable found for selection:', err);
      setTimetable(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (criteria && criteria.classId && criteria.sectionId) {
      fetchActiveTimetable(criteria);
    }
  }, [criteria]);

  useEffect(() => {
    if (!criteria && user) {
      if (user.classId && user.sectionId) {
        const autoCriteria: SelectionCriteria = {
          departmentId: typeof user.departmentId === 'object' ? user.departmentId._id : user.departmentId || '',
          classId: typeof user.classId === 'object' ? user.classId._id : user.classId,
          sectionId: typeof user.sectionId === 'object' ? user.sectionId._id : user.sectionId,
          semester: user.semester || 3,
          academicYear: '2026-2027'
        };
        setCriteria(autoCriteria);
        setShowSelector(false);
      } else {
        // For admin / unassigned users, default to first active class (II CSE Sec A)
        const defaultCriteria: SelectionCriteria = {
          departmentId: '6ab36e1ceb62b10c06c504f0',
          classId: '6ab36e1ceb62b10c06c504f7',
          sectionId: '6ab36e1ceb62b10c06c5050d',
          semester: 3,
          academicYear: '2026-2027'
        };
        setCriteria(defaultCriteria);
        setShowSelector(false);
      }
    }
  }, [user, criteria]);

  const handleSelectClass = (newCriteria: SelectionCriteria) => {
    setCriteria(newCriteria);
    sessionStorage.setItem('schedura_student_criteria', JSON.stringify(newCriteria));
    setShowSelector(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Student'} 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome to SCHEDURA. View active class schedules, daily lectures, and room allocations.
          </p>
        </div>

        {criteria && !showSelector && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSelector(true)}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Change Class / Section
          </Button>
        )}
      </div>

      {/* Prominent Class / Section Selector */}
      {showSelector && (
        <div className="no-print">
          <ClassSectionSelector
            onSelect={handleSelectClass}
            initialCriteria={criteria}
            isLoading={loading}
          />
        </div>
      )}

      {/* Main Timetable Content */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : !criteria ? (
        <EmptyState
          type="timetable"
          title="Select your class to get started"
          description="Use the selector above to choose your department, class tier, and section."
        />
      ) : !timetable ? (
        <EmptyState
          type="timetable"
          title="No active timetable available"
          description="The timetable for this selected class and section has not been published yet. Please check back later or select another class/section."
          actionText="Select Another Class"
          onAction={() => setShowSelector(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Active Timetable Header Bar */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {timetable.classId?.name || 'Class'} — Section {timetable.sectionId?.name || 'A'}
                </h2>
                <Badge variant="active" size="md" dot>
                  ACTIVE TIMETABLE
                </Badge>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Version {timetable.version}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{timetable.departmentId?.name}</span>
                <span>•</span>
                <span>Semester {timetable.semester}</span>
                <span>•</span>
                <span>Academic Year {timetable.academicYear}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end lg:self-center">
              <ExportActions timetable={timetable} entries={entries} />
            </div>
          </div>

          {/* Live Ongoing / Next Class Tracker */}
          <LiveClassTracker entries={entries} />

          {/* Controls: Search & View Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
            {/* Scoped Search Filter */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search subject, faculty, or room..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-white border border-border rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* View Mode Switcher (Weekly Grid vs Daily Timeline) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-end sm:self-auto">
              <button
                onClick={() => setViewMode('weekly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'weekly'
                    ? 'bg-white text-slate-900 shadow-subtle'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Weekly Grid</span>
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'daily'
                    ? 'bg-white text-slate-900 shadow-subtle'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Day View</span>
              </button>
            </div>
          </div>

          {/* Render Timetable Grid or Daily Timeline */}
          {viewMode === 'weekly' ? (
            <WeeklyTimetableGrid
              timetable={timetable}
              entries={entries}
              searchFilter={searchFilter}
            />
          ) : (
            <DailyTimetableTimeline
              timetable={timetable}
              entries={entries}
              searchFilter={searchFilter}
            />
          )}
        </div>
      )}
    </div>
  );
};
