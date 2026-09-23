import React from 'react';
import { Timetable } from '../../types';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Calendar, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentUpdatesListProps {
  timetables: Timetable[];
}

export const RecentUpdatesList: React.FC<RecentUpdatesListProps> = ({ timetables }) => {
  return (
    <Card className="p-6">
      <CardHeader
        title="Recent Timetable Updates"
        subtitle="Live feed of published, modified, and archived schedules across departments."
      />

      {timetables.length === 0 ? (
        <p className="text-xs text-slate-400 py-4">No recent timetable updates recorded.</p>
      ) : (
        <div className="divide-y divide-border">
          {timetables.map((tt) => {
            const dateStr = tt.updatedAt ? new Date(tt.updatedAt).toLocaleDateString() : 'Recent';
            return (
              <div key={tt._id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {tt.classId?.name || 'Class'} — Section {tt.sectionId?.name || 'A'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        v{tt.version}
                      </span>
                      <Badge
                        variant={tt.status === 'ACTIVE' ? 'active' : tt.status === 'DRAFT' ? 'draft' : 'archived'}
                        size="sm"
                        dot
                      >
                        {tt.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {tt.departmentId?.name} • Updated by {tt.createdBy?.name || 'Admin'} on {dateStr}
                    </div>
                  </div>
                </div>

                <Link
                  to={`/admin/timetables`}
                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
