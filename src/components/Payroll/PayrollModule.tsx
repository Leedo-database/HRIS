import React, { useState } from 'react';
import { Employee, PayrollRecord, CompanyProfile, UserRole } from '../../types/hris';
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
  X
} from 'lucide-react';
import { formatCurrency, numberToWords } from '../../utils/calculations';

interface PayrollModuleProps {
  payroll: PayrollRecord[];
  employees: Employee[];
  company: CompanyProfile;
  currentRole: UserRole;
  currentUser: Employee;
  onGeneratePayrollBatch: (month: string, monthKey: string) => void;
  onUpdatePayrollStatus: (id: string, status: 'Paid' | 'Processing') => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  payroll,
  employees,
  company,
  currentRole,
  currentUser,
  onGeneratePayrollBatch,
  onUpdatePayrollStatus,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [selectedMonthKey, setSelectedMonthKey] = useState('2026-09');
  const [activePayslip, setActivePayslip] = useState<PayrollRecord | null>(null);
  const [showBankAdvice, setShowBankAdvice] = useState(false);

  // Only active employees are included in the salary sheet
  const activeStaffIds = new Set(
    employees
      .filter((e) => e.status !== 'Separated' && e.status !== 'Terminated')
      .map((e) => e.id)
  );

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
    const headers = ['Serial', 'Employee ID', 'Beneficiary Account Name', 'Bank Name', 'Branch', 'Account Number', 'Routing Number', 'Net Amount Payable (BDT)', 'MFS Number'];
    const rows = monthRecords.map((p, idx) => {
      const emp = employees.find(e => e.id === p.employeeId);
      return [
        idx + 1,
        `"${p.employeeId}"`,
        `"${p.employeeName}"`,
        `"${p.bankName}"`,
        `"${emp?.bankDetails.branchName || 'Principal'}"`,
        `"${p.bankAccount}"`,
        `"${emp?.bankDetails.routingNumber || ''}"`,
        p.netSalary,
        `"${emp?.bankDetails.mobileBankingNumber || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bank_Advice_Disbursement_${selectedMonthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Payroll & Automated Salary Disbursement
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full compliance salary processing with provident fund, tax, and automated bank disbursement advice
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month selector */}
          <select
            value={selectedMonthKey}
            onChange={(e) => {
              setSelectedMonthKey(e.target.value);
              setSelectedMonth(e.target.value === '2026-10' ? 'October 2026' : 'September 2026');
            }}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-medium"
          >
            <option value="2026-09">September 2026</option>
            <option value="2026-10">October 2026</option>
          </select>

          {currentRole === 'hr_admin' && (
            <>
              <button
                onClick={() => onGeneratePayrollBatch(selectedMonth, selectedMonthKey)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Calculate and generate monthly payroll batch for all active staff"
              >
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
          <span className="text-xs text-slate-500 font-medium">Total Deductions (PF + Tax)</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            - {formatCurrency(totalDeductions, company.currencySymbol)}
          </p>
          <span className="text-[10px] text-slate-400">Provident fund, tax & adjustments</span>
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
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">
              Salary Register — {selectedMonth}
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
              {displayRecords.length} Records
            </span>
          </div>

          {currentRole === 'hr_admin' && (
            <button
              onClick={exportBankAdviceCSV}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Bank Advice CSV
            </button>
          )}
        </div>

        {displayRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No payroll generated yet for {selectedMonth}. Click "Run {selectedMonth} Payroll" to generate.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Designation</th>
                  <th className="py-3 px-3">Gross Salary</th>
                  <th className="py-3 px-3">Allowances (Mob+Trv)</th>
                  <th className="py-3 px-3">Absent Ded</th>
                  <th className="py-3 px-3">Advance Ded</th>
                  <th className="py-3 px-3">Net Payable</th>
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
                    <td className="py-3 px-3 text-slate-700">{item.designation}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900 font-mono">
                      {formatCurrency(item.grossSalary, company.currencySymbol)}
                    </td>
                    <td className="py-3 px-3 text-indigo-700 font-semibold font-mono">
                      +{formatCurrency((item.mobileAllowance ?? 1000) + (item.travelAllowance ?? 2000), company.currencySymbol)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono">
                      {item.absentDeduction && item.absentDeduction > 0 ? (
                        <span className="text-rose-600 font-bold">-{formatCurrency(item.absentDeduction, company.currencySymbol)}</span>
                      ) : (
                        <span className="text-slate-400">৳0 (0d)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono">
                      {item.advanceDeduction && item.advanceDeduction > 0 ? (
                        <span className="text-rose-600 font-bold">-{formatCurrency(item.advanceDeduction, company.currencySymbol)}</span>
                      ) : (
                        <span className="text-slate-400">৳0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700 text-sm font-mono">
                      {formatCurrency(item.netSalary, company.currencySymbol)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActivePayslip(item)}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>View Payslip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bank Advice Modal */}
      {showBankAdvice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base">Bank Salary Disbursement Advice</h3>
                  <p className="text-xs text-slate-400">Formal forwarding statement for bank wire/BEFTN transfer</p>
                </div>
              </div>
              <button onClick={() => setShowBankAdvice(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <p className="font-bold text-slate-800 text-sm">To: The Branch Manager</p>
                <p className="text-slate-600">Brac Bank PLC / Corporate Banking Wing</p>
                <p className="text-slate-700 leading-relaxed">
                  Subject: <strong>Disbursement of staff monthly salary for the month of {selectedMonth}</strong>.
                  Please debit our Organization Current Account and credit the following beneficiaries as listed below:
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="p-2.5">Staff ID</th>
                      <th className="p-2.5">Beneficiary Name</th>
                      <th className="p-2.5">Bank & Branch</th>
                      <th className="p-2.5">Account Number</th>
                      <th className="p-2.5">Routing</th>
                      <th className="p-2.5 text-right">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthRecords.map((rec) => {
                      const emp = employees.find(e => e.id === rec.employeeId);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono">{rec.employeeId}</td>
                          <td className="p-2.5 font-bold text-slate-900">{rec.employeeName}</td>
                          <td className="p-2.5">{rec.bankName}</td>
                          <td className="p-2.5 font-mono">{rec.bankAccount}</td>
                          <td className="p-2.5 font-mono text-slate-500">{emp?.bankDetails.routingNumber}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-700">
                            {formatCurrency(rec.netSalary, company.currencySymbol)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-900">
                    <tr>
                      <td colSpan={5} className="p-2.5 text-right">Total Disbursement Amount:</td>
                      <td className="p-2.5 text-right text-emerald-700 text-sm">
                        {formatCurrency(totalNet, company.currencySymbol)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">Authorized by {company.signatoryName} ({company.signatoryDesignation})</span>
              <div className="flex gap-2">
                <button
                  onClick={exportBankAdviceCSV}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export CSV for Bank
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Payslip Modal (Formatted for high-grade A4 printing) */}
      {activePayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden printable-document-container">
            {/* Action Bar (Hidden during print) */}
            <div className="no-print bg-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Employee Payslip — {activePayslip.month}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPayslip}
                  className="allow-print px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setActivePayslip(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Sheet */}
            <div className="p-8 space-y-6 text-slate-900 text-xs bg-white">
              {/* Organization Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <img
                    src={company.logoUrl || '/leedo-logo.svg'}
                    alt={company.name}
                    className="h-12 w-auto object-contain max-w-[150px]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/leedo-logo.svg';
                    }}
                  />
                </div>
                <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                  {company.name}
                </h1>
                <p className="text-xs text-slate-600 mt-1">{company.headOfficeAddress}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Registration: {company.registrationNo} • Phone: {company.phone} • Email: {company.contactEmail}
                </p>
                <div className="mt-3 inline-block bg-slate-100 px-4 py-1 rounded-full font-bold text-slate-800 tracking-wider uppercase text-xs">
                  Confidential Salary Slip — {activePayslip.month}
                </div>
              </div>

              {/* Employee & Bank Info Grid */}
              <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="space-y-1">
                  <p><span className="text-slate-500">Employee ID:</span> <strong className="font-mono">{activePayslip.employeeId}</strong></p>
                  <p><span className="text-slate-500">Name:</span> <strong className="text-sm">{activePayslip.employeeName}</strong></p>
                  <p><span className="text-slate-500">Designation:</span> <strong>{activePayslip.designation}</strong></p>
                  <p><span className="text-slate-500">Department:</span> <strong>{activePayslip.department}</strong></p>
                </div>
                <div className="space-y-1">
                  <p><span className="text-slate-500">Pay Period:</span> <strong>{activePayslip.month}</strong></p>
                  <p><span className="text-slate-500">Payment Mode:</span> <strong>Bank Electronic Transfer (BEFTN)</strong></p>
                  <p><span className="text-slate-500">Bank Name:</span> <strong>{activePayslip.bankName}</strong></p>
                  <p><span className="text-slate-500">Account No:</span> <strong className="font-mono">{activePayslip.bankAccount}</strong></p>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-2 gap-0 border border-slate-300 rounded-xl overflow-hidden">
                {/* Earnings Column */}
                <div className="border-r border-slate-300">
                  <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300 text-center uppercase tracking-wider text-[11px]">
                    Earnings (BDT)
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-semibold">Monthly Gross Base</span>
                      <span className="font-mono font-bold">{formatCurrency(activePayslip.grossSalary, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Mobile Allowance</span>
                      <span className="font-mono text-indigo-700 font-bold">+{formatCurrency(activePayslip.mobileAllowance ?? 1000, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Travel Allowance (Conveyance)</span>
                      <span className="font-mono text-indigo-700 font-bold">+{formatCurrency(activePayslip.travelAllowance ?? 2000, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                      <span>Total Gross Earnings:</span>
                      <span className="font-mono text-emerald-700 font-bold">{formatCurrency(activePayslip.totalEarnings, company.currencySymbol)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Column */}
                <div>
                  <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300 text-center uppercase tracking-wider text-[11px]">
                    Deductions (BDT)
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        Absent Days Deduction ({activePayslip.absentDays || 0}d)
                      </span>
                      <span className="font-mono text-rose-700">
                        -{formatCurrency(activePayslip.absentDeduction || 0, company.currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Salary Advance / Loan Deduction</span>
                      <span className="font-mono text-rose-700">
                        -{formatCurrency(activePayslip.advanceDeduction || activePayslip.loanDeduction || 0, company.currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Provident Fund (8%)</span>
                      <span className="font-mono text-rose-700">-{formatCurrency(activePayslip.providentFund, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Income Tax (TDS)</span>
                      <span className="font-mono text-rose-700">-{formatCurrency(activePayslip.tax, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                      <span>Total Deductions:</span>
                      <span className="font-mono text-rose-700 font-bold">-{formatCurrency(activePayslip.totalDeductions, company.currencySymbol)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-300 text-[11px] uppercase tracking-wider block">Net Take-Home Salary</span>
                  <p className="text-xs text-indigo-300 italic mt-0.5">
                    In Words: {numberToWords(activePayslip.netSalary)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {formatCurrency(activePayslip.netSalary, company.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Official Signatures Section */}
              <div className="pt-12 grid grid-cols-3 gap-6 text-center text-[11px] text-slate-700 border-t border-slate-200 mt-8">
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-semibold">Prepared By</div>
                  <p className="text-[10px] text-slate-400">HR & Admin Officer</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-semibold">Verified By</div>
                  <p className="text-[10px] text-slate-400">Finance & Grants Lead</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-semibold">Approved By</div>
                  <p className="text-[10px] text-slate-400">Executive Director / Signatory</p>
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
