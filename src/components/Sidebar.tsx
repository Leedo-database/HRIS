import React from 'react';
import { UserRole } from '../types/hris';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  Award,
  Receipt,
  FileCheck2,
  BarChart3,
  Settings,
  CalendarCheck2,
  Compass,
  UserMinus,
  User,
  LogOut,
  X
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'profile'
  | 'employees'
  | 'attendance'
  | 'timesheets'
  | 'leave'
  | 'visits'
  | 'payroll'
  | 'performance'
  | 'expenses'
  | 'separation'
  | 'letters'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentRole: UserRole;
  pendingLeavesCount: number;
  pendingVisitsCount: number;
  pendingTimesheetsCount: number;
  pendingExpensesCount: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentRole,
  pendingLeavesCount,
  pendingVisitsCount,
  pendingTimesheetsCount,
  pendingExpensesCount,
  isMobileOpen,
  onCloseMobile,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: currentRole === 'employee' ? 'My Overview' : 'Executive Dashboard',
      icon: LayoutDashboard,
      roles: ['hr_admin', 'line_manager', 'employee'],
    },
    {
      id: 'profile' as NavTab,
      label: 'My Profile & Photo',
      icon: User,
      roles: ['hr_admin', 'line_manager', 'employee'],
    },
    {
      id: 'employees' as NavTab,
      label: currentRole === 'line_manager' ? 'My Subordinate Staff' : 'Master Employee Database',
      icon: Users,
      roles: ['hr_admin', 'line_manager'], // HR sees all, Supervisor sees only their assigned subordinates
    },
    {
      id: 'attendance' as NavTab,
      label: currentRole === 'employee' ? 'My Attendance & Punch' : 'Attendance & Punch Board',
      icon: Clock,
      roles: ['hr_admin', 'line_manager', 'employee'],
    },
    {
      id: 'leave' as NavTab,
      label: currentRole === 'employee' ? 'My Leave Applications' : 'Leave Management & Approvals',
      icon: CalendarDays,
      badge: currentRole !== 'employee' && pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
      roles: ['hr_admin', 'line_manager', 'employee'],
    },
    {
      id: 'visits' as NavTab,
      label: currentRole === 'employee' ? 'Field Visit Requisition' : 'Field Visit Authorization',
      icon: Compass,
      badge: currentRole !== 'employee' && pendingVisitsCount > 0 ? pendingVisitsCount : undefined,
      roles: ['hr_admin', 'line_manager', 'employee'],
    },
    {
      id: 'timesheets' as NavTab,
      label: currentRole === 'employee' ? 'My Project Timesheet' : 'Project Timesheets (NGO)',
      icon: CalendarCheck2,
      badge: currentRole !== 'employee' && pendingTimesheetsCount > 0 ? pendingTimesheetsCount : undefined,
      roles: ['hr_admin', 'line_manager', 'employee'],
    },
    {
      id: 'payroll' as NavTab,
      label: 'Payroll & Salary Sheets',
      icon: CreditCard,
      roles: ['hr_admin'], // STRICT: Only HR Admin (Forhad & Kanta). Regular employees and supervisors have no access.
    },
    {
      id: 'expenses' as NavTab,
      label: currentRole === 'employee' ? 'My Travel Claims' : 'Field Travel & Claims',
      icon: Receipt,
      badge: currentRole !== 'employee' && pendingExpensesCount > 0 ? pendingExpensesCount : undefined,
      roles: ['hr_admin', 'line_manager', 'employee'],
    },
    {
      id: 'performance' as NavTab,
      label: currentRole === 'employee' ? 'My Appraisal Feedback' : 'Performance Evaluation (PMS)',
      icon: Award,
      roles: ['hr_admin', 'line_manager', 'employee'],
    },
    {
      id: 'separation' as NavTab,
      label: 'Separation & Settlement',
      icon: UserMinus,
      roles: ['hr_admin'], // STRICT: Only HR Admin
    },
    {
      id: 'letters' as NavTab,
      label: 'Official HR Letters & Legal Forms',
      icon: FileCheck2,
      roles: ['hr_admin'], // STRICT: Only HR Admin can access letter generation
    },
    {
      id: 'reports' as NavTab,
      label: 'Analytics & NGO Compliance',
      icon: BarChart3,
      roles: ['hr_admin', 'line_manager'], // Regular employee cannot view executive turnover/headcount analytics
    },
    {
      id: 'settings' as NavTab,
      label: 'Company & Logo Settings',
      icon: Settings,
      roles: ['hr_admin'], // Only HR Admin can modify company settings or logo
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">Navigation Menu</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {currentRole === 'employee' ? 'Self-Service Modules' : currentRole === 'line_manager' ? 'Supervisor Portal' : 'HR Management System'}
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (isMobileOpen) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                      isActive
                        ? 'bg-white text-indigo-700'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Area with Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => {
              if (isMobileOpen) onCloseMobile();
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Portal</span>
          </button>
        </div>
      </aside>
    </>
  );
};
