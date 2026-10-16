import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocFromServer 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  LeaveBalance, 
  TimesheetEntry, 
  PayrollRecord, 
  PerformanceAppraisal, 
  ExpenseClaim, 
  SeparationRecord,
  VisitAuthorization,
  UserCredential,
  IssuedLetter,
  EmployeeDocument
} from '../types/hris';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_TIMESHEETS,
  INITIAL_PAYROLL,
  INITIAL_APPRAISALS,
  INITIAL_EXPENSES,
  INITIAL_SEPARATIONS,
  INITIAL_VISITS,
} from '../data/mockData';
import { isValidLeedoStaffId, LEGACY_MOCK_NAMES, LEGACY_MOCK_IDS } from './storage';

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

// Fetch all employees from Cloud Firestore (strictly authentic LEEDO staff)
export async function fetchEmployeesFromCloud(): Promise<Employee[]> {
  try {
    const snap = await getDocs(collection(db, 'employees'));
    if (!snap.empty) {
      const list: Employee[] = [];
      for (const d of snap.docs) {
        const emp = d.data() as Employee;
        const isMock = !emp || !emp.id || !isValidLeedoStaffId(emp.id) || LEGACY_MOCK_NAMES.has((emp.fullName || '').trim()) || LEGACY_MOCK_IDS.has(emp.id);
        if (isMock) {
          // Clean up ghost doc from Firestore
          deleteDoc(doc(db, 'employees', d.id)).catch(() => {});
        } else {
          list.push(emp);
        }
      }
      if (list.length >= 80) {
        return list;
      }
    }
    return INITIAL_EMPLOYEES;
  } catch (err) {
    console.warn('Could not read from Firestore, using local data:', err);
    return INITIAL_EMPLOYEES;
  }
}

export async function saveEmployeeToCloud(emp: Employee): Promise<void> {
  try {
    if (!isValidLeedoStaffId(emp.id)) return;
    await setDoc(doc(db, 'employees', emp.id), emp);
  } catch (err) {
    console.warn('Failed to save employee to Firestore:', err);
  }
}

export async function fetchLeavesFromCloud(): Promise<LeaveRequest[]> {
  try {
    const snap = await getDocs(collection(db, 'leaves'));
    if (!snap.empty) {
      const list: LeaveRequest[] = [];
      for (const d of snap.docs) {
        const lv = d.data() as LeaveRequest;
        if (lv && lv.employeeId && isValidLeedoStaffId(lv.employeeId) && !LEGACY_MOCK_NAMES.has((lv.employeeName || '').trim())) {
          list.push(lv);
        } else {
          deleteDoc(doc(db, 'leaves', d.id)).catch(() => {});
        }
      }
      return list;
    }
    for (const l of INITIAL_LEAVES) {
      await setDoc(doc(db, 'leaves', l.id), l);
    }
    return INITIAL_LEAVES;
  } catch {
    return INITIAL_LEAVES;
  }
}

export async function saveLeaveToCloud(leave: LeaveRequest): Promise<void> {
  try {
    if (!isValidLeedoStaffId(leave.employeeId)) return;
    await setDoc(doc(db, 'leaves', leave.id), leave);
  } catch (err) {
    console.warn('Failed to save leave to cloud:', err);
  }
}

export async function fetchAttendanceFromCloud(): Promise<AttendanceRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'attendance'));
    if (!snap.empty) {
      const list: AttendanceRecord[] = [];
      for (const d of snap.docs) {
        const a = d.data() as AttendanceRecord;
        if (a && a.employeeId && isValidLeedoStaffId(a.employeeId) && !LEGACY_MOCK_NAMES.has((a.employeeName || '').trim())) {
          list.push(a);
        } else {
          deleteDoc(doc(db, 'attendance', d.id)).catch(() => {});
        }
      }
      return list;
    }
    for (const a of INITIAL_ATTENDANCE) {
      await setDoc(doc(db, 'attendance', a.id), a);
    }
    return INITIAL_ATTENDANCE;
  } catch {
    return INITIAL_ATTENDANCE;
  }
}

export async function saveAttendanceToCloud(record: AttendanceRecord): Promise<void> {
  try {
    if (!isValidLeedoStaffId(record.employeeId)) return;
    await setDoc(doc(db, 'attendance', record.id), record);
  } catch (err) {
    console.warn('Failed to save attendance to cloud:', err);
  }
}

export async function fetchSeparationsFromCloud(): Promise<SeparationRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'separations'));
    if (!snap.empty) {
      const list: SeparationRecord[] = [];
      for (const d of snap.docs) {
        const s = d.data() as SeparationRecord;
        if (s && s.employeeId && isValidLeedoStaffId(s.employeeId) && !LEGACY_MOCK_NAMES.has((s.employeeName || '').trim())) {
          list.push(s);
        } else {
          deleteDoc(doc(db, 'separations', d.id)).catch(() => {});
        }
      }
      return list;
    }
    return INITIAL_SEPARATIONS;
  } catch {
    return INITIAL_SEPARATIONS;
  }
}

export async function saveSeparationToCloud(sep: SeparationRecord): Promise<void> {
  try {
    if (!isValidLeedoStaffId(sep.employeeId)) return;
    await setDoc(doc(db, 'separations', sep.id), sep);
  } catch (err) {
    console.warn('Failed to save separation to cloud:', err);
  }
}

export async function fetchVisitsFromCloud(): Promise<VisitAuthorization[]> {
  try {
    const snap = await getDocs(collection(db, 'visits'));
    if (!snap.empty) {
      const list: VisitAuthorization[] = [];
      for (const d of snap.docs) {
        const v = d.data() as VisitAuthorization;
        if (v && v.employeeId && isValidLeedoStaffId(v.employeeId) && !LEGACY_MOCK_NAMES.has((v.employeeName || '').trim())) {
          list.push(v);
        } else {
          deleteDoc(doc(db, 'visits', d.id)).catch(() => {});
        }
      }
      return list;
    }
    for (const v of INITIAL_VISITS) {
      await setDoc(doc(db, 'visits', v.id), v);
    }
    return INITIAL_VISITS;
  } catch {
    return INITIAL_VISITS;
  }
}

export async function saveVisitToCloud(visit: VisitAuthorization): Promise<void> {
  try {
    if (!isValidLeedoStaffId(visit.employeeId)) return;
    await setDoc(doc(db, 'visits', visit.id), visit);
  } catch (err) {
    console.warn('Failed to save visit to cloud:', err);
  }
}

// Issued Official HR Letters & Legal Notices (Stored in cloud for 5-10+ years archival)
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
    await setDoc(doc(db, 'issued_letters', letter.id), letter);
  } catch (err) {
    console.warn('Failed to save issued letter to cloud:', err);
  }
}
