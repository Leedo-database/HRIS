import React, { useState } from 'react';
import { Employee, ExpenseClaim, CompanyProfile, UserRole } from '../../types/hris';
import { 
  Receipt, 
  Plus, 
  CheckCircle2, 
  Download, 
  FileText, 
  DollarSign, 
  FolderKanban,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

interface ExpenseModuleProps {
  expenses: ExpenseClaim[];
  employees: Employee[];
  company: CompanyProfile;
  currentUser: Employee;
  currentRole: UserRole;
  onAddExpense: (expense: ExpenseClaim) => void;
  onUpdateExpense: (expense: ExpenseClaim) => void;
}

export const ExpenseModule: React.FC<ExpenseModuleProps> = ({
  expenses,
  employees,
  company,
  currentUser,
  currentRole,
  onAddExpense,
  onUpdateExpense,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<any>('Travel / Field Fare');
  const [amount, setAmount] = useState<number>(2500);
  const [projectName, setProjectName] = useState('Street Children Shelter & Rescue Mission');
  const [description, setDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newClaim: ExpenseClaim = {
      id: `EXP-2026-${Date.now().toString().slice(-4)}`,
      employeeId: currentUser.id,
      employeeName: currentUser.fullName,
      department: currentUser.department,
      projectName,
      title,
      claimDate: '2026-10-13',
      category,
      amount,
      description: description || 'Approved field operational transit and logistical expenses',
      status: 'Pending',
    };

    onAddExpense(newClaim);
    setIsCreating(false);
    setTitle('');
    setDescription('');
  };

  const handleApprove = (exp: ExpenseClaim) => {
    onUpdateExpense({ ...exp, status: 'Approved' });
  };

  const handleDisburse = (exp: ExpenseClaim) => {
    onUpdateExpense({ ...exp, status: 'Disbursed' });
  };

  const exportExpenseCSV = () => {
    const headers = ['Claim ID', 'Staff ID', 'Claimant Name', 'Date', 'Category', 'Project Fund', 'Amount', 'Status', 'Description'];
    const rows = expenses.map((e) => [
      `"${e.id}"`,
      `"${e.employeeId}"`,
      `"${e.employeeName}"`,
      `"${e.claimDate}"`,
      `"${e.category}"`,
      `"${e.projectName}"`,
      e.amount,
      `"${e.status}"`,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Project_Field_Expense_Claims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Field Travel, TA/DA & Expense Claims
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log field mission transport, per diem allowances, and logistical reimbursements under project budget lines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportExpenseCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Claims CSV</span>
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Expense Claim</span>
          </button>
        </div>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Submit Field Expense Claim</h3>
              <p className="text-xs text-slate-500">Claimant: {currentUser.fullName} ({currentUser.id})</p>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Expense Title / Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Field emergency vehicle transit to Sadarghat launch terminal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Total Claim Amount ({company.currencySymbol}) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Travel / Field Fare">Travel / Field Fare (Bus, CNG, Auto)</option>
                  <option value="Daily Allowance (DA)">Daily Allowance (DA / Food Per Diem)</option>
                  <option value="Accommodation">Accommodation / Hotel</option>
                  <option value="Project Logistics">Project Logistics / Supplies</option>
                  <option value="Refreshment / Meeting">Refreshment / Community Meeting</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Charged Project Fund</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Receipt Attachment</label>
                <input
                  type="text"
                  placeholder="Voucher / Cash Memo #48291"
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-600 font-semibold mb-1">Detailed Expense Breakdown</label>
                <textarea
                  rows={2}
                  placeholder="Provide date, journey route, or itemized receipt breakdown..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <span>Submit For Verification</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Claims List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Disbursement Claims Ledger</h3>
          <span className="text-xs text-slate-500 font-mono">
            Total Claims: {formatCurrency(expenses.reduce((a, b) => a + b.amount, 0), company.currencySymbol)}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {expenses.map((claim) => (
            <div key={claim.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{claim.title}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      claim.status === 'Disbursed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : claim.status === 'Approved'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : claim.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] flex items-center gap-2">
                  <span>Claimant: <strong>{claim.employeeName}</strong> ({claim.department})</span>
                  <span>•</span>
                  <span>Category: {claim.category}</span>
                  <span>•</span>
                  <span>Project: <em>{claim.projectName}</em></span>
                </p>

                <p className="text-slate-500 text-[11px]">
                  {claim.description}
                </p>
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(claim.amount, company.currencySymbol)}
                  </span>
                  <p className="text-[10px] text-slate-400">{claim.claimDate}</p>
                </div>

                {currentRole !== 'employee' && (
                  <div className="flex items-center gap-1.5">
                    {claim.status === 'Pending' && (
                      <button
                        onClick={() => handleApprove(claim)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                      >
                        Approve
                      </button>
                    )}
                    {claim.status === 'Approved' && (
                      <button
                        onClick={() => handleDisburse(claim)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs"
                      >
                        Disburse
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
