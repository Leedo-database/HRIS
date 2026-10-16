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
  ShieldCheck
} from 'lucide-react';
import { getTodayAttendanceSummary } from '../../utils/calculations';
import { BiometricImportModal } from './BiometricImportModal';
import { GoogleMapModal } from './GoogleMapModal';

interface AttendanceModuleProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  onAddAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onImportAttendanceRecords?: (records: AttendanceRecord[]) => void;
  currentUser: Employee;
  currentRole: UserRole;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  employees,
  attendance,
  onAddAttendance,
  onUpdateAttendance,
  onImportAttendanceRecords,
  currentUser,
  currentRole,
}) => {
  const todayStr = '2026-10-14'; // current app reference date
  const [selectedMode, setSelectedMode] = useState<WorkMode>('Office');
  const [selectedJobLocation, setSelectedJobLocation] = useState<string>(
    currentUser.workStation && LEEDO_JOB_LOCATIONS.includes(currentUser.workStation as any)
      ? currentUser.workStation
      : 'Head Office'
  );
  const [locationNote, setLocationNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('All');
  const [filterLocation, setFilterLocation] = useState<string>('All');
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [selectedMapRecord, setSelectedMapRecord] = useState<AttendanceRecord | null>(null);

  // Live ticking clock for accurate punch timestamp
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

  // Check if current user has clocked in today
  const userTodayPunch = attendance.find(
    (a) => a.employeeId === currentUser.id && a.date === todayStr
  );

  const todaySummary = getTodayAttendanceSummary(employees, attendance, todayStr);

  // Coordinates mapping for LEEDO centers
  const getLocationCoords = (locName: string) => {
    switch (locName) {
      case 'Head Office': return { lat: 23.7937, lng: 90.4066 };
      case 'Inclusive School': return { lat: 23.7745, lng: 90.3654 };
      case 'Kamalapur SUS':
      case 'Kamalapur Shelter': return { lat: 23.7314, lng: 90.4262 };
      case 'Kodomtoli Shelter': return { lat: 23.6961, lng: 90.4533 };
      case 'Sadarghat SUS': return { lat: 23.7078, lng: 90.4109 };
      case 'Shambazar SUS': return { lat: 23.7095, lng: 90.4140 };
      case 'Mirpur SUS': return { lat: 23.8071, lng: 90.3686 };
      case 'Peace Home': return { lat: 23.7780, lng: 90.3800 };
      case 'RayerBazar SUS': return { lat: 23.7460, lng: 90.3650 };
      case 'Tejgoan SUS': return { lat: 23.7600, lng: 90.3950 };
      case 'Airport SUS': return { lat: 23.8512, lng: 90.4077 };
      default: return { lat: 23.7937, lng: 90.4066 };
    }
  };

  const handleClockIn = () => {
    setIsLocating(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const isLate = now.getHours() >= 9 && now.getMinutes() > 15;

    // Helper to finish punch with coordinates
    const finishPunch = (lat: number, lng: number, acc: number = 15) => {
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      const newRecord: AttendanceRecord = {
        id: `ATT-${todayStr.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
        employeeId: currentUser.id,
        employeeName: currentUser.fullName,
        date: todayStr,
        clockInTime: timeStr,
        workMode: selectedMode,
        status: selectedMode === 'Field Mission' ? 'Field Mission' : isLate ? 'Late' : 'Present',
        ipAddress: 'Mobile & Web GPS Punch',
        locationNote: locationNote || `${selectedJobLocation} (${selectedMode})`,
        punchLocationName: selectedJobLocation,
        lateReason: isLate ? 'Transit / Field Delay' : undefined,
        hoursWorked: 0,
        latitude: lat,
        longitude: lng,
        locationAccuracy: acc,
        mapsUrl,
      };

      onAddAttendance(newRecord);
      setLocationNote('');
      setIsLocating(false);
    };

    // Attempt HTML5 Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          finishPunch(pos.coords.latitude, pos.coords.longitude, Math.round(pos.coords.accuracy));
        },
        () => {
          // Fallback to designated LEEDO location coordinates
          const def = getLocationCoords(selectedJobLocation);
          finishPunch(def.lat, def.lng, 25);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      const def = getLocationCoords(selectedJobLocation);
      finishPunch(def.lat, def.lng, 25);
    }
  };

  const handleClockOut = () => {
    if (!userTodayPunch) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // estimate hours worked
    const [inH, inM] = userTodayPunch.clockInTime.split(':').map(Number);
    const hours = Math.max(1, Math.round(((now.getHours() * 60 + now.getMinutes() - (inH * 60 + inM)) / 60) * 10) / 10);

    const updated: AttendanceRecord = {
      ...userTodayPunch,
      clockOutTime: timeStr,
      hoursWorked: hours,
    };

    onUpdateAttendance(updated);
  };

  const handleBiometricImport = (importedRecords: AttendanceRecord[]) => {
    if (onImportAttendanceRecords) {
      onImportAttendanceRecords(importedRecords);
    } else {
      importedRecords.forEach((r) => onAddAttendance(r));
    }
  };

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
    return matchesSearch && matchesMode && matchesLoc;
  });

  const exportAttendanceCSV = () => {
    const headers = ['Record ID', 'Staff ID', 'Name', 'Date', 'Clock In', 'Clock Out', 'Status', 'Work Mode', 'Hours', 'Station Location', 'Google Maps Link'];
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
      `"${a.mapsUrl || (a.latitude ? `https://www.google.com/maps?q=${a.latitude},${a.longitude}` : '')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Log_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Attendance & Punch Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'employee' 
              ? 'Record your mobile/web check-in with Google Maps location capture & view attendance logs'
              : 'Live organization punch roster, Google Maps geolocation capture & biometric device machine importer'}
          </p>
        </div>

        {/* Biometric Machine Import Button: STRICTLY HR Admin Only */}
        {currentRole === 'hr_admin' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBiometricModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-200" />
              <span>Import Biometric Machine .CSV</span>
            </button>
          </div>
        )}
      </div>

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
              <span className="text-xs text-slate-500 font-mono font-medium">
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
                Shift: {currentUser.shiftStartTime || '10:00 AM'} – {currentUser.shiftEndTime || '06:00 PM'} ({currentUser.dailyDutyHours || 8} hrs)
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
            <div className="space-y-1.5">
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

            {/* LEEDO Job Location Selection (12 Master Locations) */}
            <div className="mt-3 space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>LEEDO Job Location:</span>
                <span className="text-[10px] text-slate-400 font-normal">12 Centers</span>
              </label>
              <select
                value={selectedJobLocation}
                onChange={(e) => setSelectedJobLocation(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50 font-medium text-slate-800"
              >
                {LEEDO_JOB_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Quick Location Note */}
            <div className="mt-2.5">
              <input
                type="text"
                placeholder="Station / Task remarks (e.g. Shelter night patrol, outreach)..."
                value={locationNote}
                onChange={(e) => setLocationNote(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
              />
            </div>
          </div>

          {/* Action Punch Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            {userTodayPunch ? (
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                  <div>
                    <span className="font-bold flex items-center gap-1 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Clocked In at {userTodayPunch.clockInTime}
                    </span>
                    <span className="text-[11px] text-emerald-700 block mt-0.5">
                      Station: {userTodayPunch.punchLocationName || userTodayPunch.locationNote || 'Head Office'}
                    </span>
                    {userTodayPunch.latitude && (
                      <button
                        type="button"
                        onClick={() => setSelectedMapRecord(userTodayPunch)}
                        className="text-[11px] text-indigo-700 font-bold hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>View Check-in on Google Maps</span>
                      </button>
                    )}
                  </div>
                </div>

                {!userTodayPunch.clockOutTime ? (
                  <button
                    type="button"
                    onClick={handleClockOut}
                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-200 transition-all cursor-pointer active:scale-98"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Clock Out / Check-Out For The Day</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-2xl text-center border border-slate-200">
                    <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Day Complete: Clocked out at {userTodayPunch.clockOutTime}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Total Shift: {userTodayPunch.hoursWorked} hrs recorded
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={isLocating}
                onClick={handleClockIn}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all cursor-pointer active:scale-98 disabled:opacity-75"
              >
                {isLocating ? (
                  <>
                    <Navigation className="w-4 h-4 animate-spin text-white" />
                    <span>Capturing GPS & Punching In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Clock In with Google Maps Location</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Summary Metrics & Biometric Device Banner */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary KPI Cards */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center justify-between">
              <span>Daily Attendance Roster Overview</span>
              <span className="text-xs text-slate-500 font-normal">Date: {todayStr}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-bold block">Present On Duty</span>
                <p className="text-2xl font-bold text-emerald-950 mt-1">{todaySummary.presentCount}</p>
                <span className="text-[10px] text-emerald-600 block mt-0.5">On time punches</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="text-[11px] text-amber-700 font-bold block">Late Arrival</span>
                <p className="text-2xl font-bold text-amber-950 mt-1">{todaySummary.lateCount}</p>
                <span className="text-[10px] text-amber-600 block mt-0.5">After 09:15 AM</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                <span className="text-[11px] text-blue-700 font-bold block">Field Mission</span>
                <p className="text-2xl font-bold text-blue-950 mt-1">{todaySummary.fieldMissionCount}</p>
                <span className="text-[10px] text-blue-600 block mt-0.5">Shelters / Rescue</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-600 font-bold block">Overall Turnout</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{todaySummary.attendanceRate}%</p>
                <span className="text-[10px] text-slate-500 block mt-0.5">{employees.length - todaySummary.absentCount}/{employees.length} Staff</span>
              </div>
            </div>
          </div>

          {/* Biometric Integration Banner Card (Strictly HR Admin Only per governance) */}
          {currentRole === 'hr_admin' && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-bold text-white text-sm">
                    Fingerprint Biometric Device Machine Integration
                  </h4>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed max-w-xl">
                  Upload your device's exported CSV log (columns: AC-No., Name, Date, On duty, Off duty, Clock In, Clock Out, Late, Early, Absent). The system automatically matches staff records and compiles total shift hours.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsBiometricModalOpen(true)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Upload Device CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Daily Punch Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-900 text-sm">Attendance Master Register & Maps Audit</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
              {filteredAttendance.length} records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search staff ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden w-full sm:w-44"
              />
            </div>

            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
            >
              <option value="All">All 12 Locations</option>
              {LEEDO_JOB_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
            >
              <option value="All">All Modes</option>
              <option value="Office">Office Station</option>
              <option value="Remote">Home / Remote</option>
              <option value="Field Mission">Field Mission</option>
            </select>

            <button
              onClick={exportAttendanceCSV}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Clock In</th>
                <th className="py-3 px-3">Clock Out</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Work Mode</th>
                <th className="py-3 px-3">Hours</th>
                <th className="py-3 px-3">Station / Center</th>
                <th className="py-3 px-4 text-center">Google Maps Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{rec.employeeName}</p>
                    <p className="text-[11px] font-mono text-slate-500">{rec.employeeId}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-mono">{rec.date}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800 font-mono">{rec.clockInTime}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{rec.clockOutTime || '--:--:--'}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        rec.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rec.status === 'Field Mission'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : rec.status === 'Late'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{rec.workMode}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">
                    {rec.hoursWorked ? `${rec.hoursWorked}h` : '--'}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">
                    <span className="block truncate max-w-[150px]">
                      {rec.punchLocationName || rec.locationNote || 'Head Office'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedMapRecord(rec)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold text-[11px] border border-slate-200 transition-colors cursor-pointer"
                      title="View exact physical punch coordinates on Google Maps"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>View Map</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No attendance punch records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Biometric CSV Import Modal */}
      <BiometricImportModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        employees={employees}
        onImportRecords={handleBiometricImport}
      />

      {/* Google Maps Verification Modal */}
      <GoogleMapModal
        isOpen={Boolean(selectedMapRecord)}
        onClose={() => setSelectedMapRecord(null)}
        record={selectedMapRecord}
      />
    </div>
  );
};
