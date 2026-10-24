import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocFromServer,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  TimesheetEntry, 
  PayrollRecord, 
  PerformanceAppraisal, 
  ExpenseClaim, 
  SeparationRecord, 
  VisitAuthorization, 
  IssuedLetter, 
  CompanyProfile,
  LEEDO_JOB_LOCATIONS,
  GovernmentHoliday
} from '../types/hris';
import { OFFICIAL_BANGLADESH_HOLIDAYS_2026 } from '../data/bangladeshHolidays';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_TIMESHEETS,
  INITIAL_SEPARATIONS,
  INITIAL_VISITS,
  INITIAL_COMPANY_PROFILE
} from '../data/mockData';
import { LEEDO_MASTER_EMPLOYEES } from '../data/leedoStaffDatabase';
import { isValidLeedoStaffId, LEGACY_MOCK_NAMES, LEGACY_MOCK_IDS, STORAGE_KEYS, saveToStorage } from './storage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore as per Firebase skill guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running with offline persistence fallback.');
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// 1. EMPLOYEES & STAFF ROSTER SYNC
// ---------------------------------------------------------------------------

// Fetch all employees from Cloud Firestore. If Firestore is empty, auto-seed the master staff database.
export async function fetchEmployeesFromCloud(): Promise<Employee[]> {
  const path = 'employees';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: Employee[] = [];
      for (const d of snap.docs) {
        const emp = d.data() as Employee;
        const isMock = !emp || !emp.id || !isValidLeedoStaffId(emp.id) || LEGACY_MOCK_NAMES.has((emp.fullName || '').trim()) || LEGACY_MOCK_IDS.has(emp.id);
        if (isMock) {
          deleteDoc(doc(db, path, d.id)).catch(() => {});
        } else {
          list.push(emp);
        }
      }
      if (list.length > 0) {
        return list;
      }
    }
    
    // Auto-seed initial master staff with complete duty roster to Firestore
    console.log('Seeding master employee roster into Firestore cloud...');
    await seedMasterEmployeesToCloud();
    return LEEDO_MASTER_EMPLOYEES;
  } catch (err) {
    console.warn('Could not read employees from Firestore, falling back to local data:', err);
    return LEEDO_MASTER_EMPLOYEES;
  }
}

export async function seedMasterEmployeesToCloud(): Promise<void> {
  try {
    for (const emp of LEEDO_MASTER_EMPLOYEES) {
      const sanitized: Employee = {
        ...emp,
        jobLocations: emp.jobLocations && emp.jobLocations.length > 0 ? emp.jobLocations : [emp.workStation || 'Head Office'],
        dutyDays: emp.dutyDays && emp.dutyDays.length > 0 ? emp.dutyDays : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
        shiftStartTime: emp.shiftStartTime || '10:00',
        shiftEndTime: emp.shiftEndTime || '18:00',
        dailyDutyHours: emp.dailyDutyHours || 8,
        weeklyDutyDaysCount: emp.weeklyDutyDaysCount || 6,
        casualLeaveQuota: emp.casualLeaveQuota ?? 16,
        sickLeaveQuota: emp.sickLeaveQuota ?? 14,
        mobileAllowance: emp.mobileAllowance ?? 1000,
        travelAllowance: emp.travelAllowance ?? 2000,
        advanceBalance: emp.advanceBalance ?? 0,
      };
      await setDoc(doc(db, 'employees', sanitized.id), sanitized);
    }
    console.log('Master employees seeded successfully to Firestore.');
  } catch (err) {
    console.warn('Failed seeding master staff to cloud:', err);
  }
}

export function subscribeEmployeesFromCloud(onData: (employees: Employee[]) => void): () => void {
  const path = 'employees';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: Employee[] = [];
        snapshot.forEach((d) => {
          const emp = d.data() as Employee;
          if (emp && emp.id && isValidLeedoStaffId(emp.id) && !LEGACY_MOCK_NAMES.has((emp.fullName || '').trim())) {
            list.push(emp);
          }
        });
        if (list.length > 0) {
          onData(list);
        }
      }
    },
    (error) => {
      console.warn('Firestore onSnapshot error on employees:', error);
    }
  );
}

export async function saveEmployeeToCloud(emp: Employee): Promise<void> {
  const path = `employees/${emp.id}`;
  try {
    if (!isValidLeedoStaffId(emp.id)) return;
    await setDoc(doc(db, 'employees', emp.id), emp, { merge: true });
  } catch (err) {
    console.warn('Failed to save employee to Firestore:', err);
  }
}

// ---------------------------------------------------------------------------
// 2. STAFF ROSTER & PROJECT TIMESHEETS SYNC
// ---------------------------------------------------------------------------

export async function fetchTimesheetsFromCloud(): Promise<TimesheetEntry[]> {
  const path = 'timesheets';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: TimesheetEntry[] = [];
      for (const d of snap.docs) {
        const t = d.data() as TimesheetEntry;
        if (t && t.id && t.employeeId && isValidLeedoStaffId(t.employeeId) && !LEGACY_MOCK_NAMES.has((t.employeeName || '').trim())) {
          list.push(t);
        } else {
          deleteDoc(doc(db, path, d.id)).catch(() => {});
        }
      }
      if (list.length > 0) {
        return list;
      }
    }

    // Auto-seed initial timesheets
    for (const ts of INITIAL_TIMESHEETS) {
      if (isValidLeedoStaffId(ts.employeeId)) {
        await setDoc(doc(db, 'timesheets', ts.id), ts);
      }
    }
    return INITIAL_TIMESHEETS;
  } catch (err) {
    console.warn('Could not read timesheets from Firestore:', err);
    return INITIAL_TIMESHEETS;
  }
}

export function subscribeTimesheetsFromCloud(onData: (timesheets: TimesheetEntry[]) => void): () => void {
  const path = 'timesheets';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: TimesheetEntry[] = [];
        snapshot.forEach((d) => {
          const t = d.data() as TimesheetEntry;
          if (t && t.id && t.employeeId && isValidLeedoStaffId(t.employeeId) && !LEGACY_MOCK_NAMES.has((t.employeeName || '').trim())) {
            list.push(t);
          }
        });
        if (list.length > 0) {
          onData(list);
        }
      }
    },
    (error) => {
      console.warn('Firestore onSnapshot error on timesheets:', error);
    }
  );
}

export async function saveTimesheetToCloud(ts: TimesheetEntry): Promise<void> {
  const path = `timesheets/${ts.id}`;
  try {
    if (!isValidLeedoStaffId(ts.employeeId)) return;
    await setDoc(doc(db, 'timesheets', ts.id), ts, { merge: true });
  } catch (err) {
    console.warn('Failed to save timesheet to cloud:', err);
  }
}

export async function deleteTimesheetFromCloud(tsId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'timesheets', tsId));
  } catch (err) {
    console.warn('Failed to delete timesheet from cloud:', err);
  }
}

// ---------------------------------------------------------------------------
// 3. DAILY ATTENDANCE & PUNCHES SYNC
// ---------------------------------------------------------------------------

export async function fetchAttendanceFromCloud(): Promise<AttendanceRecord[]> {
  const path = 'attendance';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: AttendanceRecord[] = [];
      for (const d of snap.docs) {
        const a = d.data() as AttendanceRecord;
        if (a && a.employeeId && isValidLeedoStaffId(a.employeeId) && !LEGACY_MOCK_NAMES.has((a.employeeName || '').trim())) {
          list.push(a);
        } else {
          deleteDoc(doc(db, path, d.id)).catch(() => {});
        }
      }
      return list;
    }
    for (const a of INITIAL_ATTENDANCE) {
      if (isValidLeedoStaffId(a.employeeId)) {
        await setDoc(doc(db, 'attendance', a.id), a);
      }
    }
    return INITIAL_ATTENDANCE;
  } catch {
    return INITIAL_ATTENDANCE;
  }
}

export function subscribeAttendanceFromCloud(onData: (attendance: AttendanceRecord[]) => void): () => void {
  const path = 'attendance';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((d) => {
          const a = d.data() as AttendanceRecord;
          if (a && a.employeeId && isValidLeedoStaffId(a.employeeId) && !LEGACY_MOCK_NAMES.has((a.employeeName || '').trim())) {
            list.push(a);
          }
        });
        if (list.length > 0) {
          onData(list);
        }
      }
    },
    (error) => {
      console.warn('Firestore onSnapshot error on attendance:', error);
    }
  );
}

export async function saveAttendanceToCloud(record: AttendanceRecord): Promise<void> {
  try {
    if (!isValidLeedoStaffId(record.employeeId)) return;
    await setDoc(doc(db, 'attendance', record.id), record, { merge: true });
  } catch (err) {
    console.warn('Failed to save attendance to cloud:', err);
  }
}

// ---------------------------------------------------------------------------
// 4. LEAVES SYNC
// ---------------------------------------------------------------------------

export async function fetchLeavesFromCloud(): Promise<LeaveRequest[]> {
  const path = 'leaves';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: LeaveRequest[] = [];
      for (const d of snap.docs) {
        const lv = d.data() as LeaveRequest;
        if (lv && lv.employeeId && isValidLeedoStaffId(lv.employeeId) && !LEGACY_MOCK_NAMES.has((lv.employeeName || '').trim())) {
          list.push(lv);
        } else {
          deleteDoc(doc(db, path, d.id)).catch(() => {});
        }
      }
      return list;
    }
    for (const l of INITIAL_LEAVES) {
      if (isValidLeedoStaffId(l.employeeId)) {
        await setDoc(doc(db, 'leaves', l.id), l);
      }
    }
    return INITIAL_LEAVES;
  } catch {
    return INITIAL_LEAVES;
  }
}

export function subscribeLeavesFromCloud(onData: (leaves: LeaveRequest[]) => void): () => void {
  const path = 'leaves';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: LeaveRequest[] = [];
        snapshot.forEach((d) => {
          const lv = d.data() as LeaveRequest;
          if (lv && lv.employeeId && isValidLeedoStaffId(lv.employeeId) && !LEGACY_MOCK_NAMES.has((lv.employeeName || '').trim())) {
            list.push(lv);
          }
        });
        if (list.length > 0) {
          onData(list);
        }
      }
    },
    (error) => {
      console.warn('Firestore onSnapshot error on leaves:', error);
    }
  );
}

export async function saveLeaveToCloud(leave: LeaveRequest): Promise<void> {
  try {
    if (!isValidLeedoStaffId(leave.employeeId)) return;
    await setDoc(doc(db, 'leaves', leave.id), leave, { merge: true });
  } catch (err) {
    console.warn('Failed to save leave to cloud:', err);
  }
}

// ---------------------------------------------------------------------------
// 5. SEPARATIONS SYNC
// ---------------------------------------------------------------------------

export async function fetchSeparationsFromCloud(): Promise<SeparationRecord[]> {
  const path = 'separations';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: SeparationRecord[] = [];
      for (const d of snap.docs) {
        const s = d.data() as SeparationRecord;
        if (s && s.employeeId && isValidLeedoStaffId(s.employeeId) && !LEGACY_MOCK_NAMES.has((s.employeeName || '').trim())) {
          list.push(s);
        } else {
          deleteDoc(doc(db, path, d.id)).catch(() => {});
        }
      }
      return list;
    }
    return INITIAL_SEPARATIONS;
  } catch {
    return INITIAL_SEPARATIONS;
  }
}

export function subscribeSeparationsFromCloud(onData: (separations: SeparationRecord[]) => void): () => void {
  const path = 'separations';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: SeparationRecord[] = [];
        snapshot.forEach((d) => {
          const s = d.data() as SeparationRecord;
          if (s && s.employeeId && isValidLeedoStaffId(s.employeeId) && !LEGACY_MOCK_NAMES.has((s.employeeName || '').trim())) {
            list.push(s);
          }
        });
        if (list.length > 0) {
          onData(list);
        }
      }
    },
    (error) => {
      console.warn('Firestore onSnapshot error on separations:', error);
    }
  );
}

export async function saveSeparationToCloud(sep: SeparationRecord): Promise<void> {
  try {
    if (!isValidLeedoStaffId(sep.employeeId)) return;
    await setDoc(doc(db, 'separations', sep.id), sep, { merge: true });
  } catch (err) {
    console.warn('Failed to save separation to cloud:', err);
  }
}

// ---------------------------------------------------------------------------
// 6. VISITS SYNC
// ---------------------------------------------------------------------------

export async function fetchVisitsFromCloud(): Promise<VisitAuthorization[]> {
  const path = 'visits';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: VisitAuthorization[] = [];
      for (const d of snap.docs) {
        const v = d.data() as VisitAuthorization;
        if (v && v.employeeId && isValidLeedoStaffId(v.employeeId) && !LEGACY_MOCK_NAMES.has((v.employeeName || '').trim())) {
          list.push(v);
        } else {
          deleteDoc(doc(db, path, d.id)).catch(() => {});
        }
      }
      return list;
    }
    for (const v of INITIAL_VISITS) {
      if (isValidLeedoStaffId(v.employeeId)) {
        await setDoc(doc(db, 'visits', v.id), v);
      }
    }
    return INITIAL_VISITS;
  } catch {
    return INITIAL_VISITS;
  }
}

export function subscribeVisitsFromCloud(onData: (visits: VisitAuthorization[]) => void): () => void {
  const path = 'visits';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: VisitAuthorization[] = [];
        snapshot.forEach((d) => {
          const v = d.data() as VisitAuthorization;
          if (v && v.employeeId && isValidLeedoStaffId(v.employeeId) && !LEGACY_MOCK_NAMES.has((v.employeeName || '').trim())) {
            list.push(v);
          }
        });
        if (list.length > 0) {
          onData(list);
        }
      }
    },
    (error) => {
      console.warn('Firestore onSnapshot error on visits:', error);
    }
  );
}

export async function saveVisitToCloud(visit: VisitAuthorization): Promise<void> {
  try {
    if (!isValidLeedoStaffId(visit.employeeId)) return;
    await setDoc(doc(db, 'visits', visit.id), visit, { merge: true });
  } catch (err) {
    console.warn('Failed to save visit to cloud:', err);
  }
}

// ---------------------------------------------------------------------------
// 7. COMPANY PROFILE & JOB LOCATIONS SYNC
// ---------------------------------------------------------------------------

export interface CloudCompanyConfig {
  company: CompanyProfile;
  jobLocations: string[];
}

export async function fetchCompanyConfigFromCloud(): Promise<CloudCompanyConfig | null> {
  try {
    const snap = await getDocs(collection(db, 'company_settings'));
    if (!snap.empty) {
      const docData = snap.docs.find(d => d.id === 'main_profile')?.data();
      if (docData) {
        return {
          company: (docData.company || INITIAL_COMPANY_PROFILE) as CompanyProfile,
          jobLocations: (docData.jobLocations || [...LEEDO_JOB_LOCATIONS]) as string[],
        };
      }
    }
    return null;
  } catch (err) {
    console.warn('Could not read company settings from Firestore:', err);
    return null;
  }
}

export async function saveCompanyConfigToCloud(company: CompanyProfile, jobLocations: string[]): Promise<void> {
  try {
    await setDoc(doc(db, 'company_settings', 'main_profile'), {
      id: 'main_profile',
      company,
      jobLocations,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to save company settings to Firestore:', err);
  }
}

// ---------------------------------------------------------------------------
// 8. ISSUED OFFICIAL LETTERS ARCHIVE
// ---------------------------------------------------------------------------

export async function fetchIssuedLettersFromCloud(): Promise<IssuedLetter[]> {
  try {
    const snap = await getDocs(collection(db, 'issued_letters'));
    if (!snap.empty) {
      const list: IssuedLetter[] = [];
      for (const d of snap.docs) {
        const l = d.data() as IssuedLetter;
        if (l && l.employeeId && isValidLeedoStaffId(l.employeeId)) {
          list.push(l);
        }
      }
      return list;
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveIssuedLetterToCloud(letter: IssuedLetter): Promise<void> {
  try {
    await setDoc(doc(db, 'issued_letters', letter.id), letter, { merge: true });
  } catch (err) {
    console.warn('Failed to save issued letter to cloud:', err);
  }
}

// ---------------------------------------------------------------------------
// 9. GOVERNMENT & PUBLIC HOLIDAYS SYNC
// ---------------------------------------------------------------------------

export async function fetchHolidaysFromCloud(): Promise<GovernmentHoliday[]> {
  const path = 'holidays';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: GovernmentHoliday[] = [];
      for (const d of snap.docs) {
        const h = d.data() as GovernmentHoliday;
        if (h && h.id && h.title) {
          list.push(h);
        }
      }
      if (list.length > 0) {
        return list.sort((a, b) => a.startDate.localeCompare(b.startDate));
      }
    }
    // Auto-seed initial official holidays
    for (const h of OFFICIAL_BANGLADESH_HOLIDAYS_2026) {
      await setDoc(doc(db, 'holidays', h.id), h);
    }
    return OFFICIAL_BANGLADESH_HOLIDAYS_2026;
  } catch (err) {
    console.warn('Could not read holidays from Firestore:', err);
    return OFFICIAL_BANGLADESH_HOLIDAYS_2026;
  }
}

export function subscribeHolidaysFromCloud(onData: (holidays: GovernmentHoliday[]) => void): () => void {
  const path = 'holidays';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (!snapshot.empty) {
        const list: GovernmentHoliday[] = [];
        snapshot.forEach((d) => {
          const h = d.data() as GovernmentHoliday;
          if (h && h.id && h.title) {
            list.push(h);
          }
        });
        if (list.length > 0) {
          onData(list.sort((a, b) => a.startDate.localeCompare(b.startDate)));
        }
      }
    },
    (error) => {
      console.warn('Firestore onSnapshot error on holidays:', error);
    }
  );
}

export async function saveHolidayToCloud(holiday: GovernmentHoliday): Promise<void> {
  try {
    await setDoc(doc(db, 'holidays', holiday.id), holiday, { merge: true });
  } catch (err) {
    console.warn('Failed to save holiday to cloud:', err);
  }
}

export async function deleteHolidayFromCloud(holidayId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'holidays', holidayId));
  } catch (err) {
    console.warn('Failed to delete holiday from cloud:', err);
  }
}

