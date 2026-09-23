import React, { useState, useEffect } from 'react';
import { Subject, Department } from '../../types';
import { subjectService, departmentService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { BookOpen, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';

export const SubjectsManagePage: React.FC = () => {
  const toast = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filterDept, setFilterDept] = useState<string>('');
  const [filterSemester, setFilterSemester] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState<string>('');
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [subjectDeptId, setSubjectDeptId] = useState<string>('');
  const [subjectSemester, setSubjectSemester] = useState<number>(3);
  const [subjectCredits, setSubjectCredits] = useState<number>(4);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterDept) params.departmentId = filterDept;
      if (filterSemester) params.semester = Number(filterSemester);
      if (searchQuery) params.search = searchQuery;

      const [sRes, dRes] = await Promise.all([
        subjectService.getAll(params),
        departmentService.getAll()
      ]);
      if (sRes.data) setSubjects(sRes.data);
      if (dRes.data) setDepartments(dRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [filterDept, filterSemester, searchQuery]);

  const openAddSubject = () => {
    setEditingSubject(null);
    setSubjectName('');
    setSubjectCode('');
    setSubjectDeptId(departments.length > 0 ? departments[0]._id : '');
    setSubjectSemester(3);
    setSubjectCredits(4);
    setIsModalOpen(true);
  };

  const openEditSubject = (s: Subject) => {
    setEditingSubject(s);
    setSubjectName(s.subjectName);
    setSubjectCode(s.subjectCode);
    setSubjectDeptId(typeof s.departmentId === 'object' ? s.departmentId._id : s.departmentId);
    setSubjectSemester(s.semester);
    setSubjectCredits(s.credits);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !subjectCode || !subjectDeptId) return;

    try {
      if (editingSubject) {
        await subjectService.update(editingSubject._id, {
          subjectName,
          subjectCode: subjectCode.toUpperCase(),
          departmentId: subjectDeptId as any,
          semester: subjectSemester,
          credits: subjectCredits
        });
        toast.success('Subject updated successfully');
      } else {
        await subjectService.create({
          subjectName,
          subjectCode: subjectCode.toUpperCase(),
          departmentId: subjectDeptId as any,
          semester: subjectSemester,
          credits: subjectCredits
        });
        toast.success('Subject created successfully');
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      toast.error('Operation failed', err.response?.data?.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete subject "${name}"?`)) return;
    try {
      await subjectService.delete(id);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (err: any) {
      toast.error('Failed to delete', err.response?.data?.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Subjects Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage curriculum course codes, credit allocations, and semester mappings.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openAddSubject}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          + Add New Subject
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Search Subjects"
            placeholder="Search by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
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
            label="Semester"
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            options={[
              { value: '', label: 'All Semesters' },
              ...[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: String(s), label: `Semester ${s}` }))
            ]}
          />
        </div>
      </Card>

      {/* Subjects Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Curriculum Subjects</h3>
            <p className="text-xs text-slate-500">{subjects.length} subjects registered</p>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Course Code</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Subject Title</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Semester</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Credits</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subjects.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono font-bold text-brand-700 bg-brand-50/30">
                      {sub.subjectCode}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">{sub.subjectName}</td>
                    <td className="p-4 text-slate-600">
                      {typeof sub.departmentId === 'object' ? sub.departmentId.name : '—'}
                    </td>
                    <td className="p-4 text-slate-600">Semester {sub.semester}</td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {sub.credits} Credits
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditSubject(sub)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sub._id, sub.subjectName)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        subtitle="Specify subject details, curriculum code, and academic credits."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Subject Code"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
            placeholder="e.g. CS301"
            required
          />

          <Input
            label="Subject Title"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="e.g. Data Structures & Algorithms"
            required
          />

          <Select
            label="Department"
            value={subjectDeptId}
            onChange={(e) => setSubjectDeptId(e.target.value)}
            options={departments.map((d) => ({ value: d._id, label: `${d.name} (${d.code})` }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Semester"
              value={subjectSemester}
              onChange={(e) => setSubjectSemester(Number(e.target.value))}
              options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: s, label: `Semester ${s}` }))}
            />

            <Select
              label="Credits"
              value={subjectCredits}
              onChange={(e) => setSubjectCredits(Number(e.target.value))}
              options={[1, 2, 3, 4, 5, 6].map((c) => ({ value: c, label: `${c} Credits` }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingSubject ? 'Update Subject' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
