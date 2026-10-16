import React, { useState } from 'react';
import { Employee, UserRole, UserCredential, CompanyProfile } from '../../types/hris';
import { 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  RefreshCw,
  Building2,
  HardDrive
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  employees: Employee[];
  credentials: Record<string, UserCredential>;
  company: CompanyProfile;
  onLoginSuccess: (emp: Employee, role: UserRole) => void;
  onUpdatePassword: (employeeId: string, newPass: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  employees,
  credentials,
  company,
  onLoginSuccess,
  onUpdatePassword,
}) => {
  const [employeeId, setEmployeeId] = useState('LEEDO-101');
  const [password, setPassword] = useState('LEEDO-101');
  const [errorMessage, setErrorMessage] = useState('');
  
  // First-time password change prompt
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedId = employeeId.trim().toUpperCase();
    const emp = employees.find((e) => e.id.toUpperCase() === trimmedId);

    if (!emp) {
      setErrorMessage(`Employee ID "${employeeId}" not found in master database.`);
      return;
    }

    // Check credentials
    const cred = credentials[emp.id] || {
      employeeId: emp.id,
      password: emp.id, // default password is employee ID
      mustChangePassword: true,
      role: emp.department === 'Human Resources & Admin' ? 'hr_admin' : 'employee',
    };

    if (password !== cred.password) {
      setErrorMessage('Incorrect password. Default password is your Employee ID.');
      return;
    }

    // Check if first-time password change is required
    if (cred.mustChangePassword || password === emp.id) {
      setTargetEmployee(emp);
      setIsChangingPassword(true);
      return;
    }

    // Normal successful login
    const resolvedRole: UserRole = 
      emp.designation.includes('Manager') || emp.department === 'Human Resources & Admin'
        ? 'hr_admin'
        : emp.designation.includes('Head') || emp.designation.includes('Lead')
        ? 'line_manager'
        : 'employee';

    onLoginSuccess(emp, resolvedRole);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('New password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }
    if (targetEmployee && newPassword === targetEmployee.id) {
      setErrorMessage('New password cannot be the same as your Employee ID.');
      return;
    }

    if (targetEmployee) {
      onUpdatePassword(targetEmployee.id, newPassword);
      setIsChangingPassword(false);

      const resolvedRole: UserRole = 
        targetEmployee.designation.includes('Manager') || targetEmployee.department === 'Human Resources & Admin'
          ? 'hr_admin'
          : targetEmployee.designation.includes('Head') || targetEmployee.designation.includes('Lead')
          ? 'line_manager'
          : 'employee';

      onLoginSuccess(targetEmployee, resolvedRole);
    }
  };

  const handleQuickDemoSelect = (emp: Employee) => {
    setEmployeeId(emp.id);
    const cred = credentials[emp.id];
    setPassword(cred?.password || emp.id);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 mx-auto flex items-center justify-center shadow-lg font-bold text-xl text-white mb-2">
            HR
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">{company.name}</h2>
          <p className="text-xs text-slate-300 mt-1">Master Human Resource Information System</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
            <HardDrive className="w-3 h-3" />
            <span>Cloud Database Persistent (5–10 Year Vault)</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isChangingPassword ? (
            /* First-time mandatory password change prompt */
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  First Time Login: Change Default Password
                </span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  As per organization security policy, please change your default password from your Employee ID ({targetEmployee?.id}) to a personal confidential password.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Confidential Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Enter new password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Confirm New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save New Password & Enter HRIS</span>
              </button>
            </form>
          ) : (
            /* Regular Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Employee ID (Staff ID) *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. LEEDO-101"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 uppercase focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Default login password is your Employee ID
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to System</span>
              </button>
            </form>
          )}

          {/* Quick Demo Staff Switcher */}
          {!isChangingPassword && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick One-Click Test Accounts:
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect(employees[0])}
                  className="w-full text-left p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      {employees[0]?.fullName} (HR Admin)
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600">
                      ID: {employees[0]?.id} (Full HR Access)
                    </span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                    HR Admin
                  </span>
                </button>

                {employees[1] && (
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSelect(employees[1])}
                    className="w-full text-left p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        {employees[1]?.fullName} (Line Manager)
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ID: {employees[1]?.id} (Supervisor Approvals)
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                      Supervisor
                    </span>
                  </button>
                )}

                {employees[4] && (
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSelect(employees[4])}
                    className="w-full text-left p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        {employees[4]?.fullName} (Field Staff)
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ID: {employees[4]?.id} (Self-Service ESS)
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                      Employee
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
