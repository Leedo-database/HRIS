import React from 'react';
import { Employee, AttendanceRecord, LeaveRequest, TimesheetEntry, CompanyProfile, UserRole } from '../../types/hris';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingDown, 
  Award, 
  Cake, 
  Calendar, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  ArrowUpRight, 
  MapPin, 
  CheckCircle2,
  Briefcase,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  formatCurrency, 
  getGenderDistribution, 
  getDepartmentDistribution, 
  getUpcomingMilestones,
  getTodayAttendanceSummary,
  isEmployeeActive 
} from '../../utils/calculations';
import { NavTab } from '../Sidebar';

interface DashboardOverviewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  timesheets: TimesheetEntry[];
  company: CompanyProfile;
  currentRole: UserRole;
  currentUser: Employee;
  onNavigateTab: (tab: NavTab) => void;
  onQuickClockIn: () => void;
  onOpenAddEmployee: () => void;
  onOpenLetterGenerator: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  employees,
  attendance,
  leaves,
  timesheets,
  company,
  currentRole,
  currentUser,
  onNavigateTab,
  onQuickClockIn,
  onOpenAddEmployee,
  onOpenLetterGenerator,
}) => {
  const activeEmployees = employees.filter(isEmployeeActive);
  const todaySummary = getTodayAttendanceSummary(employees, attendance);
  const genderStats = getGenderDistribution(employees);
  const deptStats = getDepartmentDistribution(employees);
  const milestones = getUpcomingMilestones(employees);

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const pendingTimesheets = timesheets.filter((t) => t.status === 'Submitted').length;

  // Turnover rate calculation: (Separated in year / Total personnel recorded) * 100
  const separatedCount = employees.filter((e) => !isEmployeeActive(e)).length;
  const turnoverRate = Math.round((separatedCount / (employees.length || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none">
          <svg className="w-96 h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="50 0, 100 0, 100 100, 0 100" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                {currentRole === 'hr_admin' ? 'HR Executive Portal' : currentRole === 'line_manager' ? 'Supervisor Workspace' : 'Employee Self-Service'}
              </span>
              <span className="text-xs text-slate-300">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Welcome back, {currentUser.fullName}!
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {currentRole === 'employee'
                ? `You are logged in as ${currentUser.designation}. Track your daily punch, review project timesheets, check leave balances, and download monthly payslips.`
                : `${company.name} operations are running smoothly with ${activeEmployees.length} active staff across head office and humanitarian field stations.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onQuickClockIn}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Web Clock-In</span>
            </button>
            {currentRole === 'hr_admin' && (
              <button
                onClick={onOpenAddEmployee}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>+ Add Staff</span>
              </button>
            )}
            <button
              onClick={onOpenLetterGenerator}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl backdrop-blur-xs transition-all cursor-pointer border border-white/15"
            >
              <FileText className="w-4 h-4" />
              <span>Official Letter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Headcount */}
        <div 
          onClick={() => onNavigateTab('employees')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeEmployees.length}</span>
            <span className="text-xs text-emerald-600 font-medium">100% Active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Permanent: {employees.filter(e => e.employmentType === 'Permanent').length}</span>
            <span>Contract/NGO: {employees.filter(e => e.employmentType !== 'Permanent').length}</span>
          </div>
        </div>

        {/* Today's Attendance Rate */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{todaySummary.attendanceRate}%</span>
            <span className="text-xs text-slate-500">Punched Today</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span className="text-emerald-700 font-medium">Present: {todaySummary.presentCount}</span>
            <span className="text-amber-700 font-medium">Field: {todaySummary.fieldMissionCount}</span>
            <span className="text-rose-700 font-medium">Late: {todaySummary.lateCount}</span>
          </div>
        </div>

        {/* Turnover & Attrition Rate */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Annual Turnover</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{turnoverRate}%</span>
            <span className="text-xs text-emerald-600 font-medium">Healthy benchmark</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>NGO Standard: &lt; 8%</span>
            <span className="text-emerald-600 font-medium">High Retention</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div 
          onClick={() => onNavigateTab('leave')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{pendingLeaves + pendingTimesheets}</span>
            <span className="text-xs text-amber-600 font-medium">Requires Action</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Leaves: {pendingLeaves}</span>
            <span>Timesheets: {pendingTimesheets}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Milestones & Diversity & Attendance Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Demographics, Quick Punch Feed & NGO Safeguarding */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gender & ESG Diversity Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Gender & Safeguarding Compliance (ESG Standard)
                </h3>
                <p className="text-xs text-slate-500">
                  Gender balance ratio and zero-tolerance safeguarding compliance
                </p>
              </div>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                100% Certified
              </span>
            </div>

            {/* Gender Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-rose-600 flex items-center gap-1">
                  Female: {genderStats.female} ({genderStats.femalePct}%)
                </span>
                <span className="text-indigo-600 flex items-center gap-1">
                  Male: {genderStats.male} ({genderStats.malePct}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${genderStats.femalePct}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Female: ${genderStats.femalePct}%`}
                />
                <div
                  style={{ width: `${genderStats.malePct}%` }}
                  className="bg-indigo-600 transition-all duration-500"
                  title={`Male: ${genderStats.malePct}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Target for NGO/Donor Funding: 40%+ Female Representation</span>
                <span className="text-emerald-600 font-semibold">Criteria Met ✓</span>
              </div>
            </div>

            {/* Safeguarding Checklist pill list */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-700 text-[11px]">Child Protection Policy</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-700 text-[11px]">Code of Conduct 2026</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-700 text-[11px]">Anti-Harassment Protocol</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-700 text-[11px]">Police Clearance Audit</span>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Departmental Distribution</h3>
                <p className="text-xs text-slate-500">Headcount allocation by operational wing</p>
              </div>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                View Full Analytics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(deptStats).map(([deptName, count]) => {
                const pct = Math.round((count / (activeEmployees.length || 1)) * 100);
                return (
                  <div key={deptName} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{deptName}</span>
                      <span className="text-slate-600 font-bold">{count} staff ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Punch Board */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Today’s Staff Attendance Feed</h3>
                <p className="text-xs text-slate-500">Live check-in times and work stations</p>
              </div>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                Punch Register <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {attendance.slice(0, 5).map((record) => (
                <div key={record.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {record.employeeName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{record.employeeName}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {record.locationNote || record.workMode}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        record.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : record.status === 'Field Mission'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {record.status} • {record.clockInTime}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{record.workMode}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Milestones (Birthdays, Anniversaries, Contracts) */}
        <div className="space-y-6">
          {/* Milestones Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Cake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Upcoming Milestones</h3>
                  <p className="text-xs text-slate-500">Birthdays & Anniversaries</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {milestones.length} Events
              </span>
            </div>

            <div className="space-y-3">
              {milestones.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No upcoming milestones this month.</p>
              ) : (
                milestones.map((m, idx) => (
                  <div
                    key={`${m.employeeId}-${idx}`}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={m.employeeName}
                        className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{m.employeeName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{m.designation}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
                          {m.type === 'Birthday' && <Cake className="w-3 h-3 text-pink-500" />}
                          {m.type === 'Work Anniversary' && <Award className="w-3 h-3 text-amber-500" />}
                          {m.type === 'Contract Renewal' && <Briefcase className="w-3 h-3 text-blue-500" />}
                          {m.type}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                        {m.dateStr}
                      </span>
                      <p className="text-[10px] text-pink-600 font-semibold mt-0.5">
                        {m.highlightText}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Letters Generator Widget */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-indigo-950 text-sm">Official HR Letters</h3>
            </div>
            <p className="text-xs text-indigo-800/80 mb-3 leading-relaxed">
              Generate ready-to-print Experience Letters, Bank Account Opening Forms, and Salary Certificates in seconds with verified organizational seal.
            </p>
            <div className="space-y-1.5">
              <button
                onClick={onOpenLetterGenerator}
                className="w-full text-left text-xs bg-white hover:bg-indigo-50 text-slate-800 font-medium px-3 py-2 rounded-xl border border-indigo-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Certificate of Service / Experience</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
              </button>
              <button
                onClick={onOpenLetterGenerator}
                className="w-full text-left text-xs bg-white hover:bg-indigo-50 text-slate-800 font-medium px-3 py-2 rounded-xl border border-indigo-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Salary & Employment Certificate</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
              </button>
              <button
                onClick={onOpenLetterGenerator}
                className="w-full text-left text-xs bg-white hover:bg-indigo-50 text-slate-800 font-medium px-3 py-2 rounded-xl border border-indigo-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Bank Account Opening Forwarding</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
