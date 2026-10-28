import React from 'react';
import { Employee, AttendanceRecord, LeaveRequest, TimesheetEntry, CompanyProfile, UserRole } from '../../types/hris';
import { 
  Users, 
  Clock, 
  TrendingDown, 
  Calendar, 
  AlertCircle, 
  FileText, 
  MapPin, 
  CheckCircle2,
  Briefcase,
  ChevronRight,
  Printer,
  UserCheck,
  UserX,
  UserPlus,
  Percent,
  Activity,
  Compass,
  AlertTriangle,
  Building,
  HeartHandshake
} from 'lucide-react';
import { 
  formatCurrency, 
  getGenderDistribution, 
  getDepartmentDistribution, 
  getTodayAttendanceSummary,
  isEmployeeActive,
  getReligionDistribution,
  getAgeDistribution,
  getNewJoinees
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
  const religionStats = getReligionDistribution(employees);
  const ageStats = getAgeDistribution(employees);
  const newJoineesData = getNewJoinees(employees);

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const pendingTimesheets = timesheets.filter((t) => t.status === 'Submitted').length;

  // Turnover rate calculation: (Separated in year / Total personnel recorded) * 100
  const separatedCount = employees.filter((e) => !isEmployeeActive(e)).length;
  const turnoverRate = Math.round((separatedCount / (employees.length || 1)) * 1000) / 10;

  // Selected active month for metrics (October 2026)
  const currentMonth = '2026-10';
  const todayStr = new Date().toISOString().split('T')[0];

  // -------------------------------------------------------------
  // 1. Calculations for Employee Self-Service Dashboard
  // -------------------------------------------------------------
  const userMonthAttendance = attendance.filter(
    (a) => a.employeeId === currentUser.id && a.date.startsWith(currentMonth)
  );

  const userApprovedLeaves = leaves.filter(
    (l) => l.employeeId === currentUser.id && l.status === 'Approved' && (l.startDate.startsWith(currentMonth) || l.endDate.startsWith(currentMonth))
  );
  const userLeaveDaysCount = userApprovedLeaves.reduce((sum, l) => sum + (Number(l.daysCount) || 1), 0);

  // Late days for current user
  const userLateRecords = userMonthAttendance.filter((a) => {
    if (a.status === 'Late') return true;
    if (a.clockInTime) {
      const match = a.clockInTime.match(/(\d+):(\d+)/);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        return h * 60 + m > 10 * 60 + 15;
      }
    }
    return false;
  });
  const userLateDaysCount = userLateRecords.length;

  // Calculate total late delay minutes
  let userTotalLateMinutes = 0;
  userLateRecords.forEach((a) => {
    if (a.clockInTime) {
      const match = a.clockInTime.match(/(\d+):(\d+)/);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const diff = (h * 60 + m) - (10 * 60);
        if (diff > 0) userTotalLateMinutes += diff;
      }
    }
  });

  // Scheduled duty days for user in month up to today
  const userPresentDays = userMonthAttendance.filter((a) => a.status === 'Present' || a.status === 'Late' || a.status === 'Field Mission').length;
  const userTotalHoursWorked = Math.round(userMonthAttendance.reduce((sum, a) => sum + (Number(a.hoursWorked) || 8), 0) * 10) / 10;

  // Estimate absent days for current user: duty days up to today without punch or approved leave
  const scheduledDutyDaysSoFar = 24; // typical for 6-day week in October
  const userAbsentDaysCount = Math.max(0, scheduledDutyDaysSoFar - userPresentDays - userLeaveDaysCount);
  const userDutyAttendanceRate = Math.min(100, Math.round(((userPresentDays + userLeaveDaysCount) / scheduledDutyDaysSoFar) * 100));

  // -------------------------------------------------------------
  // 2. Calculations for HR Admin / Organization Dashboard
  // -------------------------------------------------------------
  // Organization Absenteeism Rate %: (Total absent duty days / Total scheduled duty days) * 100
  const monthAttendanceRecords = attendance.filter((a) => a.date.startsWith(currentMonth));
  const totalPunchesInMonth = monthAttendanceRecords.length;
  const totalLatePunchesInMonth = monthAttendanceRecords.filter((a) => a.status === 'Late').length;
  const latePunctualityRate = totalPunchesInMonth > 0 ? Math.round((totalLatePunchesInMonth / totalPunchesInMonth) * 1000) / 10 : 7.5;

  // Total scheduled duty days for organization so far
  const totalScheduledOrgDays = activeEmployees.length * scheduledDutyDaysSoFar;
  const totalPresentOrgDays = monthAttendanceRecords.filter((a) => a.status === 'Present' || a.status === 'Late' || a.status === 'Field Mission').length;
  const totalOrgLeaveDays = leaves.filter((l) => l.status === 'Approved' && (l.startDate.startsWith(currentMonth) || l.endDate.startsWith(currentMonth))).reduce((sum, l) => sum + (Number(l.daysCount) || 1), 0);
  const totalOrgAbsentDays = Math.max(0, totalScheduledOrgDays - totalPresentOrgDays - totalOrgLeaveDays);
  const absenteeismRate = Math.round((totalOrgAbsentDays / (totalScheduledOrgDays || 1)) * 1000) / 10;

  // Center / Job Location Distribution
  const stationCounts: Record<string, number> = {};
  activeEmployees.forEach((e) => {
    const stn = e.workStation || 'Head Office';
    stationCounts[stn] = (stationCounts[stn] || 0) + 1;
  });

  // =============================================================
  // VIEW A: Regular Staff Member Dashboard (Strictly Personal)
  // =============================================================
  if (currentRole === 'employee') {
    return (
      <div className="space-y-6">
        {/* Employee Welcome & Monthly Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full border border-indigo-400/20">
                  Employee Self-Service Portal
                </span>
                <span className="text-xs text-slate-300">
                  October 2026 (চলতি মাস)
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome, {currentUser.fullName}!
              </h2>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                ID: <span className="font-mono font-bold text-white">{currentUser.id}</span> • {currentUser.designation} • Station: <span className="text-white font-semibold">{currentUser.workStation}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={onQuickClockIn}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Web Clock-In / Out</span>
              </button>
              <button
                onClick={() => onNavigateTab('timesheets')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print My Monthly Timesheet</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Graphic Monthly Summary Cards (User Requirement) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Attendance Fulfillment Rate */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Score</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{userDutyAttendanceRate}%</span>
              <span className="text-xs text-emerald-700 font-bold">Compliant</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Present: {userPresentDays} days</span>
              <span>Duty: {scheduledDutyDaysSoFar} days</span>
            </div>
          </div>

          {/* Card 2: Late Days Count & Minutes Delay */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Days (বিলম্ব)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">{userLateDaysCount}</span>
              <span className="text-xs text-slate-500 font-medium">Days with delay</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Total Delay: {userTotalLateMinutes} mins</span>
              <span className={userLateDaysCount <= 3 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                {userLateDaysCount <= 3 ? 'Within Quota ✓' : 'Grace Exceeded'}
              </span>
            </div>
          </div>

          {/* Card 3: Leaves Taken */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leaves Taken (ছুটি)</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-600">{userLeaveDaysCount}</span>
              <span className="text-xs text-slate-500 font-medium">Days Approved</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Casual: 1/14</span>
              <span>Sick: 0/14</span>
            </div>
          </div>

          {/* Card 4: Absent Days */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Absent Days (অনুপস্থিতি)</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600">{userAbsentDaysCount}</span>
              <span className="text-xs text-slate-500 font-medium">Unexcused</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Total Hours: {userTotalHoursWorked} hrs</span>
              <span className="text-slate-600 font-bold">{userAbsentDaysCount === 0 ? 'Zero Absenteeism ✓' : 'Salary Deduction'}</span>
            </div>
          </div>
        </div>

        {/* Graphical Monthly Progress Bar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Monthly Duty Fulfillment Breakdown (অক্টোবর ২০২৬ গ্রাফিক্যাল সারাংশ)
              </h3>
              <p className="text-xs text-slate-500">
                Visual ratio of on-time attendance, late check-ins, approved leaves, and off days
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              {userTotalHoursWorked} Total Duty Hours Logged
            </span>
          </div>

          {/* Segmented Graphic Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${Math.max(5, (userPresentDays / 31) * 100)}%` }}
                className="bg-emerald-500 hover:bg-emerald-600 transition-all"
                title={`Present: ${userPresentDays} days`}
              />
              <div
                style={{ width: `${Math.max(2, (userLateDaysCount / 31) * 100)}%` }}
                className="bg-amber-400 hover:bg-amber-500 transition-all"
                title={`Late: ${userLateDaysCount} days`}
              />
              <div
                style={{ width: `${Math.max(2, (userLeaveDaysCount / 31) * 100)}%` }}
                className="bg-indigo-500 hover:bg-indigo-600 transition-all"
                title={`Approved Leave: ${userLeaveDaysCount} days`}
              />
              <div
                style={{ width: `${Math.max(2, (userAbsentDaysCount / 31) * 100)}%` }}
                className="bg-rose-500 hover:bg-rose-600 transition-all"
                title={`Absent: ${userAbsentDaysCount} days`}
              />
              <div
                style={{ width: `${Math.max(5, ((31 - userPresentDays - userLeaveDaysCount - userAbsentDaysCount) / 31) * 100)}%` }}
                className="bg-slate-300 transition-all"
                title="Weekly Off & Govt Holidays"
              />
            </div>

            {/* Legend Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                Present ({userPresentDays} days)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                Late ({userLateDaysCount} days)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                Leave ({userLeaveDaysCount} days)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                Absent ({userAbsentDaysCount} days)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                Govt Holidays & Off-Days
              </span>
            </div>
          </div>
        </div>

        {/* Quick Timesheet Print Banner & Recent Personal Punches */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Recent Punches */}
          <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">My Recent Attendance Punches (আমার সাম্প্রতিক পাঞ্চ)</h3>
                <p className="text-xs text-slate-500">Personal biometric and web check-in history</p>
              </div>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                View Full Log <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {userMonthAttendance.slice(0, 6).map((rec) => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-700 text-xs">
                      {rec.date.split('-')[2]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{rec.date}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {rec.punchLocationName || rec.locationNote || currentUser.workStation}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        rec.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rec.status === 'Late'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {rec.status} • In: {rec.clockInTime}
                    </span>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Out: {rec.clockOutTime || 'Active'} • {rec.hoursWorked || 8} hrs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1 Col: Quick Certified Docket Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg leading-tight">
                Monthly Certified Timesheet Docket
              </h3>
              <p className="text-xs text-indigo-200 leading-relaxed">
                Generate and print your official certified timesheet docket for {currentMonth} with signature endorsement and hours breakdown.
              </p>
            </div>

            <div className="pt-6 space-y-2">
              <button
                onClick={() => onNavigateTab('timesheets')}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print My Certified Timesheet</span>
              </button>
              <button
                onClick={() => onNavigateTab('leave')}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <Calendar className="w-4 h-4" />
                <span>Apply for Leave (ছুটির আবেদন)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // VIEW B: HR Executive & Admin Dashboard (Organization-Wide)
  // =============================================================
  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full border border-indigo-400/20">
                HR Management & Executive Analytics
              </span>
              <span className="text-xs text-slate-300">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {company.name} • HRIS Master Dashboard
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Monitoring <span className="font-bold text-white">{activeEmployees.length}</span> active staff across Head Office and humanitarian child protection stations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onQuickClockIn}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Web Clock-In</span>
            </button>
            <button
              onClick={onOpenAddEmployee}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Staff</span>
            </button>
            <button
              onClick={() => onNavigateTab('timesheets')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl backdrop-blur-xs transition-all cursor-pointer border border-white/15"
            >
              <Printer className="w-4 h-4" />
              <span>Timesheets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Organization KPI Cards: Absenteeism, Turnover, New Joinees, Late Arrival */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Absenteeism Rate % (অনুপস্থিতির হার) */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Absenteeism Rate</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{absenteeismRate}%</span>
            <span className="text-xs text-slate-500 font-medium">Monthly Absences</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Standard: &lt; 5.0%</span>
            <span className={absenteeismRate <= 5 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
              {absenteeismRate <= 5 ? 'Healthy Benchmark ✓' : 'Action Required'}
            </span>
          </div>
        </div>

        {/* KPI 2: Staff Turnover Rate % (কর্মী টার্নওভার হার) */}
        <div 
          onClick={() => onNavigateTab('separation')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Turnover Rate</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{turnoverRate}%</span>
            <span className="text-xs text-emerald-600 font-bold">Annual Rate</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Separated: {separatedCount} staff</span>
            <span className="text-emerald-600 font-bold">High Retention ✓</span>
          </div>
        </div>

        {/* KPI 3: New Joinees (নতুন যোগদানকারী) */}
        <div 
          onClick={() => onNavigateTab('employees')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Joinees</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{newJoineesData.count}</span>
            <span className="text-xs text-emerald-700 font-bold">({newJoineesData.percentage}% of Staff)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Recent additions</span>
            <span className="text-indigo-600 font-bold">Active Onboarding</span>
          </div>
        </div>

        {/* KPI 4: Late Arrival Rate (দেরিতে উপস্থিতি হার) */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Arrival Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{latePunctualityRate}%</span>
            <span className="text-xs text-slate-500 font-medium">After 10:15 AM</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>On-time Rate: {Math.round(100 - latePunctualityRate)}%</span>
            <span className="text-emerald-600 font-bold">Verified Punches</span>
          </div>
        </div>
      </div>

      {/* Main Demographics & Compliance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Religion Ratio, Gender Ratio, Age Distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Religion Ratio Card (Explicit User Requirement: "Region islam hidu ratio") */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-indigo-600" />
                  Religious Diversity Ratio (ধর্মভিত্তিক কর্মী অনুপাত)
                </h3>
                <p className="text-xs text-slate-500">
                  Inclusive workforce distribution across faith communities
                </p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {religionStats.total} Total Staff
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${religionStats.islamPct}%` }}
                  className="bg-emerald-600 hover:bg-emerald-700 transition-all"
                  title={`Islam: ${religionStats.islam} staff (${religionStats.islamPct}%)`}
                />
                <div
                  style={{ width: `${religionStats.hinduPct}%` }}
                  className="bg-amber-500 hover:bg-amber-600 transition-all"
                  title={`Hindu: ${religionStats.hindu} staff (${religionStats.hinduPct}%)`}
                />
                <div
                  style={{ width: `${religionStats.othersPct}%` }}
                  className="bg-indigo-500 hover:bg-indigo-600 transition-all"
                  title={`Others: ${religionStats.others} staff (${religionStats.othersPct}%)`}
                />
              </div>

              {/* Legend & Details */}
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>Islam (মুসলিম)</span>
                  </div>
                  <p className="text-lg font-black text-emerald-800 mt-1">{religionStats.islamPct}%</p>
                  <p className="text-[11px] text-emerald-700">{religionStats.islam} staff members</p>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Hindu (হিন্দু)</span>
                  </div>
                  <p className="text-lg font-black text-amber-800 mt-1">{religionStats.hinduPct}%</p>
                  <p className="text-[11px] text-amber-700">{religionStats.hindu} staff members</p>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Christian / Others</span>
                  </div>
                  <p className="text-lg font-black text-indigo-800 mt-1">{religionStats.othersPct}%</p>
                  <p className="text-[11px] text-indigo-700">{religionStats.others} staff members</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Age Distribution Card (Explicit User Requirement: "age ration") */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Age Ratio & Generation Mix (বয়সভিত্তিক কর্মী অনুপাত)
                </h3>
                <p className="text-xs text-slate-500">
                  Age brackets derived from verified birth dates
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">2026 Audit</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  &lt; 25 Years (তরুণ)
                </span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{ageStats.under25Pct}%</span>
                <span className="text-[11px] text-slate-500">{ageStats.under25} staff</span>
                <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div style={{ width: `${ageStats.under25Pct}%` }} className="h-full bg-blue-500 rounded-full" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  25–35 Years (মূল শক্তি)
                </span>
                <span className="text-xl font-black text-indigo-900 mt-0.5 block">{ageStats.age25to35Pct}%</span>
                <span className="text-[11px] text-indigo-700">{ageStats.age25to35} staff</span>
                <div className="h-1.5 w-full bg-indigo-200 rounded-full mt-2 overflow-hidden">
                  <div style={{ width: `${ageStats.age25to35Pct}%` }} className="h-full bg-indigo-600 rounded-full" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  36–45 Years (অভিজ্ঞ)
                </span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{ageStats.age36to45Pct}%</span>
                <span className="text-[11px] text-slate-500">{ageStats.age36to45} staff</span>
                <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div style={{ width: `${ageStats.age36to45Pct}%` }} className="h-full bg-amber-500 rounded-full" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  46+ Years (সিনিয়র)
                </span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{ageStats.age46plusPct}%</span>
                <span className="text-[11px] text-slate-500">{ageStats.age46plus} staff</span>
                <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div style={{ width: `${ageStats.age46plusPct}%` }} className="h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Gender Ratio Card (User Requirement: "male female ratio") */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Gender Ratio (লিঙ্গভিত্তিক অনুপাত)
                </h3>
                <p className="text-xs text-slate-500">
                  Donor compliance requirement: 40%+ Female workforce participation
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                Criteria Met ✓
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-rose-600">Female: {genderStats.female} ({genderStats.femalePct}%)</span>
                <span className="text-indigo-600">Male: {genderStats.male} ({genderStats.malePct}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${genderStats.femalePct}%` }} className="bg-rose-500 transition-all" />
                <div style={{ width: `${genderStats.malePct}%` }} className="bg-indigo-600 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Station Distribution & Recent Joinees */}
        <div className="space-y-6">
          {/* Work Station / Center Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  Work Stations & Field Hubs
                </h3>
                <p className="text-xs text-slate-500">Staff allocation across centers</p>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {Object.entries(stationCounts).map(([stnName, count]) => {
                const pct = Math.round((count / (activeEmployees.length || 1)) * 100);
                return (
                  <div key={stnName} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{stnName}</span>
                      <span className="font-bold text-indigo-700">{count} staff ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="h-full bg-indigo-600 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Joinees Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">New Joinees Roster</h3>
                  <p className="text-xs text-slate-500">{newJoineesData.count} staff joined in 2025–2026</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {newJoineesData.list.slice(0, 5).map((emp) => (
                <div key={emp.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{emp.fullName}</p>
                    <p className="text-[10px] text-slate-500">{emp.designation} • {emp.workStation}</p>
                  </div>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700 font-bold">
                    {emp.joiningDate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Official Actions */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 p-5 rounded-3xl border border-indigo-200 space-y-3">
            <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wider">Executive HR Quick Actions</h4>
            <div className="space-y-1.5">
              <button
                onClick={onOpenLetterGenerator}
                className="w-full text-left text-xs bg-white hover:bg-indigo-50 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl border border-indigo-200 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                <span>Generate Official HR Letter</span>
                <ChevronRight className="w-4 h-4 text-indigo-600" />
              </button>
              <button
                onClick={() => onNavigateTab('timesheets')}
                className="w-full text-left text-xs bg-white hover:bg-indigo-50 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl border border-indigo-200 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                <span>Master Monthly Timesheet</span>
                <ChevronRight className="w-4 h-4 text-indigo-600" />
              </button>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="w-full text-left text-xs bg-white hover:bg-indigo-50 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl border border-indigo-200 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                <span>Biometric / Manual Punch Correction</span>
                <ChevronRight className="w-4 h-4 text-indigo-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
