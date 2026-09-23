import React, { useState, useEffect } from 'react';
import { Faculty, Department, ClassItem, Section } from '../../types';
import { facultyService, departmentService, classService, sectionService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Users, Plus, Edit2, Trash2, Search, GraduationCap } from 'lucide-react';

export const FacultyManagePage: React.FC = () => {
  const toast = useToast();

  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filterDept, setFilterDept] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [facultyIdInput, setFacultyIdInput] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [designation, setDesignation] = useState<string>('Assistant Professor');
  const [inChargeClassId, setInChargeClassId] = useState<string>('');
  const [inChargeSectionId, setInChargeSectionId] = useState<string>('');
  const [inChargeAcademicYear, setInChargeAcademicYear] = useState<string>('2026-2027');

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterDept) params.departmentId = filterDept;
      if (searchQuery) params.search = searchQuery;

      const [fRes, dRes, cRes, sRes] = await Promise.all([
        facultyService.getAll(params),
        departmentService.getAll(),
        classService.getAll(),
        sectionService.getAll()
      ]);
      if (fRes.data) setFaculty(fRes.data);
      if (dRes.data) setDepartments(dRes.data);
      if (cRes.data) setClasses(cRes.data);
      if (sRes.data) setSections(sRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load faculty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [filterDept, searchQuery]);

  const openAdd = () => {
    setEditingFaculty(null);
    setFacultyIdInput('');
    setName('');
    setEmail('');
    setDepartmentId(departments.length > 0 ? departments[0]._id : '');
    setDesignation('Assistant Professor');
    setInChargeClassId('');
    setInChargeSectionId('');
    setInChargeAcademicYear('2026-2027');
    setIsModalOpen(true);
  };

  const openEdit = (f: Faculty) => {
    setEditingFaculty(f);
    setFacultyIdInput(f.facultyId);
    setName(f.name);
    setEmail(f.email);
    setDepartmentId(typeof f.departmentId === 'object' ? f.departmentId._id : f.departmentId);
    setDesignation(f.designation);
    setInChargeClassId(
      f.inChargeClassId
        ? typeof f.inChargeClassId === 'object'
          ? f.inChargeClassId._id
          : f.inChargeClassId
        : ''
    );
    setInChargeSectionId(
      f.inChargeSectionId
        ? typeof f.inChargeSectionId === 'object'
          ? f.inChargeSectionId._id
          : f.inChargeSectionId
        : ''
    );
    setInChargeAcademicYear(f.inChargeAcademicYear || '2026-2027');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !departmentId || !designation) return;

    try {
      const payload: any = {
        name,
        email,
        departmentId: departmentId as any,
        designation,
        inChargeClassId: inChargeClassId || null,
        inChargeSectionId: inChargeSectionId || null,
        inChargeAcademicYear: inChargeAcademicYear || '2026-2027'
      };

      if (editingFaculty) {
        await facultyService.update(editingFaculty._id, payload);
        toast.success('Faculty updated successfully');
      } else {
        payload.facultyId = facultyIdInput || undefined;
        await facultyService.create(payload);
        toast.success('Faculty created successfully');
      }
      setIsModalOpen(false);
      fetchFaculty();
    } catch (err: any) {
      toast.error('Operation failed', err.response?.data?.message);
    }
  };

  const handleDelete = async (id: string, fName: string) => {
    if (!window.confirm(`Delete faculty member "${fName}"?`)) return;
    try {
      await facultyService.delete(id);
      toast.success('Faculty deleted');
      fetchFaculty();
    } catch (err: any) {
      toast.error('Failed to delete', err.response?.data?.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Faculty Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage teaching staff, professor designations, and departmental affiliations.
              </p>
            </div>
          </div>
        </div>

        <Button variant="primary" size="md" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>
          + Add New Faculty
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Search Faculty"
            placeholder="Search by name, email, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            label="Department Filter"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map((d) => ({ value: d._id, label: `${d.name} (${d.code})` }))
            ]}
          />
        </div>
      </Card>

      {/* Faculty Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Faculty Roster</h3>
            <p className="text-xs text-slate-500">{faculty.length} registered faculty members</p>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Faculty ID</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Name & Designation</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Email Address</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">In-Charge Class</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {faculty.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono font-bold text-slate-700">{f.facultyId}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{f.name}</div>
                      <div className="text-[11px] text-slate-500">{f.designation}</div>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-[11px]">{f.email}</td>
                    <td className="p-4 text-slate-700">
                      {typeof f.departmentId === 'object' ? f.departmentId.name : '—'}
                    </td>
                    <td className="p-4">
                      {f.inChargeClassId ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 w-fit">
                          <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                          <span>
                            {typeof f.inChargeClassId === 'object' ? f.inChargeClassId.name : 'Class'} — Sec{' '}
                            {typeof f.inChargeSectionId === 'object' ? f.inChargeSectionId.name : 'A'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(f)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(f._id, f.name)}
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

      {/* Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
        subtitle="Configure faculty identity, institutional email, academic department, and class in-charge assignment."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editingFaculty && (
            <Input
              label="Faculty ID (Optional - Auto-generated if left blank)"
              value={facultyIdInput}
              onChange={(e) => setFacultyIdInput(e.target.value)}
              placeholder="e.g. FAC035"
            />
          )}

          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Rajesh Khanna"
            required
          />

          <Input
            label="College Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rajesh.khanna@college.edu"
            required
          />

          <Select
            label="Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={departments.map((d) => ({ value: d._id, label: `${d.name} (${d.code})` }))}
          />

          <Select
            label="Designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            options={[
              { value: 'Professor & HOD', label: 'Professor & HOD' },
              { value: 'Professor & Coordinator', label: 'Professor & Coordinator' },
              { value: 'Professor', label: 'Professor' },
              { value: 'Associate Professor', label: 'Associate Professor' },
              { value: 'Assistant Professor', label: 'Assistant Professor' },
              { value: 'Visiting Faculty', label: 'Visiting Faculty' }
            ]}
          />

          {/* In-Charge Section */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <GraduationCap className="w-4 h-4 text-brand-600" />
              <span>Class Coordinator Assignment (In-Charge)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Assigned Class"
                value={inChargeClassId}
                onChange={(e) => setInChargeClassId(e.target.value)}
                options={[
                  { value: '', label: 'None (No In-Charge Assignment)' },
                  ...classes.map((c) => ({ value: c._id, label: c.name }))
                ]}
              />

              <Select
                label="Assigned Section"
                value={inChargeSectionId}
                onChange={(e) => setInChargeSectionId(e.target.value)}
                options={[
                  { value: '', label: 'None' },
                  ...sections.map((s) => ({ value: s._id, label: `Section ${s.name}` }))
                ]}
                disabled={!inChargeClassId}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingFaculty ? 'Update Faculty' : 'Create Faculty'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
