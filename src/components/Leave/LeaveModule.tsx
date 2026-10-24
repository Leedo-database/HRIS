import React, { useState } from 'react';
import { Employee, LeaveRequest, LeaveBalance, LeaveType, UserRole, GovernmentHoliday, LEEDO_JOB_LOCATIONS } from '../../types/hris';
import { 
  CalendarDays, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Calendar, 
  UserCheck,
  AlertCircle,
  History,
  ShieldCheck,
  User,
  ArrowRight,
  Printer,
  Landmark
} from 'lucide-react';
import { isEmployeeActive } from '../../utils/calculations';
import { GovernmentHolidaysTab } from './GovernmentHolidaysTab';

interface LeaveModuleProps {
  leaves: LeaveRequest[];
  leaveBalances: Record<string, LeaveBalance>;
  employees: Employee[];
  currentUser: Employee;
  currentRole: UserRole;
  jobLocations?: string[];
  holidays?: GovernmentHoliday[];
  onAddLeave: (leave: LeaveRequest) => void;
  onUpdateLeave: (leave: LeaveRequest) => void;
  onPrintLeaveForm: (leave: LeaveRequest) => void;
  onAddHoliday?: (holiday: GovernmentHoliday) => void;
  onUpdateHoliday?: (holiday: GovernmentHoliday) => void;
  onDeleteHoliday?: (holidayId: string) => void;
}

export const LeaveModule: React.FC<LeaveModuleProps> = ({
  leaves,
  leaveBalances,
  employees,
  currentUser,
  currentRole,
  jobLocations = [...LEEDO_JOB_LOCATIONS],
  holidays = [],
  onAddLeave,
  onUpdateLeave,
  onPrintLeaveForm,
  onAddHoliday = () => {},
  onUpdateHoliday = () => {},
  onDeleteHoliday = () => {},
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'holidays'>('applications');
  const [isApplying, setIsApplying] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Application form state
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual/Casual');
  const [startDate, setStartDate] = useState('2026-10-18');
  const [endDate, setEndDate] = useState('2026-10-20');
  const [reason, setReason] = useState('');
  
  // Handover Colleague with ID and Name (Active staff only)
  const colleagues = employees.filter((e) => e.id !== currentUser.id && isEmployeeActive(e));
  const [handoverPersonId, setHandoverPersonId] = useState<string>(colleagues[0]?.id || '');

  const currentBalance: LeaveBalance = leaveBalances[currentUser.id] || {
    employeeId: currentUser.id,
    annualTotal: currentUser.casualLeaveQuota || 16,
    annualUsed: 2,
    sickTotal: currentUser.sickLeaveQuota || 14,
    sickUsed: 1,
    maternityTotal: 0,
    maternityUsed: 0,
    compensatoryTotal: 6,
    compensatoryUsed: 0,
  };

  const calculateDays = (s: string, e: string) => {
    const start = new Date(s);
    const end = new Date(e);
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = calculateDays(startDate, endDate);

  // Applicant's Last 3 Leave Applications
  const applicantRecentLeaves = leaves
    .filter((l) => l.employeeId === currentUser.id)
    .slice(0, 3);

  // Pending Handover requests assigned to CURRENT USER
  const pendingHandoverForMe = leaves.filter(
    (l) => l.handoverPersonId === currentUser.id && l.handoverStatus === 'Pending'
  );

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      alert('Please provide a reason for the leave application.');
      return;
    }

    const selectedColleague = employees.find((e) => e.id === handoverPersonId);
    const colleagueName = selectedColleague
      ? `[${selectedColleague.id}] ${selectedColleague.fullName} (${selectedColleague.designation})`
      : 'Designated Duty Officer';

    const newRequest: LeaveRequest = {
      id: `LR-2026-${Date.now().toString().slice(-4)}`,
      employeeId: currentUser.id,
      employeeName: currentUser.fullName,
      department: currentUser.department,
      leaveType,
      startDate,
      endDate,
      daysCount: Math.max(1, daysCount),
      reason,
      handoverPersonId: handoverPersonId || undefined,
      handoverPersonName: colleagueName,
      handoverStatus: 'Pending',
      status: 'Pending Handover Acceptance',
      appliedDate: new Date().toISOString().split('T')[0],
      approverRemarks: 'Pending handover acceptance by designated colleague',
    };

    onAddLeave(newRequest);
    setIsApplying(false);
    setReason('');
    alert(`Leave application submitted. Handover request sent to ${colleagueName}. Once they accept, it will automatically go to HR for approval.`);
  };

  // Handover colleague accepts
  const handleAcceptHandover = (req: LeaveRequest) => {
    onUpdateLeave({
      ...req,
      handoverStatus: 'Accepted',
      status: 'Pending HR Approval',
      handoverComment: `Duty handover accepted by ${currentUser.fullName} on ${new Date().toISOString().split('T')[0]}`,
      approverRemarks: `Handover accepted by ${currentUser.fullName}. Ready for Line Manager / HR final approval.`,
    });
  };

  const handleDeclineHandover = (req: LeaveRequest) => {
    onUpdateLeave({
      ...req,
      handoverStatus: 'Declined',
      status: 'Rejected',
      handoverComment: `Handover declined by ${currentUser.fullName}`,
      approverRemarks: `Handover declined by colleague. Applicant needs to designate an alternate colleague.`,
    });
  };

  // Final HR / Manager Approval
  const handleApprove = (req: LeaveRequest) => {
    onUpdateLeave({
      ...req,
      status: 'Approved',
      approvedBy: currentUser.fullName,
      approverRemarks: `Officially approved by ${currentUser.fullName} on ${new Date().toISOString().split('T')[0]}`,
    });
  };

  const handleReject = (req: LeaveRequest) => {
    onUpdateLeave({
      ...req,
      status: 'Rejected',
      approvedBy: currentUser.fullName,
      approverRemarks: `Rejected by ${currentUser.fullName}: staffing requirements on shelter duty.`,
    });
  };

  // Subordinate employees who report to this supervisor
  const subordinateIds = new Set(
    employees
      .filter((e) => 
        e.id !== currentUser.id && (
          e.reportingManagerId === currentUser.id || 
          (e.reportingManagerName && (e.reportingManagerName === currentUser.fullName || e.reportingManagerName.includes(currentUser.fullName)))
        )
      )
      .map((e) => e.id)
  );

  const baseLeaves = currentRole === 'employee'
    ? leaves.filter((l) => l.employeeId === currentUser.id || l.handoverPersonId === currentUser.id)
    : currentRole === 'line_manager'
    ? leaves.filter((l) => l.employeeId === currentUser.id || l.handoverPersonId === currentUser.id || subordinateIds.has(l.employeeId))
    : leaves;

  const filteredLeaves = baseLeaves.filter((l) => {
    if (filterStatus === 'All') return true;
    return l.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Module Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <span>Leave Management & Public Holidays (ছুটি ও সরকারি ছুটির ক্যালেন্ডার)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage staff leaves, colleague duty handover, and official government gazette holidays
          </p>
        </div>

        {activeSubTab === 'applications' && (
          <button
            onClick={() => setIsApplying(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply For Leave</span>
          </button>
        )}
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('applications')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'applications'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Staff Leave Applications (ছুটির আবেদন)</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold">
            {filteredLeaves.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('holidays')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'holidays'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4 text-emerald-600" />
          <span>Government & Public Holidays (সরকারি ছুটি ও ইনপুট)</span>
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
            {holidays.length}
          </span>
        </button>
      </div>

      {activeSubTab === 'holidays' ? (
        <GovernmentHolidaysTab
          holidays={holidays}
          currentRole={currentRole}
          jobLocations={jobLocations}
          onAddHoliday={onAddHoliday}
          onUpdateHoliday={onUpdateHoliday}
          onDeleteHoliday={onDeleteHoliday}
        />
      ) : (
        <>

      {/* Handover Requests Assigned to Me Banner */}
      {pendingHandoverForMe.length > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <span>Colleague Handover Requests Assigned to You ({pendingHandoverForMe.length})</span>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
              Action Required
            </span>
          </div>
          <p className="text-xs text-amber-800">
            A colleague has designated you to cover their desk duties while on leave. Once you accept, the application is forwarded to HR for final sign-off.
          </p>

          <div className="space-y-2 pt-1">
            {pendingHandoverForMe.map((req) => (
              <div
                key={req.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{req.employeeName}</span>
                    <span className="font-mono text-slate-500">ID: {req.employeeId}</span>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {req.leaveType}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Dates: <strong>{req.startDate} to {req.endDate}</strong> ({req.daysCount} days)
                  </p>
                  <p className="text-slate-500 italic mt-0.5">
                    Reason: "{req.reason}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeclineHandover(req)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAcceptHandover(req)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept Duty Handover</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Casual Leave (নৈমিত্তিক)</span>
            <span className="font-bold text-indigo-600">
              {currentBalance.annualTotal - currentBalance.annualUsed} Left
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {currentBalance.annualUsed}
            </span>
            <span className="text-xs text-slate-400">/ {currentBalance.annualTotal} days quota</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, (currentBalance.annualUsed / (currentBalance.annualTotal || 1)) * 100)}%` }}
              className="h-full bg-indigo-600 rounded-full"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Medical / Sick Leave (অসুস্থতা)</span>
            <span className="font-bold text-emerald-600">
              {currentBalance.sickTotal - currentBalance.sickUsed} Left
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {currentBalance.sickUsed}
            </span>
            <span className="text-xs text-slate-400">/ {currentBalance.sickTotal} days quota</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, (currentBalance.sickUsed / (currentBalance.sickTotal || 1)) * 100)}%` }}
              className="h-full bg-emerald-600 rounded-full"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Compensatory Field Rest</span>
            <span className="font-bold text-blue-600">
              {currentBalance.compensatoryTotal - currentBalance.compensatoryUsed} Left
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {currentBalance.compensatoryUsed}
            </span>
            <span className="text-xs text-slate-400">/ {currentBalance.compensatoryTotal} days</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, (currentBalance.compensatoryUsed / (currentBalance.compensatoryTotal || 1)) * 100)}%` }}
              className="h-full bg-blue-600 rounded-full"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Maternity / Paternity</span>
            <span className="font-bold text-purple-600">
              {currentBalance.maternityTotal > 0 ? `${currentBalance.maternityTotal} Days` : 'N/A'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {currentBalance.maternityUsed}
            </span>
            <span className="text-xs text-slate-400">days taken</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">120 days paid maternity as per labor code</p>
        </div>
      </div>

      {/* Leave Application Drawer / Modal */}
      {isApplying && (
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-200 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Formal Leave Application with Colleague Handover</h3>
              <p className="text-xs text-slate-500">
                Applicant: <strong>{currentUser.fullName}</strong> (ID: {currentUser.id} • {currentUser.designation})
              </p>
            </div>
            <button
              onClick={() => setIsApplying(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Applicant's Last 3 Leave Applications & Status (Explicit User Requirement) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Applicant's Last 3 Leave Applications & Current Status (পূর্ববর্তী ৩টি ছুটির স্ট্যাটাস):</span>
            </div>

            {applicantRecentLeaves.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {applicantRecentLeaves.map((recent) => (
                  <div key={recent.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900">{recent.leaveType}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        recent.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : recent.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {recent.status}
                      </span>
                    </div>
                    <p className="text-slate-600 font-mono text-[11px]">
                      {recent.startDate} → {recent.endDate} ({recent.daysCount}d)
                    </p>
                    <p className="text-[10px] text-slate-400 truncate italic">
                      "{recent.reason}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No prior leave applications on record for this cycle.</p>
            )}
          </div>

          <form onSubmit={handleApply} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Leave Category *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="Annual/Casual">Annual / Casual Leave (নৈমিত্তিক)</option>
                  <option value="Medical/Sick">Medical / Sick Leave (অসুস্থতা)</option>
                  <option value="Compensatory/Field Rest">Compensatory / Field Rest (NGO)</option>
                  <option value="Maternity">Maternity Leave (Paid)</option>
                  <option value="Paternity">Paternity Leave</option>
                  <option value="Without Pay">Leave Without Pay (LWP)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Reason for Leave *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Attending urgent family program / Medical checkup..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Handover Person / Colleague with ID and Name (Explicit user requirement) */}
              <div className="sm:col-span-1">
                <label className="block text-slate-700 font-bold mb-1">
                  Handover Person / Colleague (ID সহ নাম) *
                </label>
                <select
                  value={handoverPersonId}
                  onChange={(e) => setHandoverPersonId(e.target.value)}
                  className="w-full p-2.5 border border-indigo-300 rounded-xl bg-indigo-50/50 font-semibold text-slate-900"
                  required
                >
                  {colleagues.map((col) => (
                    <option key={col.id} value={col.id}>
                      [{col.id}] {col.fullName} • {col.designation}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Selected colleague will receive an in-app request to accept duty handover first.
                </span>
              </div>
            </div>

            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
              <span className="text-indigo-900 font-medium">Applied Duration:</span>
              <span className="font-bold text-indigo-700 text-sm">{daysCount} Days</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApplying(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer"
              >
                <span>Submit Leave Application</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Records Master Register */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-900 text-sm">Leave Applications & Approvals Roster</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
              {filteredLeaves.length} applications
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1.5 px-3 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Handover Acceptance">Pending Handover Acceptance</option>
              <option value="Pending HR Approval">Pending HR Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Date Range</th>
                <th className="py-3 px-3">Days</th>
                <th className="py-3 px-3">Handover Colleague</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Reason & Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{l.employeeName}</p>
                    <p className="text-[11px] font-mono text-slate-500">ID: {l.employeeId} • {l.department}</p>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">{l.leaveType}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {l.startDate} → {l.endDate}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">{l.daysCount}d</td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-slate-800 text-[11px]">{l.handoverPersonName || '--'}</p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                      l.handoverStatus === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : l.handoverStatus === 'Declined'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {l.handoverStatus === 'Accepted' ? '✓ Handover Accepted' : l.handoverStatus === 'Declined' ? '✕ Handover Declined' : '⏳ Handover Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        l.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : l.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : l.status === 'Pending Handover Acceptance'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-[200px]">
                    <p className="truncate font-medium">{l.reason}</p>
                    {l.approverRemarks && (
                      <p className="text-[10px] text-slate-400 italic truncate mt-0.5">{l.approverRemarks}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPrintLeaveForm(l)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Print Formal Leave Voucher"
                      >
                        <Printer className="w-4 h-4 text-indigo-600" />
                      </button>

                      {/* If Current User is Handover Colleague and handover is pending */}
                      {l.handoverPersonId === currentUser.id && l.handoverStatus === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => handleAcceptHandover(l)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Accept
                        </button>
                      )}

                      {/* If HR Admin or Supervisor (for subordinates), can approve/reject */}
                      {(currentRole === 'hr_admin' || (currentRole === 'line_manager' && subordinateIds.has(l.employeeId))) && (l.status === 'Pending HR Approval' || l.status === 'Pending' || l.status === 'Pending Handover Acceptance') && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReject(l)}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(l)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
