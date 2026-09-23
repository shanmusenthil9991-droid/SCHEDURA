import React, { useState, useEffect } from 'react';
import { facultyService } from '../../services/api';
import { Timetable, TimetableEntry } from '../../types';
import { WeeklyTimetableGrid } from '../../components/timetable/WeeklyTimetableGrid';
import { DailyTimetableTimeline } from '../../components/timetable/DailyTimetableTimeline';
import { LiveClassTracker } from '../../components/timetable/LiveClassTracker';
import { ExportActions } from '../../components/timetable/ExportActions';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  GraduationCap,
  Search,
  Grid,
  List,
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const FacultyClassTimetablePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [inChargeInfo, setInChargeInfo] = useState<{
    class?: { _id: string; name: string };
    section?: { _id: string; name: string };
    academicYear?: string;
  } | null>(null);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fetchInChargeTimetable = async () => {
    setLoading(true);
    try {
      const res = await facultyService.getMyInChargeTimetable();
      if (res.success && res.data) {
        setInChargeInfo(res.data.inCharge || null);
        if (res.data.timetable) {
          setTimetable(res.data.timetable);
          setEntries(res.data.timetable.entries || []);
        } else {
          setTimetable(null);
          setEntries([]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch in-charge timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInChargeTimetable();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-brand-50 text-brand-700 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Class Timetable
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official active timetable for your assigned in-charge class & section. (View-Only)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInChargeTimetable}
            disabled={loading}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : !inChargeInfo || !inChargeInfo.class ? (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-8 text-center max-w-xl mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No In-Charge Class Assigned</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            You currently do not have a class coordinator assignment. Please contact your college administrator to assign your designated class and section.
          </p>
        </div>
      ) : !timetable ? (
        <EmptyState
          type="timetable"
          title={`No Active Timetable for ${inChargeInfo.class?.name || 'Class'} — Section ${inChargeInfo.section?.name || 'A'}`}
          description="The timetable for your in-charge class has not been published as ACTIVE yet. You will be able to view it as soon as the administrator publishes it."
        />
      ) : (
        <div className="space-y-6">
          {/* Active Class Header Card */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {timetable.classId?.name || inChargeInfo.class?.name} — Section {timetable.sectionId?.name || inChargeInfo.section?.name || 'A'}
                </h2>
                <Badge variant="active" size="md" dot>
                  ACTIVE TIMETABLE
                </Badge>
                <span className="flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  <ShieldCheck className="w-3 h-3" /> In-Charge
                </span>
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

          {/* Timetable Grid or Day Timeline */}
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
