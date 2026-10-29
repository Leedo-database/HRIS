import React, { useState } from 'react';
import { Employee, UserRole, UserCredential, CompanyProfile } from '../../types/hris';
import { LEEDO_MASTER_EMPLOYEES } from '../../data/leedoStaffDatabase';
import { 
  Lock, 
  User, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  Eye, 
  EyeOff, 
  HardDrive,
  ShieldAlert
} from 'lucide-react';

interface LoginScreenProps {
  employees: Employee[];
  credentials: Record<string, UserCredential>;
  company: CompanyProfile;
  onLoginSuccess: (emp: Employee, role: UserRole) => void;
  onUpdatePassword: (employeeId: string, newPass: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  employees,
  credentials,
  company,
  onLoginSuccess,
  onUpdatePassword,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // First-time password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Combine loaded employees with master records so no ID can ever be missed
  const getFullMasterList = (): Employee[] => {
    const map = new Map<string, Employee>();
    LEEDO_MASTER_EMPLOYEES.forEach((emp) => {
      map.set(emp.id.trim(), emp);
    });
    (employees || []).forEach((emp) => {
      if (emp && emp.id) {
        const existing = map.get(emp.id.trim());
        map.set(emp.id.trim(), existing ? { ...existing, ...emp } : emp);
      }
    });
    return Array.from(map.values());
  };

  const findEmployee = (input: string): Employee | undefined => {
    if (!input) return undefined;
    const clean = input.trim();
    const lower = clean.toLowerCase();
    const masterList = getFullMasterList();

    // 1. Exact ID match (case-insensitive)
    let match = masterList.find((e) => e.id.toLowerCase() === lower);
    if (match) return match;

    // 2. Stripped prefix (e.g. LEEDO-1001, EMP-1001, #1001)
    const stripped = lower.replace(/^(leedo|emp)[\s\-_]*/i, '').replace(/^#/, '').trim();
    if (stripped) {
      match = masterList.find((e) => e.id.toLowerCase() === stripped);
      if (match) return match;

      // Leading zero stripped (e.g. 01001 -> 1001)
      const numOnly = stripped.replace(/^0+/, '');
      if (numOnly) {
        match = masterList.find((e) => e.id.replace(/^0+/, '') === numOnly);
        if (match) return match;
      }
    }

    // 3. Email match
    match = masterList.find((e) => 
      (e.email && e.email.toLowerCase() === lower) || 
      (e.personalEmail && e.personalEmail.toLowerCase() === lower)
    );
    if (match) return match;

    // 4. Phone number match (digits only)
    const phoneDigits = clean.replace(/\D/g, '');
    if (phoneDigits.length >= 10) {
      match = masterList.find((e) => 
        (e.phone || '').replace(/\D/g, '').endsWith(phoneDigits.slice(-10))
      );
      if (match) return match;
    }

    return undefined;
  };

  const resolveRole = (emp: Employee): UserRole => {
    const id = emp.id.trim();
    if (id === '1001' || id === '1002') return 'hr_admin';
    const des = emp.designation?.toLowerCase() || '';
    const dept = emp.department?.toLowerCase() || '';
    if (
      des.includes('director') || 
      des.includes('founder') || 
      dept.includes('human resources') || 
      dept.includes('admin & finance')
    ) {
      return 'hr_admin';
    }
    if (
      des.includes('coordinator') || 
      des.includes('manager') || 
      des.includes('head') || 
      des.includes('lead') || 
      des.includes('in-charge') || 
      des.includes('doctor')
    ) {
      return 'line_manager';
    }
    return 'employee';
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!employeeId.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার Employee ID দিন (Please enter your Employee ID).');
      return;
    }

    const emp = findEmployee(employeeId);

    if (!emp) {
      setErrorMessage(
        `Employee ID "${employeeId}" master database-এ পাওয়া যায়নি। অনুগ্রহ করে আপনার সঠিক Staff ID (যেমন: 1001, 1002, 1003... 1099) দিন।`
      );
      return;
    }

    const cred = credentials[emp.id] || {
      employeeId: emp.id,
      password: emp.id, // default password is staff ID
      mustChangePassword: true,
      role: resolveRole(emp),
    };

    if (password !== cred.password) {
      setErrorMessage(
        'পাসওয়ার্ড সঠিক নয়। প্রথমবার লগইনের ক্ষেত্রে আপনার পাসওয়ার্ড হলো আপনার Employee ID।'
      );
      return;
    }

    // Check if first-time password change is required
    if (cred.mustChangePassword || password === emp.id) {
      setTargetEmployee(emp);
      setIsChangingPassword(true);
      return;
    }

    const role = resolveRole(emp);
    onLoginSuccess(emp, role);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে (Minimum 4 characters).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না (Passwords do not match).');
      return;
    }
    if (targetEmployee && newPassword.trim() === targetEmployee.id.trim()) {
      setErrorMessage('নতুন পাসওয়ার্ড আপনার Employee ID-এর সমান হতে পারবে না। অনুগ্রহ করে একটি গোপন ব্যক্তিগত পাসওয়ার্ড দিন।');
      return;
    }

    if (targetEmployee) {
      onUpdatePassword(targetEmployee.id, newPassword);
      setIsChangingPassword(false);
      const role = resolveRole(targetEmployee);
      onLoginSuccess(targetEmployee, role);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Subtle Gradient & Grid */}
      <div className="absolute inset-0 bg-radial from-indigo-900/25 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 p-4 sm:p-6 flex items-center justify-between border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img
            src={company.logoUrl || '/leedo-logo.svg'}
            alt="LEEDO Logo"
            className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/leedo-logo.svg';
            }}
          />
          <div>
            <h1 className="text-white font-bold text-sm sm:text-base tracking-tight leading-tight">
              {company.name}
            </h1>
            <p className="text-xs text-slate-400">
              {company.organizationType} • Reg: {company.registrationNo}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Master Cloud Database Active</span>
          </span>
        </div>
      </header>

      {/* Center Login Box */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Card Header Branding */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white text-center relative">
            <div className="mb-3 flex justify-center">
              <div className="p-3 bg-white rounded-2xl shadow-xl inline-block">
                <img
                  src={company.logoUrl || '/leedo-logo.svg'}
                  alt="LEEDO"
                  className="h-12 sm:h-14 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/leedo-logo.svg';
                  }}
                />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {company.name} HRIS Portal
            </h2>
            <p className="text-xs text-indigo-200 mt-1 font-medium">
              Employee ID Authentication & Self-Service
            </p>
          </div>

          {/* Form Area */}
          <div className="p-6 sm:p-7 space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
            )}

            {isChangingPassword ? (
              /* Mandatory First Time Password Change Prompt */
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 text-xs">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>প্রথমবার লগইন: নতুন পাসওয়ার্ড পরিবর্তন</span>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    স্বাগতম <strong>{targetEmployee?.fullName}</strong>! আপনার Staff ID (<strong>{targetEmployee?.id}</strong>)। নিরাপত্তা নীতি অনুযায়ী প্রথমবার লগইন করার সাথে সাথে আপনার ডিফল্ট পাসওয়ার্ড পরিবর্তন করে নতুন ব্যক্তিগত পাসওয়ার্ড সেট করুন।
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    নতুন ব্যক্তিগত পাসওয়ার্ড (New Password) *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 pr-10 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    পাসওয়ার্ড নিশ্চিত করুন (Confirm Password) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>পাসওয়ার্ড সংরক্ষণ ও সিস্টেমে প্রবেশ করুন</span>
                </button>
              </form>
            ) : (
              /* Standard Employee ID Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Employee / Staff ID *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="উদাহরণ: 1001, 1002, 1003..."
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full p-3 pl-10 border border-slate-300 rounded-xl font-bold text-slate-900 tracking-wider text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase"
                      autoFocus
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    প্রথমবার লগইনের পাসওয়ার্ড হলো আপনার Employee ID (যেমন: 1001)
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    পাসওয়ার্ড (Password) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="আপনার পাসওয়ার্ড লিখুন"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 pl-10 pr-10 border border-slate-300 rounded-xl font-mono text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm mt-3"
                >
                  <LogIn className="w-4 h-4" />
                  <span>লগইন করুন (Log In to HRIS)</span>
                </button>
              </form>
            )}

            {/* Strict Notice */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                প্রত্যেক কর্মকর্তা শুধুমাত্র নিজের প্রোফাইল ও অনুমোদিত মডিউল এক্সেস করতে পারবেন।
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="relative z-10 p-4 text-center text-xs text-slate-500 border-t border-slate-800/60 bg-slate-900/30 backdrop-blur-md">
        <span>{company.name} HRIS • Master Database Authentication • {company.headOfficeAddress}</span>
      </footer>
    </div>
  );
};
