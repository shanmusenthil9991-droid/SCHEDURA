import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CalendarPlus,
  History,
  BookOpen,
  Users,
  GraduationCap,
  Building,
  UserCheck,
  Eye,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../ui/Logo';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user, isAdmin, isCoordinator, isStudent, logout } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200 shadow-subtle'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          <Logo size="md" showTagline={false} />
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-5">
          {/* ADMIN MENU */}
          {isAdmin && (
            <>
              <div>
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Overview
                </div>
                <div className="space-y-1">
                  <NavLink to="/admin" end className={navLinkClass} onClick={onCloseMobile}>
                    <LayoutDashboard className="w-4 h-4 text-brand-600" />
                    <span>Dashboard</span>
                  </NavLink>
                </div>
              </div>

              <div>
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Timetable
                </div>
                <div className="space-y-1">
                  <NavLink to="/admin/timetables" className={navLinkClass} onClick={onCloseMobile}>
                    <Calendar className="w-4 h-4" />
                    <span>Manage Timetables</span>
                  </NavLink>
                  <NavLink to="/admin/create-timetable" className={navLinkClass} onClick={onCloseMobile}>
                    <CalendarPlus className="w-4 h-4 text-emerald-600" />
                    <span>Create Timetable</span>
                  </NavLink>
                </div>
              </div>

              <div>
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Master Records
                </div>
                <div className="space-y-1">
                  <NavLink to="/admin/classes" className={navLinkClass} onClick={onCloseMobile}>
                    <GraduationCap className="w-4 h-4" />
                    <span>Classes & Sections</span>
                  </NavLink>
                  <NavLink to="/admin/subjects" className={navLinkClass} onClick={onCloseMobile}>
                    <BookOpen className="w-4 h-4" />
                    <span>Subjects</span>
                  </NavLink>
                  <NavLink to="/admin/faculty" className={navLinkClass} onClick={onCloseMobile}>
                    <Users className="w-4 h-4" />
                    <span>Faculty</span>
                  </NavLink>
                  <NavLink to="/admin/rooms" className={navLinkClass} onClick={onCloseMobile}>
                    <Building className="w-4 h-4" />
                    <span>Rooms & Labs</span>
                  </NavLink>
                  <NavLink to="/admin/users" className={navLinkClass} onClick={onCloseMobile}>
                    <UserCheck className="w-4 h-4" />
                    <span>User Accounts</span>
                  </NavLink>
                </div>
              </div>

              <div>
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Student Portal
                </div>
                <div className="space-y-1">
                  <NavLink to="/student" className={navLinkClass} onClick={onCloseMobile}>
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span>Schedule Viewer</span>
                  </NavLink>
                </div>
              </div>
            </>
          )}

          {/* FACULTY COORDINATOR MENU */}
          {isCoordinator && (
            <>
              <div>
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Overview
                </div>
                <div className="space-y-1">
                  <NavLink to="/faculty" end className={navLinkClass} onClick={onCloseMobile}>
                    <LayoutDashboard className="w-4 h-4 text-brand-600" />
                    <span>Dashboard</span>
                  </NavLink>
                </div>
              </div>

              <div>
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Timetables (View-Only)
                </div>
                <div className="space-y-1">
                  <NavLink to="/faculty/class-timetable" className={navLinkClass} onClick={onCloseMobile}>
                    <GraduationCap className="w-4 h-4 text-brand-600" />
                    <span>My Class Timetable</span>
                  </NavLink>
                  <NavLink to="/faculty/teaching-schedule" className={navLinkClass} onClick={onCloseMobile}>
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>My Teaching Schedule</span>
                  </NavLink>
                </div>
              </div>
            </>
          )}

          {/* STUDENT MENU */}
          {isStudent && (
            <>
              <div>
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Timetable
                </div>
                <div className="space-y-1">
                  <NavLink to="/student" className={navLinkClass} onClick={onCloseMobile}>
                    <Calendar className="w-4 h-4 text-brand-600" />
                    <span>Class Timetable</span>
                  </NavLink>
                </div>
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Bottom Info / Sign Out */}
      <div className="border-t border-border pt-4">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 mb-3">
          <div className="text-[11px] font-semibold text-slate-800">SCHEDURA System</div>
          <div className="text-[10px] text-slate-500 mt-0.5">PS63 • Academic Edition</div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-white shadow-subtle min-h-screen fixed inset-y-0 left-0 z-40 no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
