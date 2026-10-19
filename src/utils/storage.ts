import { Employee } from '../types/hris';
import { LEEDO_MASTER_EMPLOYEES } from '../data/leedoStaffDatabase';

export const STORAGE_KEYS = {
  EMPLOYEES: 'prohris_employees_v2',
  ATTENDANCE: 'prohris_attendance_v2',
  LEAVES: 'prohris_leaves_v2',
  LEAVE_BALANCES: 'prohris_leave_balances_v2',
  TIMESHEETS: 'prohris_timesheets_v2',
  PAYROLL: 'prohris_payroll_v2',
  APPRAISALS: 'prohris_appraisals_v2',
  EXPENSES: 'prohris_expenses_v2',
  SEPARATIONS: 'prohris_separations_v2',
  VISITS: 'prohris_visits_v2',
  ISSUED_LETTERS: 'prohris_issued_letters_v2',
  COMPANY: 'prohris_company_v2',
  CURRENT_USER_ID: 'prohris_current_user_id_v2',
  CURRENT_ROLE: 'prohris_current_role_v2',
  CREDENTIALS: 'prohris_credentials_v2',
  AUTH_SESSION: 'prohris_auth_session_v2',
  MIGRATION_VERSION: 'prohris_migration_version_v5_0',
  JOB_LOCATIONS: 'prohris_job_locations_v2',
};

export const VALID_LEEDO_ID_MAP = new Map<string, string>(
  LEEDO_MASTER_EMPLOYEES.map((e) => [e.id.trim(), e.fullName.trim()])
);

export function isValidLeedoStaffId(id: string | null | undefined): boolean {
  if (!id) return false;
  return VALID_LEEDO_ID_MAP.has(String(id).trim());
}

export const LEGACY_MOCK_IDS = new Set([
  'LEEDO-101',
  'LEEDO-102',
  'LEEDO-103',
  'LEEDO-104',
  'LEEDO-105',
  'LEEDO-106',
  'LEEDO-098',
  'LEEDO-099',
]);

export const LEGACY_MOCK_NAMES = new Set([
  'Anisur Rahman',
  'Nusrat Jahan Chowdhury',
  'Tanvir Hossain Mazumder',
  'Sabrina Akter Popy',
  'Kamrul Hasan Emon',
  'Tahmina Parveen',
  'Mohammad Ali',
]);

export function isLegacyMockEmployee(emp: Partial<Employee> | null | undefined): boolean {
  if (!emp) return false;
  if (emp.id && (LEGACY_MOCK_IDS.has(emp.id.trim()) || !VALID_LEEDO_ID_MAP.has(emp.id.trim()))) return true;
  if (emp.fullName && LEGACY_MOCK_NAMES.has(emp.fullName.trim())) return true;
  return false;
}

// Guarantee LEEDO master employees are always loaded and synced with any local changes
export function loadMergedEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    let parsed: Employee[] = [];
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = [];
      }
    }

    // Filter out legacy mock employees (Anisur, Nusrat, Tanvir, Sabrina, Kamrul, Tahmina)
    const validExisting = Array.isArray(parsed)
      ? parsed.filter((e) => e && e.id && !isLegacyMockEmployee(e))
      : [];

    const existingMap = new Map<string, Employee>();
    validExisting.forEach((e) => {
      existingMap.set(e.id.trim(), e);
    });

    let modified = validExisting.length !== (Array.isArray(parsed) ? parsed.length : 0);

    // Ensure every single master employee from leedoStaffDatabase is present
    LEEDO_MASTER_EMPLOYEES.forEach((masterEmp) => {
      const existing = existingMap.get(masterEmp.id.trim());
      if (!existing) {
        existingMap.set(masterEmp.id.trim(), {
          ...masterEmp,
          jobLocations: masterEmp.jobLocations || [masterEmp.workStation || 'Head Office'],
          dutyDays: masterEmp.dutyDays || ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
          shiftStartTime: masterEmp.shiftStartTime || '10:00',
          shiftEndTime: masterEmp.shiftEndTime || '18:00',
          dailyDutyHours: masterEmp.dailyDutyHours || 8,
          weeklyDutyDaysCount: masterEmp.weeklyDutyDaysCount || 6,
          casualLeaveQuota: masterEmp.casualLeaveQuota || 16,
          sickLeaveQuota: masterEmp.sickLeaveQuota || 14,
          mobileAllowance: masterEmp.mobileAllowance ?? 1000,
          travelAllowance: masterEmp.travelAllowance ?? 2000,
        });
        modified = true;
      } else {
        existingMap.set(masterEmp.id.trim(), {
          ...masterEmp,
          ...existing,
          jobLocations: existing.jobLocations || [existing.workStation || masterEmp.workStation || 'Head Office'],
          dutyDays: existing.dutyDays || ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
          shiftStartTime: existing.shiftStartTime || '10:00',
          shiftEndTime: existing.shiftEndTime || '18:00',
          dailyDutyHours: existing.dailyDutyHours || 8,
          weeklyDutyDaysCount: existing.weeklyDutyDaysCount || 6,
          casualLeaveQuota: existing.casualLeaveQuota || 16,
          sickLeaveQuota: existing.sickLeaveQuota || 14,
          mobileAllowance: existing.mobileAllowance ?? 1000,
          travelAllowance: existing.travelAllowance ?? 2000,
          avatar: existing.avatar || masterEmp.avatar,
        });
      }
    });

    const merged = Array.from(existingMap.values());
    if (modified || !raw) {
      saveToStorage(STORAGE_KEYS.EMPLOYEES, merged);
    }
    return merged;
  } catch (err) {
    console.error('Failed to load merged employees:', err);
    return LEEDO_MASTER_EMPLOYEES;
  }
}

// Check if v5.0 migration is needed (clears any non-LEEDO test mock records from all storage keys)
export function ensureV2Migration(): void {
  try {
    const migrated = localStorage.getItem(STORAGE_KEYS.MIGRATION_VERSION);
    if (migrated !== '5.0') {
      // 1. Purge & load authentic employees
      loadMergedEmployees();

      // 2. Clean attendance - only authentic LEEDO staff IDs allowed
      const rawAtt = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (rawAtt) {
        try {
          const atts = JSON.parse(rawAtt);
          if (Array.isArray(atts)) {
            const cleaned = atts.filter((a: any) => 
              a && a.employeeId && isValidLeedoStaffId(a.employeeId) && !LEGACY_MOCK_NAMES.has((a.employeeName || '').trim())
            );
            localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(cleaned));
          }
        } catch { /* ignore */ }
      }

      // 3. Clean leaves - only authentic LEEDO staff allowed
      const rawLeaves = localStorage.getItem(STORAGE_KEYS.LEAVES);
      if (rawLeaves) {
        try {
          const lvs = JSON.parse(rawLeaves);
          if (Array.isArray(lvs)) {
            const cleaned = lvs.filter((l: any) => 
              l && l.employeeId && isValidLeedoStaffId(l.employeeId) && !LEGACY_MOCK_NAMES.has((l.employeeName || '').trim())
            );
            localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(cleaned));
          }
        } catch { /* ignore */ }
      }

      // 4. Clean separations - wipe demo separations completely
      const rawSeps = localStorage.getItem(STORAGE_KEYS.SEPARATIONS);
      if (rawSeps) {
        try {
          const seps = JSON.parse(rawSeps);
          if (Array.isArray(seps)) {
            const cleaned = seps.filter((s: any) => 
              s && s.employeeId && isValidLeedoStaffId(s.employeeId) && !LEGACY_MOCK_NAMES.has((s.employeeName || '').trim())
            );
            localStorage.setItem(STORAGE_KEYS.SEPARATIONS, JSON.stringify(cleaned));
          }
        } catch { /* ignore */ }
      }

      // 5. Clean timesheets
      const rawTs = localStorage.getItem(STORAGE_KEYS.TIMESHEETS);
      if (rawTs) {
        try {
          const tss = JSON.parse(rawTs);
          if (Array.isArray(tss)) {
            const cleaned = tss.filter((t: any) => 
              t && t.employeeId && isValidLeedoStaffId(t.employeeId) && !LEGACY_MOCK_NAMES.has((t.employeeName || '').trim())
            );
            localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify(cleaned));
          }
        } catch { /* ignore */ }
      }

      // 6. Clean payroll
      const rawPay = localStorage.getItem(STORAGE_KEYS.PAYROLL);
      if (rawPay) {
        try {
          const pays = JSON.parse(rawPay);
          if (Array.isArray(pays)) {
            const cleaned = pays.filter((p: any) => 
              p && p.employeeId && isValidLeedoStaffId(p.employeeId) && !LEGACY_MOCK_NAMES.has((p.employeeName || '').trim())
            );
            localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(cleaned));
          }
        } catch { /* ignore */ }
      }

      // 7. Clean current user if logged into legacy mock ID
      const curUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (curUserId && (!isValidLeedoStaffId(curUserId) || LEGACY_MOCK_IDS.has(curUserId))) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, '1006'); // Md. Rashedul Hasan (HR & Admin Officer)
      }

      localStorage.setItem(STORAGE_KEYS.MIGRATION_VERSION, '5.0');
    }
  } catch (e) {
    console.error('Migration check failed:', e);
  }
}

// Execute migration synchronously on module import
ensureV2Migration();


export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Failed to load key ${key} from storage:`, err);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save key ${key} to storage:`, err);
  }
}

export function exportAllDataAsJSON(): string {
  const backup: Record<string, unknown> = {};
  Object.values(STORAGE_KEYS).forEach((k) => {
    const val = localStorage.getItem(k);
    if (val) {
      try {
        backup[k] = JSON.parse(val);
      } catch {
        backup[k] = val;
      }
    }
  });
  return JSON.stringify({
    system: 'LEEDO ProHRIS Suite',
    exportDate: new Date().toISOString(),
    version: '2.0',
    data: backup,
  }, null, 2);
}

export function restoreDataFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data) return false;
    Object.entries(parsed.data).forEach(([key, val]) => {
      localStorage.setItem(key, JSON.stringify(val));
    });
    return true;
  } catch (err) {
    console.error('Failed to restore backup:', err);
    return false;
  }
}
