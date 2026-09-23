import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Department, ClassItem, Section, Timetable } from '../../types';
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
import { Skeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { History, Copy, CheckCircle, Eye, ArrowLeft, Trash2 } from 'lucide-react';

export const TimetableVersionsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('classId') || '');
  const [selectedSection, setSelectedSection] = useState<string>(searchParams.get('sectionId') || '');

  const [versions, setVersions] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentService.getAll();
        if (res.data) {
          setDepartments(res.data);
          const coordDept = typeof user?.departmentId === 'object' ? user?.departmentId._id : user?.departmentId;
          if (coordDept) {
            setSelectedDept(coordDept);
          } else if (res.data.length > 0) {
            setSelectedDept(res.data[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepartments();
  }, [user]);

  useEffect(() => {
    if (!selectedDept) return;
    const fetchClasses = async () => {
      try {
        const res = await classService.getAll({ departmentId: selectedDept });
        if (res.data) {
          setClasses(res.data);
          if (!selectedClass && res.data.length > 0) {
            setSelectedClass(res.data[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, [selectedDept]);

  useEffect(() => {
    if (!selectedClass) return;
    const fetchSections = async () => {
      try {
        const res = await sectionService.getByClass(selectedClass);
        if (res.data) {
          setSections(res.data);
          if (!selectedSection && res.data.length > 0) {
            setSelectedSection(res.data[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSections();
  }, [selectedClass]);

  const loadVersions = async () => {
    if (!selectedClass || !selectedSection) return;
    setLoading(true);
    try {
      const res = await timetableService.getVersions(selectedClass, selectedSection);
      if (res.data) {
        setVersions(res.data);
      }
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [selectedClass, selectedSection]);

  const handleActivate = async (id: string, versionNum: number) => {
    if (!window.confirm(`Activate Version ${versionNum}? This will archive the currently active timetable.`)) {
      return;
    }
    setActionLoading(id);
    try {
      await timetableService.publish(id);
      toast.success(`Version ${versionNum} is now ACTIVE.`);
      loadVersions();
    } catch (err: any) {
      toast.error('Failed to activate version', err.response?.data?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (id: string, versionNum: number) => {
    setActionLoading(id);
    try {
      const res = await timetableService.duplicate(id);
      toast.success(`Duplicated Version ${versionNum} as new Draft version.`);
      loadVersions();
    } catch (err: any) {
      toast.error('Failed to duplicate version', err.response?.data?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, versionNum: number) => {
    if (!window.confirm(`Are you sure you want to delete Version ${versionNum}?`)) return;
    setActionLoading(id);
    try {
      await timetableService.delete(id);
      toast.success(`Version ${versionNum} deleted.`);
      loadVersions();
    } catch (err: any) {
      toast.error('Failed to delete', err.response?.data?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const currentClassObj = classes.find((c) => c._id === selectedClass);
  const currentSectionObj = sections.find((s) => s._id === selectedSection);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Timetable Version History
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Inspect, duplicate, or restore past revisions of class schedules.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/coordinator')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Filter Selector */}
      <Card className="p-5 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Department"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            options={departments.map((d) => ({
              value: d._id,
              label: `${d.name} (${d.code})`
            }))}
          />
          <Select
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={classes.map((c) => ({
              value: c._id,
              label: `${c.name} (Semester ${c.semester})`
            }))}
          />
          <Select
            label="Section"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            options={sections.map((s) => ({
              value: s._id,
              label: `Section ${s.name}`
            }))}
          />
        </div>
      </Card>

      {/* Version Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {currentClassObj?.name || 'Class'} — Section {currentSectionObj?.name || 'A'} History
            </h3>
            <p className="text-xs text-slate-500">
              {versions.length} total versions recorded in database
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={6} />
          </div>
        ) : versions.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              type="generic"
              title="No version history found"
              description="No timetable versions exist yet for this class and section."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Version</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Created By</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Created Date</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Published Date</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {versions.map((v) => {
                  const isActive = v.status === 'ACTIVE';
                  const isDraft = v.status === 'DRAFT';
                  return (
                    <tr
                      key={v._id}
                      className={`hover:bg-slate-50/70 transition ${
                        isActive ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="p-4 font-bold text-slate-900">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          v{v.version}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={isActive ? 'active' : isDraft ? 'draft' : 'archived'}
                          size="md"
                          dot
                        >
                          {v.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        {v.createdBy?.name || 'System Admin'}
                      </td>
                      <td className="p-4 text-slate-500">
                        {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 text-slate-500">
                        {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : 'Not published'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/timetables?id=${v._id}`)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            View
                          </Button>

                          {!isActive && (
                            <Button
                              variant="success"
                              size="sm"
                              isLoading={actionLoading === v._id}
                              onClick={() => handleActivate(v._id, v.version)}
                              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                            >
                              Activate
                            </Button>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={actionLoading === v._id}
                            onClick={() => handleDuplicate(v._id, v.version)}
                            leftIcon={<Copy className="w-3.5 h-3.5" />}
                          >
                            Duplicate
                          </Button>

                          {!isActive && (
                            <Button
                              variant="danger"
                              size="sm"
                              isLoading={actionLoading === v._id}
                              onClick={() => handleDelete(v._id, v.version)}
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
  );
};
