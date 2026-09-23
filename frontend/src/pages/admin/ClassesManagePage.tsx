import React, { useState, useEffect } from 'react';
import { Department, ClassItem, Section } from '../../types';
import { departmentService, classService, sectionService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { GraduationCap, Plus, Edit2, Trash2, Layers } from 'lucide-react';

export const ClassesManagePage: React.FC = () => {
  const toast = useToast();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State for Class Add/Edit
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [className, setClassName] = useState<string>('');
  const [classDeptId, setClassDeptId] = useState<string>('');
  const [classSemester, setClassSemester] = useState<number>(1);
  const [classAcademicYear, setClassAcademicYear] = useState<string>('2026-2027');

  // Modal State for Section Add/Edit
  const [isSectionModalOpen, setIsSectionModalOpen] = useState<boolean>(false);
  const [sectionClassId, setSectionClassId] = useState<string>('');
  const [sectionName, setSectionName] = useState<string>('A');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes, sRes] = await Promise.all([
        classService.getAll(),
        departmentService.getAll(),
        sectionService.getAll()
      ]);
      if (cRes.data) setClasses(cRes.data);
      if (dRes.data) setDepartments(dRes.data);
      if (sRes.data) setSections(sRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load classes and sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddClass = () => {
    setEditingClass(null);
    setClassName('');
    setClassDeptId(departments.length > 0 ? departments[0]._id : '');
    setClassSemester(1);
    setClassAcademicYear('2026-2027');
    setIsClassModalOpen(true);
  };

  const openEditClass = (c: ClassItem) => {
    setEditingClass(c);
    setClassName(c.name);
    setClassDeptId(typeof c.departmentId === 'object' ? c.departmentId._id : c.departmentId);
    setClassSemester(c.semester);
    setClassAcademicYear(c.academicYear);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !classDeptId) return;

    try {
      if (editingClass) {
        await classService.update(editingClass._id, {
          name: className,
          departmentId: classDeptId as any,
          semester: classSemester,
          academicYear: classAcademicYear
        });
        toast.success('Class updated successfully');
      } else {
        await classService.create({
          name: className,
          departmentId: classDeptId as any,
          semester: classSemester,
          academicYear: classAcademicYear
        });
        toast.success('Class created with default Sections A and B');
      }
      setIsClassModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Operation failed', err.response?.data?.message);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!window.confirm(`Delete class "${name}" and all its sections?`)) return;
    try {
      await classService.delete(id);
      toast.success('Class deleted');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete', err.response?.data?.message);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionClassId || !sectionName) return;

    try {
      await sectionService.create({
        name: sectionName.toUpperCase(),
        classId: sectionClassId as any
      });
      toast.success(`Section ${sectionName.toUpperCase()} added`);
      setIsSectionModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to add section', err.response?.data?.message);
    }
  };

  const handleDeleteSection = async (id: string, name: string) => {
    if (!window.confirm(`Delete section "${name}"?`)) return;
    try {
      await sectionService.delete(id);
      toast.success('Section deleted');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete section', err.response?.data?.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-brand-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Classes & Sections Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Organize academic year cohorts, branches, and class sections.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openAddClass}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          + Add New Class
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Academic Classes Roster</h3>
            <p className="text-xs text-slate-500">{classes.length} registered classes across all departments</p>
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
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Class Name</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Semester</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Academic Year</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Active Sections</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classes.map((cls) => {
                  const classSections = sections.filter((s) => {
                    const cId = typeof s.classId === 'object' ? s.classId._id : s.classId;
                    return cId === cls._id;
                  });

                  return (
                    <tr key={cls._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4 font-bold text-slate-900">{cls.name}</td>
                      <td className="p-4 text-slate-700">
                        {typeof cls.departmentId === 'object' ? cls.departmentId.name : '—'}
                      </td>
                      <td className="p-4 font-medium text-slate-600">Semester {cls.semester}</td>
                      <td className="p-4 text-slate-500">{cls.academicYear}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {classSections.map((sec) => (
                            <span
                              key={sec._id}
                              className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-slate-200"
                            >
                              Sec {sec.name}
                              <button
                                onClick={() => handleDeleteSection(sec._id, sec.name)}
                                className="text-slate-400 hover:text-red-600 ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <button
                            onClick={() => {
                              setSectionClassId(cls._id);
                              setSectionName('C');
                              setIsSectionModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                            title="Add section"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditClass(cls)}
                            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClass(cls._id, cls.name)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Class Modal */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'Create New Class'}
        subtitle="Configure class tier, assigned department, and semester."
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <Input
            label="Class Name"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. II CSE or III MECH"
            required
          />

          <Select
            label="Department"
            value={classDeptId}
            onChange={(e) => setClassDeptId(e.target.value)}
            options={departments.map((d) => ({ value: d._id, label: `${d.name} (${d.code})` }))}
          />

          <Select
            label="Semester"
            value={classSemester}
            onChange={(e) => setClassSemester(Number(e.target.value))}
            options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: s, label: `Semester ${s}` }))}
          />

          <Input
            label="Academic Year"
            value={classAcademicYear}
            onChange={(e) => setClassAcademicYear(e.target.value)}
            placeholder="2026-2027"
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsClassModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingClass ? 'Update Class' : 'Create Class'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Section Modal */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title="Add New Section"
        subtitle="Add a section (e.g. A, B, C) to the class."
      >
        <form onSubmit={handleAddSection} className="space-y-4">
          <Input
            label="Section Name / Code"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="e.g. A or B"
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsSectionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Section
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
