import React from 'react';
import { UserRole, Employee, CompanyProfile } from '../types/hris';
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  FileText, 
  Bell, 
  ChevronDown, 
  HardDrive, 
  Users, 
  Image as ImageIcon, 
  LogOut, 
  User as UserIcon,
  Menu
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: Employee;
  onUserChange: (emp: Employee) => void;
  employees: Employee[];
  company: CompanyProfile;
  onQuickClockIn: () => void;
  onOpenQuickLetter: () => void;
  onOpenLogoEditor: () => void;
  onOpenMyProfile: () => void;
  onLogout: () => void;
  onToggleMobile?: () => void;
  pendingApprovalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  onUserChange,
  employees,
  company,
  onQuickClockIn,
  onOpenQuickLetter,
  onOpenLogoEditor,
  onOpenMyProfile,
  onLogout,
  onToggleMobile,
  pendingApprovalsCount,
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Branding & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Toggle Button */}
          {onToggleMobile && (
            <button
              type="button"
              onClick={onToggleMobile}
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="h-9 sm:h-11 w-auto flex items-center justify-center shrink-0">
            <img
              src={company.logoUrl || '/leedo-logo.svg'}
              alt={company.name}
              className="h-8 sm:h-10 w-auto object-contain max-w-[110px] sm:max-w-[130px] drop-shadow-xs"
              onError={(e) => {
                // fallback to svg
                (e.target as HTMLImageElement).src = '/leedo-logo.svg';
              }}
            />
          </div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-xs sm:text-sm md:text-base leading-tight tracking-tight">
                {company.name}
              </h1>
              {currentRole === 'hr_admin' && (
                <button
                  type="button"
                  onClick={onOpenLogoEditor}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="HR Admin: Change Organization Logo"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Edit Logo</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Reg: {company.registrationNo}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center text-emerald-600 font-medium">
                <HardDrive className="w-3 h-3 mr-1 inline" /> Cloud Database
              </span>
            </p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile Rapid Punch Button */}
          <button
            onClick={onQuickClockIn}
            className="flex sm:hidden items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Mobile Attendance Punch / Check In"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Punch</span>
          </button>

          {/* Desktop Quick Action: Clock in button */}
          <button
            onClick={onQuickClockIn}
            className="hidden sm:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
            title="Rapid Web Clock In / Punch"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Clock In</span>
          </button>

          {/* Quick Action: Generate HR Letter (HR Admin ONLY) */}
          {currentRole === 'hr_admin' && (
            <button
              onClick={onOpenQuickLetter}
              className="hidden lg:flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
              title="HR Admin: Generate Certificate / Official Letter"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Official Letters</span>
            </button>
          )}

          {/* Authenticated Role Badge (Strict RBAC - No Manual Switching) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            {currentRole === 'hr_admin' ? (
              <span className="flex items-center gap-1.5 text-indigo-700">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">HR Administrator</span>
                <span className="sm:hidden">HR</span>
              </span>
            ) : currentRole === 'line_manager' ? (
              <span className="flex items-center gap-1.5 text-amber-700">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Supervisor / Line Manager</span>
                <span className="sm:hidden">Supervisor</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Staff Portal (ID: {currentUser.id})</span>
              </span>
            )}
          </div>

          {/* Pending Alerts / Notifications */}
          {currentRole !== 'employee' && (
            <div className="relative">
              <button 
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors relative cursor-pointer"
                title={`${pendingApprovalsCount} pending item(s) requiring attention`}
              >
                <Bell className="w-4 h-4" />
                {pendingApprovalsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>
            </div>
          )}

          {/* Current User Profile Card / Button */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={onOpenMyProfile}
              className="flex items-center gap-2 text-left hover:bg-slate-50 p-1 rounded-xl transition-colors cursor-pointer group"
              title="Click to view & update your profile & photo"
            >
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`}
                alt={currentUser.fullName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 transition-all"
              />
              <div className="hidden xl:block text-xs">
                <p className="font-bold text-slate-800 leading-tight truncate max-w-[110px] group-hover:text-indigo-600">
                  {currentUser.fullName}
                </p>
                <p className="text-slate-400 text-[10px] truncate max-w-[110px]">
                  ID: {currentUser.id}
                </p>
              </div>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Log Out of Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
