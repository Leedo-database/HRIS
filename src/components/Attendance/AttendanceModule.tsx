import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord, WorkMode, UserRole, LEEDO_JOB_LOCATIONS } from '../../types/hris';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Download, 
  LogOut, 
  LogIn,
  Search,
  Building,
  Home,
  Compass,
  FileSpreadsheet,
  Upload,
  Smartphone,
  Navigation,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Info,
  Check,
  AlertTriangle,
  Moon,
  Zap,
  Edit,
  Printer
} from 'lucide-react';
import { getTodayAttendanceSummary, getHolidayOnDate } from '../../utils/calculations';
import { GovernmentHoliday } from '../../types/hris';
import { OFFICIAL_BANGLADESH_HOLIDAYS_2026 } from '../../data/bangladeshHolidays';
import { BiometricImportModal } from './BiometricImportModal';
import { GoogleMapModal } from './GoogleMapModal';
import { AttendanceCorrectionModal } from './AttendanceCorrectionModal';

interface AttendanceModuleProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  onAddAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onImportAttendanceRecords?: (records: AttendanceRecord[]) => void;
  currentUser: Employee;
  currentRole: UserRole;
  jobLocations?: string[];
  holidays?: GovernmentHoliday[];
}

// Verified physical coordinates for all official LEEDO centers in Dhaka & surrounding areas
export const LEEDO_CENTER_COORDINATES: Record<string, { lat: number; lng: number; address: string }> = {
  'Head Office': { 
    lat: 23.7937, 
    lng: 90.4066, 
    address: 'House 42, Road 11, Block-D, Banani, Dhaka-1213' 
  },
  'Inclusive School': { 
    lat: 23.7545, 
    lng: 90.3454, 
    address: 'Bosila Road, Mohammadpur, Dhaka' 
  },
  'Kamalapur SUS': { 
    lat: 23.7314, 
    lng: 90.4262, 
    address: 'Kamalapur Railway Station Area, Motijheel, Dhaka' 
  },
  'Kamalapur Shelter': { 
    lat: 23.7320, 
    lng: 90.4270, 
    address: 'Vulnerable Street Children Night Shelter, Kamalapur, Dhaka' 
  },
  'Kodomtoli Shelter': { 
    lat: 23.6961, 
    lng: 90.4533, 
    address: 'Kodomtoli / Postogola Transitional Shelter, Dhaka' 
  },
  'Kadamtali Vocational Center': { 
    lat: 23.6970, 
    lng: 90.4545, 
    address: 'Kadamtali Vocational Training & Production Center, Dhaka' 
  },
  'Sadarghat SUS': { 
    lat: 23.7078, 
    lng: 90.4109, 
    address: 'Sadarghat Launch Terminal Hub, Old Dhaka' 
  },
  'Shambazar SUS': { 
    lat: 23.7095, 
    lng: 90.4140, 
    address: 'Shambazar Riverfront Child Protection Station, Old Dhaka' 
  },
  'Mirpur SUS': { 
    lat: 23.8071, 
    lng: 90.3686, 
    address: 'Mirpur-1 Section / Gabtoli Transit Hub, Dhaka' 
  },
  'Peace Home': { 
    lat: 23.8820, 
    lng: 90.4020, 
    address: 'LEEDO Peace Home Long-term Children Village, Arichpur, Tongi' 
  },
  'RayerBazar SUS': { 
    lat: 23.7460, 
    lng: 90.3650, 
    address: 'Rayerbazar Sluice Gate Community Protection Point, Dhaka' 
  },
  'Tejgoan SUS': { 
    lat: 23.7600, 
    lng: 90.3950, 
    address: 'Tejgaon Rail Station & Slum Outreach Center, Dhaka' 
  },
  'Airport SUS': { 
    lat: 23.8512, 
    lng: 90.4077, 
    address: 'Airport Railway Station & Kawla Drop-in Center, Dhaka' 
  },
};

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  employees,
  attendance,
  onAddAttendance,
  onUpdateAttendance,
  onImportAttendanceRecords,
  currentUser,
  currentRole,
  jobLocations = [...LEEDO_JOB_LOCATIONS],
  holidays = OFFICIAL_BANGLADESH_HOLIDAYS_2026,
}) => {
  // Live dynamic current date
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedViewDate, setSelectedViewDate] = useState<string>(todayStr);

  const [selectedMode, setSelectedMode] = useState<WorkMode>('Office');
  const [selectedJobLocation, setSelectedJobLocation] = useState<string>(
    currentUser.workStation && jobLocations.includes(currentUser.workStation as any)
      ? currentUser.workStation
      : jobLocations[0] || 'Head Office'
  );
  const [locationNote, setLocationNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('All');
  const [filterLocation, setFilterLocation] = useState<string>('All');
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [recordToCorrect, setRecordToCorrect] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [selectedMapRecord, setSelectedMapRecord] = useState<AttendanceRecord | null>(null);

  // GPS Permission & Location Tracking State
  const [locationSourcePreference, setLocationSourcePreference] = useState<'device_gps' | 'center_coords'>('device_gps');
  const [geoPermissionState, setGeoPermissionState] = useState<'granted' | 'prompt' | 'denied' | 'unsupported'>('prompt');
  const [liveGpsCoords, setLiveGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoErrorNotice, setGeoErrorNotice] = useState<string | null>(null);
  const [gpsAcquisitionTime, setGpsAcquisitionTime] = useState<string | null>(null);

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check browser Geolocation permission status on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setGeoPermissionState(status.state as any);
        status.onchange = () => {
          setGeoPermissionState(status.state as any);
        };
      }).catch(() => {
        setGeoPermissionState('prompt');
      });
    } else if (typeof navigator !== 'undefined' && !('geolocation' in navigator)) {
      setGeoPermissionState('unsupported');
    }

    // Auto-detect GPS location softly on mount
    detectLiveLocation(false);
  }, []);

  // Request & detect live high-precision GPS position
  const detectLiveLocation = (showToast = true) => {
    if (!navigator.geolocation) {
      setGeoPermissionState('unsupported');
      setGeoErrorNotice('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoErrorNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setLiveGpsCoords(coords);
        setGeoPermissionState('granted');
        setGpsAcquisitionTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoPermissionState('denied');
          setGeoErrorNotice('Location permission was denied. Please allow location in your browser address bar.');
        } else if (err.code === err.TIMEOUT) {
          setGeoErrorNotice('GPS detection timed out. You can retry or use your assigned Center coordinates.');
        } else {
          setGeoErrorNotice('Could not retrieve precise location. You can use Center coordinates.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Check if current user has clocked in today
  const userTodayPunch = attendance.find(
    (a) => a.employeeId === currentUser.id && a.date === todayStr
  );

  const todaySummary = getTodayAttendanceSummary(employees, attendance, selectedViewDate);
  const holidayOnViewDate = getHolidayOnDate(selectedViewDate || todayStr, holidays);

  // Helper to safely parse time strings into minutes from midnight
  const parseTimeToMinutes = (tStr: string): number => {
    if (!tStr) return 0;
    const isPM = /pm/i.test(tStr);
    const isAM = /am/i.test(tStr);
    const digitsOnly = tStr.replace(/[^0-9:]/g, '');
    const parts = digitsOnly.split(':').map(Number);
    let h = parts[0] || 0;
    const m = parts[1] || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  };

  // Perform Clock In with exact coordinates & mapsUrl
  const handleClockIn = () => {
    setIsLocating(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Check if late based on employee's shift start time
    const shiftStart = currentUser.shiftStartTime || '10:00';
    const [shiftH, shiftM] = shiftStart.split(':').map(Number);
    const graceMinutes = 15;
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const shiftMins = shiftH * 60 + (shiftM || 0) + graceMinutes;
    const isLate = currentMins > shiftMins;

    const executePunch = (lat: number, lng: number, acc: number, source: 'Live Device GPS' | 'Assigned Center Coordinates') => {
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      const newRecord: AttendanceRecord = {
        id: `ATT-${todayStr.replace(/-/g, '')}-${currentUser.id}-${Date.now().toString().slice(-4)}`,
        employeeId: currentUser.id,
        employeeName: currentUser.fullName,
        date: todayStr,
        clockInTime: timeStr,
        workMode: selectedMode,
        status: selectedMode === 'Field Mission' ? 'Field Mission' : isLate ? 'Late' : 'Present',
        ipAddress: 'Web & GPS Punch',
        locationNote: locationNote || `${selectedJobLocation} (${selectedMode})`,
        punchLocationName: selectedJobLocation,
        lateReason: isLate ? 'Transit / Field Delay' : undefined,
        hoursWorked: 0,
        latitude: lat,
        longitude: lng,
        locationAccuracy: acc,
        mapsUrl,
        gpsSource: source,
        locationAddress: LEEDO_CENTER_COORDINATES[selectedJobLocation]?.address || selectedJobLocation,
      };

      onAddAttendance(newRecord);
      setLocationNote('');
      setIsLocating(false);
    };

    // If preference is Device GPS and we already have live coords, or can get them:
    if (locationSourcePreference === 'device_gps') {
      if (liveGpsCoords) {
        executePunch(liveGpsCoords.lat, liveGpsCoords.lng, liveGpsCoords.accuracy, 'Live Device GPS');
        return;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const acc = Math.round(pos.coords.accuracy);
            setLiveGpsCoords({ lat, lng, accuracy: acc });
            executePunch(lat, lng, acc, 'Live Device GPS');
          },
          () => {
            // Fallback to center coordinates if GPS prompt failed/timed out
            const centerInfo = LEEDO_CENTER_COORDINATES[selectedJobLocation] || LEEDO_CENTER_COORDINATES['Head Office'];
            executePunch(centerInfo.lat, centerInfo.lng, 25, 'Assigned Center Coordinates');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        return;
      }
    }

    // Default to selected Center Coordinates
    const centerInfo = LEEDO_CENTER_COORDINATES[selectedJobLocation] || LEEDO_CENTER_COORDINATES['Head Office'];
    executePunch(centerInfo.lat, centerInfo.lng, 20, 'Assigned Center Coordinates');
  };

  // Perform Clock Out & calculate actual hours
  const handleClockOut = () => {
    if (!userTodayPunch) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Estimate hours worked safely
    const inMins = parseTimeToMinutes(userTodayPunch.clockInTime);
    const outMins = now.getHours() * 60 + now.getMinutes();
    const diffMins = Math.max(30, outMins - inMins);
    const calculatedHours = Math.round((diffMins / 60) * 10) / 10;

    const updated: AttendanceRecord = {
      ...userTodayPunch,
      clockOutTime: timeStr,
      hoursWorked: calculatedHours,
    };

    onUpdateAttendance(updated);
  };

  // 10:00 PM Auto-Checkout Rule ("rat 10 tar por auto checkout hoye jabe sobar")
  const runTenPmAutoCheckout = (forced = false) => {
    const currentHour = new Date().getHours();
    const shouldRun = forced || currentHour >= 22;

    const unclosedRecords = attendance.filter((a) => {
      if (!a.clockInTime || a.clockOutTime) return false;
      // Either past date, or today and past 10 PM (or forced)
      if (a.date < todayStr) return true;
      if (a.date === todayStr && shouldRun) return true;
      return false;
    });

    if (unclosedRecords.length === 0) {
      if (forced) alert('All employees are already checked out. No unclosed punches found.');
      return;
    }

    let count = 0;
    unclosedRecords.forEach((rec) => {
      const inMins = parseTimeToMinutes(rec.clockInTime);
      const outMins = 22 * 60; // 10:00 PM = 22:00
      const diffMins = Math.max(60, outMins - inMins);
      const calculatedHours = Math.round((diffMins / 60) * 10) / 10;

      const updatedRecord: AttendanceRecord = {
        ...rec,
        clockOutTime: '22:00:00',
        hoursWorked: calculatedHours,
        locationNote: (rec.locationNote ? rec.locationNote + ' | ' : '') + 'Auto-Checked Out at 22:00 (10 PM Cut-off)',
      };
      onUpdateAttendance(updatedRecord);
      count++;
    });

    if (forced) {
      alert(`Auto-checkout completed at 22:00 (10:00 PM) for ${count} staff member(s).`);
    }
  };

  // Run auto-checkout check on mount and every 60s
  useEffect(() => {
    runTenPmAutoCheckout(false);
    const interval = setInterval(() => {
      runTenPmAutoCheckout(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [attendance, todayStr]);

  const pendingAutoCheckoutCount = attendance.filter(
    (a) => a.clockInTime && !a.clockOutTime && a.date <= todayStr
  ).length;

  const handleBiometricImport = (importedRecords: AttendanceRecord[]) => {
    if (onImportAttendanceRecords) {
      onImportAttendanceRecords(importedRecords);
    } else {
      importedRecords.forEach((r) => onAddAttendance(r));
    }
  };

  // Role based filtering
  const baseAttendance = currentRole === 'employee'
    ? attendance.filter((a) => a.employeeId === currentUser.id)
    : currentRole === 'line_manager'
    ? attendance.filter((a) => {
        if (a.employeeId === currentUser.id) return true;
        const target = employees.find((e) => e.id === a.employeeId);
        return target && (
          target.reportingManagerId === currentUser.id || 
          (target.reportingManagerName && target.reportingManagerName.includes(currentUser.fullName))
        );
      })
    : attendance;

  const filteredAttendance = baseAttendance.filter((a) => {
    const matchesSearch =
      a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = filterMode === 'All' || a.workMode === filterMode;
    const matchesLoc = filterLocation === 'All' || 
      (a.punchLocationName && a.punchLocationName.toLowerCase().includes(filterLocation.toLowerCase())) ||
      (a.locationNote && a.locationNote.toLowerCase().includes(filterLocation.toLowerCase()));
    const matchesDate = !selectedViewDate || a.date === selectedViewDate;
    return matchesSearch && matchesMode && matchesLoc && matchesDate;
  });

  const exportAttendanceCSV = () => {
    const headers = ['Record ID', 'Staff ID', 'Name', 'Date', 'Clock In', 'Clock Out', 'Status', 'Work Mode', 'Hours', 'Station Location', 'GPS Source', 'Google Maps Link'];
    const rows = filteredAttendance.map((a) => [
      `"${a.id}"`,
      `"${a.employeeId}"`,
      `"${a.employeeName}"`,
      `"${a.date}"`,
      `"${a.clockInTime}"`,
      `"${a.clockOutTime || '--'}"`,
      `"${a.status}"`,
      `"${a.workMode}"`,
      a.hoursWorked || 0,
      `"${a.punchLocationName || a.locationNote || ''}"`,
      `"${a.gpsSource || 'Verified'}"`,
      `"${a.mapsUrl || (a.latitude ? `https://www.google.com/maps?q=${a.latitude},${a.longitude}` : '')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Log_${selectedViewDate || todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const centerCoords = LEEDO_CENTER_COORDINATES[selectedJobLocation] || LEEDO_CENTER_COORDINATES['Head Office'];
  const activeLat = locationSourcePreference === 'device_gps' && liveGpsCoords ? liveGpsCoords.lat : centerCoords.lat;
  const activeLng = locationSourcePreference === 'device_gps' && liveGpsCoords ? liveGpsCoords.lng : centerCoords.lng;

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Attendance & Punch Management (উপস্থিতি ও পাঞ্চ ব্যবস্থাপনা)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'employee' 
              ? 'Check in & Check out with verified Google Maps geolocation & live GPS coordinates'
              : 'Live punch roster, Google Maps geolocation verification, check-out tracking & biometric importer'}
          </p>
        </div>

        {/* Action Buttons for HR Admin */}
        {currentRole === 'hr_admin' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* 10:00 PM Auto-Checkout Trigger Button */}
            <button
              type="button"
              onClick={() => runTenPmAutoCheckout(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
              title="Auto-checkout all staff at 10:00 PM (22:00) who checked in today or in past days without clocking out"
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>10 PM Auto-Checkout (রাত ১০টা অটো-চেকআউট)</span>
              {pendingAutoCheckoutCount > 0 && (
                <span className="bg-amber-500 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {pendingAutoCheckoutCount}
                </span>
              )}
            </button>

            {/* Biometric Machine & OCR Import Button */}
            <button
              type="button"
              onClick={() => setIsBiometricModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-200" />
              <span>Biometric / OCR Importer</span>
            </button>

            {/* Attendance Correction & Manual Entry Button */}
            <button
              type="button"
              onClick={() => {
                setRecordToCorrect(null);
                setIsCorrectionModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
              title="Manual attendance punch entry or correction with audit remark"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>+ Correction / Manual (সংশোধন)</span>
            </button>
          </div>
        )}
      </div>

      {/* Official Bangladesh Government Holiday Banner */}
      {holidayOnViewDate && (
        <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/15 to-indigo-500/10 border-2 border-teal-500/40 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-2xl shadow-sm shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-700 text-white shadow-2xs">
                  Official Government Holiday (সরকারি সাধারণ ছুটি)
                </span>
                <span className="text-xs font-bold text-teal-900 bg-teal-100/80 px-2 py-0.5 rounded-md border border-teal-200">
                  {holidayOnViewDate.type}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {holidayOnViewDate.startDate} {holidayOnViewDate.startDate !== holidayOnViewDate.endDate ? `to ${holidayOnViewDate.endDate}` : ''}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-1">
                {holidayOnViewDate.titleBangla || holidayOnViewDate.title}
                {holidayOnViewDate.titleBangla && (
                  <span className="text-xs text-slate-500 font-normal ml-2">({holidayOnViewDate.title})</span>
                )}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {holidayOnViewDate.description} • Gazetted Public Holiday (100% Paid Day Off for all staff as per Bangladesh Labor Act)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Paid Holiday (বেতনভুক্ত ছুটি)</span>
            </span>
          </div>
        </div>
      )}

      {/* Top Interactive Punch Console & Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 1 Col: Mobile & Web Touch-Friendly Punch Console */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Top Bar inside card */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mobile & Web Punch</span>
              </span>
              <span className="text-xs text-slate-500 font-mono font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {todayStr}
              </span>
            </div>

            {/* Live Clock Display */}
            <div className="my-3 text-center py-3 bg-slate-900 rounded-2xl text-white shadow-inner">
              <span className="text-[10px] uppercase font-semibold text-indigo-300 tracking-widest block mb-0.5">
                Current Time
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-emerald-400">
                {currentTime || '10:00:00 AM'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Shift: {currentUser.shiftStartTime || '10:00'} – {currentUser.shiftEndTime || '18:00'} ({currentUser.dailyDutyHours || 8} hrs)
              </span>
            </div>

            {/* Punching Staff Dossier */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Punching As</p>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  {currentUser.fullName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  ID: {currentUser.id} • {currentUser.designation}
                </p>
                {currentUser.reportingManagerName && (
                  <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                    Supervisor: {currentUser.reportingManagerName}
                  </p>
                )}
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Work Mode Selection */}
            <div className="space-y-1.5 mb-3">
              <label className="text-xs font-bold text-slate-700 block">
                Work Mode:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMode('Office')}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    selectedMode === 'Office'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Office Station</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode('Remote')}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    selectedMode === 'Remote'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home / WFH</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode('Field Mission')}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    selectedMode === 'Field Mission'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Field Mission</span>
                </button>
              </div>
            </div>

            {/* LEEDO Center / Location Selection */}
            <div className="space-y-1 mb-3">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Duty Station / Center:</span>
                <span className="text-[10px] text-slate-400 font-normal">{jobLocations.length} Centers</span>
              </label>
              <select
                value={selectedJobLocation}
                onChange={(e) => setSelectedJobLocation(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50 font-medium text-slate-800"
              >
                {jobLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Live GPS Location & Google Maps Permission Panel */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Google Maps Geolocation Source</span>
                </span>
                <button
                  type="button"
                  onClick={() => detectLiveLocation(true)}
                  disabled={isLocating}
                  className="text-[10px] text-indigo-700 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  title="Refresh GPS Coordinates"
                >
                  <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Detect GPS'}</span>
                </button>
              </div>

              {/* Source Option Toggle */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setLocationSourcePreference('device_gps');
                    if (!liveGpsCoords) detectLiveLocation(true);
                  }}
                  className={`p-2 rounded-xl text-[10px] font-bold border text-left transition-all cursor-pointer ${
                    locationSourcePreference === 'device_gps'
                      ? 'bg-white border-indigo-600 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                      : 'bg-slate-100/60 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <span className="block text-[11px]">🛰️ Device Live GPS</span>
                  <span className="text-[9px] text-slate-500 font-normal block truncate">
                    {liveGpsCoords ? `±${liveGpsCoords.accuracy}m (${liveGpsCoords.lat.toFixed(4)}, ${liveGpsCoords.lng.toFixed(4)})` : 'Click to detect'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLocationSourcePreference('center_coords')}
                  className={`p-2 rounded-xl text-[10px] font-bold border text-left transition-all cursor-pointer ${
                    locationSourcePreference === 'center_coords'
                      ? 'bg-white border-indigo-600 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                      : 'bg-slate-100/60 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <span className="block text-[11px]">🏢 Center Coordinates</span>
                  <span className="text-[9px] text-slate-500 font-normal block truncate">
                    {centerCoords.lat.toFixed(4)}, {centerCoords.lng.toFixed(4)}
                  </span>
                </button>
              </div>

              {/* GPS Status feedback */}
              {geoPermissionState === 'prompt' && !liveGpsCoords && (
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 flex items-center justify-between">
                  <span>GPS permission required for precise map pin.</span>
                  <button
                    type="button"
                    onClick={() => detectLiveLocation(true)}
                    className="font-bold underline text-amber-800"
                  >
                    Allow GPS
                  </button>
                </div>
              )}

              {geoPermissionState === 'denied' && (
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-200 text-[10px] text-rose-900 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">Browser Location Blocked</span>
                    <span className="text-slate-600">Using verified {selectedJobLocation} center coordinates. To use real GPS, allow location in browser bar.</span>
                  </div>
                </div>
              )}

              {liveGpsCoords && locationSourcePreference === 'device_gps' && (
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[10px] text-emerald-950 flex items-center justify-between">
                  <span className="flex items-center gap-1 font-semibold text-emerald-800">
                    <Check className="w-3 h-3 text-emerald-600" />
                    GPS Locked: {liveGpsCoords.lat.toFixed(5)}, {liveGpsCoords.lng.toFixed(5)} (±{liveGpsCoords.accuracy}m)
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${liveGpsCoords.lat},${liveGpsCoords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-700 hover:underline font-bold text-[10px] flex items-center gap-0.5"
                  >
                    <span>Check Pin</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Quick Location Remarks */}
            <div>
              <input
                type="text"
                placeholder="Station / Task remarks (e.g. Center duty, shelter patrol)..."
                value={locationNote}
                onChange={(e) => setLocationNote(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
              />
            </div>
          </div>

          {/* Action Punch Buttons: CHECK IN & CHECK OUT */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            {userTodayPunch ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-800 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Clocked In at {userTodayPunch.clockInTime}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {userTodayPunch.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-700 mt-1">
                    Station: <strong>{userTodayPunch.punchLocationName || 'Head Office'}</strong> ({userTodayPunch.workMode})
                  </p>

                  {userTodayPunch.latitude && (
                    <button
                      type="button"
                      onClick={() => setSelectedMapRecord(userTodayPunch)}
                      className="text-[11px] text-indigo-700 font-bold hover:underline flex items-center gap-1 mt-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>View Verified Google Maps Pin ({userTodayPunch.gpsSource || 'GPS'})</span>
                    </button>
                  )}
                </div>

                {/* CHECK OUT BUTTON */}
                {!userTodayPunch.clockOutTime ? (
                  <button
                    type="button"
                    onClick={handleClockOut}
                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-200 transition-all cursor-pointer active:scale-98"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Check Out / Clock Out (আজকের ডিউটি শেষ করুন)</span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 space-y-2">
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Duty Complete: Clocked out at {userTodayPunch.clockOutTime}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Recorded Duty Time: <strong className="text-slate-800 font-mono">{userTodayPunch.hoursWorked} hrs</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleClockOut}
                      className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Update Clock Out Time (পুনরায় চেক-আউট আপডেট)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* CHECK IN BUTTON */
              <button
                type="button"
                disabled={isLocating}
                onClick={handleClockIn}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all cursor-pointer active:scale-98 disabled:opacity-75"
              >
                {isLocating ? (
                  <>
                    <Navigation className="w-4 h-4 animate-spin text-white" />
                    <span>Acquiring GPS & Punching In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Check In / Clock In Now (উপস্থিতি পাঞ্চ করুন)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Summary Stats & Today's Attendance Overview */}
        <div className="lg:col-span-2 space-y-5">
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Staff
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {todaySummary.totalEmployees}
              </p>
              <span className="text-[10px] text-indigo-600 font-medium">Authentic LEEDO Staff</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">
                Present Today
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                {todaySummary.presentCount}
              </p>
              <span className="text-[10px] text-emerald-700 font-medium">{todaySummary.attendanceRate}% Attendance Rate</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">
                Late Arrival
              </span>
              <p className="text-2xl font-black text-amber-600 mt-1 font-mono">
                {todaySummary.lateCount}
              </p>
              <span className="text-[10px] text-amber-700 font-medium">After grace period</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-rose-600 block tracking-wider">
                On Leave / Absent
              </span>
              <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
                {todaySummary.onLeaveCount + todaySummary.absentCount}
              </p>
              <span className="text-[10px] text-rose-700 font-medium">{todaySummary.onLeaveCount} on approved leave</span>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                Google Maps Verified Check-In & Check-Out Policy:
              </p>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                When punching via mobile or web, ensure GPS location is allowed in your browser. The system captures the latitude & longitude coordinates to guarantee donor transparency and station verification. Remember to click <strong>Check Out</strong> at the end of your shift to record actual duty hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filters & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Date Picker Filter */}
            <div>
              <input
                type="date"
                value={selectedViewDate}
                onChange={(e) => setSelectedViewDate(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Mode Filter */}
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="All">All Modes</option>
              <option value="Office">Office Station</option>
              <option value="Remote">Remote</option>
              <option value="Field Mission">Field Mission</option>
            </select>

            {/* Location Filter */}
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 max-w-[150px] truncate"
            >
              <option value="All">All Locations</option>
              {jobLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Print Daily Attendance Register"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Register</span>
            </button>

            <button
              type="button"
              onClick={exportAttendanceCSV}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Records */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Date & Times</th>
                <th className="py-3.5 px-4">Duty Station</th>
                <th className="py-3.5 px-4">Status & Hours</th>
                <th className="py-3.5 px-4">GPS & Google Maps</th>
                {currentRole === 'hr_admin' && (
                  <th className="py-3.5 px-4 text-right">HR Audit</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={currentRole === 'hr_admin' ? 6 : 5} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">No attendance punches found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedViewDate === todayStr 
                        ? 'Staff have not punched in yet for today.' 
                        : `No records logged on ${selectedViewDate}.`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                          {rec.employeeName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ID: {rec.employeeId}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="text-slate-500 text-[10px] font-mono block">
                          {rec.date}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="text-emerald-700 font-bold">In: {rec.clockInTime}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">
                            Out: {rec.clockOutTime || <span className="text-amber-600 font-sans italic">Active / Working</span>}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs">
                          {rec.punchLocationName || rec.locationNote || 'Head Office'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Mode: {rec.workMode}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'Late'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {rec.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {rec.hoursWorked ? `${rec.hoursWorked} hrs` : '--'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {rec.latitude && rec.longitude ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMapRecord(rec)}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-700 hover:text-indigo-900 font-bold hover:underline cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>View Map Pin</span>
                          </button>
                          <a
                            href={rec.mapsUrl || `https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                            title="Open Google Maps in new tab"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">No GPS Record</span>
                      )}
                    </td>

                    {currentRole === 'hr_admin' && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setRecordToCorrect(rec);
                            setIsCorrectionModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 text-[11px] font-bold transition-all cursor-pointer"
                          title="Correct attendance record"
                        >
                          <Edit className="w-3 h-3 text-indigo-600" />
                          <span>Correct</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Maps Modal */}
      <GoogleMapModal
        isOpen={!!selectedMapRecord}
        onClose={() => setSelectedMapRecord(null)}
        record={selectedMapRecord}
      />

      {/* Biometric Machine CSV Import Modal */}
      <BiometricImportModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        employees={employees}
        onImportRecords={(importedRecords) => {
          handleBiometricImport(importedRecords);
          setIsBiometricModalOpen(false);
        }}
      />

      {/* HR Attendance Correction Modal */}
      <AttendanceCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setRecordToCorrect(null);
        }}
        recordToEdit={recordToCorrect}
        employees={employees}
        jobLocations={jobLocations}
        onSave={(record, isNew) => {
          if (isNew) {
            onAddAttendance(record);
          } else {
            onUpdateAttendance(record);
          }
        }}
      />
    </div>
  );
};
