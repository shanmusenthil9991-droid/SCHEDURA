import React from 'react';
import { CalendarX, SearchX, FileQuestion, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  type?: 'timetable' | 'search' | 'generic' | 'error';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  const configs = {
    timetable: {
      icon: CalendarX,
      title: title || 'No active timetable available',
      description:
        description ||
        'The timetable for this class/section has not been published yet. Please check back later or contact your department coordinator.'
    },
    search: {
      icon: SearchX,
      title: title || 'No matching results',
      description: description || 'Try adjusting your search terms or clearing your filters.'
    },
    error: {
      icon: AlertCircle,
      title: title || 'Failed to load data',
      description: description || 'An error occurred while communicating with the server. Please try again.'
    },
    generic: {
      icon: FileQuestion,
      title: title || 'No data found',
      description: description || 'There are no records to display at this time.'
    }
  };

  const current = configs[type];
  const IconComponent = current.icon;

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3.5">
        <IconComponent className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-slate-900 tracking-tight">{current.title}</h4>
      <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">{current.description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="outline" size="sm" className="mt-4">
          {actionText}
        </Button>
      )}
    </div>
  );
};
