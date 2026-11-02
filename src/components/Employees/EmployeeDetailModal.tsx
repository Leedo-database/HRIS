import React, { useState } from 'react';
import { Employee, CompanyProfile } from '../../types/hris';
import { 
  X, 
  User, 
  Briefcase, 
  CreditCard, 
  PhoneCall, 
  ShieldCheck, 
  FileText, 
  Mail, 
  MapPin, 
  Calendar, 
  Printer, 
  Edit3,
  CheckCircle2,
  AlertCircle,
  UserMinus,
  UserCheck,
  RotateCcw,
  Upload,
  Download,
  Trash2,
  FileCheck,
  FileCheck2,
  Archive,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, isEmployeeActive } from '../../utils/calculations';
import { EmployeeDocument, IssuedLetter } from '../../types/hris';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  onClose: () => void;
  company: CompanyProfile;
  currentRole?: string;
  onEdit: (emp: Employee) => void;
  onGenerateLetter: (emp: Employee, letterType: string) => void;
  onInitiateSeparation?: (emp: Employee) => void;
  onRecordSeparation?: (
    emp: Employee,
    details: {
      separationType: string;
      separationDate: string;
      noticeDate: string;
      reason: string;
      handoverTo: string;
      status?: string;
    }
  ) => void;
  onReactivateEmployee?: (empId: string, rejoiningDate?: string, notes?: string) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  issuedLetters?: IssuedLetter[];
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onClose,
  company,
  currentRole,
  onEdit,
  onGenerateLetter,
  onInitiateSeparation,
  onRecordSeparation,
  onReactivateEmployee,
  onUpdateEmployee,
  issuedLetters = [],
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'job' | 'salary' | 'emergency' | 'compliance' | 'documents' | 'issued_letters'>('profile');
  
  // Separation / Inactive Modal State
  const [isSeparationModalOpen, setIsSeparationModalOpen] = useState(false);
  const [separationStatus, setSeparationStatus] = useState<'Inactive' | 'Separated' | 'Resigned' | 'Terminated'>('Inactive');
  const [separationType, setSeparationType] = useState('Resignation');
  const [separationDate, setSeparationDate] = useState(new Date().toISOString().split('T')[0]);
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0]);
  const [handoverTo, setHandoverTo] = useState('Department Officer');
  const [separationReason, setSeparationReason] = useState('');

  // Re-activation Modal State
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [reactivateDate, setReactivateDate] = useState(new Date().toISOString().split('T')[0]);
  const [reactivateNotes, setReactivateNotes] = useState('');
  
  // Document upload state
  const [uploadCategory, setUploadCategory] = useState<EmployeeDocument['category']>('CV / Resume');
  const [customDocName, setCustomDocName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!employee) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const newDoc: EmployeeDocument = {
        id: `DOC-${Date.now().toString().slice(-6)}`,
        name: customDocName || file.name,
        category: uploadCategory,
        uploadedAt: new Date().toISOString().split('T')[0],
        fileSize: sizeStr,
        fileData: base64,
        contentType: file.type,
      };

      const updatedDocs = [...(employee.documents || []), newDoc];
      const updatedEmp = { ...employee, documents: updatedDocs };
      
      if (onUpdateEmployee) {
        onUpdateEmployee(updatedEmp);
      }
      
      setCustomDocName('');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document from the employee dossier?')) return;
    const updatedDocs = (employee.documents || []).filter((d) => d.id !== docId);
    const updatedEmp = { ...employee, documents: updatedDocs };
    if (onUpdateEmployee) {
      onUpdateEmployee(updatedEmp);
    }
  };

  const handleDownloadDocument = (doc: EmployeeDocument) => {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter letters issued specifically to this staff member
  const staffLetters = (employee.issuedLetters && employee.issuedLetters.length > 0)
    ? employee.issuedLetters
    : issuedLetters.filter((l) => l.employeeId === employee.id);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Cover */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={employee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
              alt={employee.fullName}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-md border border-indigo-400/30">
                  {employee.id}
                </span>
                {isEmployeeActive(employee) ? (
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      employee.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : employee.status === 'Probation'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    Active ({employee.status})
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/50">
                    Inactive ({employee.status || 'Separated'})
                  </span>
                )}
                <span className="text-xs text-slate-300">
                  {employee.employmentType}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {employee.fullName}
                {employee.banglaName && (
                  <span className="text-sm font-normal text-slate-300">({employee.banglaName})</span>
                )}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {employee.designation} • {employee.department}
              </p>
              <p className="text-[11px] text-indigo-300 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {employee.workStation} | Project: {employee.assignedProject}
              </p>
            </div>
          </div>
        </div>

        {/* Inactive / Separated Staff Alert Banner */}
        {!isEmployeeActive(employee) && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 text-sm">
                  কর্মী বর্তমানে নিষ্ক্রিয় / প্রস্থানকৃত (Staff Currently Inactive)
                </p>
                <p className="text-rose-700 mt-0.5">
                  {employee.separationReason ? `কারণ / Reason: ${employee.separationReason}` : `Status: ${employee.status}`}
                  {employee.separationDate && ` • কার্যকর তারিখ (DOS): ${employee.separationDate}`}
                </p>
                <p className="text-slate-600 text-[11px] mt-1">
                  এই কর্মী মাস্টার ডাটাবেস ও মাসিক স্যালারি শীট থেকে নিষ্ক্রিয় রয়েছে। কর্মী পুনরায় যোগদান করলে একই আইডিতে ({employee.id}) সক্রিয় করা যাবে।
                </p>
              </div>
            </div>
            {currentRole === 'hr_admin' && onReactivateEmployee && (
              <button
                type="button"
                onClick={() => setIsReactivateModalOpen(true)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-activate Staff on ID {employee.id} (পুনরায় সক্রিয় করুন)</span>
              </button>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" /> Personal
          </button>
          <button
            onClick={() => setActiveTab('job')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'job'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Job & Project
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'salary'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Salary & Bank
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'emergency'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-4 h-4" /> Emergency Contact
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'compliance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> NGO Safeguarding
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" /> Documents & Dossier (5-10 Yr Archive) ({employee.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('issued_letters')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'issued_letters'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> Issued Letters ({staffLetters.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">National ID / Passport Number</span>
                  <p className="font-semibold text-slate-800 text-sm font-mono">{employee.nidOrPassport || 'Not Specified'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Date of Birth (DOB)</span>
                  <p className="font-semibold text-slate-800 text-sm">{employee.dob || 'Not Specified'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Gender</span>
                  <p className="font-semibold text-slate-800">{employee.gender}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Religion</span>
                  <p className="font-semibold text-slate-800">{employee.religion || 'Islam'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Blood Group</span>
                  <p className="font-bold text-rose-600">{employee.bloodGroup}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Primary Phone</span>
                  <p className="font-semibold text-slate-800 font-mono">{employee.phone}</p>
                </div>
              </div>

              {/* Parents & Family Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Father / Husband Name</span>
                  <p className="font-medium text-slate-800">{employee.fatherOrSpouseName || 'Not recorded'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Mother Name</span>
                  <p className="font-medium text-slate-800">{employee.motherName || 'Not recorded'}</p>
                </div>
              </div>

              {/* Education & Certifications */}
              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <span className="text-indigo-900 font-bold text-xs uppercase tracking-wide block">
                  Education Credentials & Certifications
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-100 space-y-0.5">
                    <span className="text-slate-500 text-[10px]">Highest Education</span>
                    <p className="font-semibold text-slate-800 text-xs">{employee.highestEducation || 'Bachelor Degree'}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-100 space-y-0.5">
                    <span className="text-slate-500 text-[10px]">Professional Education</span>
                    <p className="font-semibold text-slate-800 text-xs">{employee.professionalEducation || 'Specialized NGO Training'}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-100 space-y-0.5">
                    <span className="text-slate-500 text-[10px]">Certificate Number</span>
                    <p className="font-mono font-semibold text-slate-800 text-xs">{employee.certificateNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Email Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Official Email</span>
                  <p className="font-semibold text-indigo-600">{employee.email}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Personal Email</span>
                  <p className="font-semibold text-slate-700">{employee.personalEmail || 'Not recorded'}</p>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Present Residential Address</span>
                  <p className="font-medium text-slate-800">{employee.presentAddress}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Permanent Home Address</span>
                  <p className="font-medium text-slate-800">{employee.permanentAddress || employee.presentAddress}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'job' && (
            <div className="space-y-4">
              {/* Supervisor Callout */}
              <div className="p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">
                    Designated Line Supervisor (কে কার সুপারভাইজার)
                  </span>
                  <p className="font-bold text-indigo-950 text-sm mt-0.5">
                    {employee.reportingManagerName || 'Founder & Executive Director (Reports Directly)'}
                  </p>
                  {employee.reportingManagerId && (
                    <span className="text-[11px] font-mono text-indigo-700">Supervisor ID: {employee.reportingManagerId}</span>
                  )}
                </div>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-indigo-200 text-indigo-800 font-bold text-xs">
                  Line Manager Assigned
                </span>
              </div>

              {/* Organization & Classification Fields: Grade, Nature of Employment, Category of Staff, Donor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Grade (বেতন স্কেল গ্রেড)</span>
                  <p className="font-semibold text-slate-800">{employee.gradeLevel}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Nature of Employment</span>
                  <p className="font-semibold text-slate-800">{employee.natureOfEmployment || 'Regular'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Category of Staff</span>
                  <p className="font-semibold text-slate-800">{employee.categoryOfStaff || 'Officer'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Donor Name / Funding</span>
                  <p className="font-semibold text-indigo-700">{employee.donorName || 'LEEDO Core Fund'}</p>
                </div>
              </div>

              {/* Location Category, Base Station, Project */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Job Location Category</span>
                  <p className="font-semibold text-slate-800">{employee.jobLocationCategory || 'Urban Outreach & Shelters'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Job Location / Primary Station</span>
                  <p className="font-semibold text-slate-800">{employee.jobLocation || employee.workStation}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Assigned NGO Project</span>
                  <p className="font-semibold text-indigo-700">{employee.assignedProject}</p>
                </div>
              </div>

              {/* Key Dates: DOJ, DOC, DOS & Reason for DOS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">DOJ (Joining Date)</span>
                  <p className="font-semibold text-slate-800">{employee.joiningDate}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">DOC (Confirmation Date)</span>
                  <p className="font-semibold text-slate-800">{employee.confirmationDate || 'In Probation Period'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">DOS (Separation Date)</span>
                  <p className={`font-semibold ${employee.separationDate ? 'text-rose-600' : 'text-slate-700'}`}>
                    {employee.separationDate || 'Currently Employed'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Employment Status</span>
                  <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    employee.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                    employee.status === 'Separated' || employee.status === 'Terminated' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {employee.status}
                  </span>
                </div>
              </div>

              {/* Reason for DOS & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Reason's for DOS (Separation Reason)</span>
                  <p className="font-medium text-slate-800">{employee.separationReason || 'N/A (Active Employee)'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-500 text-[11px]">Remarks (মন্তব্য / নোট)</span>
                  <p className="font-medium text-slate-800">{employee.remarks || 'Standard employee profile'}</p>
                </div>
              </div>

              {/* Duty Schedule & Leave Quotas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[11px] font-medium">Duty Days & Weekly Hours</span>
                  <p className="font-bold text-slate-900 text-xs">
                    {employee.dutyDays?.length || 6} Days/Week ({employee.dutyDays?.join(', ') || 'Sat-Thu'})
                  </p>
                  <p className="text-[11px] text-indigo-600 font-medium">
                    Shift: {employee.shiftStartTime || '10:00'} - {employee.shiftEndTime || '18:00'} ({employee.dailyDutyHours || 8}h/day)
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-emerald-800 text-[11px] font-medium">Annual Leave Entitlements</span>
                  <div className="flex items-center gap-3 pt-0.5">
                    <span className="px-2 py-0.5 bg-white text-indigo-700 font-bold rounded-md border border-indigo-200">
                      Casual: {employee.casualLeaveQuota ?? 16} Days
                    </span>
                    <span className="px-2 py-0.5 bg-white text-emerald-700 font-bold rounded-md border border-emerald-200">
                      Sick: {employee.sickLeaveQuota ?? 14} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi Job Locations */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-slate-600 text-[11px] font-bold block uppercase tracking-wide">
                  Assigned Job Locations & Centers ({employee.jobLocations?.length || 1})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(employee.jobLocations && employee.jobLocations.length > 0 ? employee.jobLocations : [employee.workStation || 'Head Office']).map((loc) => (
                    <span key={loc} className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>{loc}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'salary' && (
            <div className="space-y-4">
              {/* Highlight Net Take-Home Salary */}
              <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl text-white shadow-md flex items-center justify-between">
                <div>
                  <span className="text-emerald-100 text-[11px] font-semibold uppercase tracking-wider block">
                    Net Take-Home Salary (মোট প্রদেয় বেতন - Net Salary)
                  </span>
                  <p className="text-2xl sm:text-3xl font-extrabold mt-0.5 tracking-tight">
                    {formatCurrency(
                      employee.netSalary ?? 
                      ((employee.grossSalary || 0) + (employee.mobileAllowance || 0) + (employee.travelAllowance || 0) - Math.round((employee.basicSalary || (employee.grossSalary || 0) * 0.5) * 0.08) - (employee.taxDeduction || 0) - (employee.advanceBalance || 0)),
                      company.currencySymbol
                    )}
                  </p>
                  <span className="text-[11px] text-emerald-100/90 block mt-0.5">
                    Gross ({formatCurrency(employee.grossSalary, company.currencySymbol)}) + Allowances − Deductions
                  </span>
                </div>
                <button
                  onClick={() => onGenerateLetter(employee, 'salary_certificate')}
                  className="bg-white hover:bg-slate-50 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg border border-indigo-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Salary Certificate</span>
                </button>
              </div>

              {/* Monthly Gross and Allowances */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-600 text-[11px] font-semibold">Monthly Gross Salary</span>
                  <p className="font-bold text-slate-900 text-base mt-0.5">
                    {formatCurrency(employee.grossSalary, company.currencySymbol)}
                  </p>
                  <span className="text-[10px] text-slate-500">Daily rate: {formatCurrency(Math.round(employee.grossSalary / 26), company.currencySymbol)}/day</span>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-emerald-800 text-[11px] font-semibold">Mobile Allowance</span>
                  <p className="font-bold text-emerald-950 text-base mt-0.5">
                    {formatCurrency(employee.mobileAllowance ?? 1000, company.currencySymbol)}
                  </p>
                  <span className="text-[10px] text-emerald-700">Official communication</span>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-emerald-800 text-[11px] font-semibold">Travel Allowance</span>
                  <p className="font-bold text-emerald-950 text-base mt-0.5">
                    {formatCurrency(employee.travelAllowance ?? 2000, company.currencySymbol)}
                  </p>
                  <span className="text-[10px] text-emerald-700">Conveyance / Field transit</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 text-[11px]">Basic (50%)</span>
                  <p className="font-semibold text-slate-800">{formatCurrency(employee.basicSalary, company.currencySymbol)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 text-[11px]">House Rent (25%)</span>
                  <p className="font-semibold text-slate-800">{formatCurrency(employee.houseRent, company.currencySymbol)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 text-[11px]">Medical (10%)</span>
                  <p className="font-semibold text-slate-800">{formatCurrency(employee.medicalAllowance, company.currencySymbol)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 text-[11px]">Conveyance (10%)</span>
                  <p className="font-semibold text-slate-800">{formatCurrency(employee.conveyanceAllowance, company.currencySymbol)}</p>
                </div>
              </div>

              {/* Deductions: Advance Balance and Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100">
                  <span className="text-rose-800 text-[11px] font-semibold">Advance / Loan Balance</span>
                  <p className="font-bold text-rose-950 text-base mt-0.5">
                    {formatCurrency(employee.advanceBalance ?? 0, company.currencySymbol)}
                  </p>
                  <span className="text-[10px] text-rose-700">Deducted on monthly payroll</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-700 text-[11px] font-semibold">Income Tax Deduction</span>
                  <p className="font-bold text-slate-900 text-base mt-0.5">
                    {formatCurrency(employee.taxDeduction ?? 0, company.currencySymbol)}
                  </p>
                  <span className="text-[10px] text-slate-500">Tax deducted at source</span>
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Salary Disbursement Bank Details
                  </h4>
                  <button
                    onClick={() => onGenerateLetter(employee, 'bank_account_opening')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] cursor-pointer"
                  >
                    Generate Bank Opening Letter →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Bank & Branch</span>
                    <p className="font-semibold text-slate-800">{employee.bankDetails.bankName} - {employee.bankDetails.branchName || 'Main Branch'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Account Name & Number (Bank Account Number)</span>
                    <p className="font-mono font-bold text-slate-900">{employee.bankDetails.accountNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Routing Number</span>
                    <p className="font-mono text-slate-700">{employee.bankDetails.routingNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Mobile Banking (MFS)</span>
                    <p className="font-semibold text-slate-800">
                      {employee.bankDetails.mobileBankingType || 'bKash'}: {employee.bankDetails.mobileBankingNumber || employee.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 space-y-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-rose-600" />
                <h4 className="font-bold text-rose-950">Primary Emergency Contact (Family / Next of Kin)</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 bg-white rounded-lg border border-rose-200/60">
                  <span className="text-slate-500 text-[11px]">Contact Person Name</span>
                  <p className="font-bold text-slate-900">{employee.emergencyContact.name}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-rose-200/60">
                  <span className="text-slate-500 text-[11px]">Relationship</span>
                  <p className="font-semibold text-slate-800">{employee.emergencyContact.relation}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-rose-200/60">
                  <span className="text-slate-500 text-[11px]">Emergency Hotline Phone</span>
                  <p className="font-bold text-rose-700 text-sm">{employee.emergencyContact.phone}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-rose-200/60">
                  <span className="text-slate-500 text-[11px]">Residential Address</span>
                  <p className="font-medium text-slate-800">{employee.emergencyContact.address}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  NGO Safeguarding & Human Rights Standards
                </h4>
                <p className="text-xs text-emerald-800/80">
                  Verified compliance status for donor audits (USAID, UNICEF, EU, UNHCR).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-slate-700">Child Safeguarding Certification</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-slate-700">Signed Code of Conduct</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> On File
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-slate-700">Police Clearance Record</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Checked
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-slate-700">Confidentiality & Non-Disclosure (NDA)</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Executed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 6. DOCUMENTS & DOSSIER (5-10 YEAR ARCHIVE) ================= */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Institutional 5-10 Year Archival Guarantee Banner */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                <Archive className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <span>5-10 Year Permanent Dossier & Audit Archival</span>
                    <span className="text-[10px] bg-indigo-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                      Institutional Retention
                    </span>
                  </h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    All CVs, certificates, police verifications, and {company.name} signed due diligence documents are permanently stored in this staff member's official dossier. These files remain accessible for 5-10+ years for USAID, EU, UNICEF, and NGO Affairs Bureau compliance audits.
                  </p>
                </div>
              </div>

              {/* Upload New Document Box (HR Admin) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    Upload Dossier Document (নথি আপলোড করুন)
                  </h4>
                  <span className="text-[11px] text-slate-500">PDF, JPG, PNG, DOC (Up to 10MB)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold text-[11px] mb-1">
                      Document Category (নথির ধরণ) *
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="CV / Resume">1. CV / Resume (জীবনবৃত্তান্ত)</option>
                      <option value="Academic Certificate">2. Academic Certificate (শিক্ষাগত সনদপত্র)</option>
                      <option value="Professional Certificate">3. Professional Certificate (পেশাগত সনদপত্র)</option>
                      <option value="LEEDO Signed Due Diligence">4. LEEDO Signed Due Diligence (লিডো সাইন করা ডিউ ডিলিজেন্স)</option>
                      <option value="NID / Passport Copy">5. NID / Passport / Birth Certificate (জাতীয় পরিচয়পত্র)</option>
                      <option value="Police Clearance">6. Police Clearance / Verification (পুলিশ ভেরিফিকেশন)</option>
                      <option value="Appointment Letter">7. Appointment Letter / Contract (নিয়োগপত্র / চুক্তিপত্র)</option>
                      <option value="Other Document">8. Other NGO Compliance Document (অন্যান্য নথি)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold text-[11px] mb-1">
                      Document Title / Name (নথির নাম বা বিবরণ)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master's Degree Certificate, Signed Due Diligence 2026..."
                      value={customDocName}
                      onChange={(e) => setCustomDocName(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="employee-dossier-upload"
                  />
                  <label
                    htmlFor="employee-dossier-upload"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading & Archiving...' : 'Select File & Permanently Save'}</span>
                  </label>
                  <span className="text-[11px] text-slate-500 italic">
                    File is instantly converted, indexed, and bound to staff ID {employee.id}.
                  </span>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Archived Documents in Dossier ({employee.documents?.length || 0})
                  </h4>
                </div>

                {employee.documents && employee.documents.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {employee.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{doc.name}</span>
                              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                                {doc.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Uploaded: {doc.uploadedAt} • Size: {doc.fileSize || 'Standard'} • <span className="text-emerald-700 font-semibold">5-10 Year Retained</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const win = window.open();
                              if (win) {
                                win.document.write(`<iframe src="${doc.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadDocument(doc)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>

                          {currentRole === 'hr_admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete from Dossier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-xs">No documents uploaded to this staff dossier yet.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Upload their CV, academic certificates, professional credentials, and signed due diligence above to ensure permanent 5-10 year audit preservation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= 7. ISSUED LETTERS & LEGAL HISTORY ================= */}
          {activeTab === 'issued_letters' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    Official HR Letters Issued to {employee.fullName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    All Appointment, Experience, and Verification letters issued for this staff member remain permanently retrievable.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGenerateLetter(employee, 'appointment_letter');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    + Issue Appointment Letter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGenerateLetter(employee, 'experience');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold text-[11px] cursor-pointer"
                  >
                    + Issue Experience
                  </button>
                </div>
              </div>

              {staffLetters.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {staffLetters.map((letter) => (
                    <div
                      key={letter.id}
                      className="p-3 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700 text-xs">
                            {letter.referenceNo}
                          </span>
                          <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                            {letter.letterTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Date of Issue: <strong>{letter.issueDate}</strong> • Authorized Signatory: {letter.issuedBy}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onGenerateLetter(employee, letter.letterType);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reprint / View Letter</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 text-xs">No official letters have been issued to this staff member yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    When HR generates an Appointment Letter, Experience Certificate, or Salary Certificate, it will automatically save and show here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onGenerateLetter(employee, 'experience')}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Experience Letter
            </button>
            <button
              onClick={() => onGenerateLetter(employee, 'salary_certificate')}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Salary Certificate
            </button>
            <button
              onClick={() => onGenerateLetter(employee, 'travel_authorization')}
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Travel Authorization
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentRole === 'hr_admin' && onRecordSeparation && isEmployeeActive(employee) && (
              <button
                type="button"
                onClick={() => {
                  setSeparationStatus('Inactive');
                  setSeparationType('Resignation');
                  setSeparationDate(new Date().toISOString().split('T')[0]);
                  setNoticeDate(new Date().toISOString().split('T')[0]);
                  setHandoverTo('Department Officer');
                  setSeparationReason('');
                  setIsSeparationModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
                title="Mark Inactive / Separation & send to Final Settlement query"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Mark Inactive / Separation (নিষ্ক্রিয় করুন)</span>
              </button>
            )}

            {currentRole === 'hr_admin' && onReactivateEmployee && !isEmployeeActive(employee) && (
              <button
                type="button"
                onClick={() => {
                  setReactivateDate(new Date().toISOString().split('T')[0]);
                  setReactivateNotes('');
                  setIsReactivateModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                title="Re-activate employee on the exact same Employee ID"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Re-activate Staff (পুনরায় সক্রিয় করুন)</span>
              </button>
            )}

            {currentRole === 'hr_admin' && onInitiateSeparation && isEmployeeActive(employee) && (
              <button
                onClick={() => {
                  onClose();
                  onInitiateSeparation(employee);
                }}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
                title="Calculate Exit Clearance & Final Settlement"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Settlement Calculator</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Staff Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Inactive / Separation Modal Dialog */}
      {isSeparationModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm">
                  কর্মী নিষ্ক্রিয়করণ ও প্রস্থান এন্ট্রি (Mark Inactive / Separation)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSeparationModalOpen(false)}
                className="p-1 text-rose-200 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="font-bold text-rose-900">
                  {employee.fullName} ({employee.designation})
                </p>
                <p className="text-slate-600 font-mono text-[11px] mt-0.5">
                  ID: {employee.id} • Dept: {employee.department}
                </p>
                <p className="text-rose-700 text-[11px] mt-1 font-medium">
                  নিষ্ক্রিয় করলে এই কর্মী মাস্টার ডাটাবেস ও মাসিক স্যালারি শীট থেকে বাদ যাবে এবং ফাইনাল সেটেলমেন্টের কিউরি (Query) তে যুক্ত হবে।
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  নিষ্ক্রিয়করণের স্ট্যাটাস (Separation Status) *
                </label>
                <select
                  value={separationStatus}
                  onChange={(e) => setSeparationStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 font-semibold text-slate-800"
                >
                  <option value="Inactive">Inactive (নিষ্ক্রিয়)</option>
                  <option value="Separated">Separated (প্রস্থানকৃত)</option>
                  <option value="Resigned">Resigned (স্বেচ্ছায় পদত্যাগ)</option>
                  <option value="Terminated">Terminated (চাকরি অবসান / বরখাস্ত)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  প্রস্থানের কারণ (Reason for Separation) *
                </label>
                <select
                  value={separationType}
                  onChange={(e) => setSeparationType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
                >
                  <option value="Resignation">Resignation (স্বেচ্ছায় পদত্যাগ)</option>
                  <option value="Termination">Termination (চাকরি অবসান / বরখাস্ত)</option>
                  <option value="End of Contract">Contract Expiry (চুক্তির মেয়াদ সমাপ্তি)</option>
                  <option value="Mutual Separation">Mutual Separation (পারস্পরিক সমঝোতায় বিচ্ছেদ)</option>
                  <option value="Retirement">Retirement (স্বাভাবিক অবসর গ্রহণ)</option>
                  <option value="Medical Grounds">Medical Grounds (শারীরিক / চিকিৎসাজনিত কারণ)</option>
                  <option value="Project Closure">Project Closure (প্রকল্প সমাপ্তি)</option>
                  <option value="Disciplinary Dismissal">Disciplinary Action (শৃঙ্খলাভঙ্গজনিত অপসারণ)</option>
                  <option value="Other">Other / অন্যান্য কারণ</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    কার্যকর তারিখ (Date of Separation) *
                  </label>
                  <input
                    type="date"
                    value={separationDate}
                    onChange={(e) => setSeparationDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    নোটিশ প্রদানের তারিখ (Notice Date)
                  </label>
                  <input
                    type="date"
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  দায়িত্ব হস্তান্তরকারী কর্মী (Handover Colleague)
                </label>
                <input
                  type="text"
                  value={handoverTo}
                  onChange={(e) => setHandoverTo(e.target.value)}
                  placeholder="e.g., Designated Line Manager / Officer"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  বিস্তারিত কারণ ও মন্তব্য (Reason Details & Remarks)
                </label>
                <textarea
                  rows={2}
                  value={separationReason}
                  onChange={(e) => setSeparationReason(e.target.value)}
                  placeholder="পদত্যাগের বিস্তারিত কারণ বা ম্যানেজমেন্ট সিদ্ধান্তের নোট লিখুন..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsSeparationModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-100"
              >
                বাতিল করুন (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRecordSeparation) {
                    onRecordSeparation(employee, {
                      separationType,
                      separationDate,
                      noticeDate,
                      reason: separationReason || `${separationStatus}: ${separationType}`,
                      handoverTo,
                      status: separationStatus,
                    });
                  }
                  setIsSeparationModalOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>নিষ্ক্রিয় নিশ্চিত করুন (Confirm Inactive)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-activate Employee Modal Dialog */}
      {isReactivateModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">
                  কর্মী পুনরায় সক্রিয়করণ (Re-activate Staff Member)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReactivateModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-emerald-950 text-sm">
                    {employee.fullName} ({employee.designation})
                  </p>
                  <span className="font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded text-[11px]">
                    ID: {employee.id} (একই আইডি বহাল থাকবে)
                  </span>
                </div>
                <p className="text-emerald-800 text-[11px] mt-1 font-medium">
                  এই কর্মীকে পুনরায় সক্রিয় (Active) করা হলে তিনি সেন্ট্রাল মাস্টার ডাটাবেস, মাসিক স্যালারি শীট ও সুপারভাইজার তালিকায় ফিরে আসবেন।
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  পুনরায় যোগদানের তারিখ (Re-activation / Rejoining Date) *
                </label>
                <input
                  type="date"
                  value={reactivateDate}
                  onChange={(e) => setReactivateDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  পুনরায় যোগদানের নোট / প্রজেক্ট অ্যাসাইনমেন্ট (Rejoining Remarks)
                </label>
                <textarea
                  rows={3}
                  value={reactivateNotes}
                  onChange={(e) => setReactivateNotes(e.target.value)}
                  placeholder="e.g., Re-joined for LEEDO project new phase as per management approval..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsReactivateModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-100"
              >
                বাতিল করুন (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onReactivateEmployee) {
                    onReactivateEmployee(
                      employee.id,
                      reactivateDate,
                      reactivateNotes || 'Re-activated by HR Admin on same Employee ID'
                    );
                  }
                  setIsReactivateModalOpen(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>একই আইডিতে সক্রিয় নিশ্চিত করুন (Confirm Re-activate)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
