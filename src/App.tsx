import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  LeaveBalance, 
  TimesheetEntry, 
  PayrollRecord, 
  PerformanceAppraisal, 
  ExpenseClaim, 
  CompanyProfile, 
  SeparationRecord,
  VisitAuthorization,
  UserRole,
  UserCredential,
  LetterType,
  IssuedLetter,
  LEEDO_JOB_LOCATIONS,
  GovernmentHoliday
} from './types/hris';
import { OFFICIAL_BANGLADESH_HOLIDAYS_2026 } from './data/bangladeshHolidays';
import { 
  INITIAL_COMPANY_PROFILE, 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE, 
  INITIAL_LEAVES, 
  INITIAL_LEAVE_BALANCES, 
  INITIAL_TIMESHEETS, 
  INITIAL_PAYROLL, 
  INITIAL_APPRAISALS, 
  INITIAL_EXPENSES,
  INITIAL_SEPARATIONS,
  INITIAL_VISITS
} from './data/mockData';
import { 
  loadFromStorage, 
  saveToStorage, 
  STORAGE_KEYS,
  ensureV2Migration,
  loadMergedEmployees,
  isValidLeedoStaffId,
  LEGACY_MOCK_NAMES
} from './utils/storage';
import { 
  fetchEmployeesFromCloud, 
  subscribeEmployeesFromCloud,
  saveEmployeeToCloud,
  fetchTimesheetsFromCloud,
  subscribeTimesheetsFromCloud,
  saveTimesheetToCloud,
  deleteTimesheetFromCloud,
  fetchLeavesFromCloud,
  subscribeLeavesFromCloud,
  saveLeaveToCloud,
  fetchAttendanceFromCloud,
  subscribeAttendanceFromCloud,
  saveAttendanceToCloud,
  fetchSeparationsFromCloud,
  subscribeSeparationsFromCloud,
  saveSeparationToCloud,
  fetchVisitsFromCloud,
  subscribeVisitsFromCloud,
  saveVisitToCloud,
  fetchCompanyConfigFromCloud,
  saveCompanyConfigToCloud,
  fetchHolidaysFromCloud,
  subscribeHolidaysFromCloud,
  saveHolidayToCloud,
  deleteHolidayFromCloud,
  testFirestoreConnection
} from './utils/firebaseSync';

import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { EmployeeDirectory } from './components/Employees/EmployeeDirectory';
import { EmployeeDetailModal } from './components/Employees/EmployeeDetailModal';
import { AddEmployeeModal } from './components/Employees/AddEmployeeModal';
import { AttendanceModule } from './components/Attendance/AttendanceModule';
import { TimesheetModule } from './components/Timesheets/TimesheetModule';
import { LeaveModule } from './components/Leave/LeaveModule';
import { VisitModule } from './components/Visits/VisitModule';
import { PayrollModule } from './components/Payroll/PayrollModule';
import { PerformanceModule } from './components/Performance/PerformanceModule';
import { ExpenseModule } from './components/Expenses/ExpenseModule';
import { SeparationModule } from './components/Separation/SeparationModule';
import { OfficialLettersModule } from './components/Letters/OfficialLettersModule';
import { ReportsModule } from './components/Reports/ReportsModule';
import { CompanySettings } from './components/Settings/CompanySettings';
import { LoginScreen } from './components/Auth/LoginScreen';
import { MyProfileView } from './components/Profile/MyProfileView';
import { LogoEditorModal } from './components/Settings/LogoEditorModal';
import { JobLocationsManagerModal } from './components/Settings/JobLocationsManagerModal';
import { Menu } from 'lucide-react';

export default function App() {
  // Ensure migration from v1 to clean LEEDO master data
  useEffect(() => {
    ensureV2Migration();
  }, []);

  // Master State - Always load complete authentic LEEDO master database
  const [employees, setEmployees] = useState<Employee[]>(() => loadMergedEmployees());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const raw = loadFromStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    return raw.filter(
      (a) => a && a.employeeId && isValidLeedoStaffId(a.employeeId) && !LEGACY_MOCK_NAMES.has((a.employeeName || '').trim())
    );
  });
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    const raw = loadFromStorage(STORAGE_KEYS.LEAVES, INITIAL_LEAVES);
    return raw.filter(
      (l) => l && l.employeeId && isValidLeedoStaffId(l.employeeId) && !LEGACY_MOCK_NAMES.has((l.employeeName || '').trim())
    );
  });
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>(() =>
    loadFromStorage(STORAGE_KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES)
  );
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(() => {
    const raw = loadFromStorage(STORAGE_KEYS.TIMESHEETS, INITIAL_TIMESHEETS);
    return raw.filter(
      (t) => t && t.employeeId && isValidLeedoStaffId(t.employeeId) && !LEGACY_MOCK_NAMES.has((t.employeeName || '').trim())
    );
  });
  const [payroll, setPayroll] = useState<PayrollRecord[]>(() => {
    const raw = loadFromStorage(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL);
    return raw.filter(
      (p) => p && p.employeeId && isValidLeedoStaffId(p.employeeId) && !LEGACY_MOCK_NAMES.has((p.employeeName || '').trim())
    );
  });
  const [appraisals, setAppraisals] = useState<PerformanceAppraisal[]>(() =>
    loadFromStorage(STORAGE_KEYS.APPRAISALS, INITIAL_APPRAISALS)
  );
  const [expenses, setExpenses] = useState<ExpenseClaim[]>(() =>
    loadFromStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES)
  );
  const [separations, setSeparations] = useState<SeparationRecord[]>(() => {
    const raw = loadFromStorage(STORAGE_KEYS.SEPARATIONS, INITIAL_SEPARATIONS);
    return raw.filter(
      (s) => s && s.employeeId && isValidLeedoStaffId(s.employeeId) && !LEGACY_MOCK_NAMES.has((s.employeeName || '').trim())
    );
  });
  const [visits, setVisits] = useState<VisitAuthorization[]>(() =>
    loadFromStorage(STORAGE_KEYS.VISITS, INITIAL_VISITS)
  );
  const [issuedLetters, setIssuedLetters] = useState<IssuedLetter[]>(() =>
    loadFromStorage(STORAGE_KEYS.ISSUED_LETTERS, [])
  );
  const [company, setCompany] = useState<CompanyProfile>(() =>
    loadFromStorage(STORAGE_KEYS.COMPANY, INITIAL_COMPANY_PROFILE)
  );
  const [holidays, setHolidays] = useState<GovernmentHoliday[]>(() =>
    loadFromStorage(STORAGE_KEYS.HOLIDAYS, OFFICIAL_BANGLADESH_HOLIDAYS_2026)
  );

  // LEEDO Job Locations & Centers Master State
  const [jobLocations, setJobLocations] = useState<string[]>(() => {
    const saved = loadFromStorage<string[]>(STORAGE_KEYS.JOB_LOCATIONS, [...LEEDO_JOB_LOCATIONS]);
    // Ensure "Kadamtali Vocational Center" is guaranteed to be present in the job location list
    if (!saved.includes('Kadamtali Vocational Center')) {
      const idx = saved.indexOf('Kodomtoli Shelter');
      const updated = [...saved];
      if (idx !== -1) {
        updated.splice(idx + 1, 0, 'Kadamtali Vocational Center');
      } else {
        updated.push('Kadamtali Vocational Center');
      }
      saveToStorage(STORAGE_KEYS.JOB_LOCATIONS, updated);
      return updated;
    }
    return saved;
  });

  const [isJobLocationsModalOpen, setIsJobLocationsModalOpen] = useState(false);

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // HR Admin: Update or rename official job location names with automatic cascade
  const handleUpdateJobLocations = (newLocations: string[], oldName?: string, newName?: string) => {
    setJobLocations(newLocations);
    saveToStorage(STORAGE_KEYS.JOB_LOCATIONS, newLocations);
    saveCompanyConfigToCloud(company, newLocations);

    // If a location is renamed, cascade the new name to all employee profiles and cloud sync
    if (oldName && newName && oldName !== newName) {
      setEmployees((prev) => {
        const updated = prev.map((emp) => {
          let changed = false;
          let newWorkStation = emp.workStation;
          if (emp.workStation === oldName) {
            newWorkStation = newName;
            changed = true;
          }
          let newJobLocations = emp.jobLocations;
          if (emp.jobLocations && emp.jobLocations.includes(oldName as any)) {
            newJobLocations = emp.jobLocations.map((loc) => (loc === oldName ? (newName as any) : loc));
            changed = true;
          }
          if (changed) {
            const updatedEmp = { ...emp, workStation: newWorkStation, jobLocations: newJobLocations };
            saveEmployeeToCloud(updatedEmp);
            return updatedEmp;
          }
          return emp;
        });
        saveToStorage(STORAGE_KEYS.EMPLOYEES, updated);
        return updated;
      });
    }
  };

  // User credentials map (employeeId -> UserCredential)
  const [credentials, setCredentials] = useState<Record<string, UserCredential>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    const initialCreds: Record<string, UserCredential> = {};
    const masterEmps = loadMergedEmployees();
    masterEmps.forEach((emp) => {
      const isHr = emp.id === '1001' || emp.id === '1002' || emp.designation?.includes('Director') || emp.department?.includes('Human Resources') || emp.department?.includes('Admin & Finance');
      const isManager = emp.designation?.includes('Coordinator') || emp.designation?.includes('Manager') || emp.designation?.includes('Head') || emp.designation?.includes('Doctor');
      initialCreds[emp.id] = {
        employeeId: emp.id,
        password: emp.id, // default password is staff ID
        mustChangePassword: true,
        role: isHr ? 'hr_admin' : isManager ? 'line_manager' : 'employee',
      };
    });
    return initialCreds;
  });

  // Authentication State: User starts on the Login Screen unless authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return session === 'true';
  });

  // Current session & RBAC
  const [currentRole, setCurrentRole] = useState<UserRole>(() =>
    loadFromStorage(STORAGE_KEYS.CURRENT_ROLE, 'hr_admin')
  );
  const [currentUser, setCurrentUser] = useState<Employee>(() => {
    const allEmps = loadMergedEmployees();
    const savedId = loadFromStorage(STORAGE_KEYS.CURRENT_USER_ID, '1001');
    return allEmps.find((e) => e.id === savedId) || allEmps[0];
  });

  // Navigation & UI controls
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Modals
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);

  // Quick Letter state
  const [letterDraftType, setLetterDraftType] = useState<LetterType>('experience');
  const [letterDraftEmployee, setLetterDraftEmployee] = useState<Employee | null>(null);

  // Separation state
  const [separationInitialStaffId, setSeparationInitialStaffId] = useState<string | null>(null);

  // Initial Automated Cloud Sync with Firestore
  useEffect(() => {
    let isMounted = true;
    setSyncStatus('syncing');

    testFirestoreConnection().then((connected) => {
      if (!isMounted) return;
      setSyncStatus(connected ? 'synced' : 'offline');
    });

    // 1. Live subscribe to Employees & Staff Roster
    const unsubEmps = subscribeEmployeesFromCloud((cloudEmps) => {
      if (!isMounted) return;
      if (cloudEmps && cloudEmps.length > 0) {
        setEmployees(cloudEmps);
        saveToStorage(STORAGE_KEYS.EMPLOYEES, cloudEmps);
        setSyncStatus('synced');
      }
    });

    // 2. Live subscribe to Staff Roster & Project Timesheets
    const unsubTimesheets = subscribeTimesheetsFromCloud((cloudTs) => {
      if (!isMounted) return;
      if (cloudTs && cloudTs.length > 0) {
        setTimesheets(cloudTs);
        saveToStorage(STORAGE_KEYS.TIMESHEETS, cloudTs);
        setSyncStatus('synced');
      }
    });

    // 3. Live subscribe to Daily Attendance
    const unsubAttendance = subscribeAttendanceFromCloud((cloudAtt) => {
      if (!isMounted) return;
      if (cloudAtt && cloudAtt.length > 0) {
        setAttendance(cloudAtt);
        saveToStorage(STORAGE_KEYS.ATTENDANCE, cloudAtt);
        setSyncStatus('synced');
      }
    });

    // 4. Live subscribe to Leave Applications
    const unsubLeaves = subscribeLeavesFromCloud((cloudLeaves) => {
      if (!isMounted) return;
      if (cloudLeaves && cloudLeaves.length > 0) {
        setLeaves(cloudLeaves);
        saveToStorage(STORAGE_KEYS.LEAVES, cloudLeaves);
        setSyncStatus('synced');
      }
    });

    // 5. Live subscribe to Staff Separations
    const unsubSeparations = subscribeSeparationsFromCloud((cloudSeps) => {
      if (!isMounted) return;
      if (cloudSeps && cloudSeps.length > 0) {
        setSeparations(cloudSeps);
        saveToStorage(STORAGE_KEYS.SEPARATIONS, cloudSeps);
        setSyncStatus('synced');
      }
    });

    // 6. Live subscribe to Visits
    const unsubVisits = subscribeVisitsFromCloud((cloudVisits) => {
      if (!isMounted) return;
      if (cloudVisits && cloudVisits.length > 0) {
        setVisits(cloudVisits);
        saveToStorage(STORAGE_KEYS.VISITS, cloudVisits);
        setSyncStatus('synced');
      }
    });

    // 7. Live subscribe to Government & Public Holidays
    const unsubHolidays = subscribeHolidaysFromCloud((cloudHolidays) => {
      if (!isMounted) return;
      if (cloudHolidays && cloudHolidays.length > 0) {
        setHolidays(cloudHolidays);
        saveToStorage(STORAGE_KEYS.HOLIDAYS, cloudHolidays);
        setSyncStatus('synced');
      }
    });

    // 8. Load Organization Profile & Job Locations
    fetchCompanyConfigFromCloud().then((config) => {
      if (!isMounted || !config) return;
      if (config.company) {
        setCompany(config.company);
        saveToStorage(STORAGE_KEYS.COMPANY, config.company);
      }
      if (config.jobLocations && config.jobLocations.length > 0) {
        setJobLocations(config.jobLocations);
        saveToStorage(STORAGE_KEYS.JOB_LOCATIONS, config.jobLocations);
      }
    });

    // Fallback immediate fetches to populate quickly
    fetchEmployeesFromCloud().then((cloudEmps) => {
      if (isMounted && cloudEmps && cloudEmps.length > 0) {
        setEmployees(cloudEmps);
        saveToStorage(STORAGE_KEYS.EMPLOYEES, cloudEmps);
      }
    });
    fetchTimesheetsFromCloud().then((cloudTs) => {
      if (isMounted && cloudTs && cloudTs.length > 0) {
        setTimesheets(cloudTs);
        saveToStorage(STORAGE_KEYS.TIMESHEETS, cloudTs);
      }
    });
    fetchHolidaysFromCloud().then((cloudHolidays) => {
      if (isMounted && cloudHolidays && cloudHolidays.length > 0) {
        setHolidays(cloudHolidays);
        saveToStorage(STORAGE_KEYS.HOLIDAYS, cloudHolidays);
      }
    });

    return () => {
      isMounted = false;
      unsubEmps();
      unsubTimesheets();
      unsubAttendance();
      unsubLeaves();
      unsubSeparations();
      unsubVisits();
      unsubHolidays();
    };
  }, []);

  // Save changes to localStorage & Cloud
  const handleSaveEmployee = (emp: Employee) => {
    let updated: Employee[];
    const exists = employees.some((e) => e.id === emp.id);
    if (exists) {
      updated = employees.map((e) => (e.id === emp.id ? emp : e));
    } else {
      updated = [emp, ...employees];
      const newCreds = {
        ...credentials,
        [emp.id]: {
          employeeId: emp.id,
          password: emp.id,
          mustChangePassword: true,
          role: 'employee' as UserRole,
        },
      };
      setCredentials(newCreds);
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(newCreds));
    }
    setEmployees(updated);
    saveToStorage(STORAGE_KEYS.EMPLOYEES, updated);
    setSyncStatus('syncing');
    saveEmployeeToCloud(emp)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('offline'));

    // If updated employee is the active user, update currentUser state
    if (currentUser.id === emp.id) {
      setCurrentUser(emp);
    }

    // If marked Separated or Terminated, auto-generate separation docket and open settlement view
    if (emp.status === 'Separated' || emp.status === 'Terminated') {
      const existingSep = separations.find((s) => s.employeeId === emp.id);
      if (!existingSep) {
        const joinYear = new Date(emp.joiningDate).getFullYear();
        const serviceYears = Math.max(1, 2026 - joinYear);
        const lastMonthSalary = emp.grossSalary;
        const pfSettlement = Math.round(emp.basicSalary * 0.16 * 12 * serviceYears);
        const gratuity = serviceYears >= 3 ? Math.round(emp.basicSalary * serviceYears) : 0;
        const leaveEncashmentDays = 8;
        const leaveEncashmentAmount = Math.round((emp.basicSalary / 30) * leaveEncashmentDays);
        const advanceDeduction = emp.advanceBalance || 0;
        const netSettlement = Math.max(0, lastMonthSalary + pfSettlement + gratuity + leaveEncashmentAmount - advanceDeduction);

        const newSep: SeparationRecord = {
          id: `SEP-2026-${Date.now().toString().slice(-4)}`,
          employeeId: emp.id,
          employeeName: emp.fullName,
          designation: emp.designation,
          department: emp.department,
          joiningDate: emp.joiningDate,
          separationType: (emp.separationReason as any) || 'Resignation',
          noticeDate: new Date().toISOString().split('T')[0],
          lastWorkingDate: emp.separationDate || new Date().toISOString().split('T')[0],
          reason: emp.separationReason || 'Separation recorded by HR Admin',
          handoverTo: 'Designated Department Officer',
          departmentClearance: true,
          financeClearance: true,
          adminAssetClearance: false,
          itEquipmentClearance: false,
          lastMonthSalary,
          providentFundSettlement: pfSettlement,
          gratuitySettlement: gratuity,
          leaveEncashmentDays,
          leaveEncashmentAmount,
          deductionsOrAdvances: advanceDeduction,
          netSettlementAmount: netSettlement,
          clearanceStatus: 'Clearance In Progress',
          experienceLetterIssued: false,
        };
        const updatedSeps = [newSep, ...separations];
        setSeparations(updatedSeps);
        saveToStorage(STORAGE_KEYS.SEPARATIONS, updatedSeps);
        saveSeparationToCloud(newSep);
      }
      setSeparationInitialStaffId(emp.id);
      setActiveTab('separation');
    }
  };

  const handleUpdateCurrentUserProfile = (updatedEmp: Employee) => {
    setCurrentUser(updatedEmp);
    handleSaveEmployee(updatedEmp);
  };

  const handleSaveLogo = (newLogoUrl: string) => {
    const updatedCompany = { ...company, logoUrl: newLogoUrl };
    setCompany(updatedCompany);
    saveToStorage(STORAGE_KEYS.COMPANY, updatedCompany);
    saveCompanyConfigToCloud(updatedCompany, jobLocations);
  };

  const handleAddTimesheet = (t: TimesheetEntry) => {
    const updated = [t, ...timesheets.filter((item) => item.id !== t.id)];
    setTimesheets(updated);
    saveToStorage(STORAGE_KEYS.TIMESHEETS, updated);
    setSyncStatus('syncing');
    saveTimesheetToCloud(t)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('offline'));
  };

  const handleUpdateTimesheet = (t: TimesheetEntry) => {
    const updated = timesheets.map((item) => (item.id === t.id ? t : item));
    setTimesheets(updated);
    saveToStorage(STORAGE_KEYS.TIMESHEETS, updated);
    setSyncStatus('syncing');
    saveTimesheetToCloud(t)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('offline'));
  };

  const handleSaveIssuedLetter = (letter: IssuedLetter) => {
    const updatedLetters = [letter, ...issuedLetters.filter((l) => l.id !== letter.id)];
    setIssuedLetters(updatedLetters);
    saveToStorage(STORAGE_KEYS.ISSUED_LETTERS, updatedLetters);

    // Auto-save into employee's profile archive so it stays for 5-10+ years
    setEmployees((prev) => {
      const nextEmps = prev.map((e) => {
        if (e.id === letter.employeeId) {
          const currentStaffLetters = e.issuedLetters || [];
          const updatedStaffLetters = [letter, ...currentStaffLetters.filter((l) => l.id !== letter.id)];
          const updatedEmp = { ...e, issuedLetters: updatedStaffLetters };
          saveEmployeeToCloud(updatedEmp);
          return updatedEmp;
        }
        return e;
      });
      saveToStorage(STORAGE_KEYS.EMPLOYEES, nextEmps);
      return nextEmps;
    });
  };

  const handleAddAttendance = (rec: AttendanceRecord) => {
    const updated = [rec, ...attendance];
    setAttendance(updated);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, updated);
    saveAttendanceToCloud(rec);
  };

  const handleUpdateAttendance = (rec: AttendanceRecord) => {
    const updated = attendance.map((a) => (a.id === rec.id ? rec : a));
    setAttendance(updated);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, updated);
    saveAttendanceToCloud(rec);
  };

  const handleAddLeave = (leave: LeaveRequest) => {
    const updated = [leave, ...leaves];
    setLeaves(updated);
    saveToStorage(STORAGE_KEYS.LEAVES, updated);
    saveLeaveToCloud(leave);
  };

  const handleUpdateLeave = (leave: LeaveRequest) => {
    const updated = leaves.map((l) => (l.id === leave.id ? leave : l));
    setLeaves(updated);
    saveToStorage(STORAGE_KEYS.LEAVES, updated);
    saveLeaveToCloud(leave);
  };

  const handleAddHoliday = (holiday: GovernmentHoliday) => {
    const updated = [...holidays.filter((h) => h.id !== holiday.id), holiday].sort((a, b) =>
      a.startDate.localeCompare(b.startDate)
    );
    setHolidays(updated);
    saveToStorage(STORAGE_KEYS.HOLIDAYS, updated);
    setSyncStatus('syncing');
    saveHolidayToCloud(holiday)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('offline'));
  };

  const handleUpdateHoliday = (holiday: GovernmentHoliday) => {
    const updated = holidays.map((h) => (h.id === holiday.id ? holiday : h)).sort((a, b) =>
      a.startDate.localeCompare(b.startDate)
    );
    setHolidays(updated);
    saveToStorage(STORAGE_KEYS.HOLIDAYS, updated);
    setSyncStatus('syncing');
    saveHolidayToCloud(holiday)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('offline'));
  };

  const handleDeleteHoliday = (holidayId: string) => {
    const updated = holidays.filter((h) => h.id !== holidayId);
    setHolidays(updated);
    saveToStorage(STORAGE_KEYS.HOLIDAYS, updated);
    setSyncStatus('syncing');
    deleteHolidayFromCloud(holidayId)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('offline'));
  };

  const handleAddVisit = (visit: VisitAuthorization) => {
    const updated = [visit, ...visits];
    setVisits(updated);
    saveToStorage(STORAGE_KEYS.VISITS, updated);
    saveVisitToCloud(visit);
  };

  const handleUpdateVisit = (visit: VisitAuthorization) => {
    const updated = visits.map((v) => (v.id === visit.id ? visit : v));
    setVisits(updated);
    saveToStorage(STORAGE_KEYS.VISITS, updated);
    saveVisitToCloud(visit);
  };

  const handleAddSeparation = (sep: SeparationRecord) => {
    const updated = [sep, ...separations];
    setSeparations(updated);
    saveToStorage(STORAGE_KEYS.SEPARATIONS, updated);
    saveSeparationToCloud(sep);

    // Update staff status to Separated
    const updatedEmployees = employees.map((e) =>
      e.id === sep.employeeId ? { ...e, status: 'Separated' as any } : e
    );
    setEmployees(updatedEmployees);
    saveToStorage(STORAGE_KEYS.EMPLOYEES, updatedEmployees);
  };

  const handleUpdateSeparation = (sep: SeparationRecord) => {
    const updated = separations.map((s) => (s.id === sep.id ? sep : s));
    setSeparations(updated);
    saveToStorage(STORAGE_KEYS.SEPARATIONS, updated);
    saveSeparationToCloud(sep);
  };

  const handleGeneratePayrollBatch = (month: string, monthKey: string) => {
    const activeStaff = employees.filter((e) => e.status !== 'Terminated' && e.status !== 'Separated');
    const newRecords: PayrollRecord[] = activeStaff.map((emp) => {
      const gross = emp.grossSalary;
      const mobile = emp.mobileAllowance ?? 1000;
      const travel = emp.travelAllowance ?? 2000;
      const basic = emp.basicSalary;
      const house = emp.houseRent;
      const med = emp.medicalAllowance;
      const conv = emp.conveyanceAllowance;
      const special = emp.specialProjectAllowance || 0;
      const totalEarn = gross + mobile + travel;

      const dailyRate = Math.round((gross / 26) * 100) / 100;
      const absentDays = 0;
      const absentDed = Math.round(dailyRate * absentDays);
      const advanceDed = emp.advanceBalance ?? 0;
      const pf = Math.round(basic * (emp.pfDeductionPercentage / 100));
      const tax = emp.taxDeduction || 0;
      const totalDed = pf + tax + advanceDed + absentDed;
      const net = Math.max(0, totalEarn - totalDed);

      return {
        id: `PAY-${monthKey}-${emp.id}`,
        month,
        monthKey,
        employeeId: emp.id,
        employeeName: emp.fullName,
        designation: emp.designation,
        department: emp.department,
        bankAccount: emp.bankDetails?.accountNumber || 'Pending Account',
        bankName: emp.bankDetails?.bankName || 'Brac Bank PLC',
        grossSalary: gross,
        mobileAllowance: mobile,
        travelAllowance: travel,
        basicSalary: basic,
        houseRent: house,
        medicalAllowance: med,
        conveyanceAllowance: conv,
        specialAllowance: special,
        bonus: 0,
        totalEarnings: totalEarn,
        absentDays,
        absentDeduction: absentDed,
        advanceDeduction: advanceDed,
        providentFund: pf,
        tax,
        loanDeduction: advanceDed,
        unpaidLeaveDeduction: absentDed,
        totalDeductions: totalDed,
        netSalary: net,
        paymentStatus: 'Paid',
        disbursementDate: new Date().toISOString().split('T')[0],
      };
    });

    const otherMonths = payroll.filter((p) => p.monthKey !== monthKey);
    const updated = [...newRecords, ...otherMonths];
    setPayroll(updated);
    saveToStorage(STORAGE_KEYS.PAYROLL, updated);
  };

  const handleUpdatePassword = (empId: string, newPass: string) => {
    const updated = {
      ...credentials,
      [empId]: {
        ...(credentials[empId] || { employeeId: empId, role: 'employee' as UserRole }),
        password: newPass,
        mustChangePassword: false,
      },
    };
    setCredentials(updated);
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updated));
  };

  const handleLoginSuccess = (emp: Employee, role: UserRole) => {
    setCurrentUser(emp);
    setCurrentRole(role);
    setIsAuthenticated(true);
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, emp.id);
    saveToStorage(STORAGE_KEYS.CURRENT_ROLE, role);
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');

    if (role === 'employee') {
      setActiveTab('profile');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  };

  const handleResetData = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setAttendance(INITIAL_ATTENDANCE);
    setLeaves(INITIAL_LEAVES);
    setTimesheets(INITIAL_TIMESHEETS);
    setPayroll(INITIAL_PAYROLL);
    setAppraisals(INITIAL_APPRAISALS);
    setExpenses(INITIAL_EXPENSES);
    setSeparations(INITIAL_SEPARATIONS);
    setVisits(INITIAL_VISITS);
    setCompany(INITIAL_COMPANY_PROFILE);
    localStorage.clear();
    window.location.reload();
  };

  // Pending approval counts
  const pendingLeavesCount = leaves.filter((l) => l.status === 'Pending').length;
  const pendingVisitsCount = visits.filter((v) => v.status === 'Pending').length;
  const pendingTimesheetsCount = timesheets.filter((t) => t.status === 'Submitted').length;
  const pendingExpensesCount = expenses.filter((e) => e.status === 'Pending').length;

  // Gate with Login Screen at start
  if (!isAuthenticated) {
    return (
      <LoginScreen
        employees={employees}
        credentials={credentials}
        company={company}
        onLoginSuccess={handleLoginSuccess}
        onUpdatePassword={handleUpdatePassword}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={(role) => {
          setCurrentRole(role);
          saveToStorage(STORAGE_KEYS.CURRENT_ROLE, role);
        }}
        currentUser={currentUser}
        onUserChange={(emp) => {
          setCurrentUser(emp);
          saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, emp.id);
        }}
        employees={employees}
        company={company}
        onQuickClockIn={() => setActiveTab('attendance')}
        onOpenQuickLetter={() => {
          setLetterDraftType('experience');
          setLetterDraftEmployee(currentUser);
          setActiveTab('letters');
        }}
        onOpenLogoEditor={() => setIsLogoEditorOpen(true)}
        onOpenMyProfile={() => setActiveTab('profile')}
        onLogout={handleLogout}
        pendingApprovalsCount={pendingLeavesCount + pendingVisitsCount + pendingTimesheetsCount + pendingExpensesCount}
        syncStatus={syncStatus}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Mobile Drawer Menu Button */}
        <div className="no-print lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-3.5 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          currentRole={currentRole}
          pendingLeavesCount={pendingLeavesCount}
          pendingVisitsCount={pendingVisitsCount}
          pendingTimesheetsCount={pendingTimesheetsCount}
          pendingExpensesCount={pendingExpensesCount}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                employees={employees}
                attendance={attendance}
                leaves={leaves}
                timesheets={timesheets}
                company={company}
                currentRole={currentRole}
                currentUser={currentUser}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onQuickClockIn={() => setActiveTab('attendance')}
                onOpenAddEmployee={() => {
                  setEmployeeToEdit(null);
                  setIsAddEmployeeOpen(true);
                }}
                onOpenLetterGenerator={() => {
                  setLetterDraftType('salary_certificate');
                  setActiveTab('letters');
                }}
              />
            )}

            {/* My Profile Tab: Accessible to all staff to update info and photo */}
            {activeTab === 'profile' && (
              <MyProfileView
                currentUser={currentUser}
                company={company}
                onUpdateProfile={handleUpdateCurrentUserProfile}
              />
            )}

            {/* Employee Database: HR Admin sees all, Line Manager sees their assigned subordinates */}
            {activeTab === 'employees' && (
              (currentRole === 'hr_admin' || currentRole === 'line_manager') ? (
                <EmployeeDirectory
                  employees={employees}
                  company={company}
                  currentRole={currentRole}
                  currentUser={currentUser}
                  jobLocations={jobLocations}
                  onOpenJobLocationsManager={() => setIsJobLocationsModalOpen(true)}
                  onSelectEmployee={(emp) => setSelectedEmployeeForDetail(emp)}
                  onAddEmployee={() => {
                    setEmployeeToEdit(null);
                    setIsAddEmployeeOpen(true);
                  }}
                  onEditEmployee={(emp) => {
                    setEmployeeToEdit(emp);
                    setIsAddEmployeeOpen(true);
                  }}
                  onInitiateSeparation={(emp) => {
                    setSeparationInitialStaffId(emp.id);
                    setActiveTab('separation');
                  }}
                  onGenerateLetter={(emp, type) => {
                    setLetterDraftEmployee(emp);
                    setLetterDraftType(type as LetterType);
                    setActiveTab('letters');
                  }}
                />
              ) : (
                <MyProfileView
                  currentUser={currentUser}
                  company={company}
                  onUpdateProfile={handleUpdateCurrentUserProfile}
                />
              )
            )}

            {activeTab === 'attendance' && (
              <AttendanceModule
                employees={employees}
                attendance={attendance}
                currentUser={currentUser}
                currentRole={currentRole}
                jobLocations={jobLocations}
                onAddAttendance={handleAddAttendance}
                onUpdateAttendance={handleUpdateAttendance}
              />
            )}

            {activeTab === 'timesheets' && (
              <TimesheetModule
                timesheets={timesheets}
                employees={employees}
                currentUser={currentUser}
                currentRole={currentRole}
                jobLocations={jobLocations}
                onAddTimesheet={handleAddTimesheet}
                onUpdateTimesheet={handleUpdateTimesheet}
              />
            )}

            {activeTab === 'leave' && (
              <LeaveModule
                leaves={leaves}
                leaveBalances={leaveBalances}
                employees={employees}
                currentUser={currentUser}
                currentRole={currentRole}
                jobLocations={jobLocations}
                holidays={holidays}
                onAddLeave={handleAddLeave}
                onUpdateLeave={handleUpdateLeave}
                onPrintLeaveForm={(l) => {
                  const target = employees.find((e) => e.id === l.employeeId);
                  setLetterDraftEmployee(target || currentUser);
                  setLetterDraftType('leave_application');
                  setActiveTab('letters');
                }}
                onAddHoliday={handleAddHoliday}
                onUpdateHoliday={handleUpdateHoliday}
                onDeleteHoliday={handleDeleteHoliday}
              />
            )}

            {activeTab === 'visits' && (
              <VisitModule
                visits={visits}
                employees={employees}
                company={company}
                currentUser={currentUser}
                currentRole={currentRole}
                onAddVisit={handleAddVisit}
                onUpdateVisit={handleUpdateVisit}
              />
            )}

            {activeTab === 'payroll' && (
              <PayrollModule
                payroll={payroll}
                employees={employees}
                company={company}
                currentRole={currentRole}
                currentUser={currentUser}
                onGeneratePayrollBatch={handleGeneratePayrollBatch}
                onUpdatePayrollStatus={(id, status) => {
                  const updated = payroll.map((p) =>
                    p.id === id ? { ...p, paymentStatus: status } : p
                  );
                  setPayroll(updated);
                  saveToStorage(STORAGE_KEYS.PAYROLL, updated);
                }}
                onUpdateEmployee={handleSaveEmployee}
              />
            )}

            {activeTab === 'performance' && (
              <PerformanceModule
                appraisals={appraisals}
                employees={employees}
                currentUser={currentUser}
                currentRole={currentRole}
                onAddAppraisal={(app) => {
                  const updated = [app, ...appraisals];
                  setAppraisals(updated);
                  saveToStorage(STORAGE_KEYS.APPRAISALS, updated);
                }}
                onUpdateAppraisal={(app) => {
                  const updated = appraisals.map((a) => (a.id === app.id ? app : a));
                  setAppraisals(updated);
                  saveToStorage(STORAGE_KEYS.APPRAISALS, updated);
                }}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseModule
                expenses={expenses}
                employees={employees}
                company={company}
                currentUser={currentUser}
                currentRole={currentRole}
                onAddExpense={(exp) => {
                  const updated = [exp, ...expenses];
                  setExpenses(updated);
                  saveToStorage(STORAGE_KEYS.EXPENSES, updated);
                }}
                onUpdateExpense={(exp) => {
                  const updated = expenses.map((e) => (e.id === exp.id ? exp : e));
                  setExpenses(updated);
                  saveToStorage(STORAGE_KEYS.EXPENSES, updated);
                }}
              />
            )}

            {/* Separation: Strictly HR Admin */}
            {activeTab === 'separation' && currentRole === 'hr_admin' && (
              <SeparationModule
                separations={separations}
                employees={employees}
                company={company}
                currentRole={currentRole}
                currentUser={currentUser}
                initialStaffId={separationInitialStaffId}
                onAddSeparation={handleAddSeparation}
                onUpdateSeparation={handleUpdateSeparation}
                onGenerateLetter={(emp, type) => {
                  setLetterDraftEmployee(emp);
                  setLetterDraftType(type as LetterType);
                  setActiveTab('letters');
                }}
              />
            )}

            {/* Official Letters & Legal Forms Generator: Strictly HR Admin Only */}
            {activeTab === 'letters' && currentRole === 'hr_admin' && (
              <OfficialLettersModule
                employees={employees}
                company={company}
                initialLetterType={letterDraftType}
                initialEmployee={letterDraftEmployee}
                issuedLetters={issuedLetters}
                onSaveIssuedLetter={handleSaveIssuedLetter}
              />
            )}

            {/* Reports: HR Admin & Line Manager */}
            {activeTab === 'reports' && currentRole !== 'employee' && (
              <ReportsModule
                employees={employees}
                attendance={attendance}
                leaves={leaves}
                separations={separations}
                company={company}
              />
            )}

            {/* Settings: Strictly HR Admin */}
            {activeTab === 'settings' && currentRole === 'hr_admin' && (
              <CompanySettings
                company={company}
                onUpdateCompany={(c) => {
                  setCompany(c);
                  saveToStorage(STORAGE_KEYS.COMPANY, c);
                }}
                onResetData={handleResetData}
                jobLocations={jobLocations}
                employees={employees}
                onUpdateJobLocations={handleUpdateJobLocations}
              />
            )}
          </div>
        </main>
      </div>

      {/* Employee Details Modal Drawer (HR Admin only) */}
      {selectedEmployeeForDetail && (
        <EmployeeDetailModal
          employee={selectedEmployeeForDetail}
          onClose={() => setSelectedEmployeeForDetail(null)}
          company={company}
          currentRole={currentRole}
          issuedLetters={issuedLetters}
          onUpdateEmployee={handleSaveEmployee}
          onEdit={(emp) => {
            setEmployeeToEdit(emp);
            setIsAddEmployeeOpen(true);
          }}
          onInitiateSeparation={(emp) => {
            setSelectedEmployeeForDetail(null);
            setSeparationInitialStaffId(emp.id);
            setActiveTab('separation');
          }}
          onGenerateLetter={(emp, letterType) => {
            setSelectedEmployeeForDetail(null);
            setLetterDraftEmployee(emp);
            setLetterDraftType(letterType as LetterType);
            setActiveTab('letters');
          }}
        />
      )}

      {/* Add / Edit Employee Modal (HR Admin only) */}
      {isAddEmployeeOpen && (
        <AddEmployeeModal
          isOpen={isAddEmployeeOpen}
          onClose={() => {
            setIsAddEmployeeOpen(false);
            setEmployeeToEdit(null);
          }}
          onSave={handleSaveEmployee}
          employeeToEdit={employeeToEdit}
          existingCount={employees.length}
          employees={employees}
          jobLocations={jobLocations}
        />
      )}

      {/* Organization Logo Customizer Modal (HR Admin) */}
      <LogoEditorModal
        isOpen={isLogoEditorOpen}
        onClose={() => setIsLogoEditorOpen(false)}
        currentLogoUrl={company.logoUrl || '/leedo-logo.svg'}
        onSaveLogo={handleSaveLogo}
        organizationName={company.name}
      />

      {/* Job Locations & Centers Management Modal (HR Admin) */}
      <JobLocationsManagerModal
        isOpen={isJobLocationsModalOpen}
        onClose={() => setIsJobLocationsModalOpen(false)}
        jobLocations={jobLocations}
        employees={employees}
        onUpdateJobLocations={handleUpdateJobLocations}
      />
    </div>
  );
}
