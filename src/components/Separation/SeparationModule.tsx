import React, { useState } from 'react';
import { Employee, SeparationRecord, CompanyProfile, UserRole } from '../../types/hris';
import { 
  UserMinus, 
  Plus, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  Download, 
  Printer, 
  DollarSign, 
  AlertTriangle,
  X
} from 'lucide-react';
import { formatCurrency, numberToWords, isEmployeeActive } from '../../utils/calculations';

interface SeparationModuleProps {
  separations: SeparationRecord[];
  employees: Employee[];
  company: CompanyProfile;
  currentRole: UserRole;
  currentUser: Employee;
  initialStaffId?: string | null;
  onAddSeparation: (record: SeparationRecord) => void;
  onUpdateSeparation: (record: SeparationRecord) => void;
  onGenerateLetter: (emp: Employee, type: string) => void;
}

export const SeparationModule: React.FC<SeparationModuleProps> = ({
  separations,
  employees,
  company,
  currentRole,
  currentUser,
  initialStaffId,
  onAddSeparation,
  onUpdateSeparation,
  onGenerateLetter,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId || employees[0]?.id || '');
  const [separationType, setSeparationType] = useState<any>('Resignation');
  const [noticeDate, setNoticeDate] = useState('2026-10-01');
  const [lastWorkingDate, setLastWorkingDate] = useState('2026-10-31');
  const [reason, setReason] = useState('');
  const [handoverTo, setHandoverTo] = useState('');
  const [customAdvanceDeduction, setCustomAdvanceDeduction] = useState<number>(0);
  
  const [activePrintRecord, setActivePrintRecord] = useState<SeparationRecord | null>(null);

  // Auto react to initialStaffId passed from Employee Directory or Profile
  React.useEffect(() => {
    if (initialStaffId) {
      setSelectedStaffId(initialStaffId);
      const existing = separations.find((s) => s.employeeId === initialStaffId);
      if (existing) {
        setActivePrintRecord(existing);
      } else {
        const emp = employees.find((e) => e.id === initialStaffId);
        if (emp) {
          setCustomAdvanceDeduction(emp.advanceBalance || 0);
          if (emp.separationReason) setReason(emp.separationReason);
          if (emp.separationDate) setLastWorkingDate(emp.separationDate);
        }
        setIsCreating(true);
      }
    }
  }, [initialStaffId, separations, employees]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedStaffId) || employees[0];
    
    // Auto-calculate final settlement figures based on salary and tenure
    const joinYear = new Date(emp.joiningDate).getFullYear();
    const serviceYears = Math.max(1, 2026 - joinYear);
    const lastMonthSalary = emp.grossSalary;
    const pfSettlement = Math.round(emp.basicSalary * 0.16 * 12 * serviceYears);
    const gratuity = serviceYears >= 3 ? Math.round(emp.basicSalary * serviceYears) : 0;
    const leaveEncashmentDays = 8;
    const leaveEncashmentAmount = Math.round((emp.basicSalary / 30) * leaveEncashmentDays);
    const advanceDeduction = customAdvanceDeduction || emp.advanceBalance || 0;
    const netSettlement = Math.max(0, lastMonthSalary + pfSettlement + gratuity + leaveEncashmentAmount - advanceDeduction);

    const newRecord: SeparationRecord = {
      id: `SEP-2026-${Date.now().toString().slice(-4)}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      designation: emp.designation,
      department: emp.department,
      joiningDate: emp.joiningDate,
      separationType,
      noticeDate,
      lastWorkingDate,
      reason: reason || 'Career transition & voluntary resignation',
      handoverTo: handoverTo || 'Designated Department Officer',
      departmentClearance: true,
      financeClearance: true,
      adminAssetClearance: false,
      itEquipmentClearance: false,
      lastMonthSalary,
      providentFundSettlement: pfSettlement,
      gratuitySettlement: gratuity,
      leaveEncashmentDays,
      leaveEncashmentAmount,
      deductionsOrAdvances: advanceDeduction,
      netSettlementAmount: netSettlement,
      clearanceStatus: 'Clearance In Progress',
      experienceLetterIssued: false,
    };

    onAddSeparation(newRecord);
    setIsCreating(false);
    setActivePrintRecord(newRecord); // Immediately open the final settlement docket!
  };

  const toggleClearance = (rec: SeparationRecord, field: keyof SeparationRecord) => {
    const updated = { ...rec, [field]: !rec[field] };
    // If all clearances are true, set status to Approved
    if (
      updated.departmentClearance &&
      updated.financeClearance &&
      updated.adminAssetClearance &&
      updated.itEquipmentClearance
    ) {
      updated.clearanceStatus = 'Clearance Approved';
    }
    onUpdateSeparation(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-rose-600" />
            Staff Separation, Exit Clearance & Final Settlement
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage resignations, department clearance checklists, terminal provident fund, gratuity & final settlement
          </p>
        </div>

        {currentRole === 'hr_admin' && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Staff Separation</span>
          </button>
        )}
      </div>

      {/* Initiation Modal */}
      {isCreating && (
        <div className="bg-white p-6 rounded-2xl border-2 border-rose-200 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Initiate Staff Separation & Clearance</h3>
              <p className="text-xs text-slate-500">Record notice, select separation reason, and prepare clearance docket</p>
            </div>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Departing Employee *</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                >
                  {employees
                    .filter((emp) => isEmployeeActive(emp) || emp.id === selectedStaffId)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.id}) — {emp.designation} {!isEmployeeActive(emp) ? '(Separated)' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Separation Type (আলাদা হওয়ার ধরণ) *</label>
                <select
                  value={separationType}
                  onChange={(e) => setSeparationType(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="Resignation">Voluntary Resignation (স্বেচ্ছায় পদত্যাগ)</option>
                  <option value="Termination">Administrative Termination (চাকরি অবসান / বরখাস্ত)</option>
                  <option value="Contract Expiry">Contract Cycle Expiry (চুক্তির মেয়াদ সমাপ্তি)</option>
                  <option value="Retirement">Retirement (অবসর গ্রহণ)</option>
                  <option value="Mutual Separation">Mutual Separation (পারস্পরিক সমঝোতা)</option>
                  <option value="Medical Grounds">Medical Grounds (স্বাস্থ্যগত কারণ)</option>
                  <option value="Project Funding Closure">Project Funding Closure / Redundancy (প্রকল্প সমাপ্তি)</option>
                  <option value="Disciplinary Dismissal">Disciplinary Action (শৃঙ্খলাজনিত বরখাস্ত)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Handover To (Staff Member)</label>
                <input
                  type="text"
                  placeholder="Colleague receiving handover"
                  value={handoverTo}
                  onChange={(e) => setHandoverTo(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notice Submission Date</label>
                <input
                  type="date"
                  value={noticeDate}
                  onChange={(e) => setNoticeDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Last Official Working Date *</label>
                <input
                  type="date"
                  required
                  value={lastWorkingDate}
                  onChange={(e) => setLastWorkingDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Advance Salary / Loan Recovery (অগ্রিম সমন্বয়)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={customAdvanceDeduction}
                  onChange={(e) => setCustomAdvanceDeduction(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-xl font-mono text-rose-600 font-bold"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-600 font-semibold mb-1">Primary Reason for Exit (বিস্তারিত কারণ)</label>
                <input
                  type="text"
                  placeholder="e.g. Higher studies / New project assignment / Family relocation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Generate Separation Docket</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Separations Registry */}
      <div className="space-y-4">
        {separations.map((rec) => {
          const emp = employees.find((e) => e.id === rec.employeeId);
          return (
            <div
              key={rec.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    {rec.employeeName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{rec.employeeName}</h3>
                      <span className="font-mono text-xs text-slate-400">({rec.employeeId})</span>
                      <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
                        {rec.separationType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {rec.designation} • {rec.department} | Last Working Day: <strong>{rec.lastWorkingDate}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePrintRecord(rec)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Settlement Sheet</span>
                  </button>
                  {emp && (
                    <button
                      onClick={() => onGenerateLetter(emp, 'experience')}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Issue Experience Letter</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Clearance Checkpoints & Settlement Figures Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                {/* 4-Point Clearance Checklist */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="font-bold text-slate-800 text-xs block">Departmental Clearance Verification:</span>
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                      <span className="text-slate-700">1. Operational Handover & Document Files</span>
                      <input
                        type="checkbox"
                        checked={rec.departmentClearance}
                        onChange={() => toggleClearance(rec, 'departmentClearance')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                      <span className="text-slate-700">2. Finance & Loan/Advance Clearance</span>
                      <input
                        type="checkbox"
                        checked={rec.financeClearance}
                        onChange={() => toggleClearance(rec, 'financeClearance')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                      <span className="text-slate-700">3. Admin Asset, ID Card & Locker Keys</span>
                      <input
                        type="checkbox"
                        checked={rec.adminAssetClearance}
                        onChange={() => toggleClearance(rec, 'adminAssetClearance')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                      <span className="text-slate-700">4. IT Equipment, Laptop & Email Revocation</span>
                      <input
                        type="checkbox"
                        checked={rec.itEquipmentClearance}
                        onChange={() => toggleClearance(rec, 'itEquipmentClearance')}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Final Settlement Breakdown */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-xs">Terminal Settlement Breakdown</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      {rec.clearanceStatus}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Last Month Salary:</span>
                      <span className="font-mono font-semibold">{formatCurrency(rec.lastMonthSalary, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Provident Fund (Employee + Employer):</span>
                      <span className="font-mono font-semibold">{formatCurrency(rec.providentFundSettlement, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gratuity Benefit:</span>
                      <span className="font-mono font-semibold">{formatCurrency(rec.gratuitySettlement, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leave Encashment ({rec.leaveEncashmentDays} days):</span>
                      <span className="font-mono font-semibold">{formatCurrency(rec.leaveEncashmentAmount, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-t border-emerald-200 pt-1.5 font-bold text-slate-900 text-sm">
                      <span className="text-emerald-900">Total Net Settlement Payable:</span>
                      <span className="font-mono text-emerald-700">{formatCurrency(rec.netSettlementAmount, company.currencySymbol)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Printable Final Settlement Document Modal */}
      {activePrintRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden printable-document-container">
            <div className="no-print bg-slate-900 p-4 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Final Settlement & Exit Clearance Docket</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="allow-print px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button onClick={() => setActivePrintRecord(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-slate-900 text-xs bg-white">
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <h1 className="text-xl font-bold uppercase tracking-wide">{company.name}</h1>
                <p className="text-xs text-slate-600 mt-1">{company.headOfficeAddress}</p>
                <div className="mt-3 inline-block bg-slate-100 px-4 py-1 rounded-full font-bold uppercase text-xs">
                  Official Final Settlement & Clearance Statement
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div>
                  <p><span className="text-slate-500">Employee ID:</span> <strong className="font-mono">{activePrintRecord.employeeId}</strong></p>
                  <p><span className="text-slate-500">Employee Name:</span> <strong>{activePrintRecord.employeeName}</strong></p>
                  <p><span className="text-slate-500">Designation:</span> <strong>{activePrintRecord.designation}</strong></p>
                  <p><span className="text-slate-500">Department:</span> <strong>{activePrintRecord.department}</strong></p>
                </div>
                <div>
                  <p><span className="text-slate-500">Date of Joining:</span> <strong>{activePrintRecord.joiningDate}</strong></p>
                  <p><span className="text-slate-500">Last Working Date:</span> <strong>{activePrintRecord.lastWorkingDate}</strong></p>
                  <p><span className="text-slate-500">Separation Type:</span> <strong>{activePrintRecord.separationType}</strong></p>
                  <p><span className="text-slate-500">Clearance Status:</span> <strong className="text-emerald-700">{activePrintRecord.clearanceStatus}</strong></p>
                </div>
              </div>

              {/* Settlement table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-3">Entitlement Item Description</th>
                      <th className="p-3 text-right">Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3">Last Month Earned Gross Salary</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(activePrintRecord.lastMonthSalary, company.currencySymbol)}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Provident Fund (Accumulated Employee & Employer Share)</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(activePrintRecord.providentFundSettlement, company.currencySymbol)}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Gratuity Benefit / Long Service Award</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(activePrintRecord.gratuitySettlement, company.currencySymbol)}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Earned Leave Encashment ({activePrintRecord.leaveEncashmentDays} days)</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(activePrintRecord.leaveEncashmentAmount, company.currencySymbol)}</td>
                    </tr>
                    {activePrintRecord.deductionsOrAdvances > 0 && (
                      <tr className="text-rose-700 bg-rose-50/50">
                        <td className="p-3 font-semibold">Less: Advance Salary / Loan Recovery Deduction</td>
                        <td className="p-3 text-right font-mono font-bold">
                          -{formatCurrency(activePrintRecord.deductionsOrAdvances, company.currencySymbol)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-100 font-bold text-sm">
                      <td className="p-3 text-slate-900">Total Net Final Settlement Payable:</td>
                      <td className="p-3 text-right font-mono text-emerald-700">
                        {formatCurrency(activePrintRecord.netSettlementAmount, company.currencySymbol)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-600 block">Amount in Words:</span>
                <p className="font-bold text-indigo-900 italic mt-0.5">
                  {numberToWords(activePrintRecord.netSettlementAmount)}
                </p>
              </div>

              <div className="pt-12 grid grid-cols-4 gap-4 text-center text-[10px] text-slate-700 border-t border-slate-300 mt-8">
                <div>
                  <div className="border-t border-slate-400 pt-1">Prepared By (HR)</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1">Checked By (Finance)</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1">Approved By (Director)</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1">Received & Acknowledged By</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
