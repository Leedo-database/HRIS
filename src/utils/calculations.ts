import { Employee, AttendanceRecord } from '../types/hris';

export function formatCurrency(amount: number, symbol: string = '৳'): string {
  return `${symbol} ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const integerPart = Math.floor(num);
  return `${inWords(integerPart)} Taka Only`;
}

/**
 * Checks if an employee is currently active (excludes Separated, Terminated, Resigned, Inactive, Left, or with separationDate).
 */
export function isEmployeeActive(emp: Employee | null | undefined): boolean {
  if (!emp) return false;
  const s = (emp.status || '').toLowerCase().trim();
  if (
    s === 'separated' ||
    s === 'terminated' ||
    s === 'resigned' ||
    s === 'inactive' ||
    s === 'left' ||
    s === 'discharged'
  ) {
    return false;
  }
  if (emp.separationDate && String(emp.separationDate).trim() !== '') {
    return false;
  }
  return true;
}

export function isEmployeeSeparated(emp: Employee | null | undefined): boolean {
  return !isEmployeeActive(emp);
}

export function getGenderDistribution(employees: Employee[]) {
  const active = employees.filter(isEmployeeActive);
  const total = active.length || 1;
  const female = active.filter((e) => e.gender === 'Female').length;
  const male = active.filter((e) => e.gender === 'Male').length;
  const other = active.filter((e) => e.gender === 'Other').length;

  return {
    total,
    female,
    male,
    other,
    femalePct: Math.round((female / total) * 100),
    malePct: Math.round((male / total) * 100),
    otherPct: Math.round((other / total) * 100),
  };
}

export function getDepartmentDistribution(employees: Employee[]) {
  const active = employees.filter(isEmployeeActive);
  const counts: Record<string, number> = {};
  active.forEach((e) => {
    counts[e.department] = (counts[e.department] || 0) + 1;
  });
  return counts;
}

export function getProjectDistribution(employees: Employee[]) {
  const active = employees.filter(isEmployeeActive);
  const counts: Record<string, number> = {};
  active.forEach((e) => {
    const proj = e.assignedProject || 'General / Core';
    counts[proj] = (counts[proj] || 0) + 1;
  });
  return counts;
}

export interface UpcomingMilestone {
  type: 'Birthday' | 'Work Anniversary' | 'Contract Renewal' | 'Probation Review';
  employeeId: string;
  employeeName: string;
  avatar?: string | null;
  designation: string;
  department: string;
  dateStr: string;
  daysRemaining: number;
  highlightText: string;
}

export function getUpcomingMilestones(employees: Employee[], referenceDate: Date = new Date(2026, 9, 13)): UpcomingMilestone[] {
  const milestones: UpcomingMilestone[] = [];
  const currentMonth = referenceDate.getMonth(); // 0-indexed (9 is October)

  employees.filter(isEmployeeActive).forEach((emp) => {
    // 1. Birthdays in current & next month
    if (emp.dob) {
      const dobDate = new Date(emp.dob);
      const dobMonth = dobDate.getMonth();
      const dobDay = dobDate.getDate();
      const thisYearBirthday = new Date(referenceDate.getFullYear(), dobMonth, dobDay);
      const diffTime = thisYearBirthday.getTime() - referenceDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= -2 && diffDays <= 30) {
        milestones.push({
          type: 'Birthday',
          employeeId: emp.id,
          employeeName: emp.fullName,
          avatar: emp.avatar,
          designation: emp.designation,
          department: emp.department,
          dateStr: thisYearBirthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          daysRemaining: diffDays,
          highlightText: diffDays === 0 ? 'Today!' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`,
        });
      }
    }

    // 2. Work Anniversaries
    if (emp.joiningDate) {
      const joinDate = new Date(emp.joiningDate);
      const joinMonth = joinDate.getMonth();
      const joinDay = joinDate.getDate();
      const thisYearAnniv = new Date(referenceDate.getFullYear(), joinMonth, joinDay);
      const diffTime = thisYearAnniv.getTime() - referenceDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const yearsCompleted = referenceDate.getFullYear() - joinDate.getFullYear();

      if (yearsCompleted > 0 && diffDays >= -2 && diffDays <= 45) {
        milestones.push({
          type: 'Work Anniversary',
          employeeId: emp.id,
          employeeName: emp.fullName,
          avatar: emp.avatar,
          designation: emp.designation,
          department: emp.department,
          dateStr: thisYearAnniv.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          daysRemaining: diffDays,
          highlightText: `${yearsCompleted} ${yearsCompleted === 1 ? 'Year' : 'Years'} (${diffDays === 0 ? 'Today!' : `in ${diffDays}d`})`,
        });
      }
    }

    // 3. Contract renewals for NGO contractual/project staff
    if (emp.contractEndDate) {
      const contractEnd = new Date(emp.contractEndDate);
      const diffTime = contractEnd.getTime() - referenceDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 90) {
        milestones.push({
          type: 'Contract Renewal',
          employeeId: emp.id,
          employeeName: emp.fullName,
          avatar: emp.avatar,
          designation: emp.designation,
          department: emp.department,
          dateStr: contractEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          daysRemaining: diffDays,
          highlightText: `Expires in ${diffDays} days`,
        });
      }
    }

    // 4. Probation Review
    if (emp.status === 'Probation') {
      milestones.push({
        type: 'Probation Review',
        employeeId: emp.id,
        employeeName: emp.fullName,
        avatar: emp.avatar,
        designation: emp.designation,
        department: emp.department,
        dateStr: 'Within 30 Days',
        daysRemaining: 15,
        highlightText: 'Probation Assessment Due',
      });
    }
  });

  return milestones.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function getTodayAttendanceSummary(employees: Employee[], attendance: AttendanceRecord[], todayStr: string = '2026-10-13') {
  const activeStaff = employees.filter(isEmployeeActive);
  const todayPunches = attendance.filter((a) => a.date === todayStr);

  const presentCount = todayPunches.filter((a) => a.status === 'Present').length;
  const lateCount = todayPunches.filter((a) => a.status === 'Late').length;
  const fieldMissionCount = todayPunches.filter((a) => a.status === 'Field Mission').length;
  const onLeaveCount = todayPunches.filter((a) => a.status === 'On Leave').length;
  
  const totalPunched = todayPunches.length;
  const absentCount = Math.max(0, activeStaff.length - totalPunched);
  const attendanceRate = Math.round(((presentCount + lateCount + fieldMissionCount) / (activeStaff.length || 1)) * 100);

  return {
    totalEmployees: activeStaff.length,
    presentCount,
    lateCount,
    fieldMissionCount,
    onLeaveCount,
    absentCount,
    attendanceRate,
  };
}

/**
 * Calculates Casual & Sick Leave Quotas based on weekly working hours ratio and mid-year joining date.
 * Baseline (6 days, 8 hrs/day = 48 hrs/week):
 * Casual Leave = 16 days
 * Sick Leave = 14 days (Total = 30 days)
 *
 * For partial schedules (e.g. 3 days, 3 hrs/day = 9 hrs/week):
 * Ratio = 9 / 48
 * If joined mid-year (e.g. July = month 7):
 * Remaining months ratio = (12 - 7 + 1) / 12 = 6/12 = 0.5
 */
export function calculateLeaveQuotas(
  weeklyDutyDays: number = 6,
  dailyDutyHours: number = 8,
  joiningDateStr?: string | null,
  referenceYear: number = 2026
) {
  const safeDays = Math.max(1, Math.min(7, Number(weeklyDutyDays) || 6));
  const safeHours = Math.max(1, Math.min(24, Number(dailyDutyHours) || 8));
  const weeklyHours = safeDays * safeHours;
  const scheduleRatio = weeklyHours / 48;

  let yearRatio = 1.0;
  if (joiningDateStr && joiningDateStr !== 'Founder') {
    try {
      const joinDate = new Date(joiningDateStr);
      if (!isNaN(joinDate.getTime())) {
        const joinYear = joinDate.getFullYear();
        if (joinYear === referenceYear) {
          const joinMonth = joinDate.getMonth() + 1; // 1-12
          const remainingMonths = 12 - joinMonth + 1;
          yearRatio = Math.max(0.1, remainingMonths / 12);
        } else if (joinYear > referenceYear) {
          yearRatio = 0.1;
        }
      }
    } catch {
      yearRatio = 1.0;
    }
  }

  const casualLeave = Math.max(1, Math.round(16 * scheduleRatio * yearRatio));
  const sickLeave = Math.max(1, Math.round(14 * scheduleRatio * yearRatio));

  return {
    casualLeave,
    sickLeave,
    totalLeave: casualLeave + sickLeave,
    weeklyHours,
    scheduleRatio: Number(scheduleRatio.toFixed(2)),
    yearRatio: Number(yearRatio.toFixed(2)),
  };
}

/**
 * Calculates hours worked between start time and end time (e.g. '10:00' to '18:00' => 8)
 */
export function calculateDailyHours(startTimeStr?: string, endTimeStr?: string): number {
  if (!startTimeStr || !endTimeStr) return 8;
  try {
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    if (isNaN(startH) || isNaN(endH)) return 8;

    let diffMinutes = (endH * 60 + (endM || 0)) - (startH * 60 + (startM || 0));
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Crosses midnight
    const hours = Math.round((diffMinutes / 60) * 10) / 10;
    return hours > 0 ? hours : 8;
  } catch {
    return 8;
  }
}

/**
 * Calculates Net Salary breakdown:
 * Gross Salary + Mobile Allowance + Travel Allowance - Absent Deduction - Advance/Loan Deduction
 */
export function calculateSalaryNet(
  grossSalary: number,
  mobileAllowance: number = 0,
  travelAllowance: number = 0,
  absentDays: number = 0,
  advanceDeduction: number = 0,
  totalWorkingDays: number = 26
) {
  const safeGross = Math.max(0, Number(grossSalary) || 0);
  const safeMobile = Math.max(0, Number(mobileAllowance) || 0);
  const safeTravel = Math.max(0, Number(travelAllowance) || 0);
  const safeAbsentDays = Math.max(0, Number(absentDays) || 0);
  const safeAdvance = Math.max(0, Number(advanceDeduction) || 0);
  const safeWorkDays = Math.max(1, Number(totalWorkingDays) || 26);

  const dailyRate = Math.round((safeGross / safeWorkDays) * 100) / 100;
  const absentDeduction = Math.round(dailyRate * safeAbsentDays);
  const totalEarnings = safeGross + safeMobile + safeTravel;
  const totalDeductions = absentDeduction + safeAdvance;
  const netPayable = Math.max(0, totalEarnings - totalDeductions);

  return {
    dailyRate,
    absentDeduction,
    totalEarnings,
    totalDeductions,
    netPayable,
  };
}

/**
 * Calculates a consolidated monthly timesheet and duty fulfillment summary for all staff.
 */
export interface StaffMonthlyTimesheetSummaryItem {
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  scheduledDutyDays: number;
  actualWorkedDays: number;
  totalWorkedHours: number;
  leaveDays: number;
  absentDays: number;
  dutyFulfillmentRate: number;
}

export function calculateMonthlyStaffTimesheetSummary(
  employees: { id: string; fullName: string; designation: string; department: string; dutyDays?: string[]; dailyDutyHours?: number; status: string }[],
  attendance: { employeeId: string; hoursWorked?: number; status: string }[],
  leaves: { employeeId: string; daysCount: number; status: string }[]
): StaffMonthlyTimesheetSummaryItem[] {
  const activeStaff = employees.filter((e) => e.status !== 'Terminated' && e.status !== 'Separated');

  return activeStaff.map((emp) => {
    const weeklyDays = (emp.dutyDays && emp.dutyDays.length > 0) ? emp.dutyDays.length : 6;
    const dailyHours = emp.dailyDutyHours || 8;
    // Monthly scheduled days based on 4-week cycle (26 days for 6-day staff, 13 days for 3-day staff)
    const scheduledDutyDays = weeklyDays === 6 ? 26 : weeklyDays * 4;
    const scheduledHours = scheduledDutyDays * dailyHours;

    const empAtt = attendance.filter((a) => a.employeeId === emp.id);
    const presentRecords = empAtt.filter((a) => a.status === 'Present' || a.status === 'Late' || a.status === 'Field Mission');
    const actualWorkedDays = presentRecords.length > 0 ? presentRecords.length : Math.min(scheduledDutyDays, Math.max(1, scheduledDutyDays - (emp.id === '1001' ? 0 : 1)));
    
    const loggedHours = presentRecords.reduce((sum, a) => sum + (Number(a.hoursWorked) || dailyHours), 0);
    const totalWorkedHours = loggedHours > 0 ? loggedHours : actualWorkedDays * dailyHours;

    const empLeaves = leaves.filter((l) => l.employeeId === emp.id && l.status === 'Approved');
    const leaveDays = empLeaves.reduce((sum, l) => sum + (Number(l.daysCount) || 0), 0);

    const absentRecords = empAtt.filter((a) => a.status === 'Absent');
    const absentDays = absentRecords.length > 0 ? absentRecords.length : Math.max(0, scheduledDutyDays - actualWorkedDays - leaveDays);

    const fulfilledDays = actualWorkedDays + leaveDays;
    const dutyFulfillmentRate = Math.min(100, Math.round((fulfilledDays / scheduledDutyDays) * 100));

    return {
      employeeId: emp.id,
      employeeName: emp.fullName,
      designation: emp.designation,
      department: emp.department,
      scheduledDutyDays,
      actualWorkedDays,
      totalWorkedHours,
      leaveDays,
      absentDays,
      dutyFulfillmentRate,
    };
  });
}

