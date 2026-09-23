import React from 'react';
import { Calendar } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false }) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold tracking-tight',
    lg: 'text-2xl font-extrabold tracking-tight'
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5 select-none">
        <div className="flex items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm p-1.5 ring-4 ring-blue-50">
          <Calendar className={iconSizes[size]} />
        </div>
        <div className="flex flex-col">
          <span className={`${textSizes[size]} text-slate-900 leading-none`}>
            SCHEDURA
          </span>
          {showTagline && (
            <span className="text-[11px] font-medium text-slate-500 tracking-normal mt-1">
              Smart Class Timetable & Schedule Management
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
