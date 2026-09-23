import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'archived' | 'draft' | 'primary' | 'secondary' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const variants = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10',
    archived: 'bg-slate-100 text-slate-600 border-slate-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/10',
    primary: 'bg-blue-50 text-brand-700 border-blue-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200'
  };

  const dots = {
    active: 'bg-emerald-500',
    archived: 'bg-slate-400',
    draft: 'bg-amber-500',
    primary: 'bg-brand-500',
    secondary: 'bg-slate-400',
    warning: 'bg-amber-500',
    danger: 'bg-red-500'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-subtle ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />}
      {children}
    </span>
  );
};
