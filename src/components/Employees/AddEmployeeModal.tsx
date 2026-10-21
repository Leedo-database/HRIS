import React, { useState, useEffect } from 'react';
import { Employee, EmploymentStatus, Gender, LEEDO_JOB_LOCATIONS } from '../../types/hris';
import { 
  X, 
  UserPlus, 
  Save, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  UserCheck, 
  Sparkles,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import { calculateDailyHours, calculateLeaveQuotas, formatCurrency, isEmployeeActive } from '../../utils/calculations';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  employeeToEdit?: Employee | null;
  existingCount: number;
  employees?: Employee[];
  jobLocations?: string[];
}

const ALL_DAYS = [
  { key: 'Sat', label: 'Saturday (শনি)' },
  { key: 'Sun', label: 'Sunday (রবি)' },
  { key: 'Mon', label: 'Monday (সোম)' },
  { key: 'Tue', label: 'Tuesday (মঙ্গল)' },
  { key: 'Wed', label: 'Wednesday (বুধ)' },
  { key: 'Thu', label: 'Thursday (বৃহঃ)' },
  { key: 'Fri', label: 'Friday (শুক্র)' },
];

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employeeToEdit,
  existingCount,
  employees = [],
  jobLocations = [...LEEDO_JOB_LOCATIONS],
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'duty_schedule' | 'salary' | 'locations' | 'compliance'>('basic');

  useEffect(() => {
    if (employeeToEdit) {
      const duty = employeeToEdit.dutyDays && employeeToEdit.dutyDays.length > 0
        ? employeeToEdit.dutyDays
        : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
      const startT = employeeToEdit.shiftStartTime || '10:00';
      const endT = employeeToEdit.shiftEndTime || '18:00';
      const hours = employeeToEdit.dailyDutyHours || calculateDailyHours(startT, endT);
      const quotas = calculateLeaveQuotas(duty.length, hours, employeeToEdit.joiningDate);

      setFormData({
        ...employeeToEdit,
        dutyDays: duty,
        shiftStartTime: startT,
        shiftEndTime: endT,
        dailyDutyHours: hours,
        weeklyDutyDaysCount: duty.length,
        casualLeaveQuota: employeeToEdit.casualLeaveQuota ?? quotas.casualLeave,
        sickLeaveQuota: employeeToEdit.sickLeaveQuota ?? quotas.sickLeave,
        mobileAllowance: employeeToEdit.mobileAllowance ?? 1000,
        travelAllowance: employeeToEdit.travelAllowance ?? 2000,
        advanceBalance: employeeToEdit.advanceBalance ?? 0,
        jobLocations: employeeToEdit.jobLocations && employeeToEdit.jobLocations.length > 0
          ? employeeToEdit.jobLocations
          : [employeeToEdit.workStation || 'Head Office'],
      });
    } else {
      // Determine next sequential ID (e.g. 1100, 1101)
      const numericIds = employees
        .map((e) => Number(e.id))
        .filter((n) => !isNaN(n) && n >= 1000);
      const nextId = numericIds.length > 0 ? String(Math.max(...numericIds) + 1) : String(1001 + existingCount);

      const defaultDuty = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
      const defaultStart = '10:00';
      const defaultEnd = '18:00';
      const defaultHours = 8;
      const joinDate = new Date().toISOString().split('T')[0];
      const quotas = calculateLeaveQuotas(defaultDuty.length, defaultHours, joinDate);

      setFormData({
        id: nextId,
        fullName: '',
        banglaName: '',
        email: '',
        phone: '+880 1',
        gender: 'Female',
        dob: '1995-01-01',
        bloodGroup: 'B+',
        nidOrPassport: '',
        presentAddress: 'Dhaka, Bangladesh',
        permanentAddress: '',
        designation: 'Project Officer',
        department: 'Program & Operation',
        gradeLevel: 'Grade 4 (Officer)',
        joiningDate: joinDate,
        employmentType: 'Permanent',
        status: 'Active',
        workStation: 'Head Office',
        assignedProject: 'Child Protection & Street Hub',
        jobLocations: ['Head Office'],
        
        // Duty Schedule
        dutyDays: defaultDuty,
        shiftStartTime: defaultStart,
        shiftEndTime: defaultEnd,
        dailyDutyHours: defaultHours,
        weeklyDutyDaysCount: 6,

        // Quotas
        casualLeaveQuota: quotas.casualLeave,
        sickLeaveQuota: quotas.sickLeave,

        // Salary Breakdown
        grossSalary: 50000,
        mobileAllowance: 1000,
        travelAllowance: 2000,
        advanceBalance: 0,
        basicSalary: 25000,
        houseRent: 12500,
        medicalAllowance: 5000,
        conveyanceAllowance: 5000,
        specialProjectAllowance: 2500,
        pfDeductionPercentage: 8,
        taxDeduction: 1000,

        // Supervisor
        reportingManagerId: '1002',
        reportingManagerName: 'Murshida Akhter Kanta (Director - Admin & Finance)',

        emergencyContact: {
          name: '',
          relation: 'Spouse',
          phone: '+880 1',
          address: 'Dhaka, Bangladesh',
        },
        bankDetails: {
          bankName: 'Brac Bank PLC',
          accountName: '',
          accountNumber: '',
          branchName: 'Dhaka Branch',
          routingNumber: '060264182',
          mobileBankingType: 'bKash',
          mobileBankingNumber: '',
        },
        compliance: {
          safeguardingCertified: true,
          safeguardingCertDate: new Date().toISOString().split('T')[0],
          codeOfConductSigned: true,
          policeClearanceVerified: true,
          ndaSigned: true,
          donorComplianceBriefing: true,
        },
      });
    }
  }, [employeeToEdit, existingCount, isOpen, employees]);

  if (!isOpen) return null;

  // Toggle a single duty day
  const toggleDutyDay = (dayKey: string) => {
    const current = formData.dutyDays || [];
    let updated: string[];
    if (current.includes(dayKey)) {
      if (current.length === 1) return; // keep at least 1 day
      updated = current.filter((d) => d !== dayKey);
    } else {
      updated = [...current, dayKey];
    }

    // recalculate quotas live
    const quotas = calculateLeaveQuotas(
      updated.length,
      formData.dailyDutyHours || 8,
      formData.joiningDate
    );

    setFormData((prev) => ({
      ...prev,
      dutyDays: updated,
      weeklyDutyDaysCount: updated.length,
      casualLeaveQuota: quotas.casualLeave,
      sickLeaveQuota: quotas.sickLeave,
    }));
  };

  // Preset schedules
  const applyPresetSchedule = (days: string[], start: string, end: string, hours: number) => {
    const quotas = calculateLeaveQuotas(days.length, hours, formData.joiningDate);
    setFormData((prev) => ({
      ...prev,
      dutyDays: days,
      shiftStartTime: start,
      shiftEndTime: end,
      dailyDutyHours: hours,
      weeklyDutyDaysCount: days.length,
      casualLeaveQuota: quotas.casualLeave,
      sickLeaveQuota: quotas.sickLeave,
    }));
  };

  // Shift Timing change -> auto-calculates hours and recalculates quotas
  const handleShiftTimeChange = (type: 'start' | 'end', val: string) => {
    const startT = type === 'start' ? val : (formData.shiftStartTime || '10:00');
    const endT = type === 'end' ? val : (formData.shiftEndTime || '18:00');
    const hours = calculateDailyHours(startT, endT);
    const quotas = calculateLeaveQuotas(
      (formData.dutyDays || []).length,
      hours,
      formData.joiningDate
    );

    setFormData((prev) => ({
      ...prev,
      shiftStartTime: startT,
      shiftEndTime: endT,
      dailyDutyHours: hours,
      casualLeaveQuota: quotas.casualLeave,
      sickLeaveQuota: quotas.sickLeave,
    }));
  };

  // Toggle Job Location
  const toggleJobLocation = (loc: string) => {
    const current = formData.jobLocations || [];
    let updated: string[];
    if (current.includes(loc)) {
      if (current.length === 1) return;
      updated = current.filter((l) => l !== loc);
    } else {
      updated = [...current, loc];
    }
    setFormData((prev) => ({
      ...prev,
      jobLocations: updated,
      workStation: updated[0] || 'Head Office',
    }));
  };

  const handleSupervisorChange = (supId: string) => {
    const sup = employees.find((e) => e.id === supId);
    setFormData((prev) => ({
      ...prev,
      reportingManagerId: supId || null,
      reportingManagerName: sup ? `${sup.fullName} (${sup.designation})` : null,
    }));
  };

  const handleGrossChange = (val: number) => {
    const gross = Number(val) || 0;
    const basic = Math.round(gross * 0.5);
    const house = Math.round(gross * 0.25);
    const med = Math.round(gross * 0.1);
    const conv = Math.round(gross * 0.1);
    const tax = gross > 40000 ? Math.round((gross - 40000) * 0.05) : 0;

    setFormData((prev) => ({
      ...prev,
      grossSalary: gross,
      basicSalary: basic,
      houseRent: house,
      medicalAllowance: med,
      conveyanceAllowance: conv,
      taxDeduction: tax,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      alert('Please fill out Employee Name and Official Email.');
      return;
    }
    onSave(formData as Employee);
    onClose();
  };

  const weeklyHours = (formData.dutyDays?.length || 6) * (formData.dailyDutyHours || 8);
  const totalLeave = (formData.casualLeaveQuota || 16) + (formData.sickLeaveQuota || 14);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                {employeeToEdit ? `Edit Staff Profile: ${employeeToEdit.fullName}` : 'Onboard New Staff Member'}
              </h2>
              <p className="text-xs text-slate-400">
                Staff ID: <span className="font-mono text-emerald-400 font-bold">{formData.id}</span> • Supervisor, Duty Days, Hours, Salary & Locations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'basic'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Personal & Supervisor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('duty_schedule')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'duty_schedule'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" /> Duty Schedule & Leave Quotas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salary')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'salary'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Gross Salary & Allowances
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('locations')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'locations'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" /> Job Locations ({formData.jobLocations?.length || 1})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'compliance'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Compliance & Bank
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: BASIC & SUPERVISOR */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Staff ID</label>
                  <input
                    type="text"
                    value={formData.id || ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold bg-slate-50 text-slate-800"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Full Legal Name (English)</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="e.g. Mohammad Jasim Uddin"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bangla Name (বাংলা নাম)</label>
                  <input
                    type="text"
                    value={formData.banglaName || ''}
                    onChange={(e) => setFormData({ ...formData, banglaName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="e.g. মোঃ জসিম উদ্দিন"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="e.g. jasim@leedobd.org"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                    placeholder="+880 1712-XXXXXX"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={formData.gender || 'Female'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup || 'B+'}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SUPERVISOR / REPORTING MANAGER (Explicit user requirement) */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-700" />
                  <label className="font-bold text-indigo-950 text-xs">
                    Designated Supervisor / Reporting Manager (কে কার সুপারভাইজার)
                  </label>
                </div>
                <p className="text-[11px] text-indigo-800">
                  Select the line supervisor responsible for approving this employee's leave applications, timesheets, and field duty requests.
                </p>
                <select
                  value={formData.reportingManagerId || ''}
                  onChange={(e) => handleSupervisorChange(e.target.value)}
                  className="w-full p-2.5 border border-indigo-200 rounded-xl bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- No Direct Line Supervisor (Reports to Founder/ED) --</option>
                  {/* If previously assigned supervisor has resigned/separated, display with tag */}
                  {formData.reportingManagerId &&
                    !employees
                      .filter((e) => e.id !== formData.id && isEmployeeActive(e))
                      .some((e) => e.id === formData.reportingManagerId) && (
                      <option value={formData.reportingManagerId}>
                        ⚠️ [Inactive/Separated: {formData.reportingManagerName || formData.reportingManagerId}] — Reassign to an active supervisor
                      </option>
                    )}
                  {employees
                    .filter((e) => e.id !== formData.id && isEmployeeActive(e))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        [{emp.id}] {emp.fullName} • {emp.designation} ({emp.department})
                      </option>
                    ))}
                </select>
              </div>

              {/* Designation, Department & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation || ''}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                    placeholder="e.g. Field Outreach Officer"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={formData.department || 'Program & Operation'}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Program & Operation">Program & Operation</option>
                    <option value="Admin & Finance">Admin & Finance</option>
                    <option value="Grants Acquisition">Grants Acquisition</option>
                    <option value="MEAL & Research">MEAL & Research</option>
                    <option value="Field Operations & Logistics">Field Operations & Logistics</option>
                    <option value="Shelter & Safeguarding">Shelter & Safeguarding</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade Level</label>
                  <select
                    value={formData.gradeLevel || 'Grade 4 (Officer)'}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Grade 1 (Executive)">Grade 1 (Executive)</option>
                    <option value="Grade 2 (Managerial)">Grade 2 (Managerial)</option>
                    <option value="Grade 3 (Senior Professional)">Grade 3 (Senior Professional)</option>
                    <option value="Grade 4 (Officer)">Grade 4 (Officer)</option>
                    <option value="Grade 5 (Assistant / Field Associate)">Grade 5 (Assistant / Field Associate)</option>
                    <option value="Grade 6 (Support Staff)">Grade 6 (Support Staff)</option>
                  </select>
                </div>
              </div>

              {/* Status and Joining Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate || ''}
                    onChange={(e) => {
                      const newJoin = e.target.value;
                      const quotas = calculateLeaveQuotas(
                        formData.dutyDays?.length || 6,
                        formData.dailyDutyHours || 8,
                        newJoin
                      );
                      setFormData({ 
                        ...formData, 
                        joiningDate: newJoin,
                        casualLeaveQuota: quotas.casualLeave,
                        sickLeaveQuota: quotas.sickLeave,
                      });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Employment Status</label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EmploymentStatus })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Probation">Probation</option>
                    <option value="Contractual">Contractual</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated / Separated</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType || 'Permanent'}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
              </div>

              {/* Separation reason if status is Terminated */}
              {formData.status === 'Terminated' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Employee Separation Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Separation Reason</label>
                      <select
                        value={formData.separationReason || 'Resignation'}
                        onChange={(e) => setFormData({ ...formData, separationReason: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="Resignation">Voluntary Resignation</option>
                        <option value="Termination">Official Termination</option>
                        <option value="Contract Expiry">Contract Expiry</option>
                        <option value="Retirement">Retirement</option>
                        <option value="Mutual Separation">Mutual Separation</option>
                        <option value="Disciplinary Dismissal">Disciplinary Action / Dismissal</option>
                        <option value="Project Funding Closure">Project Funding Closure</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Separation Date</label>
                      <input
                        type="date"
                        value={formData.separationDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData({ ...formData, separationDate: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DUTY SCHEDULE & LEAVE QUOTAS (Explicit User Requirement) */}
          {activeTab === 'duty_schedule' && (
            <div className="space-y-5">
              {/* Preset Schedule Buttons */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-bold text-slate-800 text-xs block">Quick Schedule Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetSchedule(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'], '10:00', '18:00', 8)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-xs cursor-pointer"
                  >
                    Standard 6 Days (Sat-Thu) • 10-06pm (8h)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetSchedule(['Sun', 'Mon', 'Tue', 'Wed', 'Thu'], '09:00', '17:00', 8)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-200 text-xs cursor-pointer"
                  >
                    5 Days (Sun-Thu) • 9-5pm (8h)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetSchedule(['Sat', 'Mon', 'Wed'], '10:00', '13:00', 3)}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 text-xs cursor-pointer"
                  >
                    Part-Time 3 Days • 3 Hours/Day
                  </button>
                </div>
              </div>

              {/* Multiple Day Duty Selector */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Select Duty Days (কে কোন কোন দিন ডিউটি করবে - একাধিক দিন সিলেক্ট করুন):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ALL_DAYS.map((day) => {
                    const isChecked = (formData.dutyDays || []).includes(day.key);
                    return (
                      <button
                        type="button"
                        key={day.key}
                        onClick={() => toggleDutyDay(day.key)}
                        className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{day.label}</span>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isChecked ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Selected: <strong>{formData.dutyDays?.length || 0} Days/Week</strong> ({formData.dutyDays?.join(', ')})
                </p>
              </div>

              {/* Shift Timing: 10:00 - 18:00 Auto calculates 8 hrs */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Office Shift Timing & Auto Daily Hours Calculation
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    Auto Calculated: {formData.dailyDutyHours || 8} hrs/day
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Shift Start Time</label>
                    <input
                      type="time"
                      value={formData.shiftStartTime || '10:00'}
                      onChange={(e) => handleShiftTimeChange('start', e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Shift End Time</label>
                    <input
                      type="time"
                      value={formData.shiftEndTime || '18:00'}
                      onChange={(e) => handleShiftTimeChange('end', e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Daily Duty Hours (Editable)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="24"
                      value={formData.dailyDutyHours ?? 8}
                      onChange={(e) => {
                        const h = Number(e.target.value) || 8;
                        const quotas = calculateLeaveQuotas(
                          formData.dutyDays?.length || 6,
                          h,
                          formData.joiningDate
                        );
                        setFormData({
                          ...formData,
                          dailyDutyHours: h,
                          casualLeaveQuota: quotas.casualLeave,
                          sickLeaveQuota: quotas.sickLeave,
                        });
                      }}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>Weekly Commitment: <strong>{weeklyHours} Hours/Week</strong> ({formData.dutyDays?.length || 6} days × {formData.dailyDutyHours || 8} hrs)</span>
                  <span className="text-indigo-600 font-semibold">Standard NGO Ratio: {(weeklyHours / 48).toFixed(2)}x</span>
                </div>
              </div>

              {/* Automatic Leave Quota Ratio Calculator (Casual: 16 days, Sick: 14 days baseline) */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-emerald-700" />
                    Proportional Leave Quota Auto-Calculator (রেশিও অনুযায়ী ছুটি হিসাব)
                  </span>
                  <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                    Total: {totalLeave} Days
                  </span>
                </div>

                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  <strong>Policy:</strong> Full-time staff (6 days, 8 hrs = 48 hrs/week) receive <strong>16 Days Casual Leave</strong> & <strong>14 Days Sick Leave</strong> (30 days total). Staff with custom schedules (e.g. 3 days, 3 hrs) receive proportionate leave. Joining mid-year reduces the quota pro-rata by remaining months. HR can customize either field below:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-emerald-200">
                    <label className="font-bold text-slate-800 block mb-1">
                      Casual Leave Quota (নৈমিত্তিক ছুটি)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.casualLeaveQuota ?? 16}
                        onChange={(e) => setFormData({ ...formData, casualLeaveQuota: Number(e.target.value) || 0 })}
                        className="w-full p-2 border border-slate-200 rounded-xl font-bold text-sm text-indigo-700"
                      />
                      <span className="text-xs text-slate-500 font-bold">Days</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Standard baseline: 16 days</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200">
                    <label className="font-bold text-slate-800 block mb-1">
                      Sick Leave Quota (অসুস্থতাজনিত ছুটি)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.sickLeaveQuota ?? 14}
                        onChange={(e) => setFormData({ ...formData, sickLeaveQuota: Number(e.target.value) || 0 })}
                        className="w-full p-2 border border-slate-200 rounded-xl font-bold text-sm text-emerald-700"
                      />
                      <span className="text-xs text-slate-500 font-bold">Days</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Standard baseline: 14 days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALARY (Gross, Mobile Allowance, Travel Allowance, Deductions) */}
          {activeTab === 'salary' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <span className="font-bold text-amber-950 text-xs block mb-1">
                  Salary Structure (বেতন কাঠামো - Gross, Mobile, Travel & Advance)
                </span>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Monthly payroll calculates: <strong>Gross Salary + Mobile Allowance + Travel Allowance</strong>. Unapproved absents deduct salary per working day rate (<code>Gross ÷ 26</code>). Any outstanding advance/loan is automatically deducted.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Monthly Gross Salary (৳)</label>
                  <input
                    type="number"
                    value={formData.grossSalary || ''}
                    onChange={(e) => handleGrossChange(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 bg-white"
                    placeholder="e.g. 50000"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Daily Wage Rate: ৳{Math.round((formData.grossSalary || 0) / 26)}/day
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Mobile Allowance (৳)</label>
                  <input
                    type="number"
                    value={formData.mobileAllowance ?? 1000}
                    onChange={(e) => setFormData({ ...formData, mobileAllowance: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-sm text-indigo-700 bg-white"
                    placeholder="e.g. 1000"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Official communication stipend</span>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Travel Allowance (৳)</label>
                  <input
                    type="number"
                    value={formData.travelAllowance ?? 2000}
                    onChange={(e) => setFormData({ ...formData, travelAllowance: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-sm text-indigo-700 bg-white"
                    placeholder="e.g. 2000"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Conveyance / Field transit</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Advance / Loan Balance (৳)</label>
                  <input
                    type="number"
                    value={formData.advanceBalance ?? 0}
                    onChange={(e) => setFormData({ ...formData, advanceBalance: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-rose-700 bg-white"
                    placeholder="e.g. 5000"
                  />
                  <span className="text-[10px] text-rose-600 mt-0.5 block">
                    Outstanding advance to deduct on next payroll
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Estimated Total Monthly Gross</span>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5">
                    {formatCurrency((formData.grossSalary || 0) + (formData.mobileAllowance || 0) + (formData.travelAllowance || 0))}
                  </p>
                  <span className="text-[10px] text-slate-500">Gross + Mobile + Travel</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 13 LEEDO JOB LOCATIONS (Multiple Select) */}
          {activeTab === 'locations' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                <span className="font-bold text-indigo-950 text-xs block mb-1">
                  Multi-Location Assignment (এক জন কর্মী ২-৩ টি কর্মস্থলে কাজ করতে পারবে)
                </span>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Select all LEEDO centers and shelters where this staff member operates or conducts field duties.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {jobLocations.map((loc) => {
                  const isSelected = (formData.jobLocations || []).includes(loc);
                  return (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => toggleJobLocation(loc)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                        <div>
                          <p className="font-bold text-xs">{loc}</p>
                          <span className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            Official LEEDO Center
                          </span>
                        </div>
                      </div>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isSelected ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-700">
                  Assigned Centers ({formData.jobLocations?.length || 0}):{' '}
                  <strong>{formData.jobLocations?.join(', ') || 'Head Office'}</strong>
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: COMPLIANCE & BANK */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="font-bold text-slate-900 text-xs block">Bank & Mobile Banking Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankDetails?.bankName || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails!, bankName: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      placeholder="e.g. Brac Bank PLC"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.bankDetails?.accountNumber || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails!, accountNumber: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono"
                      placeholder="e.g. 150120XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mobile Banking</label>
                    <select
                      value={formData.bankDetails?.mobileBankingType || 'bKash'}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails!, mobileBankingType: e.target.value as any }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Wallet Number</label>
                    <input
                      type="text"
                      value={formData.bankDetails?.mobileBankingNumber || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails!, mobileBankingNumber: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono"
                      placeholder="+880 1XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Safeguarding & Compliance */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <span className="font-bold text-emerald-950 text-xs block">Child Safeguarding & NGO Governance</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.compliance?.safeguardingCertified || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        compliance: { ...formData.compliance!, safeguardingCertified: e.target.checked }
                      })}
                      className="rounded-sm text-indigo-600"
                    />
                    <span>Child Safeguarding Certified</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.compliance?.codeOfConductSigned || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        compliance: { ...formData.compliance!, codeOfConductSigned: e.target.checked }
                      })}
                      className="rounded-sm text-indigo-600"
                    />
                    <span>Code of Conduct Signed</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.compliance?.policeClearanceVerified || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        compliance: { ...formData.compliance!, policeClearanceVerified: e.target.checked }
                      })}
                      className="rounded-sm text-indigo-600"
                    />
                    <span>Police Clearance Verified</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.compliance?.ndaSigned || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        compliance: { ...formData.compliance!, ndaSigned: e.target.checked }
                      })}
                      className="rounded-sm text-indigo-600"
                    />
                    <span>Donor Confidentiality & NDA</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{employeeToEdit ? 'Save Changes' : 'Confirm & Register Staff'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
