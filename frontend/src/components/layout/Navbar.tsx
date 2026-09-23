import React from 'react';
import { Search, Bell, LogOut, User as UserIcon, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../ui/Logo';
import { Badge } from '../ui/Badge';

interface NavbarProps {
  onOpenSearch: () => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onToggleMobileSidebar }) => {
  const { user, logout, isAdmin, isCoordinator } = useAuth();

  const roleLabel = isAdmin
    ? 'System Administrator'
    : isCoordinator
    ? 'Faculty Coordinator'
    : 'Student';

  const roleBadgeVariant = isAdmin ? 'primary' : isCoordinator ? 'draft' : 'secondary';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-white px-4 md:px-8 shadow-subtle no-print">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden">
          <Logo size="sm" />
        </div>

        {/* Global Search Bar trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-3 w-64 md:w-80 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-xs text-slate-500 transition shadow-subtle"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="flex-1 text-left">Search subjects, faculty, rooms...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenSearch}
          className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User profile dropdown info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-50 border border-brand-100 text-brand-700 font-bold text-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              {user?.name || 'User'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-slate-500 font-medium">{roleLabel}</span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out of SCHEDURA"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
