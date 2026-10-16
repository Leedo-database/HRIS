import React, { useState, useRef } from 'react';
import { Employee, AttendanceRecord } from '../../types/hris';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Sparkles, 
  Filter, 
  Download, 
  ArrowRight,
  Database,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface BiometricImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onImportRecords: (newRecords: AttendanceRecord[]) => void;
}

interface ParsedMachineRow {
  rawAcNo: string;
  rawName: string;
  rawDate: string;
  onDuty: string;
  offDuty: string;
  clockIn: string;
  clockOut: string;
  late: string;
  early: string;
  absent: string;
  matchedEmployee?: Employee;
  normalizedDate: string;
  status: 'Present' | 'Late' | 'Absent' | 'Half Day';
  hoursWorked: number;
  isValid: boolean;
  error?: string;
}

// Sample demonstration log matching the exact uploaded biometric fingerprint machine image
const SAMPLE_MACHINE_CSV = `AC-No.,Name,Date,On duty,Off duty,Clock In,Clock Out,Late,Early,Absent
2,Murshida,01/09/2026,10:00,18:00,,,,,True
2,Murshida,02/09/2026,10:00,18:00,,,,,True
2,Murshida,03/09/2026,10:00,18:00,,,,,True
2,Murshida,04/09/2026,10:00,18:00,,20:12,01:00,,
2,Murshida,07/09/2026,10:00,18:00,,21:01,01:00,,
2,Murshida,09/09/2026,10:00,18:00,,19:02,01:00,,
2,Murshida,10/09/2026,10:00,18:00,,19:19,01:00,,
2,Murshida,14/09/2026,10:00,18:00,,20:22,01:00,,
2,Murshida,16/09/2026,10:00,18:00,,20:23,01:00,,
2,Murshida,17/09/2026,10:00,18:00,,19:45,01:00,,
2,Murshida,22/09/2026,10:00,18:00,,20:12,01:00,,
2,Murshida,26/09/2026,10:00,18:00,,20:51,01:00,,
3,Md. Habibi,01/09/2026,10:00,18:00,09:56,19:41,,,
3,Md. Habibi,02/09/2026,10:00,18:00,10:15,19:36,00:15,,
3,Md. Habibi,05/09/2026,10:00,18:00,10:02,19:34,,,
3,Md. Habibi,06/09/2026,10:00,18:00,10:05,,00:05,01:00,
3,Md. Habibi,07/09/2026,10:00,18:00,09:58,20:08,,,
3,Md. Habibi,08/09/2026,10:00,18:00,,21:29,,01:00,
3,Md. Habibi,09/09/2026,10:00,18:00,10:12,,00:12,01:00,
3,Md. Habibi,10/09/2026,10:00,18:00,,18:10,01:00,,
3,Md. Habibi,12/09/2026,10:00,18:00,10:03,18:17,,,
3,Md. Habibi,13/09/2026,10:00,18:00,10:18,19:29,00:18,,
3,Md. Habibi,14/09/2026,10:00,18:00,,18:48,01:00,,
3,Md. Habibi,15/09/2026,10:00,18:00,10:21,19:16,00:21,,
3,Md. Habibi,16/09/2026,10:00,18:00,10:05,19:18,00:05,,
3,Md. Habibi,17/09/2026,10:00,18:00,10:26,,00:26,01:00,
3,Md. Habibi,20/09/2026,10:00,18:00,,18:21,01:00,,
3,Md. Habibi,21/09/2026,10:00,18:00,10:03,,01:00,,
3,Md. Habibi,22/09/2026,10:00,18:00,,18:43,01:00,,
3,Md. Habibi,23/09/2026,10:00,18:00,,18:58,01:00,,
3,Md. Habibi,24/09/2026,10:00,18:00,10:01,,,01:00,
3,Md. Habibi,26/09/2026,10:00,18:00,10:12,,,01:00,
3,Md. Habibi,27/09/2026,10:00,18:00,10:02,,00:12,01:00,
3,Md. Habibi,28/09/2026,10:00,18:00,10:33,18:30,00:33,,
3,Md. Habibi,29/09/2026,10:00,18:00,,19:42,01:00,,
3,Md. Habibi,30/09/2026,10:00,18:00,10:02,,,01:00,
4,Md. Belal,01/09/2026,10:00,18:00,10:57,20:13,00:57,,
4,Md. Belal,02/09/2026,10:00,18:00,10:41,,00:41,01:00,
4,Md. Belal,05/09/2026,10:00,18:00,,20:11,01:00,,
4,Md. Belal,06/09/2026,10:00,18:00,11:19,,01:19,01:00,
4,Md. Belal,07/09/2026,10:00,18:00,10:44,20:19,00:44,,
4,Md. Belal,08/09/2026,10:00,18:00,10:57,21:29,00:57,,
4,Md. Belal,09/09/2026,10:00,18:00,10:39,19:02,00:39,,
4,Md. Belal,10/09/2026,10:00,18:00,11:02,19:38,01:02,,
4,Md. Belal,13/09/2026,10:00,18:00,10:38,19:19,00:38,,
4,Md. Belal,15/09/2026,10:00,18:00,10:52,,00:52,01:00,
4,Md. Belal,16/09/2026,10:00,18:00,11:06,,01:06,01:00,
4,Md. Belal,17/09/2026,10:00,18:00,10:56,,00:56,01:00,
10,Rayhan,01/09/2026,10:00,18:00,10:14,,00:14,01:00,
10,Rayhan,02/09/2026,10:00,18:00,09:46,19:16,,,
10,Rayhan,05/09/2026,10:00,18:00,,19:35,01:00,,
10,Rayhan,06/09/2026,10:00,18:00,11:08,17:09,01:08,00:51,
10,Rayhan,07/09/2026,10:00,18:00,10:27,,00:27,01:00,
10,Rayhan,08/09/2026,10:00,18:00,10:19,19:35,00:19,,
10,Rayhan,09/09/2026,10:00,18:00,10:28,18:48,00:28,,
10,Rayhan,10/09/2026,10:00,18:00,,14:50,01:00,03:10,
10,Rayhan,12/09/2026,10:00,18:00,10:25,,00:25,01:00,
10,Rayhan,13/09/2026,10:00,18:00,,19:19,01:00,,
10,Rayhan,14/09/2026,10:00,18:00,,19:17,01:00,,
10,Rayhan,15/09/2026,10:00,18:00,,19:04,01:00,,
10,Rayhan,16/09/2026,10:00,18:00,10:10,,00:10,01:00,
10,Rayhan,17/09/2026,10:00,18:00,10:28,,00:28,01:00,
10,Rayhan,19/09/2026,10:00,18:00,11:00,,01:00,01:00,
10,Rayhan,20/09/2026,10:00,18:00,10:34,18:05,00:34,,
10,Rayhan,21/09/2026,10:00,18:00,10:49,19:00,00:49,,
10,Rayhan,22/09/2026,10:00,18:00,10:26,20:18,00:26,,
10,Rayhan,24/09/2026,10:00,18:00,,18:17,01:00,,
10,Rayhan,26/09/2026,10:00,18:00,10:23,,00:23,01:00,
10,Rayhan,27/09/2026,10:00,18:00,,15:12,01:00,02:48,
10,Rayhan,28/09/2026,10:00,18:00,11:14,,01:14,01:00,
10,Rayhan,29/09/2026,10:00,18:00,10:12,19:08,00:12,,
10,Rayhan,30/09/2026,10:00,18:00,10:00,,,01:00,
19,Farhana,01/09/2026,10:00,18:00,,20:08,01:00,,
19,Farhana,07/09/2026,10:00,18:00,,20:16,01:00,,
19,Farhana,10/09/2026,10:00,18:00,,19:20,01:00,,
19,Farhana,15/09/2026,10:00,18:00,,20:22,01:00,,
19,Farhana,16/09/2026,10:00,18:00,,19:45,01:00,,
19,Farhana,18/09/2026,10:00,18:00,,18:37,01:00,,
19,Farhana,21/09/2026,10:00,18:00,,19:29,01:00,,
19,Farhana,22/09/2026,10:00,18:00,,20:19,01:00,,
19,Farhana,24/09/2026,10:00,18:00,,19:53,01:00,,
19,Farhana,26/09/2026,10:00,18:00,,20:52,01:00,,
19,Farhana,27/09/2026,10:00,18:00,,18:46,01:00,,
19,Farhana,28/09/2026,10:00,18:00,,14:47,01:00,03:13,
19,Farhana,29/09/2026,10:00,18:00,10:51,18:47,00:51,,
19,Farhana,30/09/2026,10:00,18:00,,18:49,01:00,,
27,Fabliha,01/09/2026,10:00,13:00,10:22,,00:22,01:00,
27,Fabliha,02/09/2026,10:00,13:00,10:12,,00:12,01:00,
27,Fabliha,05/09/2026,10:00,13:00,10:02,,,01:00,
27,Fabliha,06/09/2026,10:00,13:00,10:09,,00:09,01:00,
27,Fabliha,07/09/2026,10:00,13:00,10:14,,00:14,01:00,
27,Fabliha,08/09/2026,10:00,13:00,09:58,,,01:00,
27,Fabliha,09/09/2026,10:00,13:00,10:20,,00:20,01:00,
27,Fabliha,10/09/2026,10:00,13:00,10:08,,00:08,01:00,
27,Fabliha,12/09/2026,10:00,13:00,10:17,,00:17,01:00,
27,Fabliha,13/09/2026,10:00,13:00,10:14,,00:14,01:00,
27,Fabliha,14/09/2026,10:00,13:00,10:18,,00:18,01:00,
27,Fabliha,16/09/2026,10:00,13:00,10:25,,00:25,01:00,
27,Fabliha,17/09/2026,10:00,13:00,10:28,,00:28,01:00,
27,Fabliha,19/09/2026,10:00,13:00,10:11,,00:11,01:00,
27,Fabliha,20/09/2026,10:00,13:00,10:34,,00:34,01:00,
27,Fabliha,21/09/2026,10:00,13:00,10:11,,00:11,01:00,
27,Fabliha,22/09/2026,10:00,13:00,10:10,,00:10,01:00,
27,Fabliha,24/09/2026,10:00,13:00,10:22,,00:22,01:00,
27,Fabliha,26/09/2026,10:00,13:00,10:07,,00:07,01:00,
27,Fabliha,27/09/2026,10:00,13:00,10:19,,00:19,01:00,
27,Fabliha,28/09/2026,10:00,13:00,10:02,,,01:00,
27,Fabliha,29/09/2026,10:00,13:00,10:21,15:40,00:21,,
27,Fabliha,30/09/2026,10:00,13:00,10:05,,00:05,01:00`;

export const BiometricImportModal: React.FC<BiometricImportModalProps> = ({
  isOpen,
  onClose,
  employees,
  onImportRecords,
}) => {
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedMachineRow[]>([]);
  const [filterTab, setFilterTab] = useState<'All' | 'Present' | 'Late' | 'Absent' | 'Unmatched'>('All');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importStats, setImportStats] = useState({ total: 0, present: 0, late: 0, absent: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Smart employee matcher by biometric AC-No or Name
  const matchEmployee = (acNo: string, rawName: string): Employee | undefined => {
    const cleanAc = acNo.trim();
    const cleanName = rawName.trim().toLowerCase();

    // 1. Direct match on ID
    let found = employees.find((e) => e.id.toLowerCase() === cleanAc.toLowerCase());
    if (found) return found;

    // 2. Machine AC-No maps to LEEDO Staff ID (e.g., AC-No 2 -> 1002, AC-No 10 -> 1010)
    if (/^\d+$/.test(cleanAc)) {
      const acNumber = parseInt(cleanAc, 10);
      const possibleId1 = String(1000 + acNumber);
      found = employees.find((e) => e.id === possibleId1);
      if (found) return found;

      const padded = cleanAc.padStart(4, '0');
      found = employees.find((e) => e.id.endsWith(padded) || e.id === padded);
      if (found) return found;
    }

    // 3. Name Match (Fuzzy / Substring)
    if (cleanName && cleanName !== 'admin') {
      found = employees.find((e) => {
        const empFull = e.fullName.toLowerCase();
        return empFull.includes(cleanName) || cleanName.includes(empFull.split(' ')[0]);
      });
      if (found) return found;
    }

    // 4. Admin persona fallback (Murshida / Forhad)
    if (cleanName === 'admin' || cleanAc === '8') {
      return employees.find((e) => e.id === '1002') || employees[0];
    }

    return undefined;
  };

  // Convert date formats (DD/MM/YYYY, D/M/YYYY, YYYY-MM-DD) to ISO YYYY-MM-DD
  const normalizeDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const clean = dateStr.trim();
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) return clean; // already YYYY-MM-DD
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    return clean;
  };

  // Calculate work hours between in and out
  const calculateWorkHours = (inTime: string, outTime: string, isAbsent: boolean): number => {
    if (isAbsent || !inTime || !outTime) {
      if (inTime && !outTime) return 4.0; // single punch recorded
      return 0;
    }
    try {
      const [inH, inM] = inTime.split(':').map(Number);
      const [outH, outM] = outTime.split(':').map(Number);
      let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
      if (diffMinutes < 0) diffMinutes += 24 * 60; // overnight
      return Math.round((diffMinutes / 60) * 10) / 10;
    } catch {
      return 0;
    }
  };

  const parseCsvContent = (content: string) => {
    setIsProcessing(true);
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      setIsProcessing(false);
      return;
    }

    // Determine delimiter: comma, tab, or semicolon
    const headerLine = lines[0];
    let delimiter = ',';
    if (headerLine.includes('\t')) delimiter = '\t';
    else if (headerLine.includes(';') && !headerLine.includes(',')) delimiter = ';';

    const headerTokens = headerLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

    // Find column indexes
    let acIdx = headerTokens.findIndex((h) => h.includes('ac-no') || h.includes('ac no') || h === 'id' || h.includes('user'));
    let nameIdx = headerTokens.findIndex((h) => h === 'name' || h.includes('employee') || h.includes('staff'));
    let dateIdx = headerTokens.findIndex((h) => h.includes('date'));
    let onDutyIdx = headerTokens.findIndex((h) => h.includes('on duty') || h.includes('onduty') || h.includes('shift in'));
    let offDutyIdx = headerTokens.findIndex((h) => h.includes('off duty') || h.includes('offduty') || h.includes('shift out'));
    let inIdx = headerTokens.findIndex((h) => h.includes('clock in') || h.includes('clockin') || h.includes('time in') || h === 'in');
    let outIdx = headerTokens.findIndex((h) => h.includes('clock out') || h.includes('clockout') || h.includes('time out') || h === 'out');
    let lateIdx = headerTokens.findIndex((h) => h.includes('late'));
    let earlyIdx = headerTokens.findIndex((h) => h.includes('early'));
    let absentIdx = headerTokens.findIndex((h) => h.includes('absent'));

    // Fallbacks based on standard machine export format (AC-No., Name, Date, On duty, Off duty, Clock In, Clock Out, Late, Early, Absent)
    if (acIdx === -1) acIdx = 0;
    if (nameIdx === -1) nameIdx = 1;
    if (dateIdx === -1) dateIdx = 2;
    if (onDutyIdx === -1) onDutyIdx = 3;
    if (offDutyIdx === -1) offDutyIdx = 4;
    if (inIdx === -1) inIdx = 5;
    if (outIdx === -1) outIdx = 6;
    if (lateIdx === -1) lateIdx = 7;
    if (earlyIdx === -1) earlyIdx = 8;
    if (absentIdx === -1) absentIdx = 9;

    const dataLines = lines.slice(1);
    const parsed: ParsedMachineRow[] = [];

    dataLines.forEach((line) => {
      // Split preserving values
      const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 3) return;

      const rawAcNo = cols[acIdx] || '';
      const rawName = cols[nameIdx] || '';
      const rawDate = cols[dateIdx] || '';
      const onDuty = onDutyIdx < cols.length ? cols[onDutyIdx] : '';
      const offDuty = offDutyIdx < cols.length ? cols[offDutyIdx] : '';
      const clockIn = inIdx < cols.length ? cols[inIdx] : '';
      const clockOut = outIdx < cols.length ? cols[outIdx] : '';
      const late = lateIdx < cols.length ? cols[lateIdx] : '';
      const early = earlyIdx < cols.length ? cols[earlyIdx] : '';
      const absent = absentIdx < cols.length ? cols[absentIdx] : '';

      if (!rawAcNo && !rawName) return;

      const matchedEmp = matchEmployee(rawAcNo, rawName);
      const normalizedDate = normalizeDateStr(rawDate);

      const isAbsentVal = absent.toLowerCase() === 'true' || (!clockIn && !clockOut);
      const isLateVal = !isAbsentVal && ((late && late !== '00:00' && late !== '0') || (clockIn && clockIn > '10:15'));

      let status: 'Present' | 'Late' | 'Absent' | 'Half Day' = 'Present';
      if (isAbsentVal) {
        status = 'Absent';
      } else if (isLateVal) {
        status = 'Late';
      }

      const hoursWorked = calculateWorkHours(clockIn, clockOut, isAbsentVal);

      parsed.push({
        rawAcNo,
        rawName,
        rawDate,
        onDuty,
        offDuty,
        clockIn,
        clockOut,
        late,
        early,
        absent,
        matchedEmployee: matchedEmp,
        normalizedDate,
        status,
        hoursWorked,
        isValid: Boolean(matchedEmp && normalizedDate),
        error: !matchedEmp 
          ? `Staff not recognized for AC-No: ${rawAcNo} (${rawName})` 
          : !normalizedDate 
          ? 'Invalid date' 
          : undefined,
      });
    });

    setParsedRows(parsed);
    setIsProcessing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        parseCsvContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleData = () => {
    setFileName('LEEDO_Biometric_Fingerprint_Log_September_2026.csv');
    setCsvText(SAMPLE_MACHINE_CSV);
    parseCsvContent(SAMPLE_MACHINE_CSV);
  };

  const handleCommitImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid && r.matchedEmployee);
    if (validRows.length === 0) {
      alert('No valid biometric attendance rows ready to import. Please check data mapping.');
      return;
    }

    const newAttendanceRecords: AttendanceRecord[] = validRows.map((row, idx) => {
      const emp = row.matchedEmployee!;
      const cleanDate = row.normalizedDate;
      const formattedClockIn = row.clockIn ? (row.clockIn.length === 5 ? `${row.clockIn}:00` : row.clockIn) : '--:--:--';
      const formattedClockOut = row.clockOut ? (row.clockOut.length === 5 ? `${row.clockOut}:00` : row.clockOut) : undefined;

      return {
        id: `BIO-${cleanDate.replace(/-/g, '')}-${emp.id}-${idx}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        date: cleanDate,
        clockInTime: formattedClockIn,
        clockOutTime: formattedClockOut,
        workMode: 'Office',
        status: row.status,
        ipAddress: 'Biometric Fingerprint Scanner (AC-No: ' + row.rawAcNo + ')',
        locationNote: `Biometric Punch (Shift: ${row.onDuty || '10:00'} - ${row.offDuty || '18:00'})`,
        lateReason: row.status === 'Late' ? `Biometric late punch: ${row.late || 'Late clock-in'}` : undefined,
        hoursWorked: row.hoursWorked,
      };
    });

    onImportRecords(newAttendanceRecords);
    setImportStats({
      total: newAttendanceRecords.length,
      present: newAttendanceRecords.filter((r) => r.status === 'Present').length,
      late: newAttendanceRecords.filter((r) => r.status === 'Late').length,
      absent: newAttendanceRecords.filter((r) => r.status === 'Absent').length,
    });
    setImportSuccess(true);
  };

  // Stats calculation
  const totalCount = parsedRows.length;
  const matchedCount = parsedRows.filter((r) => r.matchedEmployee).length;
  const presentCount = parsedRows.filter((r) => r.status === 'Present' && r.isValid).length;
  const lateCount = parsedRows.filter((r) => r.status === 'Late' && r.isValid).length;
  const absentCount = parsedRows.filter((r) => r.status === 'Absent' && r.isValid).length;
  const unmatchedCount = parsedRows.filter((r) => !r.matchedEmployee).length;

  const filteredDisplayRows = parsedRows.filter((r) => {
    if (filterTab === 'All') return true;
    if (filterTab === 'Present') return r.status === 'Present' && r.isValid;
    if (filterTab === 'Late') return r.status === 'Late' && r.isValid;
    if (filterTab === 'Absent') return r.status === 'Absent' && r.isValid;
    if (filterTab === 'Unmatched') return !r.matchedEmployee;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-2xl border border-indigo-400/30">
              <FileSpreadsheet className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Biometric Fingerprint Machine Attendance Importer
              </h2>
              <p className="text-xs text-indigo-200">
                Upload .CSV / Excel logs directly from ZKTeco, Realtime & Office Biometric Scanners
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {importSuccess ? (
            /* Success confirmation screen */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Biometric Attendance Synchronized Successfully!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  <strong>{importStats.total}</strong> attendance logs have been integrated into LEEDO's Master Register, local storage, and Firestore Cloud Vault.
                </p>
              </div>

              {/* Stats badges */}
              <div className="flex justify-center gap-3 pt-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  Present: {importStats.present}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  Late: {importStats.late}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                  Absent: {importStats.absent}
                </span>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setImportSuccess(false);
                    setParsedRows([]);
                    setCsvText('');
                    setFileName('');
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Upload Another File
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  View Master Attendance Register
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* File Upload & Dropzone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 border-2 border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 p-5 rounded-2xl transition-colors text-center flex flex-col items-center justify-center relative cursor-pointer group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, .txt, .tsv, .xlsx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-xs group-hover:scale-105 transition-transform mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {fileName ? fileName : 'Upload Biometric Machine .CSV File'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                    Supports exports with AC-No, Name, Date, Clock In, Clock Out, Late, Early, Absent columns
                  </p>
                  <span className="mt-2 text-[10px] font-semibold text-indigo-600 bg-white px-2.5 py-1 rounded-full border border-indigo-100 shadow-2xs">
                    Click to browse or drag file here
                  </span>
                </div>

                {/* Instant Sample Button */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>One-Click Test Data</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Load the exact September 2026 fingerprint log from LEEDO shelter & office biometric scanners with 90+ records.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="w-full mt-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                  >
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Load September 2026 Machine Log</span>
                  </button>
                </div>
              </div>

              {/* Parsed Summary Metrics */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold block">Total Machine Rows</span>
                      <span className="text-xl font-bold text-slate-900">{totalCount}</span>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <span className="text-[10px] text-indigo-700 font-semibold block">Matched Staff</span>
                      <span className="text-xl font-bold text-indigo-900">{matchedCount}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-semibold block">Present</span>
                      <span className="text-xl font-bold text-emerald-900">{presentCount}</span>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-amber-700 font-semibold block">Late Punches</span>
                      <span className="text-xl font-bold text-amber-900">{lateCount}</span>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <span className="text-[10px] text-rose-700 font-semibold block">Absences</span>
                      <span className="text-xl font-bold text-rose-900">{absentCount}</span>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {(['All', 'Present', 'Late', 'Absent', 'Unmatched'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setFilterTab(tab)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            filterTab === tab
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Showing {filteredDisplayRows.length} of {parsedRows.length} logs
                    </span>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">AC-No</th>
                          <th className="py-2.5 px-3">Machine Name</th>
                          <th className="py-2.5 px-3">Matched Employee</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-2">Clock In</th>
                          <th className="py-2.5 px-2">Clock Out</th>
                          <th className="py-2.5 px-2">Hours</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDisplayRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">
                              {row.rawAcNo}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {row.rawName}
                            </td>
                            <td className="py-2 px-3">
                              {row.matchedEmployee ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{row.matchedEmployee.fullName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({row.matchedEmployee.id})</span>
                                </div>
                              ) : (
                                <span className="text-rose-600 font-medium flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>Unmapped</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {row.normalizedDate || row.rawDate}
                            </td>
                            <td className="py-2 px-2 font-mono font-semibold text-slate-800">
                              {row.clockIn || '--:--'}
                            </td>
                            <td className="py-2 px-2 font-mono text-slate-600">
                              {row.clockOut || '--:--'}
                            </td>
                            <td className="py-2 px-2 font-mono text-slate-700">
                              {row.hoursWorked ? `${row.hoursWorked} hrs` : '--'}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  row.status === 'Present'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : row.status === 'Late'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!importSuccess && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer text-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={parsedRows.length === 0 || matchedCount === 0}
              onClick={handleCommitImport}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-200 flex items-center gap-2 cursor-pointer transition-all text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import & Sync {matchedCount} Biometric Records</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
