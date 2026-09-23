import React from 'react';
import { Timetable, TimetableEntry } from '../../types';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExportActionsProps {
  timetable: Timetable;
  entries: TimetableEntry[];
}

export const ExportActions: React.FC<ExportActionsProps> = ({ timetable, entries }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Day', 'Start Time', 'End Time', 'Subject Code', 'Subject Name', 'Faculty', 'Room', 'Building'];
    const rows = entries.map((e) => [
      `"${e.day}"`,
      `"${e.startTime}"`,
      `"${e.endTime}"`,
      `"${e.subjectId?.subjectCode || ''}"`,
      `"${e.subjectId?.subjectName || ''}"`,
      `"${e.facultyId?.name || ''}"`,
      `"${e.roomId?.roomNumber || ''}"`,
      `"${e.roomId?.building || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `SCHEDURA_${timetable.classId?.name || 'Class'}_Sec${timetable.sectionId?.name || 'A'}_Timetable.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex items-center gap-2 no-print">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        leftIcon={<Printer className="w-4 h-4" />}
      >
        Print
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
      >
        Export CSV
      </Button>
    </div>
  );
};
