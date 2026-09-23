import React, { useState, useEffect, useRef } from 'react';
import { Department, ClassItem, Section } from '../../types';
import { departmentService, classService, sectionService } from '../../services/api';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Search, Sparkles, Filter, CheckCircle2, ChevronRight } from 'lucide-react';

export interface SelectionCriteria {
  departmentId: string;
  classId: string;
  sectionId: string;
  semester: number;
  academicYear: string;
}

interface ClassSectionSelectorProps {
  onSelect: (criteria: SelectionCriteria) => void;
  initialCriteria?: SelectionCriteria | null;
  isLoading?: boolean;
}

export const ClassSectionSelector: React.FC<ClassSectionSelectorProps> = ({
  onSelect,
  initialCriteria,
  isLoading = false
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [selectedDept, setSelectedDept] = useState<string>(initialCriteria?.departmentId || '');
  const [selectedClass, setSelectedClass] = useState<string>(initialCriteria?.classId || '');
  const [selectedSection, setSelectedSection] = useState<string>(initialCriteria?.sectionId || '');
  const [selectedSemester, setSelectedSemester] = useState<number>(initialCriteria?.semester || 3);
  const [selectedYear, setSelectedYear] = useState<string>(initialCriteria?.academicYear || '2026-2027');

  const [loadingDepts, setLoadingDepts] = useState<boolean>(true);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(false);
  const [loadingSections, setLoadingSections] = useState<boolean>(false);

  // Sync with initialCriteria prop if it arrives or changes
  useEffect(() => {
    if (initialCriteria) {
      if (initialCriteria.departmentId) setSelectedDept(initialCriteria.departmentId);
      if (initialCriteria.classId) setSelectedClass(initialCriteria.classId);
      if (initialCriteria.sectionId) setSelectedSection(initialCriteria.sectionId);
      if (initialCriteria.semester) setSelectedSemester(initialCriteria.semester);
      if (initialCriteria.academicYear) setSelectedYear(initialCriteria.academicYear);
    }
  }, [initialCriteria]);

  // Load Departments on mount
  useEffect(() => {
    let isMounted = true;
    const fetchDepts = async () => {
      try {
        setLoadingDepts(true);
        const res = await departmentService.getAll();
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setDepartments(res.data);
          setSelectedDept((prev) => prev || initialCriteria?.departmentId || res.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        if (isMounted) setLoadingDepts(false);
      }
    };
    fetchDepts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Classes when Department changes
  useEffect(() => {
    if (!selectedDept) {
      setClasses([]);
      setSelectedClass('');
      return;
    }

    let isMounted = true;
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const res = await classService.getAll({ departmentId: selectedDept });
        if (isMounted && res.success && res.data) {
          const loadedClasses: ClassItem[] = res.data;
          setClasses(loadedClasses);

          if (loadedClasses.length > 0) {
            // Check if current selectedClass or initialCriteria is valid in this department
            const matched = loadedClasses.find(
              (c) => c._id === selectedClass || (initialCriteria?.classId && c._id === initialCriteria.classId)
            );
            const targetClass = matched || loadedClasses[0];
            setSelectedClass(targetClass._id);
            setSelectedSemester(targetClass.semester || 1);
            setSelectedYear(targetClass.academicYear || '2026-2027');
          } else {
            setSelectedClass('');
            setSections([]);
            setSelectedSection('');
          }
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
      } finally {
        if (isMounted) setLoadingClasses(false);
      }
    };

    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, [selectedDept]);

  // Load Sections when Class changes
  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSection('');
      return;
    }

    let isMounted = true;
    const fetchSections = async () => {
      try {
        setLoadingSections(true);
        const res = await sectionService.getByClass(selectedClass);
        if (isMounted && res.success && res.data) {
          const loadedSections: Section[] = res.data;
          setSections(loadedSections);

          if (loadedSections.length > 0) {
            const matched = loadedSections.find(
              (s) => s._id === selectedSection || (initialCriteria?.sectionId && s._id === initialCriteria.sectionId)
            );
            const targetSec = matched || loadedSections[0];
            setSelectedSection(targetSec._id);
          } else {
            setSelectedSection('');
          }
        }
      } catch (err) {
        console.error('Failed to load sections:', err);
      } finally {
        if (isMounted) setLoadingSections(false);
      }
    };

    fetchSections();
    return () => {
      isMounted = false;
    };
  }, [selectedClass]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedDept || !selectedClass || !selectedSection) return;

    onSelect({
      departmentId: selectedDept,
      classId: selectedClass,
      sectionId: selectedSection,
      semester: selectedSemester,
      academicYear: selectedYear
    });
  };

  const departmentOptions = departments.map((d) => ({
    value: d._id,
    label: `${d.name} (${d.code})`
  }));

  const classOptions = classes.map((c) => ({
    value: c._id,
    label: `${c.name} (Semester ${c.semester})`
  }));

  const sectionOptions = sections.map((s) => ({
    value: s._id,
    label: `Section ${s.name}`
  }));

  const semesterOptions = [
    { value: 1, label: 'Semester 1' },
    { value: 2, label: 'Semester 2' },
    { value: 3, label: 'Semester 3' },
    { value: 4, label: 'Semester 4' },
    { value: 5, label: 'Semester 5' },
    { value: 6, label: 'Semester 6' },
    { value: 7, label: 'Semester 7' },
    { value: 8, label: 'Semester 8' }
  ];

  const yearOptions = [
    { value: '2026-2027', label: '2026–2027' },
    { value: '2025-2026', label: '2025–2026' }
  ];

  // Quick preset selector handler
  const handleQuickPreset = (deptCode: string, className: string, secName: string) => {
    const d = departments.find((dept) => dept.code === deptCode);
    if (!d) return;
    setSelectedDept(d._id);

    // Fetch classes and sections for preset
    classService.getAll({ departmentId: d._id }).then(async (cRes) => {
      if (cRes.success && cRes.data) {
        const cls = cRes.data.find((c: ClassItem) => c.name === className) || cRes.data[0];
        if (cls) {
          setClasses(cRes.data);
          setSelectedClass(cls._id);
          setSelectedSemester(cls.semester);
          setSelectedYear(cls.academicYear);

          const sRes = await sectionService.getByClass(cls._id);
          if (sRes.success && sRes.data) {
            const sec = sRes.data.find((s: Section) => s.name === secName) || sRes.data[0];
            setSections(sRes.data);
            if (sec) {
              setSelectedSection(sec._id);
              onSelect({
                departmentId: d._id,
                classId: cls._id,
                sectionId: sec._id,
                semester: cls.semester,
                academicYear: cls.academicYear
              });
            }
          }
        }
      }
    });
  };

  const isFormValid = Boolean(selectedDept && selectedClass && selectedSection);

  return (
    <Card className="border-brand-100 bg-white shadow-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Choose Your Class</h2>
            <p className="text-xs text-slate-500">
              Select your department, class, and section to view the official published timetable.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Presets:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset('CSE', 'II CSE', 'A')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
          >
            II CSE - A
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('CSE', 'III CSE', 'A')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
          >
            III CSE - A
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('IT', 'II IT', 'A')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
          >
            II IT - A
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <Select
            label="Department"
            options={departmentOptions}
            value={selectedDept}
            placeholder={loadingDepts ? 'Loading departments...' : 'Select Department'}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setSelectedClass('');
              setSelectedSection('');
            }}
            disabled={loadingDepts || departments.length === 0}
          />

          <Select
            label="Class"
            options={classOptions}
            value={selectedClass}
            placeholder={loadingClasses ? 'Loading classes...' : classOptions.length === 0 ? 'No classes found' : 'Select Class'}
            onChange={(e) => {
              const clsId = e.target.value;
              setSelectedClass(clsId);
              const found = classes.find((c) => c._id === clsId);
              if (found) {
                setSelectedSemester(found.semester);
                setSelectedYear(found.academicYear);
              }
              setSelectedSection('');
            }}
            disabled={loadingClasses || classes.length === 0}
          />

          <Select
            label="Section"
            options={sectionOptions}
            value={selectedSection}
            placeholder={loadingSections ? 'Loading sections...' : sectionOptions.length === 0 ? 'No sections' : 'Select Section'}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={loadingSections || sections.length === 0}
          />

          <Select
            label="Semester"
            options={semesterOptions}
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
          />

          <Select
            label="Academic Year"
            options={yearOptions}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            {isFormValid && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready to load schedule
              </span>
            )}
          </div>

          <Button
            type="submit"
            size="md"
            variant="primary"
            isLoading={isLoading}
            disabled={!isFormValid}
            leftIcon={<Search className="w-4 h-4" />}
          >
            View Timetable
          </Button>
        </div>
      </form>
    </Card>
  );
};
