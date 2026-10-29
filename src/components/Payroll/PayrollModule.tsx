import React, { useState } from 'react';
import { Employee, PayrollRecord, CompanyProfile, UserRole, GovernmentHoliday } from '../../types/hris';
import { OFFICIAL_BANGLADESH_HOLIDAYS_2026 } from '../../data/bangladeshHolidays';
import { 
  CreditCard, 
  Printer, 
  Download, 
  FileCheck2, 
  DollarSign, 
  CheckCircle2, 
  FileSpreadsheet,
  Building,
  User,
  X,
  Edit,
  Sliders,
  Check,
  Search,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FileText,
  CalendarCheck2
} from 'lucide-react';
import { formatCurrency, numberToWords, getMonthHolidayMetrics } from '../../utils/calculations';
import { exportPayslipToDocx } from '../../utils/docxExport';

interface PayrollModuleProps {
  payroll: PayrollRecord[];
  employees: Employee[];
  company: CompanyProfile;
  currentRole: UserRole;
  currentUser: Employee;
  holidays?: GovernmentHoliday[];
  onGeneratePayrollBatch: (month: string, monthKey: string) => void;
  onUpdatePayrollStatus: (id: string, status: 'Paid' | 'Processing') => void;
  onUpdateEmployee?: (employee: Employee) => void;
}

const AVAILABLE_PAYROLL_MONTHS = [
  { key: '2026-08', label: 'August 2026' },
  { key: '2026-09', label: 'September 2026' },
  { key: '2026-10', label: 'October 2026 (Current Month)' },
  { key: '2026-11', label: 'November 2026' },
  { key: '2026-12', label: 'December 2026' },
  { key: '2027-01', label: 'January 2027' },
];

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  payroll,
  employees,
  company,
  currentRole,
  currentUser,
  holidays = OFFICIAL_BANGLADESH_HOLIDAYS_2026,
  onGeneratePayrollBatch,
  onUpdatePayrollStatus,
  onUpdateEmployee = () => {},
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState('2026-10');
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [activePayslip, setActivePayslip] = useState<PayrollRecord | null>(null);
  const [showBankAdvice, setShowBankAdvice] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'register' | 'salary_setup'>('register');

  // Month holiday metrics for labor compliance calculation
  const monthMetrics = getMonthHolidayMetrics(selectedMonthKey, holidays);

  // Salary Setup Modal state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [salarySearchQuery, setSalarySearchQuery] = useState('');
  const [editForm, setEditForm] = useState({
    grossSalary: 0,
    basicSalary: 0,
    houseRent: 0,
    medicalAllowance: 0,
    conveyanceAllowance: 0,
    specialProjectAllowance: 0,
    mobileAllowance: 1000,
    travelAllowance: 2000,
    pfDeductionPercentage: 8,
    taxDeduction: 0,
    advanceBalance: 0,
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    mobileBankingType: 'bKash' as 'bKash' | 'Nagad' | 'Rocket' | 'None',
    mobileBankingNumber: '',
  });

  // Only active employees are included in salary processing
  const activeStaff = employees.filter((e) => e.status !== 'Separated' && e.status !== 'Terminated');
  const activeStaffIds = new Set(activeStaff.map((e) => e.id));

  // Filter records by selected month and active employment status
  const monthRecords = payroll.filter(
    (p) => p.monthKey === selectedMonthKey && activeStaffIds.has(p.employeeId)
  );

  const displayRecords = monthRecords;

  const totalGross = displayRecords.reduce((acc, p) => acc + p.grossSalary, 0);
  const totalDeductions = displayRecords.reduce((acc, p) => acc + p.totalDeductions, 0);
  const totalNet = displayRecords.reduce((acc, p) => acc + p.netSalary, 0);

  const handlePrintPayslip = () => {
    window.print();
  };

  const exportBankAdviceCSV = () => {
    const headers = [
      'Serial', 
      'Employee ID', 
      'Beneficiary Account Name', 
      'Bank Name', 
      'Branch', 
      'Account Number', 
      'Routing Number', 
      'Net Amount Payable (BDT)', 
      'MFS Number'
    ];
    const rows = monthRecords.map((p, idx) => {
      const emp = employees.find(e => e.id === p.employeeId);
      return [
        idx + 1,
        `"${p.employeeId}"`,
        `"${p.employeeName}"`,
        `"${p.bankName}"`,
        `"${emp?.bankDetails?.branchName || 'Principal Branch'}"`,
        `"${p.bankAccount}"`,
        `"${emp?.bankDetails?.routingNumber || ''}"`,
        p.netSalary,
        `"${emp?.bankDetails?.mobileBankingNumber || ''}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bank_Advice_Disbursement_${selectedMonthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open Salary Editor for an Employee
  const handleOpenSalaryEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditForm({
      grossSalary: emp.grossSalary || 0,
      basicSalary: emp.basicSalary || Math.round((emp.grossSalary || 0) * 0.5),
      houseRent: emp.houseRent || Math.round((emp.grossSalary || 0) * 0.25),
      medicalAllowance: emp.medicalAllowance || Math.round((emp.grossSalary || 0) * 0.1),
      conveyanceAllowance: emp.conveyanceAllowance || Math.round((emp.grossSalary || 0) * 0.1),
      specialProjectAllowance: emp.specialProjectAllowance || 0,
      mobileAllowance: emp.mobileAllowance ?? 1000,
      travelAllowance: emp.travelAllowance ?? 2000,
      pfDeductionPercentage: emp.pfDeductionPercentage ?? 8,
      taxDeduction: emp.taxDeduction || 0,
      advanceBalance: emp.advanceBalance || 0,
      bankName: emp.bankDetails?.bankName || 'Brac Bank PLC',
      accountNumber: emp.bankDetails?.accountNumber || '',
      routingNumber: emp.bankDetails?.routingNumber || '',
      mobileBankingType: emp.bankDetails?.mobileBankingType || 'bKash',
      mobileBankingNumber: emp.bankDetails?.mobileBankingNumber || emp.phone || '',
    });
  };

  // Auto-calculate statutory breakdown (50% Basic, 25% House, 10% Medical, 10% Conveyance)
  const handleAutoCalculateBreakdown = (grossVal: number) => {
    const gross = Number(grossVal) || 0;
    const basic = Math.round(gross * 0.5);
    const house = Math.round(gross * 0.25);
    const med = Math.round(gross * 0.1);
    const conv = Math.round(gross * 0.1);
    setEditForm((prev) => ({
      ...prev,
      grossSalary: gross,
      basicSalary: basic,
      houseRent: house,
      medicalAllowance: med,
      conveyanceAllowance: conv,
    }));
  };

  // Save Salary Structure Changes
  const handleSaveSalaryStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const updatedEmp: Employee = {
      ...editingEmployee,
      grossSalary: Number(editForm.grossSalary) || 0,
      basicSalary: Number(editForm.basicSalary) || 0,
      houseRent: Number(editForm.houseRent) || 0,
      medicalAllowance: Number(editForm.medicalAllowance) || 0,
      conveyanceAllowance: Number(editForm.conveyanceAllowance) || 0,
      specialProjectAllowance: Number(editForm.specialProjectAllowance) || 0,
      mobileAllowance: Number(editForm.mobileAllowance) || 0,
      travelAllowance: Number(editForm.travelAllowance) || 0,
      pfDeductionPercentage: Number(editForm.pfDeductionPercentage) || 0,
      taxDeduction: Number(editForm.taxDeduction) || 0,
      advanceBalance: Number(editForm.advanceBalance) || 0,
      bankDetails: {
        ...editingEmployee.bankDetails,
        bankName: editForm.bankName,
        accountNumber: editForm.accountNumber,
        routingNumber: editForm.routingNumber,
        mobileBankingType: editForm.mobileBankingType,
        mobileBankingNumber: editForm.mobileBankingNumber,
      },
    };

    onUpdateEmployee(updatedEmp);
    setEditingEmployee(null);
    alert(`Salary structure updated successfully for ${updatedEmp.fullName}. You can now run payroll with updated values.`);
  };

  const filteredSalaryStaff = activeStaff.filter((e) =>
    e.fullName.toLowerCase().includes(salarySearchQuery.toLowerCase()) ||
    e.id.toLowerCase().includes(salarySearchQuery.toLowerCase()) ||
    e.designation.toLowerCase().includes(salarySearchQuery.toLowerCase()) ||
    e.workStation.toLowerCase().includes(salarySearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span>Payroll & Automated Salary Disbursement (বেতন ও পে-রোল)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full compliance salary processing with provident fund, tax, advance recovery, and automated bank disbursement advice
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Extended Month Selector */}
          <select
            value={selectedMonthKey}
            onChange={(e) => {
              setSelectedMonthKey(e.target.value);
              const found = AVAILABLE_PAYROLL_MONTHS.find(m => m.key === e.target.value);
              setSelectedMonth(found ? found.label.split(' (')[0] : e.target.value);
            }}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-bold text-indigo-900 shadow-2xs"
          >
            {AVAILABLE_PAYROLL_MONTHS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>

          {currentRole === 'hr_admin' && (
            <>
              <button
                onClick={() => onGeneratePayrollBatch(selectedMonth, selectedMonthKey)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Calculate and generate monthly payroll batch for all active staff"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run {selectedMonth} Payroll</span>
              </button>

              <button
                onClick={() => setShowBankAdvice(true)}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                title="View Bank Disbursement Advice Sheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Bank Advice Sheet</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('register')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'register'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Monthly Salary Register & Payslips ({selectedMonth})</span>
        </button>

        {currentRole === 'hr_admin' && (
          <button
            type="button"
            onClick={() => setActiveSubTab('salary_setup')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'salary_setup'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Staff Salary Structure & Setup (সকল কর্মীর বেতন তথ্য ও কাঠামো)</span>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-indigo-200">
              {activeStaff.length}
            </span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: SALARY REGISTER & PAYSLIPS */}
      {activeSubTab === 'register' && (
        <div className="space-y-6">
          {/* Bangladesh Labor Act & Gazetted Holiday Statutory Card */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-emerald-500/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm sm:text-base text-white">
                      Statutory Working Days & Government Holidays ({selectedMonth})
                    </h4>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                      বাংলাদেশ শ্রম আইন ২০০৬ ও সরকারি গেজেট অনুমোদিত
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    সকল সরকারি গেজেটেড ছুটি ও সাপ্তাহিক ছুটি ১০০% পূর্ণ বেতনে প্রদেয় (No wage deductions for gazetted public holidays).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center min-w-[70px]">
                  <span className="text-[10px] text-slate-300 block uppercase font-medium">Calendar</span>
                  <span className="text-sm sm:text-base font-bold text-white font-mono">{monthMetrics.totalDays} Days</span>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center min-w-[70px]">
                  <span className="text-[10px] text-slate-300 block uppercase font-medium">Working</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-300 font-mono">{monthMetrics.workingDays} Days</span>
                </div>
                <div className="bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-400/40 text-center min-w-[70px]">
                  <span className="text-[10px] text-emerald-200 block uppercase font-bold">Govt Holidays</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-300 font-mono">{monthMetrics.govtHolidaysCount} Days</span>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center min-w-[70px]">
                  <span className="text-[10px] text-slate-300 block uppercase font-medium">Weekends</span>
                  <span className="text-sm sm:text-base font-bold text-slate-200 font-mono">{monthMetrics.weekendCount} Days</span>
                </div>
              </div>
            </div>

            {monthMetrics.uniqueHolidays.length > 0 ? (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-slate-300 font-semibold">Gazetted Holidays in {selectedMonth}:</span>
                {monthMetrics.uniqueHolidays.map((h) => (
                  <span key={h.id} className="bg-white/10 hover:bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/15 text-slate-200 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <strong>{h.title} {h.titleBangla ? `(${h.titleBangla})` : ''}</strong>
                    <span className="text-[10px] text-emerald-300 font-mono">
                      ({h.startDate === h.endDate ? h.startDate : `${h.startDate} to ${h.endDate}`} • {h.daysCount}d paid)
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-slate-400">
                No gazetted public holidays in this month. Standard working days applicable.
              </div>
            )}
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Gross Payroll</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(totalGross, company.currencySymbol)}
              </p>
              <span className="text-[10px] text-slate-400">{displayRecords.length} staff processed</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Deductions (PF + Tax + Advance)</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                - {formatCurrency(totalDeductions, company.currencySymbol)}
              </p>
              <span className="text-[10px] text-slate-400">Provident fund, tax & advance recoveries</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <span className="text-xs text-emerald-800 font-semibold">Total Net Payable (Bank Transfer)</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {formatCurrency(totalNet, company.currencySymbol)}
              </p>
              <span className="text-[10px] text-emerald-600">Disbursed via electronic BEFTN/NPSB</span>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Salary Register — {selectedMonth}
                </h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                  {displayRecords.length} Records
                </span>
              </div>

              {currentRole === 'hr_admin' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveSubTab('salary_setup')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Edit Staff Salary Information</span>
                  </button>
                  <button
                    onClick={exportBankAdviceCSV}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Bank Advice CSV
                  </button>
                </div>
              )}
            </div>

            {displayRecords.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">
                  No payroll batch generated yet for {selectedMonth}.
                </p>
                <p className="text-slate-400 text-xs">
                  Click "Run {selectedMonth} Payroll" above to automatically calculate and disburse salary for all {activeStaff.length} active staff.
                </p>
                {currentRole === 'hr_admin' && (
                  <button
                    type="button"
                    onClick={() => onGeneratePayrollBatch(selectedMonth, selectedMonthKey)}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run {selectedMonth} Payroll Now</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-3">Designation & Station</th>
                      <th className="py-3 px-3">Gross Salary</th>
                      <th className="py-3 px-3">Days & Holidays</th>
                      <th className="py-3 px-3">Allowances (Mob+Trv)</th>
                      <th className="py-3 px-3">Advance Ded</th>
                      <th className="py-3 px-3">PF (8%) + Tax</th>
                      <th className="py-3 px-3 font-bold text-emerald-800">Net Payable</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Payslip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayRecords.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{item.employeeName}</p>
                          <p className="text-[11px] font-mono text-slate-500">{item.employeeId}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <span>{item.designation}</span>
                          <span className="block text-[10px] text-indigo-700 font-medium">{item.department}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 font-mono">
                          {formatCurrency(item.grossSalary, company.currencySymbol)}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">
                          <div className="font-semibold text-slate-800">
                            {item.totalWorkingDays ?? monthMetrics.workingDays}w / {item.totalDaysInMonth ?? monthMetrics.totalDays}d
                          </div>
                          <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 whitespace-nowrap">
                            <CalendarCheck2 className="w-2.5 h-2.5 text-teal-600" />
                            {item.govtHolidays ?? monthMetrics.govtHolidaysCount}d Hol (Paid)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono">
                          {formatCurrency((item.mobileAllowance || 0) + (item.travelAllowance || 0), company.currencySymbol)}
                        </td>
                        <td className="py-3 px-3 text-rose-600 font-mono">
                          {(item.advanceDeduction || 0) > 0 ? `- ${formatCurrency(item.advanceDeduction || 0, company.currencySymbol)}` : '--'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono">
                          {formatCurrency((item.providentFund || 0) + (item.tax || 0), company.currencySymbol)}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700 font-mono text-sm">
                          {formatCurrency(item.netSalary, company.currencySymbol)}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() =>
                              onUpdatePayrollStatus(
                                item.id,
                                item.paymentStatus === 'Paid' ? 'Processing' : 'Paid'
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              item.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.paymentStatus === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                            {item.paymentStatus}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              exportPayslipToDocx(
                                item,
                                company,
                                employees.find((e) => e.id === item.employeeId)
                              )
                            }
                            className="text-blue-700 hover:text-blue-900 font-bold text-xs inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer mr-1.5 shadow-2xs"
                            title="Download Payslip as Microsoft Word (.docx) file"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>.DOCX</span>
                          </button>
                          <button
                            onClick={() => setActivePayslip(item)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3 h-3" /> Payslip
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STAFF SALARY STRUCTURE & SETUP */}
      {activeSubTab === 'salary_setup' && currentRole === 'hr_admin' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Configure Staff Salary Structure & Allowances</span>
              </span>
              <p className="text-indigo-700 text-[11px]">
                Update Gross Salary, Mobile & Travel Allowances, PF deduction, Advance Balance, and Bank details for each staff member.
                When you click "Run Payroll", these exact figures are used to compute monthly net pay.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onGeneratePayrollBatch(selectedMonth, selectedMonthKey)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run {selectedMonth} Payroll</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={salarySearchQuery}
                onChange={(e) => setSalarySearchQuery(e.target.value)}
                placeholder="Search staff by name, ID, or station..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredSalaryStaff.length} of {activeStaff.length} active employees
            </span>
          </div>

          {/* Staff Salary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">ID & Name</th>
                    <th className="py-3 px-3">Designation & Station</th>
                    <th className="py-3 px-3 font-mono">Gross Salary</th>
                    <th className="py-3 px-3 font-mono">Basic (50%)</th>
                    <th className="py-3 px-3 font-mono">House Rent (25%)</th>
                    <th className="py-3 px-3 font-mono">Allowances (Mob+Trv)</th>
                    <th className="py-3 px-3 font-mono">PF %</th>
                    <th className="py-3 px-3 font-mono">Advance Loan</th>
                    <th className="py-3 px-3">Bank Details</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSalaryStaff.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{emp.fullName}</span>
                        <span className="text-[10px] font-mono text-slate-500">ID: {emp.id}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="font-medium text-slate-800 block">{emp.designation}</span>
                        <span className="text-[10px] text-indigo-700 font-semibold">{emp.workStation}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {formatCurrency(emp.grossSalary, company.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {formatCurrency(emp.basicSalary, company.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {formatCurrency(emp.houseRent, company.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {formatCurrency((emp.mobileAllowance ?? 1000) + (emp.travelAllowance ?? 2000), company.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                        {emp.pfDeductionPercentage ?? 8}%
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-600 font-semibold">
                        {(emp.advanceBalance || 0) > 0 ? formatCurrency(emp.advanceBalance!, company.currencySymbol) : '--'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600">
                        <span className="block font-medium text-slate-800">{emp.bankDetails?.bankName || 'Brac Bank PLC'}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Acc: {emp.bankDetails?.accountNumber || 'Pending'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenSalaryEdit(emp)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit Salary</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SALARY STRUCTURE MODAL */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-base">
                    Edit Salary Structure — {editingEmployee.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID: {editingEmployee.id} • {editingEmployee.designation} ({editingEmployee.workStation})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalaryStructure} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Gross Salary & Auto Breakdown Button */}
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-bold text-indigo-950 text-sm">Gross Salary (সর্বমোট বেতন) *</label>
                  <button
                    type="button"
                    onClick={() => handleAutoCalculateBreakdown(editForm.grossSalary)}
                    className="text-xs text-indigo-700 bg-white hover:bg-indigo-100 font-bold px-2.5 py-1 rounded-lg border border-indigo-300 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Auto-Calculate Standard Breakdown (50% Basic, 25% House, 10% Med, 10% Conv)</span>
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={editForm.grossSalary}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleAutoCalculateBreakdown(val);
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-indigo-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Statutory Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Basic Salary (50%)</label>
                  <input
                    type="number"
                    value={editForm.basicSalary}
                    onChange={(e) => setEditForm({ ...editForm, basicSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">House Rent (25%)</label>
                  <input
                    type="number"
                    value={editForm.houseRent}
                    onChange={(e) => setEditForm({ ...editForm, houseRent: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Medical Allowance (10%)</label>
                  <input
                    type="number"
                    value={editForm.medicalAllowance}
                    onChange={(e) => setEditForm({ ...editForm, medicalAllowance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Conveyance (10%)</label>
                  <input
                    type="number"
                    value={editForm.conveyanceAllowance}
                    onChange={(e) => setEditForm({ ...editForm, conveyanceAllowance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Special Allowances & Deductions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Mobile Allowance</label>
                  <input
                    type="number"
                    value={editForm.mobileAllowance}
                    onChange={(e) => setEditForm({ ...editForm, mobileAllowance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Travel Allowance</label>
                  <input
                    type="number"
                    value={editForm.travelAllowance}
                    onChange={(e) => setEditForm({ ...editForm, travelAllowance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">PF Deduction %</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={editForm.pfDeductionPercentage}
                    onChange={(e) => setEditForm({ ...editForm, pfDeductionPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Advance / Loan Recovery</label>
                  <input
                    type="number"
                    value={editForm.advanceBalance}
                    onChange={(e) => setEditForm({ ...editForm, advanceBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-xl font-mono text-rose-600 bg-white"
                  />
                </div>
              </div>

              {/* Bank & MFS Details */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-800 block">Bank Account & Electronic Disbursement</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editForm.bankName}
                      onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Account Number</label>
                    <input
                      type="text"
                      value={editForm.accountNumber}
                      onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Routing Number</label>
                    <input
                      type="text"
                      value={editForm.routingNumber}
                      onChange={(e) => setEditForm({ ...editForm, routingNumber: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Mobile Banking Type</label>
                    <select
                      value={editForm.mobileBankingType}
                      onChange={(e) => setEditForm({ ...editForm, mobileBankingType: e.target.value as any })}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="None">None</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Mobile Banking Number</label>
                    <input
                      type="text"
                      value={editForm.mobileBankingNumber}
                      onChange={(e) => setEditForm({ ...editForm, mobileBankingNumber: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-xs text-slate-500">
                  Est. Net Salary: <strong>৳{Math.max(0, editForm.grossSalary + editForm.mobileAllowance + editForm.travelAllowance - Math.round(editForm.basicSalary * (editForm.pfDeductionPercentage / 100)) - editForm.advanceBalance).toLocaleString()}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Salary Information</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Advice Sheet Modal */}
      {showBankAdvice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:z-auto print:block">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:h-auto print:shadow-none print:border-none print:w-full print:max-w-none print:block">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Bank Advice Disbursement Sheet</h3>
                  <p className="text-xs text-slate-400">Month: {selectedMonth} • {monthRecords.length} Beneficiaries</p>
                </div>
              </div>
              <button onClick={() => setShowBankAdvice(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 block">Bank Debit Account:</span>
                  <span className="font-mono text-slate-600">Brac Bank PLC — A/C: 150120100149200 ({company.name} Central Operations Account)</span>
                </div>
                <button
                  onClick={exportBankAdviceCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Bank Advice CSV
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2.5">SL</th>
                      <th className="p-2.5">Beneficiary Name</th>
                      <th className="p-2.5">Bank Name & Branch</th>
                      <th className="p-2.5">Account Number</th>
                      <th className="p-2.5">Routing No.</th>
                      <th className="p-2.5 text-right font-bold">Net Amount (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthRecords.map((r, i) => {
                      const emp = employees.find(e => e.id === r.employeeId);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-500">{i + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">{r.employeeName}</td>
                          <td className="p-2.5 text-slate-600">{r.bankName}</td>
                          <td className="p-2.5 font-mono font-semibold text-slate-800">{r.bankAccount}</td>
                          <td className="p-2.5 font-mono text-slate-500">{emp?.bankDetails?.routingNumber || '--'}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            {formatCurrency(r.netSalary, company.currencySymbol)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Payslip Modal */}
      {activePayslip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:z-auto print:block">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:h-auto print:shadow-none print:border-none print:w-full print:max-w-none print:block">
            <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Official Employee Payslip Preview</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    exportPayslipToDocx(
                      activePayslip,
                      company,
                      employees.find((e) => e.id === activePayslip.employeeId)
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                  title="Download Payslip as Microsoft Word (.docx) document"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download .DOCX</span>
                </button>
                <button
                  onClick={handlePrintPayslip}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Payslip
                </button>
                <button
                  onClick={() => setActivePayslip(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto print:p-0 print:m-0 text-slate-900">
              {/* Official Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {company.logoUrl && (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="h-12 w-auto object-contain max-w-[120px] shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">{company.name}</h1>
                    <p className="text-xs text-slate-600">{company.headOfficeAddress}</p>
                    <p className="text-[10px] text-slate-500">
                      Govt Reg: {company.registrationNo || 'NGO-BUR/DH-2849/2000'} • Email: {company.contactEmail} {company.phone ? `• Phone: ${company.phone}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    PAYSLIP / SALARY CERTIFICATE
                  </span>
                  <p className="text-xs text-slate-600 font-mono mt-1">Period: {activePayslip.month}</p>
                </div>
              </div>

              {/* Employee Dossier */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Employee Name</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{activePayslip.employeeName}</p>
                  <p className="font-mono text-slate-500">Staff ID: {activePayslip.employeeId}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Designation & Department</span>
                  <p className="font-bold text-slate-900 mt-0.5">{activePayslip.designation}</p>
                  <p className="text-slate-600">{activePayslip.department}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Disbursement Channel</span>
                  <p className="font-mono text-slate-800 mt-0.5">{activePayslip.bankName}</p>
                  <p className="font-mono text-slate-500">A/C: {activePayslip.bankAccount}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Payment Status</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                    {activePayslip.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Attendance & Gazetted Government Holiday Reconciliation */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-xs">
                      Attendance & Statutory Holiday Compliance (উপস্থিতি ও সরকারি ছুটি সমন্বয়)
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    শ্রম আইন ২০০৬ অনুযায়ী ১০০% প্রদেয়
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1 font-mono">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Total Days in Month</span>
                    <span className="font-bold text-slate-900 text-sm">{activePayslip.totalDaysInMonth ?? monthMetrics.totalDays} Days</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Standard Working Days</span>
                    <span className="font-bold text-slate-900 text-sm">{activePayslip.totalWorkingDays ?? monthMetrics.workingDays} Days</span>
                  </div>
                  <div className="bg-teal-50/80 p-2 rounded-lg border border-teal-200 text-teal-900">
                    <span className="text-[10px] text-teal-700 block font-semibold">Govt Holidays (Paid)</span>
                    <span className="font-black text-teal-800 text-sm">{activePayslip.govtHolidays ?? monthMetrics.govtHolidaysCount} Days</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Weekly Rest Days</span>
                    <span className="font-bold text-slate-900 text-sm">{activePayslip.weekends ?? monthMetrics.weekendCount} Days</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  * বাংলাদেশ গেজেট অনুযায়ী সকল জাতীয় ও ধর্মীয় সরকারি ছুটির দিন সম্পূর্ণ বেতনভুক্ত হিসেবে গণ্য হয়েছে। কোনো প্রকার বেতন কর্তন করা হয়নি।
                </p>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                {/* Earnings */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider text-[11px]">
                    Earnings (আয়)
                  </h4>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-mono font-medium">{formatCurrency(activePayslip.basicSalary, company.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">House Rent Allowance</span>
                    <span className="font-mono font-medium">{formatCurrency(activePayslip.houseRent, company.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Medical Allowance</span>
                    <span className="font-mono font-medium">{formatCurrency(activePayslip.medicalAllowance, company.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Conveyance Allowance</span>
                    <span className="font-mono font-medium">{formatCurrency(activePayslip.conveyanceAllowance, company.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Mobile & Data Allowance</span>
                    <span className="font-mono font-medium">{formatCurrency(activePayslip.mobileAllowance || 0, company.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Travel & Field Allowance</span>
                    <span className="font-mono font-medium">{formatCurrency(activePayslip.travelAllowance || 0, company.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-slate-900 border-t border-slate-300">
                    <span>Total Gross Earnings:</span>
                    <span className="font-mono">{formatCurrency(activePayslip.totalEarnings, company.currencySymbol)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider text-[11px]">
                    Deductions (কর্তন)
                  </h4>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Provident Fund (Employee 8%)</span>
                    <span className="font-mono font-medium text-rose-600">{formatCurrency(activePayslip.providentFund, company.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Tax Deduction (TDS)</span>
                    <span className="font-mono font-medium text-rose-600">{formatCurrency(activePayslip.tax, company.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Advance Salary / Loan Recovery</span>
                    <span className="font-mono font-medium text-rose-600">{formatCurrency(activePayslip.advanceDeduction || 0, company.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Unapproved Absence Deduction ({activePayslip.absentDays || 0} days)</span>
                    <span className="font-mono font-medium text-rose-600">{formatCurrency(activePayslip.absentDeduction || 0, company.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-rose-700 border-t border-slate-300">
                    <span>Total Deductions:</span>
                    <span className="font-mono">- {formatCurrency(activePayslip.totalDeductions, company.currencySymbol)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary Highlight */}
              <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase text-emerald-800 font-bold block">Net Salary Payable</span>
                  <p className="text-[11px] text-emerald-700 font-medium">In Words: {numberToWords(activePayslip.netSalary)}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-800 font-mono">
                    {formatCurrency(activePayslip.netSalary, company.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Legal Signatures */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-semibold">Prepared By</div>
                  <p className="font-bold text-slate-900 text-[11px] mt-0.5">{company.hrSignatoryName || 'Md. Omar Faruque'}</p>
                  <p className="text-[10px] text-slate-500">{company.hrSignatoryDesignation || 'Manager HR & Admin'}</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-semibold">Verified By</div>
                  <p className="font-bold text-slate-900 text-[11px] mt-0.5">Murshida Akhter Kanta</p>
                  <p className="text-[10px] text-slate-500">Director (Admin & Finance)</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-semibold">Approved By</div>
                  <p className="font-bold text-slate-900 text-[11px] mt-0.5">{company.signatoryName || 'Forhad Hossain'}</p>
                  <p className="text-[10px] text-slate-500">{company.signatoryDesignation || 'Executive Director'}</p>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center italic pt-4">
                This is a system-generated legal payslip issued under {company.name} Human Resource Policies and Bangladesh Labor Act compliance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
