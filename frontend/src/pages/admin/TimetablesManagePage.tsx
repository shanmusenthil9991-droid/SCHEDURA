import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Department,
  ClassItem,
  Section,
  Timetable,
  TimetableEntry,
  FacultyAllocation,
  DayOfWeek
} from '../../types';
import {
  departmentService,
  classService,
  sectionService,
  timetableService
} from '../../services/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { WeeklyTimetableGrid } from '../../components/timetable/WeeklyTimetableGrid';
import { TimetableEntryEditModal } from '../../components/timetable/TimetableEntryEditModal';
import { ExportActions } from '../../components/timetable/ExportActions';
import { Skeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Calendar,
  CalendarPlus,
  Eye,
  CheckCircle,
  Archive,
  Copy,
  Trash2,
  Plus,
  ArrowLeft,
  Filter,
  Users,
  History
} from 'lucide-react';

export const TimetablesManagePage: React.FC = () => {
  const { user, isAdmin, isCoordinator } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [filterDept, setFilterDept] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected timetable detail view
  const selectedTimetableId = searchParams.get('id');
  const [activeTimetableDetail, setActiveTimetableDetail] = useState<Timetable | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Tab & Faculty Allocation State
  const [activeTab, setActiveTab] = useState<'class' | 'faculty'>('class');
  const [facultyAllocations, setFacultyAllocations] = useState<FacultyAllocation[]>([]);
  const [loadingAllocations, setLoadingAllocations] = useState<boolean>(false);
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('ALL');

  // Entry Edit / Add Modal State
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
  const [newEntryDay, setNewEntryDay] = useState<DayOfWeek>('Monday');
  const [newEntrySlot, setNewEntrySlot] = useState<{ startTime: string; endTime: string } | undefined>();

  const loadFacultyAllocation = async (id: string) => {
    setLoadingAllocations(true);
    try {
      const res = await timetableService.getFacultyAllocation(id);
      if (res.success && res.data) {
        setFacultyAllocations(res.data.allocations || []);
      }
    } catch (err: any) {
      console.error('Failed to load faculty allocation:', err);
    } finally {
      setLoadingAllocations(false);
    }
  };

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.getAll();
        if (res.data) {
          setDepartments(res.data);
          const coordDept = typeof user?.departmentId === 'object' ? user?.departmentId._id : user?.departmentId;
          if (coordDept && isCoordinator) {
            setFilterDept(coordDept);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepts();
  }, [user, isCoordinator]);

  // Load Classes when filter department changes
  useEffect(() => {
    if (!filterDept) {
      setClasses([]);
      return;
    }
    const fetchClasses = async () => {
      try {
        const res = await classService.getAll({ departmentId: filterDept });
        if (res.data) setClasses(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, [filterDept]);

  // Load Timetables list
  const loadTimetables = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterDept) params.departmentId = filterDept;
      if (filterClass) params.classId = filterClass;
      if (filterStatus) params.status = filterStatus;

      const res = await timetableService.getAll(params);
      if (res.data) setTimetables(res.data);
    } catch (err) {
      console.error('Failed to load timetables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetables();
  }, [filterDept, filterClass, filterStatus]);

  // Load Timetable details if selected
  const loadTimetableDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await timetableService.getById(id);
      if (res.data) {
        setActiveTimetableDetail(res.data);
        setEntries(res.data.entries || []);
      }
    } catch (err) {
      console.error('Failed to load timetable detail:', err);
      toast.error('Failed to load timetable details');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedTimetableId) {
      loadTimetableDetail(selectedTimetableId);
    } else {
      setActiveTimetableDetail(null);
      setEntries([]);
    }
  }, [selectedTimetableId]);

  const handlePublish = async (id: string) => {
    if (!window.confirm('Publish timetable? This will archive the currently active timetable for this class.')) {
      return;
    }
    try {
      await timetableService.publish(id);
      toast.success('Timetable published as ACTIVE.');
      loadTimetables();
      if (selectedTimetableId === id) loadTimetableDetail(id);
    } catch (err: any) {
      toast.error('Failed to publish', err.response?.data?.message);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await timetableService.archive(id);
      toast.success('Timetable archived.');
      loadTimetables();
      if (selectedTimetableId === id) loadTimetableDetail(id);
    } catch (err: any) {
      toast.error('Failed to archive', err.response?.data?.message);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await timetableService.duplicate(id);
      toast.success('Created new draft copy in version history.');
      loadTimetables();
      if (res.data?._id) {
        setSearchParams({ id: res.data._id });
      }
    } catch (err: any) {
      toast.error('Failed to duplicate', err.response?.data?.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this timetable and its entries?')) {
      return;
    }
    try {
      await timetableService.delete(id);
      toast.success('Timetable deleted.');
      if (selectedTimetableId === id) {
        setSearchParams({});
      }
      loadTimetables();
    } catch (err: any) {
      toast.error('Failed to delete', err.response?.data?.message);
    }
  };

  const openEditEntryModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const openAddEntryModal = (day: DayOfWeek, slot: { startTime: string; endTime: string }) => {
    setEditingEntry(null);
    setNewEntryDay(day);
    setNewEntrySlot(slot);
    setIsEntryModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-brand-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeTimetableDetail ? 'Timetable Schedule Editor' : 'Manage Timetables'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {activeTimetableDetail
                  ? `${activeTimetableDetail.classId?.name} — Section ${activeTimetableDetail.sectionId?.name} (Version ${activeTimetableDetail.version})`
                  : 'Full catalog of all active, draft, and archived academic schedules.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTimetableDetail ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchParams({})}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to List
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/coordinator/create-timetable')}
              leftIcon={<CalendarPlus className="w-4 h-4" />}
            >
              + Create Timetable
            </Button>
          )}
        </div>
      </div>

      {/* DETAIL VIEW / INTERACTIVE GRID EDITOR */}
      {selectedTimetableId && activeTimetableDetail ? (
        <div className="space-y-6">
          {/* Schedule Detail Meta Header */}
          <Card className="p-5 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeTimetableDetail.classId?.name} — Section {activeTimetableDetail.sectionId?.name}
                </h2>
                <Badge
                  variant={
                    activeTimetableDetail.status === 'ACTIVE'
                      ? 'active'
                      : activeTimetableDetail.status === 'DRAFT'
                      ? 'draft'
                      : 'archived'
                  }
                  size="md"
                  dot
                >
                  {activeTimetableDetail.status}
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Version {activeTimetableDetail.version}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {activeTimetableDetail.departmentId?.name} • Semester {activeTimetableDetail.semester} • Academic Year {activeTimetableDetail.academicYear}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end lg:self-center no-print">
              <ExportActions timetable={activeTimetableDetail} entries={entries} />

              {activeTimetableDetail.status !== 'ACTIVE' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handlePublish(activeTimetableDetail._id)}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                >
                  Publish Active
                </Button>
              )}

              {activeTimetableDetail.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleArchive(activeTimetableDetail._id)}
                  leftIcon={<Archive className="w-4 h-4 text-slate-500" />}
                >
                  Archive
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDuplicate(activeTimetableDetail._id)}
                leftIcon={<Copy className="w-4 h-4" />}
              >
                Duplicate
              </Button>
            </div>
          </Card>

          {/* Tab Switcher: Class Timetable vs Faculty Allocation */}
          <div className="flex items-center gap-2 border-b border-border pb-1 no-print">
            <button
              onClick={() => setActiveTab('class')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'class'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-subtle'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Tab 1: Class Timetable</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('faculty');
                loadFacultyAllocation(activeTimetableDetail._id);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'faculty'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-subtle'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Tab 2: Faculty Allocation</span>
            </button>
          </div>

          {/* TAB 1: CLASS TIMETABLE */}
          {activeTab === 'class' && (
            <>
              {loadingDetail ? (
                <Skeleton className="h-96 rounded-2xl" />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between no-print">
                    <p className="text-xs text-slate-500">
                      Click any assigned class session to edit or correct. Click empty slots to add new sessions.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingEntry(null);
                        setNewEntryDay('Monday');
                        setNewEntrySlot({ startTime: '09:00', endTime: '10:00' });
                        setIsEntryModalOpen(true);
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Entry
                    </Button>
                  </div>

                  <WeeklyTimetableGrid
                    timetable={activeTimetableDetail}
                    entries={entries}
                    isEditable={true}
                    onEditEntry={openEditEntryModal}
                    onAddEntry={openAddEntryModal}
                  />
                </div>
              )}
            </>
          )}

          {/* TAB 2: FACULTY ALLOCATION */}
          {activeTab === 'faculty' && (
            <div className="space-y-6">
              {loadingAllocations ? (
                <Skeleton className="h-96 rounded-2xl" />
              ) : facultyAllocations.length === 0 ? (
                <EmptyState
                  type="timetable"
                  title="No Faculty Allocated"
                  description="No teaching sessions have been assigned to faculty members in this timetable."
                />
              ) : (
                <div className="space-y-6">
                  {/* Faculty Filter Bar */}
                  <div className="bg-white p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-brand-600" />
                      <span className="text-xs font-bold text-slate-800">Filter Faculty:</span>
                      <select
                        value={selectedFacultyFilter}
                        onChange={(e) => setSelectedFacultyFilter(e.target.value)}
                        className="bg-slate-50 border border-border rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="ALL">All Faculty ({facultyAllocations.length})</option>
                        {facultyAllocations.map((alloc) => (
                          <option key={alloc.faculty._id} value={alloc.faculty._id}>
                            {alloc.faculty.name} ({alloc.faculty.designation}) — {alloc.sessions?.length || alloc.totalSlots || 0} slots
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      Showing{' '}
                      {selectedFacultyFilter === 'ALL'
                        ? facultyAllocations.length
                        : 1}{' '}
                      allocated faculty member(s)
                    </div>
                  </div>

                  {/* Faculty Workload Grid */}
                  <div className="grid grid-cols-1 gap-6">
                    {facultyAllocations
                      .filter(
                        (alloc) =>
                          selectedFacultyFilter === 'ALL' ||
                          alloc.faculty._id === selectedFacultyFilter
                      )
                      .map((alloc) => {
                        const sessionList = alloc.sessions || [];
                        return (
                          <div
                            key={alloc.faculty._id}
                            className="bg-white rounded-2xl border border-border shadow-card overflow-hidden"
                          >
                            <div className="bg-slate-50/80 px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                                  {alloc.faculty.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900">
                                    {alloc.faculty.name}
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                    {alloc.faculty.designation} • {alloc.faculty.departmentId?.name || 'Department'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700 bg-white border border-border px-3 py-1 rounded-lg">
                                  {sessionList.length} Scheduled {sessionList.length === 1 ? 'Slot' : 'Slots'} / Week
                                </span>
                                {alloc.faculty.maxWeeklyHours && (
                                  <span className="text-xs text-slate-500">
                                    Max: {alloc.faculty.maxWeeklyHours} hrs
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50/50 border-b border-border text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                                    <th className="p-3.5">Day</th>
                                    <th className="p-3.5">Time</th>
                                    <th className="p-3.5">Subject</th>
                                    <th className="p-3.5">Room</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {sessionList.map((slot, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="p-3.5 font-bold text-slate-900">{slot.day}</td>
                                      <td className="p-3.5 font-mono text-slate-700 font-semibold">
                                        {slot.startTime} - {slot.endTime}
                                      </td>
                                      <td className="p-3.5">
                                        <div className="font-semibold text-slate-900">
                                          {slot.subject?.subjectName || slot.subject?.name || 'Subject'}
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-mono">
                                          {slot.subject?.subjectCode || slot.subject?.code || ''}
                                        </div>
                                      </td>
                                      <td className="p-3.5 text-slate-600">
                                        {slot.room?.roomNumber} {slot.room?.building ? `(${slot.room.building})` : ''}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Entry Edit / Add Modal */}
          {isEntryModalOpen && (
            <TimetableEntryEditModal
              isOpen={isEntryModalOpen}
              onClose={() => setIsEntryModalOpen(false)}
              timetableId={activeTimetableDetail._id}
              departmentId={
                typeof activeTimetableDetail.departmentId === 'object'
                  ? activeTimetableDetail.departmentId._id
                  : activeTimetableDetail.departmentId
              }
              entry={editingEntry}
              defaultDay={newEntryDay}
              defaultSlot={newEntrySlot}
              onSuccess={() => loadTimetableDetail(activeTimetableDetail._id)}
            />
          )}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="space-y-6">
          {/* Filters Card */}
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-brand-600" />
              <span>Filter Timetables</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Department"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                options={[
                  { value: '', label: 'All Departments' },
                  ...departments.map((d) => ({ value: d._id, label: `${d.name} (${d.code})` }))
                ]}
              />

              <Select
                label="Class"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                options={[
                  { value: '', label: 'All Classes' },
                  ...classes.map((c) => ({ value: c._id, label: c.name }))
                ]}
                disabled={!filterDept}
              />

              <Select
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'ACTIVE', label: '🟢 ACTIVE Only' },
                  { value: 'DRAFT', label: '🟡 DRAFT Only' },
                  { value: 'ARCHIVED', label: '⚪ ARCHIVED Only' }
                ]}
              />
            </div>
          </Card>

          {/* Timetable Master Table */}
          <Card className="p-0 overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic Timetables</h3>
                <p className="text-xs text-slate-500">
                  {timetables.length} timetable versions matching current filters
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={6} cols={7} />
              </div>
            ) : timetables.length === 0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  type="timetable"
                  title="No timetables found"
                  description="No timetables match the selected filters. Try broadening your filter selection or create a new timetable."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border">
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Class & Section</th>
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Department</th>
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Semester / Year</th>
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Version</th>
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Last Updated</th>
                      <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {timetables.map((tt) => {
                      const isActive = tt.status === 'ACTIVE';
                      const isDraft = tt.status === 'DRAFT';
                      return (
                        <tr
                          key={tt._id}
                          className={`hover:bg-slate-50/70 transition ${
                            isActive ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          <td className="p-4 font-bold text-slate-900">
                            {tt.classId?.name || 'Class'} — Sec {tt.sectionId?.name || 'A'}
                          </td>
                          <td className="p-4 text-slate-600">
                            {tt.departmentId?.name || 'Department'}
                          </td>
                          <td className="p-4 text-slate-600">
                            Sem {tt.semester} • {tt.academicYear}
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-700">
                            v{tt.version}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={isActive ? 'active' : isDraft ? 'draft' : 'archived'}
                              size="md"
                              dot
                            >
                              {tt.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-slate-500">
                            {tt.updatedAt ? new Date(tt.updatedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchParams({ id: tt._id })}
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                              >
                                View / Edit
                              </Button>

                              {!isActive && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handlePublish(tt._id)}
                                  title="Publish as Active"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicate(tt._id)}
                                title="Duplicate Version"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-600" />
                              </Button>

                              {!isActive && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(tt._id)}
                                  title="Delete Timetable"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
