import React, { useState } from 'react';
import { 
  Employee, 
  TimesheetEntry, 
  TimesheetCorrectionRequest, 
  UserRole,
  CompanyProfile,
  LEEDO_JOB_LOCATIONS,
  GovernmentHoliday,
  AttendanceRecord,
  LeaveRequest
} from '../../types/hris';
import { OFFICIAL_BANGLADESH_HOLIDAYS_2026 } from '../../data/bangladeshHolidays';
import { getHolidayOnDate, isEmployeeActive } from '../../utils/calculations';
import { 
  CalendarCheck2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Download, 
  Send, 
  Printer,
  Edit,
  FolderKanban,
  FileCheck,
  AlertCircle,
  FileText,
  User,
  X,
  Sparkles,
  Building,
  Filter,
  Users,
  AlertTriangle,
  SlidersHorizontal,
  Search,
  FileSpreadsheet,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';

interface TimesheetModuleProps {
  timesheets: TimesheetEntry[];
  employees: Employee[];
  currentUser: Employee;
  currentRole: UserRole;
  company?: CompanyProfile;
  jobLocations?: string[];
  holidays?: GovernmentHoliday[];
  attendance?: AttendanceRecord[];
  leaves?: LeaveRequest[];
  onAddTimesheet: (entry: TimesheetEntry) => void;
  onUpdateTimesheet: (entry: TimesheetEntry) => void;
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday (সোম)',
  tue: 'Tuesday (মঙ্গল)',
  wed: 'Wednesday (বুধ)',
  thu: 'Thursday (বৃহঃ)',
  fri: 'Friday (শুক্র)',
  sat: 'Saturday (শনি)',
  sun: 'Sunday (রবি)',
};

const DAY_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TimesheetModule: React.FC<TimesheetModuleProps> = ({
  timesheets,
  employees,
  currentUser,
  currentRole,
  company,
  jobLocations = [...LEEDO_JOB_LOCATIONS],
  holidays = OFFICIAL_BANGLADESH_HOLIDAYS_2026,
  attendance = [],
  leaves = [],
  onAddTimesheet,
  onUpdateTimesheet,
}) => {
  // Month selector: Defaults to current month '2026-10' (October 2026)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Sub-Tab Navigation: 1) Monthly Timesheets & Duty Log, 2) Late & Absenteeism Exception Timesheet
  const [activeTimesheetSubTab, setActiveTimesheetSubTab] = useState<'duty_timesheet' | 'exceptions_timesheet'>('duty_timesheet');

  // Display Options for Late & Absent Data (User requirement)
  const [showLateData, setShowLateData] = useState<boolean>(true);
  const [showAbsentData, setShowAbsentData] = useState<boolean>(true);
  const [autoMarkMissingBiometricAsAbsent, setAutoMarkMissingBiometricAsAbsent] = useState<boolean>(true);
  const [timesheetDayFilter, setTimesheetDayFilter] = useState<'all' | 'late_only' | 'absent_only' | 'exceptions_only'>('all');

  // Exception Timesheet Filters
  const [exceptionFilterType, setExceptionFilterType] = useState<'all' | 'late' | 'absent'>('all');
  const [exceptionFilterStation, setExceptionFilterStation] = useState<string>('All');
  const [exceptionSearch, setExceptionSearch] = useState<string>('');

  // Dynamic active HR & Executive signatories (ensures separated staff never appear on official timesheets)
  const activeHrSignatory = employees.find(
    (e) => isEmployeeActive(e) && (e.designation.toLowerCase().includes('hr') || e.id === '1057')
  );
  const hrSignatoryName = company?.hrSignatoryName || activeHrSignatory?.fullName || 'Md. Omar Faruque';
  const hrSignatoryTitle = company?.hrSignatoryDesignation || activeHrSignatory?.designation || 'Manager HR & Admin';
  const edSignatoryName = company?.signatoryName || 'Forhad Hossain';
  const edSignatoryTitle = company?.signatoryDesignation || 'Founder & Executive Director';

  // 15th of the month auto-generation trigger:
  // When current day >= 15, the system automatically activates next month (November 2026)
  const today = new Date();
  const currentDayOfMonth = today.getDate();
  const isPast15th = currentDayOfMonth >= 15;

  const [isCreating, setIsCreating] = useState(false);
  const [projectCode, setProjectCode] = useState('LEEDO-CP-2026');
  const [projectName, setProjectName] = useState('Street Children Shelter & Rescue Mission');
  const [activityDescription, setActivityDescription] = useState('');
  const [hours, setHours] = useState({
    mon: 8,
    tue: 8,
    wed: 8,
    thu: 8,
    fri: 8,
    sat: 0,
    sun: 0,
  });

  // Modal 1: Individual Employee Monthly Timesheet Print Modal (Monthly, Not Weekly)
  const [selectedMonthlyPrintEmp, setSelectedMonthlyPrintEmp] = useState<Employee | null>(null);
  const [quickPrintEmployeeId, setQuickPrintEmployeeId] = useState<string>(currentUser.id);

  // Modal 2: HR Master All-Staff Monthly Timesheet Summary Print Modal
  const [isMasterSummaryPrintModalOpen, setIsMasterSummaryPrintModalOpen] = useState(false);
  const [masterFilterStation, setMasterFilterStation] = useState<string>('All');

  // Modal 3: Late & Absenteeism Exception Timesheet Print Modal
  const [isExceptionPrintModalOpen, setIsExceptionPrintModalOpen] = useState(false);

  // Edit Request to HR State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [activeCorrectionTimesheet, setActiveCorrectionTimesheet] = useState<TimesheetEntry | null>(null);
  const [correctionDay, setCorrectionDay] = useState<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'>('mon');
  const [correctionRequestedHours, setCorrectionRequestedHours] = useState<number>(8);
  const [correctionReason, setCorrectionReason] = useState<string>('');

  const totalHours = Object.values(hours).reduce((acc, h) => acc + (Number(h) || 0), 0);

  const handleCreateTimesheet = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: TimesheetEntry = {
      id: `TS-${Date.now().toString().slice(-6)}`,
      employeeId: currentUser.id,
      employeeName: currentUser.fullName,
      weekStarting: '2026-10-12',
      projectCode,
      projectName,
      activityDescription: activityDescription || 'General field protection, shelter rounds, and program support',
      hours,
      totalHours,
      status: 'Submitted',
      supervisorComment: 'Submitted for supervisor verification',
      correctionRequests: [],
    };

    onAddTimesheet(newEntry);
    setIsCreating(false);
    setActivityDescription('');
  };

  const handleApprove = (entry: TimesheetEntry) => {
    onUpdateTimesheet({
      ...entry,
      status: 'Approved',
      supervisorComment: `Approved by ${currentUser.fullName} on ${new Date().toISOString().split('T')[0]}`,
    });
  };

  const handleReject = (entry: TimesheetEntry) => {
    onUpdateTimesheet({
      ...entry,
      status: 'Rejected',
      supervisorComment: 'Please adjust field activity hours per project budget line.',
    });
  };

  // Submit correction request to HR
  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCorrectionTimesheet) return;

    const currentDayHours = activeCorrectionTimesheet.hours[correctionDay] || 0;
    const newRequest: TimesheetCorrectionRequest = {
      id: `CORR-${Date.now().toString().slice(-4)}`,
      timesheetId: activeCorrectionTimesheet.id,
      employeeId: currentUser.id,
      employeeName: currentUser.fullName,
      dayKey: correctionDay,
      currentHours: currentDayHours,
      requestedHours: correctionRequestedHours,
      reason: correctionReason || 'Adjustment of field duty hours due to emergency response',
      status: 'Pending HR Approval',
      requestDate: new Date().toISOString().split('T')[0],
    };

    const updatedTimesheet: TimesheetEntry = {
      ...activeCorrectionTimesheet,
      correctionRequests: [...(activeCorrectionTimesheet.correctionRequests || []), newRequest],
    };

    onUpdateTimesheet(updatedTimesheet);
    setIsCorrectionModalOpen(false);
    setActiveCorrectionTimesheet(null);
    setCorrectionReason('');
    alert('Timesheet edit request has been sent to HR for approval.');
  };

  // HR handles approving staff correction
  const handleApproveCorrection = (entry: TimesheetEntry, req: TimesheetCorrectionRequest) => {
    const newHours = {
      ...entry.hours,
      [req.dayKey]: req.requestedHours,
    };
    const newTotal = Object.values(newHours).reduce((acc, h) => acc + (Number(h) || 0), 0);

    const updatedRequests = (entry.correctionRequests || []).map((r) =>
      r.id === req.id
        ? {
            ...r,
            status: 'Approved' as const,
            approvedBy: currentUser.fullName,
            hrRemarks: `Approved by ${currentUser.fullName} on ${new Date().toISOString().split('T')[0]}`,
          }
        : r
    );

    onUpdateTimesheet({
      ...entry,
      hours: newHours,
      totalHours: newTotal,
      status: 'Approved',
      supervisorComment: `Timesheet updated per approved revision request (${DAY_LABELS[req.dayKey]}: ${req.requestedHours}h)`,
      correctionRequests: updatedRequests,
    });
  };

  const handleRejectCorrection = (entry: TimesheetEntry, req: TimesheetCorrectionRequest) => {
    const updatedRequests = (entry.correctionRequests || []).map((r) =>
      r.id === req.id
        ? {
            ...r,
            status: 'Rejected' as const,
            approvedBy: currentUser.fullName,
            hrRemarks: `Rejected: hours exceed allocated project donor budget.`,
          }
        : r
    );

    onUpdateTimesheet({
      ...entry,
      correctionRequests: updatedRequests,
    });
  };

  // Helper to compute monthly calendar for an employee factoring in real attendance, late punch, absences, and gazetted holidays
  const getEmployeeMonthlyDays = (emp: Employee, monthKey: string) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const empDutyDays = emp.dutyDays && emp.dutyDays.length > 0 
      ? emp.dutyDays 
      : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
    const dailyHours = emp.dailyDutyHours || 8;

    const empAttRecords = (attendance || []).filter(
      (a) => a.employeeId === emp.id && a.date.startsWith(monthKey)
    );
    const empLeaves = (leaves || []).filter(
      (l) => l.employeeId === emp.id && l.status === 'Approved'
    );

    const days = [];
    let scheduledDutyDays = 0;
    let presentDays = 0;
    let govtHolidayDays = 0;
    let leaveDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let totalWorkedHours = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeekShort = DAY_OF_WEEK_SHORT[dateObj.getDay()];
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const isScheduledDuty = empDutyDays.includes(dayOfWeekShort);
      const hol = getHolidayOnDate(dateStr, holidays);

      let status = 'Weekly Off-Day';
      let hoursLogged = 0;
      let notes = 'Weekend / Rostered Rest Day';
      let isHoliday = false;
      let isLate = false;
      let lateMinutes = 0;
      let isAbsent = false;
      let clockInTime: string | undefined;
      let clockOutTime: string | undefined;

      // 1. Official Bangladesh Government Holiday (Paid Day Off)
      if (hol) {
        isHoliday = true;
        govtHolidayDays++;
        status = `Govt Holiday (সরকারি ছুটি)`;
        hoursLogged = dailyHours; // Fully credited paid standard duty hours
        totalWorkedHours += dailyHours;
        notes = `Official Gazette Public Holiday: ${hol.titleBangla || hol.title} (Paid Day Off)`;
      } else {
        // 2. Check Approved Leave
        const leaveMatch = empLeaves.find(
          (l) => dateStr >= l.startDate && dateStr <= l.endDate
        );

        if (leaveMatch) {
          status = `Approved Leave (${leaveMatch.leaveType})`;
          hoursLogged = 0;
          leaveDays++;
          notes = `Approved Leave: ${leaveMatch.reason || leaveMatch.leaveType}`;
        } else if (isScheduledDuty) {
          scheduledDutyDays++;

          // 3. Check Attendance Record (from Biometric machine or Clock-In)
          const attMatch = empAttRecords.find((a) => a.date === dateStr);

          if (attMatch) {
            clockInTime = attMatch.clockInTime;
            clockOutTime = attMatch.clockOutTime;
            hoursLogged = attMatch.hoursWorked || dailyHours;

            if (attMatch.status === 'Late') {
              isLate = true;
              lateDays++;
              presentDays++;
              totalWorkedHours += hoursLogged;
              // Extract late minutes or calculate
              const [inH, inM] = (attMatch.clockInTime || '10:35').split(':').map(Number);
              lateMinutes = Math.max(1, ((inH || 10) * 60 + (inM || 0)) - (10 * 60));
              status = 'Late Arrival (বিলম্ব)';
              notes = `Late In: ${clockInTime} (+${lateMinutes}m late) • Shift: ${emp.shiftStartTime || '10:00'}-${emp.shiftEndTime || '18:00'}`;
            } else if (attMatch.status === 'Absent') {
              isAbsent = true;
              status = 'Absent (অনুপস্থিত)';
              hoursLogged = 0;
              absentDays++;
              notes = 'Unapproved absence / No punch recorded';
            } else {
              // Present on time
              status = 'Present / Duty Performed';
              totalWorkedHours += hoursLogged;
              presentDays++;
              notes = `${emp.assignedProject || 'Street Children Shelter & Community Hub'} (${clockInTime || emp.shiftStartTime || '10:00'} - ${clockOutTime || emp.shiftEndTime || '18:00'})`;
            }
          } else {
            // Scheduled duty day without attendance record
            // Strictly enforce HR rule requested by user:
            // "bio matrik r data na thakle and kono leave application e na thakle absent dorben"
            if (autoMarkMissingBiometricAsAbsent && dateStr <= todayStr) {
              isAbsent = true;
              status = 'Absent (অনুপস্থিত / নো বায়োমেট্রিক পাঞ্চ)';
              hoursLogged = 0;
              absentDays++;
              notes = 'বায়োমেট্রিক মেশিনে কোনো পাঞ্চ রেকর্ড নেই এবং অনুমোদিত ছুটির আবেদনও নেই (Unapproved Absence)';
            } else if (dateStr > todayStr) {
              // Future upcoming duty day in this month
              status = 'Upcoming Duty (অনাগত কার্যদিবস)';
              hoursLogged = 0;
              notes = `Scheduled Duty: ${emp.assignedProject || 'LEEDO Shelter & Field'} (${emp.shiftStartTime || '10:00'} - ${emp.shiftEndTime || '18:00'})`;
            } else {
              // Standard duty performed fallback when auto-absent is manually toggled off
              status = 'Present / Duty Performed';
              hoursLogged = dailyHours;
              presentDays++;
              totalWorkedHours += dailyHours;
              notes = `${emp.assignedProject || 'Street Children Shelter & Community Hub'} (${emp.shiftStartTime || '10:00'} - ${emp.shiftEndTime || '18:00'})`;
            }
          }
        }
      }

      days.push({
        dayNumber: day,
        dateStr,
        dayOfWeek: dayOfWeekShort,
        isScheduledDuty,
        isHoliday,
        holidayTitle: hol ? (hol.titleBangla || hol.title) : undefined,
        isLate,
        lateMinutes: isLate ? lateMinutes : undefined,
        isAbsent,
        clockInTime,
        clockOutTime,
        status,
        hoursLogged,
        notes,
      });
    }

    return {
      days,
      daysInMonth,
      scheduledDutyDays,
      presentDays,
      govtHolidayDays,
      leaveDays,
      absentDays,
      lateDays,
      offDays: Math.max(0, daysInMonth - scheduledDutyDays - govtHolidayDays),
      totalWorkedHours,
    };
  };

  // Helper to compute summary row for an employee for Master HR Summary
  const getStaffMonthlySummary = (emp: Employee) => {
    const stats = getEmployeeMonthlyDays(emp, selectedMonth);
    return {
      emp,
      ...stats,
    };
  };

  // Subordinate employees who report to this supervisor
  const subordinateIds = new Set(
    employees
      .filter((e) => 
        e.id !== currentUser.id && (
          e.reportingManagerId === currentUser.id || 
          (e.reportingManagerName && (e.reportingManagerName === currentUser.fullName || e.reportingManagerName.includes(currentUser.fullName)))
        )
      )
      .map((e) => e.id)
  );

  // Accessible staff based on role (Employee sees only self; Supervisor sees team; HR sees all)
  const accessibleEmployees = currentRole === 'employee'
    ? [currentUser]
    : currentRole === 'line_manager'
    ? employees.filter((e) => e.id === currentUser.id || subordinateIds.has(e.id))
    : employees;

  // All Late and Absent incidents for accessible staff for the selected month
  const allExceptionsInMonth = accessibleEmployees.flatMap((emp) => {
    const stats = getEmployeeMonthlyDays(emp, selectedMonth);
    const exceptionDays = stats.days.filter((d) => d.isLate || d.isAbsent);
    return exceptionDays.map((d, index) => ({
      id: `${emp.id}_${d.dateStr}_${d.isLate ? 'late' : 'absent'}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      avatar: emp.avatar,
      designation: emp.designation,
      department: emp.department,
      workStation: emp.workStation,
      dateStr: d.dateStr,
      dayOfWeek: d.dayOfWeek,
      dayNumber: d.dayNumber,
      type: (d.isLate ? 'Late' : 'Absent') as 'Late' | 'Absent',
      scheduledShift: `${emp.shiftStartTime || '10:00'} - ${emp.shiftEndTime || '18:00'}`,
      clockInTime: d.clockInTime,
      clockOutTime: d.clockOutTime,
      lateMinutes: d.lateMinutes || (d.isLate ? 25 : 0),
      hoursLogged: d.hoursLogged,
      notes: d.notes,
      monthIncidentIndex: index + 1,
    }));
  });

  const totalLateIncidents = allExceptionsInMonth.filter((e) => e.type === 'Late').length;
  const totalAbsentIncidents = allExceptionsInMonth.filter((e) => e.type === 'Absent').length;
  const uniqueStaffWithExceptions = new Set(allExceptionsInMonth.map((e) => e.employeeId)).size;
  const totalLateMinutes = allExceptionsInMonth.reduce((sum, e) => sum + (e.lateMinutes || 0), 0);

  // Export Late & Absenteeism Exception Timesheet CSV
  const exportExceptionTimesheetCSV = () => {
    const headers = [
      'Staff ID',
      'Employee Name',
      'Designation',
      'Work Station',
      'Incident Date',
      'Day of Week',
      'Exception Type (ব্যতিক্রম)',
      'Scheduled Shift',
      'Actual Clock In',
      'Actual Clock Out',
      'Delay (Minutes)',
      'Hours Worked',
      'Notes & Audit Remarks'
    ];
    const filtered = allExceptionsInMonth.filter((item) => {
      if (exceptionFilterType !== 'all' && item.type.toLowerCase() !== exceptionFilterType) return false;
      if (exceptionFilterStation !== 'All' && item.workStation !== exceptionFilterStation) return false;
      if (exceptionSearch.trim()) {
        const q = exceptionSearch.toLowerCase();
        return (
          item.employeeName.toLowerCase().includes(q) ||
          item.employeeId.includes(q) ||
          item.workStation.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const rows = filtered.map((e) => [
      `"${e.employeeId}"`,
      `"${e.employeeName}"`,
      `"${e.designation}"`,
      `"${e.workStation}"`,
      `"${e.dateStr}"`,
      `"${e.dayOfWeek}"`,
      `"${e.type === 'Late' ? 'Late Arrival (বিলম্ব)' : 'Absent (অনুপস্থিত)'}"`,
      `"${e.scheduledShift}"`,
      `"${e.clockInTime || '--'}"`,
      `"${e.clockOutTime || '--'}"`,
      e.lateMinutes || 0,
      e.hoursLogged,
      `"${e.notes}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LEEDO_Late_and_Absenteeism_Exception_Timesheet_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTimesheetCSV = () => {
    const headers = [
      'Staff ID',
      'Employee Name',
      'Designation',
      'Work Station',
      'Month',
      'Scheduled Duty Days (কাজ করার কথা)',
      'Present Days (কতো দিন করেছে)',
      'Govt Holidays (সরকারি সাধারণ ছুটি)',
      'Late Days (দেরিতে উপস্থিতি)',
      'Worked Hours (কতো ঘণ্টা করেছে)',
      'Leave Days (ছুটি নিয়েছে কিনা)',
      'Absent Days (অনুপস্থিত ছিল কিনা)',
      'Off-Days (সাপ্তাহিক ছুটি)',
      'Status'
    ];
    
    // Subordinate employees who report to this supervisor
    const subordinateIds = new Set(
      employees
        .filter((e) => 
          e.id !== currentUser.id && (
            e.reportingManagerId === currentUser.id || 
            (e.reportingManagerName && (e.reportingManagerName === currentUser.fullName || e.reportingManagerName.includes(currentUser.fullName)))
          )
        )
        .map((e) => e.id)
    );

    const baseStaff = currentRole === 'line_manager'
      ? employees.filter(e => subordinateIds.has(e.id) || e.id === currentUser.id)
      : employees;

    const targetEmployees = masterFilterStation === 'All' 
      ? baseStaff 
      : baseStaff.filter(e => e.workStation === masterFilterStation || e.jobLocations?.includes(masterFilterStation as any));

    const rows = targetEmployees.map((e) => {
      const stats = getStaffMonthlySummary(e);
      return [
        `"${e.id}"`,
        `"${e.fullName}"`,
        `"${e.designation}"`,
        `"${e.workStation}"`,
        `"${selectedMonth}"`,
        stats.scheduledDutyDays,
        stats.presentDays,
        stats.govtHolidayDays,
        stats.lateDays,
        stats.totalWorkedHours,
        stats.leaveDays,
        stats.absentDays,
        stats.offDays,
        `"100% Verified"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LEEDO_Staff_Monthly_Timesheet_Master_Summary_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const visibleTimesheets = currentRole === 'employee'
    ? timesheets.filter((t) => t.employeeId === currentUser.id)
    : currentRole === 'line_manager'
    ? timesheets.filter((t) => t.employeeId === currentUser.id || subordinateIds.has(t.employeeId))
    : timesheets;

  // Pending HR corrections count
  const allPendingCorrections = timesheets.flatMap((t) =>
    (t.correctionRequests || [])
      .filter((r) => r.status === 'Pending HR Approval')
      .map((r) => ({ entry: t, request: r }))
  );

  const monthLabel = selectedMonth === '2026-10' 
    ? 'October 2026 (চলতি মাস)' 
    : selectedMonth === '2026-11' 
    ? 'November 2026 (আগামী মাস - স্বয়ংক্রিয় তৈরি)' 
    : selectedMonth;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-indigo-600" />
            <span>Staff Monthly Timesheets & Donor Compliance (মাসিক টাইমশীট)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log activity hours, generate authentic monthly timesheets (not weekly), print master staff summary & handle corrections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white font-bold text-indigo-900 shadow-2xs"
          >
            <option value="2026-10">October 2026 (Current Month)</option>
            <option value="2026-11">November 2026 (Auto-Prepared for Salary)</option>
            <option value="2026-09">September 2026 (Archived)</option>
          </select>

          {/* HR Master Summary Print Button (Accessible to HR and Managers) */}
          {currentRole !== 'employee' && (
            <button
              onClick={() => setIsMasterSummaryPrintModalOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Print master summary for all staff timesheets"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Print All-Staff Monthly Summary</span>
            </button>
          )}

          <button
            onClick={exportTimesheetCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Master CSV</span>
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Time Log</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="no-print flex border-b border-slate-200 gap-2 mb-2">
        <button
          onClick={() => setActiveTimesheetSubTab('duty_timesheet')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTimesheetSubTab === 'duty_timesheet'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Monthly Duty Timesheets & Verification (মাসিক টাইমশীট ও ডিউটি লগ)</span>
        </button>

        <button
          onClick={() => setActiveTimesheetSubTab('exceptions_timesheet')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTimesheetSubTab === 'exceptions_timesheet'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Late & Absenteeism Exception Timesheet (দেরি ও অনুপস্থিতি স্পেশাল টাইমশীট)</span>
          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-black">
            {allExceptionsInMonth.length}
          </span>
        </button>
      </div>

      {activeTimesheetSubTab === 'duty_timesheet' ? (
        <>
          {/* Individual Employee Timesheet Print Selector (HR Admin & Managers can select ANY employee) */}
          <div className="no-print bg-gradient-to-r from-indigo-900 to-slate-900 p-4 sm:p-5 rounded-3xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {currentRole === 'employee'
                    ? 'Print My Monthly Certified Timesheet (আমার মাসিক টাইমশীট প্রিন্ট)'
                    : 'Print Staff Monthly Timesheet (একক কর্মীর মাসিক টাইমশীট প্রিন্ট)'}
                </h3>
              </div>
              <p className="text-xs text-indigo-200">
                {currentRole === 'employee'
                  ? `View & print your verified certified monthly timesheet docket for ${monthLabel} with daily hours and official signature seals.`
                  : `Select staff from roster to view & print their certified monthly timesheet docket for ${monthLabel}.`}
              </p>
            </div>

            {currentRole === 'employee' ? (
              <button
                type="button"
                onClick={() => setSelectedMonthlyPrintEmp(currentUser)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-4 h-4" />
                <span>Print My Monthly Timesheet (আমার টাইমশীট প্রিন্ট করুন)</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <select
                  value={quickPrintEmployeeId}
                  onChange={(e) => setQuickPrintEmployeeId(e.target.value)}
                  className="p-2 text-xs border border-indigo-400/30 bg-indigo-950/80 text-white rounded-xl font-semibold flex-1 md:w-64"
                >
                  {accessibleEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.designation} - {emp.workStation})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const target = accessibleEmployees.find((e) => e.id === quickPrintEmployeeId) || currentUser;
                    setSelectedMonthlyPrintEmp(target);
                  }}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Staff Timesheet</span>
                </button>
              </div>
            )}
          </div>

          {/* Timesheet Display & Highlight Controls Toolbar */}
          <div className="no-print bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>Timesheet View & Highlight Options (টাইমশীটে প্রদর্শন নিয়ন্ত্রণ):</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={showLateData}
                  onChange={(e) => setShowLateData(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Show Late Arrivals (দেরি উপস্থিতি)</span>
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={showAbsentData}
                  onChange={(e) => setShowAbsentData(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Show Absent Days (অনুপস্থিতি দিন)</span>
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-semibold select-none bg-rose-50/80 px-2.5 py-1 rounded-xl border border-rose-200">
                <input
                  type="checkbox"
                  checked={autoMarkMissingBiometricAsAbsent}
                  onChange={(e) => setAutoMarkMissingBiometricAsAbsent(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                  <span className="text-rose-900 text-xs">No Bio Punch = Absent (বায়োমেট্রিক ও ছুটি না থাকলে অনুপস্থিত)</span>
                </span>
              </label>

              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-slate-500 text-[11px]">Filter Days:</span>
                <select
                  value={timesheetDayFilter}
                  onChange={(e) => setTimesheetDayFilter(e.target.value as any)}
                  className="py-1 px-2.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
                >
                  <option value="all">All Days (সব দিন)</option>
                  <option value="late_only">Late Days Only (শুধু দেরি হওয়া দিন)</option>
                  <option value="absent_only">Absent Days Only (শুধু অনুপস্থিত দিন)</option>
                  <option value="exceptions_only">Exceptions Only (দেরি ও অনুপস্থিত উভয়ই)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pending HR Corrections Review Banner (Visible to HR Admin) */}
          {currentRole === 'hr_admin' && allPendingCorrections.length > 0 && (
            <div className="no-print bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Pending Timesheet Revision Requests from Staff ({allPendingCorrections.length})</span>
                </div>
                <span className="text-[11px] bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                  Action Required
                </span>
              </div>

              <div className="space-y-2">
                {allPendingCorrections.map(({ entry, request }) => (
                  <div
                    key={request.id}
                    className="bg-white p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{request.employeeName}</span>
                        <span className="font-mono text-slate-500">ID: {request.employeeId}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                          Day: {DAY_LABELS[request.dayKey]}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">
                        Hours Change: <strong className="text-slate-900">{request.currentHours}h</strong> →{' '}
                        <strong className="text-indigo-600">{request.requestedHours}h</strong>
                      </p>
                      <p className="text-slate-500 italic mt-0.5">Reason: "{request.reason}"</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectCorrection(entry, request)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveCorrection(entry, request)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Update Hours</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Creation Modal / Inline Drawer */}
          {isCreating && (
            <div className="no-print bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-md">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Log Project Activity Hours</h3>
                  <p className="text-xs text-slate-500">Target Month: {monthLabel}</p>
                </div>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTimesheet} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Donor Project Code</label>
                    <select
                      value={projectCode}
                      onChange={(e) => {
                        setProjectCode(e.target.value);
                        if (e.target.value === 'LEEDO-CP-2026') setProjectName('Street Children Shelter & Rescue Mission');
                        if (e.target.value === 'UNICEF-EDU-42') setProjectName('Child Rights Protection & Education');
                        if (e.target.value === 'CORE-OPS-01') setProjectName('Core Administration & Safeguarding');
                      }}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="LEEDO-CP-2026">LEEDO-CP-2026 (Street Children Shelter & Rescue Mission)</option>
                      <option value="UNICEF-EDU-42">UNICEF-EDU-42 (Child Rights Protection & Education)</option>
                      <option value="CORE-OPS-01">CORE-OPS-01 (Core Administration & Finance)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Project Name</label>
                    <input
                      type="text"
                      value={projectName}
                      readOnly
                      className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">Specific Activity Description *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Detail activities undertaken (e.g., child rescue outreach at Sadarghat terminal, M&E data entry, community counseling)..."
                      value={activityDescription}
                      onChange={(e) => setActivityDescription(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Daily Hours Input */}
                <div>
                  <label className="block text-slate-700 font-bold mb-2">Daily Hours Breakdown:</label>
                  <div className="grid grid-cols-7 gap-2">
                    {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => (
                      <div key={day} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="uppercase text-[10px] font-bold text-slate-500">{day}</span>
                        <input
                          type="number"
                          min="0"
                          max="14"
                          step="0.5"
                          value={hours[day]}
                          onChange={(e) =>
                            setHours({ ...hours, [day]: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full text-center font-bold text-slate-900 border border-slate-300 rounded-lg py-1 mt-1 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800">
                    Weekly Total: <span className="text-indigo-600 text-sm font-extrabold">{totalHours} Hours</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit to Line Supervisor</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Staff Timesheet Records & Monthly Print Actions */}
          <div className="no-print space-y-4">
            {visibleTimesheets.map((ts) => {
              const emp = employees.find((e) => e.id === ts.employeeId) || currentUser;
              const pendingCorrectionsForThis = (ts.correctionRequests || []).filter(
                (r) => r.status === 'Pending HR Approval'
              );

              return (
                <div
                  key={ts.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{ts.projectName}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {ts.projectCode}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Logged by <strong>{ts.employeeName}</strong> (ID: {ts.employeeId}) • Period: <strong>{monthLabel}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          ts.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ts.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ts.status === 'Approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>{ts.status}</span>
                      </span>

                      {/* Monthly Timesheet Print Button (Monthly, Not Weekly!) */}
                      <button
                        type="button"
                        onClick={() => setSelectedMonthlyPrintEmp(emp)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer"
                        title="Print full monthly timesheet docket for this staff member"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Monthly Timesheet (মাসিক)</span>
                      </button>

                      {/* Request Edit to HR (Available to staff who submitted) */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCorrectionTimesheet(ts);
                          setIsCorrectionModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
                        title="Request an adjustment or correction to HR"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Request Edit</span>
                      </button>
                    </div>
                  </div>

                  {/* Activity Description */}
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-900 block mb-0.5">Activity Record:</span>
                    {ts.activityDescription}
                  </p>

                  {/* Hours Grid */}
                  <div className="grid grid-cols-7 gap-2 text-center text-xs">
                    {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => (
                      <div key={day} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{day}</span>
                        <span className={`font-mono font-bold text-sm ${ts.hours[day] > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {ts.hours[day]}h
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pending Corrections Alert on this Card */}
                  {pendingCorrectionsForThis.length > 0 && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Revision requested by staff ({DAY_LABELS[pendingCorrectionsForThis[0].dayKey]}: {pendingCorrectionsForThis[0].requestedHours}h) - Pending HR approval
                      </span>
                    </div>
                  )}

                  {/* Supervisor Comment & Approval Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
                    <div className="text-slate-500 text-[11px] italic">
                      {ts.supervisorComment && <span>Note: {ts.supervisorComment}</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800">
                        Total: <span className="text-indigo-600 font-extrabold">{ts.totalHours} hrs</span>
                      </span>

                      {currentRole !== 'employee' && ts.status === 'Submitted' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(ts)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(ts)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Timesheet</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ================= SUB-TAB 2: DEDICATED LATE & ABSENTEEISM EXCEPTION TIMESHEET ================= */
        <div className="no-print space-y-6">
          {/* Header Banner & Controls */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 p-5 rounded-3xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Late & Absenteeism Exception Timesheet (দেরি ও অনুপস্থিতি স্পেশাল রেজিস্টার)
                </h3>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed max-w-2xl">
                বায়োমেট্রিক ও শিফট ডিউটি অনুযায়ী যারা দেরি করেছেন (১০:১৫ এর পর পাঞ্চ) কিংবা অনুমোদনহীন অনুপস্থিত ছিলেন, তাদের সম্পূর্ণ আলাদা মাসিক এক্সেপশন টাইমশীট।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setIsExceptionPrintModalOpen(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Exception Timesheet (প্রিন্ট)</span>
              </button>

              <button
                type="button"
                onClick={exportExceptionTimesheetCSV}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                <span>Export Exception CSV</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-amber-700">Late Punch Incidents (দেরি)</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">{totalLateIncidents}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">After 10:15 AM grace cutoff</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-rose-700">Unapproved Absences (অনুপস্থিতি)</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">{totalAbsentIncidents}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">No approved leave on duty day</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-600">Affected Staff (মোট কর্মী)</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">{uniqueStaffWithExceptions}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Staff with &gt;=1 incident</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-indigo-700">Cumulative Delay (বিলম্ব সময়)</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">{totalLateMinutes} <span className="text-xs text-slate-500 font-normal">mins</span></h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Approx. {(totalLateMinutes / 60).toFixed(1)} lost work hrs</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 font-bold">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-semibold">Violation Type:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setExceptionFilterType('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    exceptionFilterType === 'all' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({allExceptionsInMonth.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExceptionFilterType('late')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    exceptionFilterType === 'late' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Late Only ({totalLateIncidents})
                </button>
                <button
                  type="button"
                  onClick={() => setExceptionFilterType('absent')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    exceptionFilterType === 'absent' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Absent Only ({totalAbsentIncidents})
                </button>
              </div>

              {/* Station Filter */}
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-500 font-semibold">Station:</span>
                <select
                  value={exceptionFilterStation}
                  onChange={(e) => setExceptionFilterStation(e.target.value)}
                  className="py-1 px-2.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
                >
                  <option value="All">All Work Stations</option>
                  {Array.from(new Set(employees.map(e => e.workStation).filter(Boolean))).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, ID, or station..."
                value={exceptionSearch}
                onChange={(e) => setExceptionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Exceptions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {(() => {
              const filtered = allExceptionsInMonth.filter((item) => {
                if (exceptionFilterType !== 'all' && item.type.toLowerCase() !== exceptionFilterType) return false;
                if (exceptionFilterStation !== 'All' && item.workStation !== exceptionFilterStation) return false;
                if (exceptionSearch.trim()) {
                  const q = exceptionSearch.toLowerCase();
                  return (
                    item.employeeName.toLowerCase().includes(q) ||
                    item.employeeId.toLowerCase().includes(q) ||
                    item.workStation.toLowerCase().includes(q) ||
                    item.designation.toLowerCase().includes(q)
                  );
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-slate-800 text-sm">No Attendance Exceptions Found</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      All staff have either maintained on-time biometric punches (before 10:15 AM) or logged approved leave for this period.
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Staff Member</th>
                        <th className="p-3">Work Station</th>
                        <th className="p-3">Incident Date</th>
                        <th className="p-3">Shift Schedule</th>
                        <th className="p-3">Actual Clock-In</th>
                        <th className="p-3">Violation Category</th>
                        <th className="p-3">Delay / Hours</th>
                        <th className="p-3">Biometric Notes / Cause</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((item) => {
                        const targetEmp = employees.find(e => e.id === item.employeeId);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={item.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
                                  alt=""
                                  className="w-8 h-8 rounded-full border border-slate-200"
                                />
                                <div>
                                  <span className="font-bold text-slate-900 block">{item.employeeName}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">ID: {item.employeeId} • {item.designation}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-indigo-700 font-semibold">{item.workStation}</span>
                            </td>
                            <td className="p-3 font-mono">
                              <span className="font-bold text-slate-800 block">{item.dateStr}</span>
                              <span className="text-[10px] text-slate-500">{item.dayOfWeek} (Day {item.dayNumber})</span>
                            </td>
                            <td className="p-3 font-mono text-slate-600">
                              {item.scheduledShift}
                            </td>
                            <td className="p-3 font-mono">
                              {item.clockInTime ? (
                                <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {item.clockInTime}
                                </span>
                              ) : (
                                <span className="text-rose-600 font-semibold italic">No Punch Logged</span>
                              )}
                            </td>
                            <td className="p-3">
                              {item.type === 'Late' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Late Arrival (দেরি)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-200">
                                  <AlertCircle className="w-3 h-3 text-rose-700" />
                                  <span>Absent (অনুপস্থিত)</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono">
                              {item.type === 'Late' ? (
                                <div>
                                  <span className="text-amber-800 font-extrabold block">+{item.lateMinutes} mins late</span>
                                  <span className="text-[10px] text-slate-500">{item.hoursLogged}h duty credited</span>
                                </div>
                              ) : (
                                <span className="text-rose-700 font-bold">0.0h (Unpaid Day)</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 max-w-xs">
                              <p className="line-clamp-2 text-[11px]">{item.notes}</p>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (targetEmp) setSelectedMonthlyPrintEmp(targetEmp);
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-200 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs whitespace-nowrap"
                                title="Open this employee's individual timesheet"
                              >
                                <Printer className="w-3 h-3" />
                                <span>View Timesheet</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: INDIVIDUAL MONTHLY TIMESHEET PRINT (MONTHLY, NOT WEEKLY!) ================= */}
      {selectedMonthlyPrintEmp && (() => {
        const stats = getEmployeeMonthlyDays(selectedMonthlyPrintEmp, selectedMonth);
        const displayedDays = stats.days.filter((d) => {
          if (timesheetDayFilter === 'late_only') return d.isLate;
          if (timesheetDayFilter === 'absent_only') return d.isAbsent;
          if (timesheetDayFilter === 'exceptions_only') return d.isLate || d.isAbsent;
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static print:z-auto print:block">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:h-auto print:shadow-none print:border-none print:w-full print:max-w-none print:block">
              {/* Modal Control Header (hidden during print) */}
              <div className="no-print p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-sm">
                      Official Monthly Timesheet (মাসিক টাইমশীট) — {selectedMonthlyPrintEmp.fullName}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">Period: {selectedMonth} • Station: {selectedMonthlyPrintEmp.workStation}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Quick Toggles within Modal */}
                  <div className="flex items-center gap-2 bg-slate-800/90 px-2.5 py-1 rounded-xl text-[11px] border border-slate-700">
                    <label className="flex items-center gap-1 cursor-pointer text-amber-300 font-semibold select-none">
                      <input
                        type="checkbox"
                        checked={showLateData}
                        onChange={(e) => setShowLateData(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Late</span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer text-rose-300 font-semibold select-none">
                      <input
                        type="checkbox"
                        checked={showAbsentData}
                        onChange={(e) => setShowAbsentData(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span>Absent</span>
                    </label>

                    <select
                      value={timesheetDayFilter}
                      onChange={(e) => setTimesheetDayFilter(e.target.value as any)}
                      className="bg-slate-900 text-slate-200 rounded-md px-1.5 py-0.5 text-[10px] border border-slate-700 font-semibold"
                    >
                      <option value="all">All ({stats.days.length}d)</option>
                      <option value="late_only">Late Only ({stats.lateDays}d)</option>
                      <option value="absent_only">Absent Only ({stats.absentDays}d)</option>
                      <option value="exceptions_only">Exceptions ({stats.lateDays + stats.absentDays}d)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Monthly Timesheet (প্রিন্ট)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMonthlyPrintEmp(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Monthly Timesheet (A4 Formatted Document) */}
              <div className="p-6 sm:p-10 space-y-5 overflow-y-auto print:p-0 print:m-0 text-slate-900 bg-white leading-relaxed text-xs">
                {/* Official NGO Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">LEEDO</h1>
                    <p className="text-xs font-semibold text-slate-700">
                      Local Education and Economic Development Organization
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Govt NGO Affairs Bureau Reg: NGO-BUR/DH-2849/2000 • Banani, Dhaka, Bangladesh
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
                      MONTHLY TIMESHEET DOCKET
                    </span>
                    <p className="text-[10px] text-slate-600 font-mono mt-1">Period: <strong>{selectedMonth}</strong></p>
                  </div>
                </div>

                {/* Staff Dossier Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Staff Member</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedMonthlyPrintEmp.fullName}</p>
                    <span className="text-[11px] font-mono text-slate-500">ID: {selectedMonthlyPrintEmp.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Designation & Station</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedMonthlyPrintEmp.designation}</p>
                    <span className="text-[11px] text-indigo-700 font-semibold">{selectedMonthlyPrintEmp.workStation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Duty Schedule</span>
                    <p className="font-bold text-slate-900 mt-0.5 font-mono">
                      {selectedMonthlyPrintEmp.shiftStartTime || '10:00'} - {selectedMonthlyPrintEmp.shiftEndTime || '18:00'}
                    </p>
                    <span className="text-[10px] text-slate-500">{selectedMonthlyPrintEmp.dailyDutyHours || 8}h/day ({selectedMonthlyPrintEmp.dutyDays?.length || 6} days/wk)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Monthly Worked Hours</span>
                    <p className="font-mono font-black text-indigo-900 text-sm mt-0.5">{stats.totalWorkedHours} Hours</p>
                    <span className="text-[10px] text-emerald-700 font-bold">Present: {stats.presentDays} of {stats.scheduledDutyDays} days</span>
                  </div>
                </div>

                {/* Monthly Reconciliation Summary Box */}
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-center">
                  <div className="p-2 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 font-semibold block">Month Days</span>
                    <span className="font-bold text-slate-900 text-sm">{stats.daysInMonth}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 font-semibold block">Duty Scheduled</span>
                    <span className="font-bold text-slate-900 text-sm">{stats.scheduledDutyDays}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-emerald-700 font-semibold block">Present Days</span>
                    <span className="font-bold text-emerald-800 text-sm">{stats.presentDays}</span>
                  </div>
                  <div className="p-2 bg-teal-50 rounded-lg border border-teal-200">
                    <span className="text-[10px] text-teal-800 font-bold block">Govt Holidays</span>
                    <span className="font-black text-teal-900 text-sm">{stats.govtHolidayDays} (Paid)</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-amber-700 font-semibold block">Leave Taken</span>
                    <span className="font-bold text-amber-800 text-sm">{stats.leaveDays}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-rose-700 font-semibold block">Absent Days</span>
                    <span className="font-bold text-rose-800 text-sm">{stats.absentDays}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 font-semibold block">Weekly Off</span>
                    <span className="font-bold text-slate-700 text-sm">{stats.offDays}</span>
                  </div>
                </div>

                {/* Complete 31-Day Calendar Activity Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                    <span>Full Month Daily Duty & Activity Allocation ({stats.daysInMonth} Days):</span>
                    <span className="text-[10px] text-slate-500 lowercase font-normal">monthly certified audit docket</span>
                  </h4>

                  <table className="w-full text-[11px] text-left border border-slate-300">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-1.5 border-r border-slate-300 w-10 text-center">Day</th>
                        <th className="p-1.5 border-r border-slate-300 w-24">Date</th>
                        <th className="p-1.5 border-r border-slate-300 w-14">Weekday</th>
                        <th className="p-1.5 border-r border-slate-300 w-44">Status</th>
                        <th className="p-1.5 border-r border-slate-300 text-center w-16">Hours</th>
                        <th className="p-1.5">Project Task & Field Activity Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {displayedDays.map((d) => {
                        const isLateHighlighted = d.isLate && showLateData;
                        const isAbsentHighlighted = d.isAbsent && showAbsentData;

                        let rowClass = 'hover:bg-slate-50';
                        if (d.isHoliday) {
                          rowClass = 'bg-teal-50/80 font-medium border-l-4 border-l-teal-600';
                        } else if (isLateHighlighted) {
                          rowClass = 'bg-amber-50/90 font-medium border-l-4 border-l-amber-500';
                        } else if (isAbsentHighlighted) {
                          rowClass = 'bg-rose-50/90 font-medium border-l-4 border-l-rose-500';
                        } else if (!d.isScheduledDuty) {
                          rowClass = 'bg-slate-50/60 text-slate-400';
                        }

                        return (
                          <tr key={d.dayNumber} className={rowClass}>
                            <td className="p-1.5 border-r border-slate-200 text-center font-mono font-bold">
                              {d.dayNumber}
                            </td>
                            <td className="p-1.5 border-r border-slate-200 font-mono text-slate-700">
                              {d.dateStr}
                            </td>
                            <td className="p-1.5 border-r border-slate-200 font-bold font-mono">
                              {d.dayOfWeek}
                            </td>
                            <td className="p-1.5 border-r border-slate-200 font-semibold">
                              {d.isHoliday ? (
                                <span className="inline-flex items-center gap-1 text-teal-800 font-bold bg-teal-100 px-1.5 py-0.5 rounded text-[10px]">
                                  <span>🏛️ Govt Holiday (Paid)</span>
                                </span>
                              ) : isLateHighlighted ? (
                                <span className="inline-flex items-center gap-1 text-amber-900 font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                                  <span>⏰ Late ({d.clockInTime || '10:35 AM'}, +{d.lateMinutes || 0}m delay)</span>
                                </span>
                              ) : isAbsentHighlighted ? (
                                <span className="inline-flex items-center gap-1 text-rose-900 font-bold bg-rose-100 px-1.5 py-0.5 rounded text-[10px]">
                                  <span>❌ Unapproved Absent</span>
                                </span>
                              ) : (
                                <span className={
                                  d.status.includes('Present') ? 'text-emerald-700' :
                                  d.status.includes('Leave') ? 'text-amber-700' : 'text-slate-400'
                                }>
                                  {d.status}
                                </span>
                              )}
                            </td>
                            <td className="p-1.5 border-r border-slate-200 text-center font-mono font-bold">
                              {d.hoursLogged > 0 ? (
                                <span className={d.isHoliday ? 'text-teal-800 font-extrabold' : isLateHighlighted ? 'text-amber-900 font-bold' : ''}>
                                  {d.hoursLogged}h
                                </span>
                              ) : '--'}
                            </td>
                            <td className="p-1.5 text-slate-700">
                              {d.isHoliday ? (
                                <span className="text-teal-900 font-bold">
                                  {d.notes}
                                </span>
                              ) : isLateHighlighted ? (
                                <span className="text-amber-950 font-medium">
                                  {d.notes} {d.lateMinutes ? `(Grace period exceeded by ${d.lateMinutes} mins)` : ''}
                                </span>
                              ) : isAbsentHighlighted ? (
                                <span className="text-rose-950 font-medium">
                                  {d.notes}
                                </span>
                              ) : d.notes}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                        <td colSpan={4} className="p-2 border-r border-slate-300 text-right uppercase">
                          Monthly Cumulative Total Approved Hours:
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center font-mono text-indigo-700 font-extrabold text-xs">
                          {stats.totalWorkedHours}h
                        </td>
                        <td className="p-2 text-emerald-800 font-bold">
                          100% Reconciled ({stats.presentDays} duty days completed{stats.lateDays > 0 ? `, ${stats.lateDays} late` : ''})
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Lateness & Absence Exception Compliance Note */}
                {(stats.lateDays > 0 || stats.absentDays > 0) && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-slate-800 text-[10px] space-y-1">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      <span>HR Attendance & Punctuality Audit Compliance Record (নিয়মানুবর্তিতা ও উপস্থিতি নোট):</span>
                    </div>
                    <p className="text-slate-600">
                      During {selectedMonth}, this staff member recorded <strong>{stats.lateDays} late arrival incident(s)</strong> and <strong>{stats.absentDays} unapproved absence(s)</strong>.
                      LEEDO organizational office shift starts strictly at 10:00 AM with a 15-minute grace window until 10:15 AM.
                    </p>
                  </div>
                )}

                {/* Formal NGO Signatures Block */}
                <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <p className="font-bold text-slate-900">{selectedMonthlyPrintEmp.fullName}</p>
                    <p className="text-[10px] text-slate-500">Employee Signature & Date</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <p className="font-bold text-slate-900">Line Manager / Project Lead</p>
                    <p className="text-[10px] text-slate-500">Field Activity Verification</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <p className="font-bold text-slate-900">Forhad Hossain (Founder & ED)</p>
                    <p className="text-[10px] text-slate-500">Executive Director / HR Approval</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL 2: HR MASTER ALL-STAFF MONTHLY TIMESHEET SUMMARY PRINT ================= */}
      {isMasterSummaryPrintModalOpen && (() => {
        const baseStaff = currentRole === 'line_manager'
          ? employees.filter(e => subordinateIds.has(e.id) || e.id === currentUser.id)
          : employees;
        const filteredList = masterFilterStation === 'All'
          ? baseStaff
          : baseStaff.filter(e => e.workStation === masterFilterStation || e.jobLocations?.includes(masterFilterStation as any));

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static print:z-auto print:block">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:h-auto print:shadow-none print:border-none print:w-full print:max-w-none print:block">
              {/* Modal Control Header (hidden during print) */}
              <div className="no-print p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-sm">
                      Master Monthly Timesheet Summary (সকল কর্মীর মাসিক টাইমশীট মাস্টার সামারি)
                    </h3>
                    <p className="text-[11px] text-slate-400">Period: {monthLabel} • {filteredList.length} Staff Members</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={masterFilterStation}
                    onChange={(e) => setMasterFilterStation(e.target.value)}
                    className="p-1.5 text-xs border border-slate-700 bg-slate-800 text-white rounded-lg"
                  >
                    <option value="All">All {jobLocations.length} LEEDO Centers</option>
                    {jobLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={exportTimesheetCSV}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Export to Excel / CSV with UTF-8 support"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Excel (.CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMasterSummaryPrintModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Master Summary Printable Table (A4 Landscape Formatted) */}
              <div className="p-6 sm:p-10 space-y-6 overflow-y-auto print:p-0 print:m-0 text-slate-900 bg-white leading-relaxed text-xs">
                {/* Official Letterhead Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">LEEDO</h1>
                    <p className="text-xs font-semibold text-slate-700">
                      Local Education and Economic Development Organization
                    </p>
                    <p className="text-[10px] text-slate-500">
                      NGO Affairs Bureau Reg: NGO-BUR/DH-2849/2000 • House 42, Road 11, Banani, Dhaka
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-md border border-slate-300">
                      MASTER TIMESHEET SUMMARY
                    </span>
                    <p className="text-[11px] text-slate-700 font-mono mt-1">Audit Month: <strong>{selectedMonth}</strong></p>
                    <p className="text-[10px] text-slate-500">Station Filter: {masterFilterStation}</p>
                  </div>
                </div>

                {/* Master Summary Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border border-slate-300">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 w-12 text-center">ID</th>
                        <th className="p-2 border-r border-slate-300">Employee Name</th>
                        <th className="p-2 border-r border-slate-300">Designation & Station</th>
                        <th className="p-2 border-r border-slate-300 text-center">Duty Days<br/><span className="text-[9px] font-normal">(কথা)</span></th>
                        <th className="p-2 border-r border-slate-300 text-center text-emerald-800">Present<br/><span className="text-[9px] font-normal">(করেছে)</span></th>
                        <th className="p-2 border-r border-slate-300 text-center text-teal-800 font-extrabold bg-teal-50/70">Govt Hol<br/><span className="text-[9px] font-normal">(সরকারি ছুটি)</span></th>
                        <th className="p-2 border-r border-slate-300 text-center text-indigo-900 font-extrabold">Total Hrs<br/><span className="text-[9px] font-normal">(ঘণ্টা)</span></th>
                        <th className="p-2 border-r border-slate-300 text-center text-amber-800">Leave<br/><span className="text-[9px] font-normal">(ছুটি)</span></th>
                        <th className="p-2 border-r border-slate-300 text-center text-rose-800">Absent<br/><span className="text-[9px] font-normal">(অনুপস্থিত)</span></th>
                        <th className="p-2 border-r border-slate-300 text-center">Off-Days<br/><span className="text-[9px] font-normal">(সাপ্তাহিক)</span></th>
                        <th className="p-2 border-r border-slate-300 text-center">Status</th>
                        <th className="p-2 text-center no-print">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredList.map((emp) => {
                        const stats = getStaffMonthlySummary(emp);
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50">
                            <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-700">
                              {emp.id}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                              {emp.fullName}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-slate-600">
                              <span className="block font-medium">{emp.designation}</span>
                              <span className="text-[10px] text-indigo-700 font-semibold">{emp.workStation}</span>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-800">
                              {stats.scheduledDutyDays} d
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-emerald-700">
                              {stats.presentDays} d
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-teal-800 bg-teal-50/50">
                              {stats.govtHolidayDays} d <span className="text-[9px] text-teal-600 font-normal">(paid)</span>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-indigo-700">
                              {stats.totalWorkedHours} hrs
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-mono font-semibold text-amber-700">
                              {stats.leaveDays > 0 ? `${stats.leaveDays} d` : '--'}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-mono font-semibold text-rose-700">
                              {stats.absentDays > 0 ? `${stats.absentDays} d` : '0'}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500">
                              {stats.offDays} d
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                100% Compliant
                              </span>
                            </td>
                            <td className="p-2 text-center no-print">
                              <button
                                type="button"
                                onClick={() => setSelectedMonthlyPrintEmp(emp)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-200 cursor-pointer inline-flex items-center gap-1 shadow-2xs whitespace-nowrap"
                                title="Print individual monthly timesheet for this staff member"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Print</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Official Signatures Row */}
                <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <p className="font-bold text-slate-900">{hrSignatoryName}</p>
                    <p className="text-[10px] text-slate-500">{hrSignatoryTitle}</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <p className="font-bold text-slate-900">Murshida Akhter Kanta</p>
                    <p className="text-[10px] text-slate-500">Director (Admin & Finance)</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <p className="font-bold text-slate-900">{edSignatoryName}</p>
                    <p className="text-[10px] text-slate-500">{edSignatoryTitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL 3: LATE & ABSENTEEISM EXCEPTION TIMESHEET PRINT ================= */}
      {isExceptionPrintModalOpen && (() => {
        const filtered = allExceptionsInMonth.filter((item) => {
          if (exceptionFilterType !== 'all' && item.type.toLowerCase() !== exceptionFilterType) return false;
          if (exceptionFilterStation !== 'All' && item.workStation !== exceptionFilterStation) return false;
          if (exceptionSearch.trim()) {
            const q = exceptionSearch.toLowerCase();
            return (
              item.employeeName.toLowerCase().includes(q) ||
              item.employeeId.toLowerCase().includes(q) ||
              item.workStation.toLowerCase().includes(q) ||
              item.designation.toLowerCase().includes(q)
            );
          }
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static print:z-auto print:block">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:h-auto print:shadow-none print:border-none print:w-full print:max-w-none print:block">
              {/* Modal Control Header (hidden during print) */}
              <div className="no-print p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-sm">
                      Late & Absenteeism Exceptions Timesheet (দেরি ও অনুপস্থিতি রিপোর্ট)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Period: {selectedMonth} • Total Records: {filtered.length} of {allExceptionsInMonth.length}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={exceptionFilterType}
                    onChange={(e) => setExceptionFilterType(e.target.value as any)}
                    className="p-1.5 text-xs border border-slate-700 bg-slate-800 text-white rounded-xl font-semibold"
                  >
                    <option value="all">All Exceptions ({allExceptionsInMonth.length})</option>
                    <option value="late">Late Only ({totalLateIncidents})</option>
                    <option value="absent">Absent Only ({totalAbsentIncidents})</option>
                  </select>

                  <select
                    value={exceptionFilterStation}
                    onChange={(e) => setExceptionFilterStation(e.target.value)}
                    className="p-1.5 text-xs border border-slate-700 bg-slate-800 text-white rounded-xl font-semibold"
                  >
                    <option value="All">All Stations</option>
                    {Array.from(new Set(employees.map(e => e.workStation).filter(Boolean))).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Exception Timesheet (প্রিন্ট)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExceptionPrintModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Register (A4 Formatted Document) */}
              <div className="p-6 sm:p-10 space-y-5 overflow-y-auto print:p-0 print:m-0 text-slate-900 bg-white leading-relaxed text-xs">
                {/* Official NGO Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">LEEDO</h1>
                    <p className="text-xs font-semibold text-slate-700">
                      Local Education and Economic Development Organization
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Govt NGO Affairs Bureau Reg: NGO-BUR/DH-2849/2000 • Banani, Dhaka, Bangladesh
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md border border-amber-300">
                      ATTENDANCE EXCEPTIONS & PUNCTUALITY AUDIT
                    </span>
                    <p className="text-[10px] text-slate-600 font-mono mt-1">Period: <strong>{selectedMonth}</strong></p>
                  </div>
                </div>

                {/* Sub-header Information */}
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">
                      LEEDO Monthly Lateness & Unapproved Absence Docket (দেরি ও অনুপস্থিতি বিশেষ টাইমশীট)
                    </h3>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      Shift Start: 10:00 AM (Grace period permitted up to 10:15 AM). Punches at or after 10:16 AM are flagged as late arrivals.
                    </p>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200">
                      <span className="text-[9px] uppercase font-bold text-amber-800 block">Late Incidents</span>
                      <span className="font-mono font-bold text-amber-900 text-xs">{totalLateIncidents}</span>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-rose-200">
                      <span className="text-[9px] uppercase font-bold text-rose-800 block">Absences</span>
                      <span className="font-mono font-bold text-rose-900 text-xs">{totalAbsentIncidents}</span>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-600 block">Staff Affected</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">{uniqueStaffWithExceptions}</span>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-indigo-200">
                      <span className="text-[9px] uppercase font-bold text-indigo-700 block">Cumulative Delay</span>
                      <span className="font-mono font-bold text-indigo-900 text-xs">{totalLateMinutes}m</span>
                    </div>
                  </div>
                </div>

                {/* Table of Violations */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border border-slate-300">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                        <th className="p-2 border-r border-slate-300 w-44">Staff Member</th>
                        <th className="p-2 border-r border-slate-300 w-32">Station & Role</th>
                        <th className="p-2 border-r border-slate-300 w-28">Date & Weekday</th>
                        <th className="p-2 border-r border-slate-300 w-24">Shift Time</th>
                        <th className="p-2 border-r border-slate-300 w-24">Actual In</th>
                        <th className="p-2 border-r border-slate-300 w-32">Exception Category</th>
                        <th className="p-2 border-r border-slate-300 w-20 text-center">Delay Mins</th>
                        <th className="p-2">Biometric Audit Remarks & Explanations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-slate-500 italic">
                            No attendance exceptions match the selected filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((item, idx) => (
                          <tr key={item.id} className={item.type === 'Late' ? 'bg-amber-50/50' : 'bg-rose-50/50'}>
                            <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <span className="font-bold text-slate-900 block">{item.employeeName}</span>
                              <span className="font-mono text-slate-500 text-[10px]">ID: {item.employeeId}</span>
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <span className="font-semibold text-indigo-800 block">{item.workStation}</span>
                              <span className="text-slate-500 text-[10px]">{item.designation}</span>
                            </td>
                            <td className="p-2 border-r border-slate-200 font-mono">
                              <span className="font-bold text-slate-800 block">{item.dateStr}</span>
                              <span className="text-slate-500 text-[10px]">{item.dayOfWeek}</span>
                            </td>
                            <td className="p-2 border-r border-slate-200 font-mono text-slate-600">
                              {item.scheduledShift}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-mono">
                              {item.clockInTime ? (
                                <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                                  {item.clockInTime}
                                </span>
                              ) : (
                                <span className="text-rose-600 font-semibold italic text-[10px]">No Punch</span>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-semibold">
                              {item.type === 'Late' ? (
                                <span className="text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  ⏰ Late Arrival
                                </span>
                              ) : (
                                <span className="text-rose-900 bg-rose-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  ❌ Unapproved Absent
                                </span>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">
                              {item.type === 'Late' ? (
                                <span className="text-amber-800">+{item.lateMinutes}m</span>
                              ) : (
                                <span className="text-rose-700">--</span>
                              )}
                            </td>
                            <td className="p-2 text-slate-700">
                              {item.notes}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Compliance & Disciplinary Audit Statement */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-[10px] space-y-1">
                  <p className="font-bold text-slate-900">
                    HR & Administrative Policy Note regarding Lateness & Absenteeism:
                  </p>
                  <p>
                    1. Staff arriving after 10:15 AM grace cutoff are marked late. Three (3) unexcused late arrivals in a single calendar month result in a 0.5-day salary deduction per NGO service rules.
                  </p>
                  <p>
                    2. Unapproved absences without prior leave requisition are treated as Leave Without Pay (LWP) and must be substantiated before salary disbursement.
                  </p>
                </div>

                {/* Official Signatures Row */}
                <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <p className="font-bold text-slate-900">{hrSignatoryName}</p>
                    <p className="text-[10px] text-slate-500">{hrSignatoryTitle}</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <p className="font-bold text-slate-900">Murshida Akhter Kanta</p>
                    <p className="text-[10px] text-slate-500">Director (Admin & Finance)</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                    <p className="font-bold text-slate-900">{edSignatoryName}</p>
                    <p className="text-[10px] text-slate-500">{edSignatoryTitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* REQUEST TIMESHEET REVISION / EDIT MODAL */}
      {isCorrectionModalOpen && activeCorrectionTimesheet && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Request Timesheet Revision to HR</h3>
                  <p className="text-xs text-slate-400">Timesheet ID: {activeCorrectionTimesheet.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCorrectionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Select Day for Correction:</label>
                <select
                  value={correctionDay}
                  onChange={(e) => {
                    const day = e.target.value as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
                    setCorrectionDay(day);
                    setCorrectionRequestedHours(activeCorrectionTimesheet.hours[day] || 8);
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold"
                >
                  {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((d) => (
                    <option key={d} value={d}>
                      {DAY_LABELS[d]} — Currently logged: {activeCorrectionTimesheet.hours[d]}h
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Logged</span>
                  <p className="text-xl font-bold text-slate-700 mt-1">
                    {activeCorrectionTimesheet.hours[correctionDay]} hrs
                  </p>
                </div>

                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <label className="text-[10px] font-bold text-indigo-700 uppercase block mb-1">
                    Correct Hours (Requested)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="16"
                    step="0.5"
                    value={correctionRequestedHours}
                    onChange={(e) => setCorrectionRequestedHours(Number(e.target.value) || 0)}
                    className="w-full p-1.5 border border-indigo-300 rounded-lg font-bold text-indigo-900 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Reason for Correction / Adjustment * (HR এর কাছে আবেদনের কারণ):
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Extended emergency field rescue operation at Kamalapur railway shelter till midnight; data entry delay..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request to HR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
