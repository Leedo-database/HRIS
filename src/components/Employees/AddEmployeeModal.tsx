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
  Calculator,
  AlertTriangle,
  GraduationCap,
  Building,
  Heart,
  PhoneCall,
  FileCheck2
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
  const [activeTab, setActiveTab] = useState<'personal' | 'job' | 'duty_schedule' | 'salary' | 'locations_compliance'>('personal');

  const computeNetSalary = (data: Partial<Employee>) => {
    const gross = Number(data.grossSalary) || 0;
    const mobile = Number(data.mobileAllowance) || 0;
    const travel = Number(data.travelAllowance) || 0;
    const basic = Number(data.basicSalary) || Math.round(gross * 0.5);
    const pf = Math.round(basic * ((data.pfDeductionPercentage ?? 8) / 100));
    const tax = Number(data.taxDeduction) || 0;
    const adv = Number(data.advanceBalance) || 0;
    return Math.max(0, gross + mobile + travel - pf - tax - adv);
  };

  useEffect(() => {
    if (employeeToEdit) {
      const duty = employeeToEdit.dutyDays && employeeToEdit.dutyDays.length > 0
        ? employeeToEdit.dutyDays
        : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
      const startT = employeeToEdit.shiftStartTime || '10:00';
      const endT = employeeToEdit.shiftEndTime || '18:00';
      const hours = employeeToEdit.dailyDutyHours || calculateDailyHours(startT, endT);
      const quotas = calculateLeaveQuotas(duty.length, hours, employeeToEdit.joiningDate);

      const net = employeeToEdit.netSalary ?? computeNetSalary(employeeToEdit);

      setFormData({
        ...employeeToEdit,
        highestEducation: employeeToEdit.highestEducation ?? 'Bachelor of Social Science (BSS)',
        professionalEducation: employeeToEdit.professionalEducation ?? '',
        certificateNumber: employeeToEdit.certificateNumber ?? '',
        fatherOrSpouseName: employeeToEdit.fatherOrSpouseName ?? '',
        motherName: employeeToEdit.motherName ?? '',
        religion: employeeToEdit.religion ?? 'Islam',
        natureOfEmployment: employeeToEdit.natureOfEmployment ?? 'Regular',
        categoryOfStaff: employeeToEdit.categoryOfStaff ?? 'Officer',
        donorName: employeeToEdit.donorName ?? 'LEEDO Core Fund',
        jobLocationCategory: employeeToEdit.jobLocationCategory ?? 'Urban Outreach & Shelters',
        confirmationDate: employeeToEdit.confirmationDate ?? '',
        separationDate: employeeToEdit.separationDate ?? '',
        separationReason: employeeToEdit.separationReason ?? '',
        remarks: employeeToEdit.remarks ?? '',
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
        netSalary: net,
        jobLocations: employeeToEdit.jobLocations && employeeToEdit.jobLocations.length > 0
          ? employeeToEdit.jobLocations
          : [employeeToEdit.workStation || 'Head Office'],
        bankDetails: {
          bankName: employeeToEdit.bankDetails?.bankName || 'Brac Bank PLC',
          accountName: employeeToEdit.bankDetails?.accountName || employeeToEdit.fullName,
          accountNumber: employeeToEdit.bankDetails?.accountNumber || '',
          branchName: employeeToEdit.bankDetails?.branchName || 'Dhaka Branch',
          routingNumber: employeeToEdit.bankDetails?.routingNumber || '060264182',
          mobileBankingType: employeeToEdit.bankDetails?.mobileBankingType || 'bKash',
          mobileBankingNumber: employeeToEdit.bankDetails?.mobileBankingNumber || employeeToEdit.phone,
        },
        emergencyContact: {
          name: employeeToEdit.emergencyContact?.name || '',
          relation: employeeToEdit.emergencyContact?.relation || 'Spouse',
          phone: employeeToEdit.emergencyContact?.phone || '',
          address: employeeToEdit.emergencyContact?.address || employeeToEdit.presentAddress,
        },
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

      const gross = 50000;
      const basic = 25000;
      const house = 12500;
      const med = 5000;
      const conv = 5000;
      const mob = 1000;
      const trav = 2000;
      const tax = 500;
      const pf = Math.round(basic * 0.08);
      const net = gross + mob + trav - pf - tax;

      setFormData({
        id: nextId,
        fullName: '',
        banglaName: '',
        email: '',
        personalEmail: '',
        phone: '+880 1',
        gender: 'Female',
        dob: '1995-01-01',
        religion: 'Islam',
        bloodGroup: 'B+',
        nidOrPassport: '',
        fatherOrSpouseName: '',
        motherName: '',
        highestEducation: 'Bachelor of Social Science (BSS)',
        professionalEducation: 'Child Protection in Emergencies (CPiE)',
        certificateNumber: '',
        presentAddress: 'Dhaka, Bangladesh',
        permanentAddress: '',
        designation: 'Project Officer',
        department: 'Program & Operation',
        gradeLevel: 'Grade 4 (Officer)',
        joiningDate: joinDate,
        confirmationDate: '',
        separationDate: '',
        separationReason: '',
        remarks: 'Active staff member onboarded under official LEEDO HR policy.',
        employmentType: 'Permanent',
        status: 'Active',
        natureOfEmployment: 'Regular',
        categoryOfStaff: 'Officer',
        donorName: 'LEEDO Core Fund',
        jobLocationCategory: 'Urban Outreach & Shelters',
        workStation: 'Head Office',
        jobLocation: 'Head Office',
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
        grossSalary: gross,
        mobileAllowance: mob,
        travelAllowance: trav,
        advanceBalance: 0,
        basicSalary: basic,
        houseRent: house,
        medicalAllowance: med,
        conveyanceAllowance: conv,
        specialProjectAllowance: 2500,
        pfDeductionPercentage: 8,
        taxDeduction: tax,
        netSalary: net,

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
      jobLocation: updated[0] || 'Head Office',
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
    const net = computeNetSalary({
      ...formData,
      grossSalary: gross,
      basicSalary: basic,
      houseRent: house,
      medicalAllowance: med,
      conveyanceAllowance: conv,
      taxDeduction: tax,
    });

    setFormData((prev) => ({
      ...prev,
      grossSalary: gross,
      basicSalary: basic,
      houseRent: house,
      medicalAllowance: med,
      conveyanceAllowance: conv,
      taxDeduction: tax,
      netSalary: net,
    }));
  };

  const updateAllowance = (field: 'mobileAllowance' | 'travelAllowance' | 'advanceBalance' | 'taxDeduction', val: number) => {
    const updated = {
      ...formData,
      [field]: val,
    };
    const net = computeNetSalary(updated);
    setFormData({
      ...updated,
      netSalary: net,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      alert('Please fill out Employee Name and Official Email.');
      return;
    }
    const finalNet = computeNetSalary(formData);
    onSave({
      ...formData,
      netSalary: finalNet,
      jobLocation: formData.jobLocation || formData.workStation || 'Head Office',
    } as Employee);
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
                {employeeToEdit ? `Edit Staff Profile: ${employeeToEdit.fullName}` : 'Onboard New Staff Member (কর্মী নিবন্ধন)'}
              </h2>
              <p className="text-xs text-slate-400">
                Staff ID: <span className="font-mono text-emerald-400 font-bold">{formData.id}</span> • 24 Master HR Fields Supported
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
            onClick={() => setActiveTab('personal')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'personal'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Personal & Education
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('job')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'job'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" /> Job & Organization
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('duty_schedule')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'duty_schedule'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" /> Duty & Leave Quotas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salary')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'salary'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Salary & Bank
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('locations_compliance')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'locations_compliance'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Locations & Emergency
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: PERSONAL & EDUCATION (NID, DOB, Address, Highest Ed, Professional Ed, Certificate, Father/Husband, Mother, Gender, Religion) */}
          {activeTab === 'personal' && (
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
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                    placeholder="e.g. Mohammad Jasim Uddin"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Personal Email Address</label>
                  <input
                    type="email"
                    value={formData.personalEmail || ''}
                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="e.g. jasim.personal@gmail.com"
                  />
                </div>
              </div>

              {/* Specific Field Requirements: NID, DOB, Gender, Religion, Blood Group */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">NID / Passport Number</label>
                  <input
                    type="text"
                    value={formData.nidOrPassport || ''}
                    onChange={(e) => setFormData({ ...formData, nidOrPassport: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                    placeholder="e.g. 19902692518000123"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DOB (Date of Birth)</label>
                  <input
                    type="date"
                    value={formData.dob || '1995-01-01'}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
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
                  <label className="font-bold text-slate-700 block mb-1">Religion</label>
                  <select
                    value={formData.religion || 'Islam'}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Hinduism">Hinduism</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Buddhism">Buddhism</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Parents / Spouse Name & Blood Group */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Father / Husband Name</label>
                  <input
                    type="text"
                    value={formData.fatherOrSpouseName || ''}
                    onChange={(e) => setFormData({ ...formData, fatherOrSpouseName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="e.g. Md. Rafiqul Islam / Husband"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mother Name</label>
                  <input
                    type="text"
                    value={formData.motherName || ''}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="e.g. Rokeya Begum"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Blood Group & Phone</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formData.bloodGroup || 'B+'}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-[11px]"
                      placeholder="+880 17..."
                    />
                  </div>
                </div>
              </div>

              {/* Education & Certification Specific Fields */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-xs">Educational Credentials & Professional Certifications</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Highest Education</label>
                    <input
                      type="text"
                      value={formData.highestEducation || ''}
                      onChange={(e) => setFormData({ ...formData, highestEducation: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                      placeholder="e.g. MSS in Social Welfare, DU"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Professional Education</label>
                    <input
                      type="text"
                      value={formData.professionalEducation || ''}
                      onChange={(e) => setFormData({ ...formData, professionalEducation: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                      placeholder="e.g. PGDHRM, Child Protection, IASC"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Certificate Number</label>
                    <input
                      type="text"
                      value={formData.certificateNumber || ''}
                      onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-mono"
                      placeholder="e.g. CERT-2024-8841"
                    />
                  </div>
                </div>
              </div>

              {/* Addresses (Present & Permanent) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Present Address (বর্তমান ঠিকানা)</label>
                  <textarea
                    rows={2}
                    value={formData.presentAddress || ''}
                    onChange={(e) => setFormData({ ...formData, presentAddress: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="House/Road, Area, District"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Permanent Address (স্থায়ী ঠিকানা)</label>
                  <textarea
                    rows={2}
                    value={formData.permanentAddress || ''}
                    onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="Village, Post Office, Upazila, District"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JOB & ORGANIZATION (Grade, Nature of Employment, Category of Staff, Donor, Job Location Category, Work Station, DOJ, DOC, DOS, Reason for DOS, Remarks) */}
          {activeTab === 'job' && (
            <div className="space-y-4">
              {/* Supervisor Callout */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-700" />
                  <label className="font-bold text-indigo-950 text-xs">
                    Designated Supervisor / Reporting Manager (কে কার সুপারভাইজার)
                  </label>
                </div>
                <select
                  value={formData.reportingManagerId || ''}
                  onChange={(e) => handleSupervisorChange(e.target.value)}
                  className="w-full p-2.5 border border-indigo-200 rounded-xl bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- No Direct Line Supervisor (Reports to Founder/ED) --</option>
                  {employees
                    .filter((e) => e.id !== formData.id && isEmployeeActive(e))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        [{emp.id}] {emp.fullName} • {emp.designation} ({emp.department})
                      </option>
                    ))}
                </select>
              </div>

              {/* Designation, Department, Grade */}
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
                  <label className="font-bold text-slate-700 block mb-1">Grade (বেতন স্কেল গ্রেড)</label>
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

              {/* Nature of Employment, Category of Staff, Donor Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nature of Employment</label>
                  <select
                    value={formData.natureOfEmployment || 'Regular'}
                    onChange={(e) => setFormData({ ...formData, natureOfEmployment: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Project-Based">Project-Based</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Probationary">Probationary</option>
                    <option value="Casual / Daily">Casual / Daily</option>
                    <option value="Intern / Volunteer">Intern / Volunteer</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category of Staff</label>
                  <select
                    value={formData.categoryOfStaff || 'Officer'}
                    onChange={(e) => setFormData({ ...formData, categoryOfStaff: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Management">Management</option>
                    <option value="Officer">Officer</option>
                    <option value="Field Staff">Field Staff</option>
                    <option value="Teacher / Caregiver">Teacher / Caregiver</option>
                    <option value="Support Staff">Support Staff</option>
                    <option value="Consultant">Consultant</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Donor Name / Project Fund</label>
                  <input
                    type="text"
                    value={formData.donorName || 'LEEDO Core Fund'}
                    onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium"
                    placeholder="e.g. LEEDO Core Fund / UNICEF / FCDO"
                  />
                </div>
              </div>

              {/* Job Location Category & Primary Work Station & Project */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Job Location Category</label>
                  <select
                    value={formData.jobLocationCategory || 'Urban Outreach & Shelters'}
                    onChange={(e) => setFormData({ ...formData, jobLocationCategory: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Urban Outreach & Shelters">Urban Outreach & Shelters</option>
                    <option value="Central Administration">Central Administration</option>
                    <option value="Transit Shelter & Mobile School">Transit Shelter & Mobile School</option>
                    <option value="Long Term Peace Home">Long Term Peace Home</option>
                    <option value="Field Operations Hub">Field Operations Hub</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Job Location / Station</label>
                  <select
                    value={formData.workStation || 'Head Office'}
                    onChange={(e) => {
                      const st = e.target.value;
                      setFormData({
                        ...formData,
                        workStation: st,
                        jobLocation: st,
                      });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    {jobLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Project</label>
                  <input
                    type="text"
                    value={formData.assignedProject || ''}
                    onChange={(e) => setFormData({ ...formData, assignedProject: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                    placeholder="e.g. Child Protection & Street Hub"
                  />
                </div>
              </div>

              {/* Dates: DOJ, DOC, Status, DOS & Reason for DOS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DOJ (Joining Date)</label>
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
                    className="w-full p-2 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DOC (Confirmation Date)</label>
                  <input
                    type="date"
                    value={formData.confirmationDate || ''}
                    onChange={(e) => setFormData({ ...formData, confirmationDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Employment Status</label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EmploymentStatus })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Probation">Probation</option>
                    <option value="Contractual">Contractual</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DOS (Separation Date)</label>
                  <input
                    type="date"
                    value={formData.separationDate || ''}
                    onChange={(e) => setFormData({ ...formData, separationDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Separation Reason & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason's for DOS (Separation Reason)</label>
                  <input
                    type="text"
                    value={formData.separationReason || ''}
                    onChange={(e) => setFormData({ ...formData, separationReason: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="e.g. Voluntary Resignation / Project Closure / Higher Studies"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Remarks (মন্তব্য / নোট)</label>
                  <input
                    type="text"
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    placeholder="Special HR notes, performance or clearance remarks"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DUTY SCHEDULE & LEAVE QUOTAS */}
          {activeTab === 'duty_schedule' && (
            <div className="space-y-5">
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

              {/* Leave Quota Proportional Calculator */}
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SALARY & BANKING (Net Salary, Gross, Breakdown, Allowances, Advances, Bank Details) */}
          {activeTab === 'salary' && (
            <div className="space-y-4">
              {/* Highlight Net Take-Home Salary */}
              <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl text-white shadow-md flex items-center justify-between">
                <div>
                  <span className="text-emerald-100 text-[11px] font-semibold uppercase tracking-wider block">
                    Net Take-Home Salary (মোট প্রদেয় বেতন - Net Salary)
                  </span>
                  <p className="text-2xl sm:text-3xl font-extrabold mt-0.5 tracking-tight">
                    {formatCurrency(formData.netSalary || computeNetSalary(formData))}
                  </p>
                  <span className="text-[11px] text-emerald-100/90 block mt-0.5">
                    Gross (৳{formData.grossSalary || 0}) + Mobile (৳{formData.mobileAllowance || 0}) + Travel (৳{formData.travelAllowance || 0}) − PF/Tax/Advance
                  </span>
                </div>
                <div className="text-right">
                  <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-bold">
                    Auto Synchronized
                  </span>
                </div>
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
                    onChange={(e) => updateAllowance('mobileAllowance', Number(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-sm text-indigo-700 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Official communication stipend</span>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Travel Allowance (৳)</label>
                  <input
                    type="number"
                    value={formData.travelAllowance ?? 2000}
                    onChange={(e) => updateAllowance('travelAllowance', Number(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-sm text-indigo-700 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Conveyance / Field transit</span>
                </div>
              </div>

              {/* Deductions & Allowances breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Basic (50%)</span>
                  <p className="font-bold text-slate-800">{formatCurrency(formData.basicSalary || Math.round((formData.grossSalary || 0) * 0.5))}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">House Rent (25%)</span>
                  <p className="font-bold text-slate-800">{formatCurrency(formData.houseRent || Math.round((formData.grossSalary || 0) * 0.25))}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Medical (10%)</span>
                  <p className="font-bold text-slate-800">{formatCurrency(formData.medicalAllowance || Math.round((formData.grossSalary || 0) * 0.1))}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Conveyance (10%)</span>
                  <p className="font-bold text-slate-800">{formatCurrency(formData.conveyanceAllowance || Math.round((formData.grossSalary || 0) * 0.1))}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Advance / Loan Balance (৳)</label>
                  <input
                    type="number"
                    value={formData.advanceBalance ?? 0}
                    onChange={(e) => updateAllowance('advanceBalance', Number(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-rose-700 bg-white"
                    placeholder="e.g. 5000"
                  />
                  <span className="text-[10px] text-rose-600 mt-0.5 block">
                    Outstanding advance to deduct on next payroll
                  </span>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tax Deduction (৳)</label>
                  <input
                    type="number"
                    value={formData.taxDeduction ?? 0}
                    onChange={(e) => updateAllowance('taxDeduction', Number(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white"
                    placeholder="e.g. 500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Monthly income tax deduction at source
                  </span>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="font-bold text-slate-900 text-xs block">Bank & Mobile Banking Disbursement Information</span>
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
                    <label className="font-bold text-slate-700 block mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={formData.bankDetails?.accountNumber || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails!, accountNumber: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                      placeholder="e.g. 150120XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Branch Name</label>
                    <input
                      type="text"
                      value={formData.bankDetails?.branchName || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails!, branchName: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      placeholder="e.g. Mirpur Branch, Dhaka"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Routing Number</label>
                    <input
                      type="text"
                      value={formData.bankDetails?.routingNumber || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails!, routingNumber: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono"
                      placeholder="e.g. 060264182"
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
            </div>
          )}

          {/* TAB 5: LOCATIONS & EMERGENCY CONTACT & COMPLIANCE */}
          {activeTab === 'locations_compliance' && (
            <div className="space-y-5">
              {/* Emergency Contact */}
              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-rose-600" />
                  <span className="font-bold text-rose-950 text-xs">Emergency Contact Details (জরুরী যোগাযোগ)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Emergency Contact Person</label>
                    <input
                      type="text"
                      value={formData.emergencyContact?.name || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact!, name: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      placeholder="e.g. Spouse / Brother / Father Name"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Relationship</label>
                    <input
                      type="text"
                      value={formData.emergencyContact?.relation || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact!, relation: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      placeholder="e.g. Spouse / Father / Sister"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Emergency Contact Number</label>
                    <input
                      type="text"
                      value={formData.emergencyContact?.phone || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact!, phone: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-rose-700"
                      placeholder="+880 1XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Emergency Contact Address</label>
                    <input
                      type="text"
                      value={formData.emergencyContact?.address || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact!, address: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      placeholder="City, District"
                    />
                  </div>
                </div>
              </div>

              {/* Multi Job Locations */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                <span className="font-bold text-indigo-950 text-xs block">
                  Assigned Job Locations & Centers (এক জন কর্মী একাধিক কর্মস্থলে কাজ করতে পারবে)
                </span>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Select all LEEDO centers, transit shelters and mobile schools this staff member operates at:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {jobLocations.map((loc) => {
                    const isSelected = (formData.jobLocations || []).includes(loc);
                    return (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => toggleJobLocation(loc)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                          <span className="font-bold text-xs">{loc}</span>
                        </div>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isSelected ? '✓' : '+'}
                        </span>
                      </button>
                    );
                  })}
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
