import { AttendanceRecord } from '../types/hris';

/**
 * Authentic Biometric Punch Logs for October 2026 for LEEDO staff
 * Synthesized according to LEEDO biometric machine patterns (AC No. 2 to 30)
 * Includes On-Time punches, Late arrivals (>10:15 AM grace period), and missed punch days (Absences).
 */

interface PunchSpec {
  empId: string;
  empName: string;
  station: string;
  acNo: string;
  lateDates?: Record<string, { inTime: string; lateMins: number }>;
  absentDates?: string[]; // Days with NO PUNCH at all (Unapproved Absences)
}

const STAFF_PUNCH_SPECS: PunchSpec[] = [
  {
    empId: '1001',
    empName: 'Forhad Hossain',
    station: 'Head Office',
    acNo: '1',
    lateDates: { '2026-10-18': { inTime: '10:22:15', lateMins: 22 } },
    absentDates: ['2026-10-05'],
  },
  {
    empId: '1002',
    empName: 'Murshida Akhter Kanta',
    station: 'Head Office',
    acNo: '2',
    lateDates: { '2026-10-17': { inTime: '10:20:45', lateMins: 20 } },
    absentDates: ['2026-10-12'],
  },
  {
    empId: '1003',
    empName: 'AM Shmsuddula',
    station: 'Sadarghat Station',
    acNo: '29',
    lateDates: { '2026-10-07': { inTime: '10:35:10', lateMins: 35 } },
    absentDates: ['2026-10-11'],
  },
  {
    empId: '1004',
    empName: 'Md. Habibur Rahman',
    station: 'Babu Bazar Peace Home',
    acNo: '3',
    lateDates: {
      '2026-10-06': { inTime: '10:38:22', lateMins: 38 },
      '2026-10-13': { inTime: '10:18:14', lateMins: 18 },
      '2026-10-15': { inTime: '10:21:43', lateMins: 21 },
      '2026-10-27': { inTime: '10:33:55', lateMins: 33 },
    },
    absentDates: ['2026-10-08', '2026-10-19'],
  },
  {
    empId: '1005',
    empName: 'Md. Belal Hossain',
    station: 'Babu Bazar Peace Home',
    acNo: '4',
    lateDates: {
      '2026-10-01': { inTime: '10:57:44', lateMins: 57 },
      '2026-10-06': { inTime: '10:52:05', lateMins: 52 },
      '2026-10-10': { inTime: '11:02:17', lateMins: 62 },
      '2026-10-24': { inTime: '10:28:30', lateMins: 28 },
    },
    absentDates: ['2026-10-14', '2026-10-22'],
  },
  {
    empId: '1057',
    empName: 'Md. Omar Faruque',
    station: 'Head Office',
    acNo: '57',
    lateDates: { '2026-10-04': { inTime: '10:24:10', lateMins: 24 } },
    absentDates: ['2026-10-07'],
  },
  {
    empId: '1007',
    empName: 'Athui Marma',
    station: 'Sadarghat Station',
    acNo: '7',
    lateDates: { '2026-10-08': { inTime: '10:30:15', lateMins: 30 } },
    absentDates: ['2026-10-25'],
  },
  {
    empId: '1010',
    empName: 'Rayhan',
    station: 'Babu Bazar Peace Home',
    acNo: '10',
    lateDates: {
      '2026-10-07': { inTime: '10:27:37', lateMins: 27 },
      '2026-10-18': { inTime: '10:32:00', lateMins: 32 },
    },
    absentDates: ['2026-10-15'],
  },
  {
    empId: '1019',
    empName: 'Farhana',
    station: 'Head Office',
    acNo: '19',
    lateDates: {
      '2026-10-06': { inTime: '10:29:10', lateMins: 29 },
      '2026-10-14': { inTime: '10:25:00', lateMins: 25 },
    },
    absentDates: ['2026-10-13'],
  },
  {
    empId: '1025',
    empName: 'A.K.M. Mizanur Rahman',
    station: 'Head Office',
    acNo: '25',
    lateDates: { '2026-10-11': { inTime: '10:34:00', lateMins: 34 } },
    absentDates: ['2026-10-18'],
  },
  {
    empId: '1027',
    empName: 'Fabiha Mustari',
    station: 'Babu Bazar Peace Home',
    acNo: '27',
    lateDates: {
      '2026-10-06': { inTime: '10:45:00', lateMins: 45 },
      '2026-10-12': { inTime: '10:35:20', lateMins: 35 },
    },
    absentDates: ['2026-10-08', '2026-10-22'],
  },
];

export function generateOctoberBiometricAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const daysInOctober = 27; // Up to yesterday/today

  // Excluded dates: Fridays (weekly off for all) and Durga Puja Govt Holidays (Oct 20 & 21)
  const holidayDates = new Set(['2026-10-20', '2026-10-21']);

  STAFF_PUNCH_SPECS.forEach((spec) => {
    const absentSet = new Set(spec.absentDates || []);

    for (let day = 1; day <= daysInOctober; day++) {
      const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
      const dObj = new Date(2026, 9, day);
      const dayOfWeek = dObj.getDay();

      // Friday is 5 -> Weekend off
      if (dayOfWeek === 5) continue;
      // Govt Holidays
      if (holidayDates.has(dateStr)) continue;

      // Check if employee was on approved leave on this date:
      // Athui Marma: 15 & 16
      if (spec.empId === '1007' && (dateStr === '2026-10-15' || dateStr === '2026-10-16')) continue;
      // Md. Omar Faruque: 22 to 24
      if (spec.empId === '1057' && (dateStr >= '2026-10-22' && dateStr <= '2026-10-24')) continue;

      // If intentionally ABSENT (no biometric punch):
      if (absentSet.has(dateStr)) {
        // Do NOT create a biometric punch! The absence rule will detect missing punch and flag as Absent!
        continue;
      }

      // Check if late on this date:
      const lateInfo = spec.lateDates ? spec.lateDates[dateStr] : undefined;
      const isLate = !!lateInfo;
      const clockIn = isLate ? lateInfo.inTime : `09:${String(40 + (day % 18)).padStart(2, '0')}:12`;
      const clockOut = `18:${String(5 + (day % 25)).padStart(2, '0')}:00`;

      records.push({
        id: `ATT-OCT-${dateStr.replace(/-/g, '')}-${spec.empId}`,
        employeeId: spec.empId,
        employeeName: spec.empName,
        date: dateStr,
        clockInTime: clockIn,
        clockOutTime: clockOut,
        workMode: 'Office',
        status: isLate ? 'Late' : 'Present',
        punchLocationName: spec.station,
        locationNote: `Biometric Machine FP Punch (Machine AC No: ${spec.acNo})`,
        lateReason: isLate ? `Biometric Machine: Clocked in at ${clockIn} (+${lateInfo.lateMins}m late)` : undefined,
        hoursWorked: 8.0,
        ipAddress: 'Biometric Machine FP',
        gpsSource: 'Assigned Center Coordinates',
      });
    }
  });

  return records;
}
