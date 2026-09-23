import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-white py-6 px-6 sm:px-8 text-center sm:text-left mt-auto no-print">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold text-sm tracking-tight text-slate-900">SCHEDURA</span>
          <p className="text-xs text-slate-500 mt-0.5">
            Smart Class Timetable & Schedule Management
          </p>
        </div>

        <div className="text-xs text-slate-400">
          © 2026 SCHEDURA. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
