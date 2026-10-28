import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord, WorkMode, LEEDO_JOB_LOCATIONS } from '../../types/hris';
import { X, CheckCircle2, AlertCircle, Clock, ShieldCheck, User, Calendar, MapPin } from 'lucide-react';

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit: AttendanceRecord | null;
  employees: Employee[];
  jobLocations?: string[];
  onSave: (record: AttendanceRecord, isNew: boolean) => void;
}

export const AttendanceCorrectionModal: React.FC<AttendanceCorrectionModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
  employees,
  jobLocations = [...LEEDO_JOB_LOCATIONS],
  onSave,
}) => {
  const isEditing = !!recordToEdit;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    recordToEdit?.employeeId || employees[0]?.id || ''
  );
  const [date, setDate] = useState<string>(
    recordToEdit?.date || new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<'Present' | 'Late' | 'Absent' | 'Field Mission'>(
    (recordToEdit?.status as any) || 'Present'
  );
  const [workMode, setWorkMode] = useState<WorkMode>(
    recordToEdit?.workMode || 'Office'
  );
  const [clockInTime, setClockInTime] = useState<string>(
    recordToEdit?.clockInTime || '10:00:00'
  );
  const [clockOutTime, setClockOutTime] = useState<string>(
    recordToEdit?.clockOutTime || '18:00:00'
  );
  const [hoursWorked, setHoursWorked] = useState<number>(
    recordToEdit?.hoursWorked || 8
  );
  const [punchLocation, setPunchLocation] = useState<string>(
    recordToEdit?.punchLocationName || jobLocations[0] || 'Head Office'
  );
  const [correctionReason, setCorrectionReason] = useState<string>(
    recordToEdit?.locationNote?.includes('Correction:') 
      ? recordToEdit.locationNote 
      : ''
  );
  const [customNote, setCustomNote] = useState<string>('');

  useEffect(() => {
    if (recordToEdit) {
      setSelectedEmployeeId(recordToEdit.employeeId);
      setDate(recordToEdit.date);
      setStatus((recordToEdit.status as any) || 'Present');
      setWorkMode(recordToEdit.workMode || 'Office');
      setClockInTime(recordToEdit.clockInTime || '10:00:00');
      setClockOutTime(recordToEdit.clockOutTime || '18:00:00');
      setHoursWorked(recordToEdit.hoursWorked ?? 8);
      setPunchLocation(recordToEdit.punchLocationName || jobLocations[0] || 'Head Office');
      setCorrectionReason('');
      setCustomNote(recordToEdit.locationNote || '');
    } else {
      setSelectedEmployeeId(employees[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('Present');
      setWorkMode('Office');
      setClockInTime('10:00:00');
      setClockOutTime('18:00:00');
      setHoursWorked(8);
      setPunchLocation(jobLocations[0] || 'Head Office');
      setCorrectionReason('');
      setCustomNote('');
    }
  }, [recordToEdit, isOpen]);

  if (!isOpen) return null;

  const currentEmp = employees.find((e) => e.id === selectedEmployeeId);

  // Auto calculate hours worked when in/out times change
  const handleCalculateHours = (inStr: string, outStr: string) => {
    if (!inStr || !outStr) return;
    try {
      const [hIn, mIn] = inStr.split(':').map(Number);
      const [hOut, mOut] = outStr.split(':').map(Number);
      if (!isNaN(hIn) && !isNaN(hOut)) {
        const totalIn = hIn * 60 + (mIn || 0);
        const totalOut = hOut * 60 + (mOut || 0);
        const diff = Math.max(0, totalOut - totalIn);
        const calculated = Math.round((diff / 60) * 10) / 10;
        setHoursWorked(calculated);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp) {
      alert('Please select an employee.');
      return;
    }

    if (!correctionReason.trim()) {
      alert('Please provide an official audit reason for this attendance correction.');
      return;
    }

    const auditRemark = `[HR Correction: ${correctionReason.trim()}] ${customNote ? '• ' + customNote : ''}`;

    const recordToSave: AttendanceRecord = {
      id: recordToEdit?.id || `ATT-MANUAL-${date.replace(/-/g, '')}-${currentEmp.id}-${Date.now().toString().slice(-4)}`,
      employeeId: currentEmp.id,
      employeeName: currentEmp.fullName,
      date,
      clockInTime: status === 'Absent' ? '--' : clockInTime,
      clockOutTime: status === 'Absent' ? '--' : clockOutTime,
      workMode,
      status,
      hoursWorked: status === 'Absent' ? 0 : hoursWorked,
      punchLocationName: punchLocation,
      locationNote: auditRemark,
      ipAddress: 'HR Admin Manual Override',
      gpsSource: 'Manual Punch',
    };

    onSave(recordToSave, !isEditing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {isEditing ? 'HR Attendance Correction (উপস্থিতি সংশোধন)' : 'Manual Attendance Entry (ম্যানুয়াল উপস্থিতি এন্ট্রি)'}
              </h3>
              <p className="text-xs text-slate-300">
                Official HR Administrative Audit Override with mandatory remark
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Employee Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Staff Member (কর্মী নির্বাচন)
            </label>
            {isEditing ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{recordToEdit?.employeeName}</p>
                  <p className="text-xs text-slate-500 font-mono">ID: {recordToEdit?.employeeId}</p>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-bold">
                  Editing Record
                </span>
              </div>
            ) : (
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.designation} - ID: {emp.id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Attendance Date (তারিখ)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Attendance Status (স্ট্যাটাস)
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as any;
                  setStatus(newStatus);
                  if (newStatus === 'Absent') {
                    setHoursWorked(0);
                  } else if (hoursWorked === 0) {
                    setHoursWorked(8);
                  }
                }}
                className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="Present">Present (উপস্থিত - On Time)</option>
                <option value="Late">Late (দেরিতে উপস্থিতি - Approved / Flagged)</option>
                <option value="Field Mission">Field Mission (মাঠ পর্যায় / আউটডোর ডিউটি)</option>
                <option value="Absent">Absent (অনুপস্থিত - Unapproved Absence)</option>
              </select>
            </div>
          </div>

          {/* Clock In / Out Times & Hours Worked (Hidden if Absent) */}
          {status !== 'Absent' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Clock In (ইন টাইম)
                </label>
                <input
                  type="text"
                  placeholder="10:00:00"
                  value={clockInTime}
                  onChange={(e) => {
                    setClockInTime(e.target.value);
                    handleCalculateHours(e.target.value, clockOutTime);
                  }}
                  className="w-full text-xs font-mono p-2 bg-white border border-slate-200 rounded-lg outline-hidden font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Clock Out (আউট টাইম)
                </label>
                <input
                  type="text"
                  placeholder="18:00:00"
                  value={clockOutTime}
                  onChange={(e) => {
                    setClockOutTime(e.target.value);
                    handleCalculateHours(clockInTime, e.target.value);
                  }}
                  className="w-full text-xs font-mono p-2 bg-white border border-slate-200 rounded-lg outline-hidden font-bold text-indigo-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Hours Worked (ঘণ্টা)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono p-2 bg-white border border-slate-200 rounded-lg outline-hidden font-bold text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Work Mode & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Mode (কাজের ধরন)
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="Office">Office Station</option>
                <option value="Field Mission">Field Mission / Shelter</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Center / Station
              </label>
              <select
                value={punchLocation}
                onChange={(e) => setPunchLocation(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {jobLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Correction Reason & Audit Remark */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correction Reason & Audit Remark (বাধ্যতামূলক সংশোধনের কারণ) *
            </label>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[
                'Biometric device offline / machine glitch',
                'Supervisor confirmed outdoor field duty',
                'Official punctuality waiver granted',
                'Emergency shelter duty adjustment'
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setCorrectionReason(reason)}
                  className="text-left text-[11px] p-1.5 px-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200 transition-colors text-slate-600 truncate"
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Center biometric machine was down due to power cut, employee verified present by Center In-charge..."
              rows={2}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Save Attendance Correction' : 'Add Manual Attendance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
