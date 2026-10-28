import React, { useState, useEffect } from 'react';
import { Employee, CompanyProfile, LetterType, IssuedLetter, PayrollRecord } from '../../types/hris';
import { 
  FileCheck2, 
  Printer, 
  Copy, 
  Check, 
  Download, 
  User, 
  Building, 
  Calendar,
  Sparkles,
  Search,
  Archive,
  Save,
  CheckCircle2,
  FileText,
  BadgeCheck,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { formatCurrency, numberToWords, isEmployeeActive } from '../../utils/calculations';
import { exportOfficialLetterToDocx } from '../../utils/docxExport';

interface OfficialLettersModuleProps {
  employees: Employee[];
  company: CompanyProfile;
  payroll?: PayrollRecord[];
  initialLetterType?: LetterType;
  initialEmployee?: Employee | null;
  issuedLetters?: IssuedLetter[];
  onSaveIssuedLetter?: (letter: IssuedLetter) => void;
}

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const OfficialLettersModule: React.FC<OfficialLettersModuleProps> = ({
  employees,
  company,
  payroll = [],
  initialLetterType = 'experience',
  initialEmployee = null,
  issuedLetters = [],
  onSaveIssuedLetter,
}) => {
  const [activeView, setActiveView] = useState<'generator' | 'archive'>('generator');
  const [selectedType, setSelectedType] = useState<LetterType>(initialLetterType);
  const [selectedStaffId, setSelectedStaffId] = useState(
    initialEmployee && (['experience', 'separation_clearance', 'final_settlement'].includes(initialLetterType) || isEmployeeActive(initialEmployee))
      ? initialEmployee.id 
      : employees.find(isEmployeeActive)?.id || '1001'
  );
  
  // Staff Employment Cadre / Appointment Category
  const [appointmentCategory, setAppointmentCategory] = useState<'Permanent' | 'Contractual' | 'Permanent Volunteer'>('Permanent');
  
  // Dynamic References & Dates
  const [referenceNo, setReferenceNo] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [addressedToBank, setAddressedToBank] = useState('The Branch Manager, Brac Bank PLC, Banani Branch, Dhaka');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Search & Filter for Issued Letters Archive
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLetterType, setFilterLetterType] = useState<string>('All');
  const [archivedLetterPreview, setArchivedLetterPreview] = useState<IssuedLetter | null>(null);

  // Synchronize when initialEmployee or initialLetterType props change
  useEffect(() => {
    if (initialEmployee?.id) {
      setSelectedStaffId(initialEmployee.id);
    }
  }, [initialEmployee]);

  useEffect(() => {
    if (initialLetterType) {
      setSelectedType(initialLetterType);
    }
  }, [initialLetterType]);

  // Ensure separated employees are automatically replaced by active staff if an active letter type is selected
  useEffect(() => {
    const isExitDoc = ['experience', 'separation_clearance', 'final_settlement'].includes(selectedType);
    const currentEmp = employees.find((e) => e.id === selectedStaffId);
    if (!isExitDoc && currentEmp && !isEmployeeActive(currentEmp)) {
      const firstActive = employees.find(isEmployeeActive);
      if (firstActive) {
        setSelectedStaffId(firstActive.id);
      }
    }
  }, [selectedType, selectedStaffId, employees]);

  const emp = employees.find((e) => e.id === selectedStaffId) || employees.find(isEmployeeActive) || employees[0];

  // Latest calculated payroll record for this staff if available
  const latestPayroll = payroll?.find((p) => p.employeeId === emp?.id);

  // Dynamic salary computation: Prioritize latest payroll record, fallback to employee profile, and compute standard statutory allowances
  const gross = latestPayroll?.grossSalary ?? (emp?.grossSalary || 0);
  const basic = latestPayroll?.basicSalary ?? (emp?.basicSalary || Math.round(gross * 0.5));
  const house = latestPayroll?.houseRent ?? (emp?.houseRent || Math.round(gross * 0.25));
  const med = latestPayroll?.medicalAllowance ?? (emp?.medicalAllowance || Math.round(gross * 0.1));
  const conv = latestPayroll?.conveyanceAllowance ?? (emp?.conveyanceAllowance || Math.round(gross * 0.1));
  const mob = latestPayroll?.mobileAllowance ?? (emp?.mobileAllowance ?? 1000);
  const trv = latestPayroll?.travelAllowance ?? (emp?.travelAllowance ?? 2000);
  const totalGross = gross + mob + trv;

  // Auto generate reference number when staff or type changes
  useEffect(() => {
    const now = new Date();
    const mon = MONTH_NAMES[now.getMonth()];
    const rand = Math.floor(100 + Math.random() * 900);
    const typeCode = selectedType === 'appointment_letter' 
      ? (appointmentCategory === 'Permanent' ? 'APT-PERM' : appointmentCategory === 'Contractual' ? 'APT-CONT' : 'APT-VOL')
      : selectedType.toUpperCase().slice(0, 4);
    setReferenceNo(`LEEDO/HR/${now.getFullYear()}/${mon}/${typeCode}-${emp?.id || '1001'}-${rand}`);
  }, [selectedStaffId, selectedType, appointmentCategory, emp?.id]);

  const handlePrint = () => {
    // Save to profile and issued letters before printing if handler exists
    handleSaveToProfile(false);
    window.print();
  };

  const handleCopyText = () => {
    const docElement = document.getElementById('printable-official-letter');
    if (docElement) {
      navigator.clipboard.writeText(docElement.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLetterTitle = (type: LetterType, apptCat: string): string => {
    switch (type) {
      case 'appointment_letter':
        return `${apptCat} Appointment & Offer Letter`;
      case 'experience':
        return 'Official Experience & Service Certificate';
      case 'salary_certificate':
        return 'Certified Salary & Employment Verification Certificate';
      case 'bank_account_opening':
        return 'Official Bank Account Opening Recommendation';
      case 'leave_application':
        return 'Formal Leave Requisition & Authorization Form';
      case 'travel_authorization':
        return 'Authorized Field Mission & Travel Clearance';
      case 'separation_clearance':
        return 'Staff Exit Clearance & Handover Docket';
      case 'final_settlement':
        return 'Terminal Benefits & Final Settlement Voucher';
      case 'emergency_contact_form':
        return 'Emergency Contact & Safeguarding Verification Form';
      case 'warning_letter':
        return 'Official Administrative Notice & Code of Conduct Counseling';
      default:
        return 'Official Letter';
    }
  };

  const handleSaveToProfile = (showToast = true) => {
    if (!emp) return;

    const newIssuedLetter: IssuedLetter = {
      id: `LET-${Date.now().toString().slice(-6)}`,
      referenceNo,
      letterType: selectedType,
      letterTitle: getLetterTitle(selectedType, appointmentCategory),
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeDesignation: emp.designation,
      employeeDepartment: emp.department,
      issueDate,
      issuedBy: company.hrSignatoryName
        ? `${company.hrSignatoryName} (${company.hrSignatoryDesignation || 'Manager HR & Admin'})`
        : company.signatoryName || 'HR Admin & Legal Division',
      addressedTo: selectedType === 'bank_account_opening' ? addressedToBank : undefined,
      purpose: undefined,
      appointmentCategory: selectedType === 'appointment_letter' ? appointmentCategory : undefined,
    };

    if (onSaveIssuedLetter) {
      onSaveIssuedLetter(newIssuedLetter);
    }

    if (showToast) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Filter archived letters
  const filteredArchivedLetters = issuedLetters.filter((l) => {
    const matchesSearch = 
      l.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.letterTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterLetterType === 'All' || l.letterType === filterLetterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header and View Switcher */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600" />
            <span>Official HR Letters & Legal Forms Generator</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-generate certified Appointment Letters, Experience Certificates, and Salary Documents with permanent profile archival
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher: Generator vs Archive */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveView('generator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'generator'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Letter Generator
            </button>
            <button
              onClick={() => setActiveView('archive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'archive'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Issued Archive ({issuedLetters.length})</span>
            </button>
          </div>

          {activeView === 'generator' && (
            <>
              <button
                onClick={() => handleSaveToProfile(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Save and attach this letter to staff dossier"
              >
                {savedSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savedSuccess ? 'Saved to Profile!' : 'Save to Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('printable-official-letter');
                  if (el) {
                    exportOfficialLetterToDocx(
                      el.innerHTML,
                      getLetterTitle(selectedType, appointmentCategory),
                      emp?.fullName || 'Staff'
                    );
                  }
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Download Letter as Microsoft Word (.docx) document"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download .DOCX</span>
              </button>

              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Letter (A4)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= ARCHIVE VIEW ================= */}
      {activeView === 'archive' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Archive className="w-4 h-4 text-indigo-600" />
                <span>Historical Issued Letters & Legal Notices Archive (HR Central Registry)</span>
              </h3>
              <p className="text-xs text-slate-500">
                All issued letters remain permanently stored in the database for donor audits and verification
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Reference, Name, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl w-60 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={filterLetterType}
                onChange={(e) => setFilterLetterType(e.target.value)}
                className="py-1.5 px-3 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 font-semibold"
              >
                <option value="All">All Letter Types</option>
                <option value="appointment_letter">Appointment Letters</option>
                <option value="experience">Experience Letters</option>
                <option value="salary_certificate">Salary Certificates</option>
                <option value="bank_account_opening">Bank Opening</option>
                <option value="separation_clearance">Exit Clearance</option>
                <option value="final_settlement">Final Settlement</option>
              </select>
            </div>
          </div>

          {filteredArchivedLetters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Reference Number</th>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Document Category</th>
                    <th className="p-3">Issue Date</th>
                    <th className="p-3">Authorized Signatory</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArchivedLetters.map((letter) => (
                    <tr key={letter.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        {letter.referenceNo}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{letter.employeeName}</p>
                        <span className="text-[10px] font-mono text-slate-400">ID: {letter.employeeId}</span>
                      </td>
                      <td className="p-3">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          {letter.letterTitle}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{letter.issueDate}</td>
                      <td className="p-3 text-slate-700">{letter.issuedBy}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedStaffId(letter.employeeId);
                            setSelectedType(letter.letterType);
                            setReferenceNo(letter.referenceNo);
                            setIssueDate(letter.issueDate);
                            if (letter.appointmentCategory) {
                              setAppointmentCategory(
                                letter.appointmentCategory === 'Part-Time / Hourly'
                                  ? 'Permanent Volunteer'
                                  : (letter.appointmentCategory as 'Permanent' | 'Contractual' | 'Permanent Volunteer')
                              );
                            }
                            setActiveView('generator');
                          }}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          View & Re-print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Archive className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>No historical letters match the filter. Generate a letter and click "Save to Profile" to archive it.</p>
            </div>
          )}
        </div>
      )}

      {/* ================= GENERATOR VIEW ================= */}
      {activeView === 'generator' && (
        <>
          {/* Control Configuration Bar */}
          <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Official Document Type *</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as LetterType)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-800"
                >
                  <option value="appointment_letter">1. Appointment & Offer Letter (নিয়োগপত্র)</option>
                  <option value="experience">2. Experience & Relieving Certificate (অভিজ্ঞতা সনদ)</option>
                  <option value="salary_certificate">3. Salary & Employment Certificate (বেতন সনদ)</option>
                  <option value="bank_account_opening">4. Bank Account Opening Recommendation (ব্যাংক হিসাব)</option>
                  <option value="travel_authorization">5. Official Travel & Visit Authorization (ভ্রমণ অনুমতি)</option>
                  <option value="leave_application">6. Formal Leave Application Requisition</option>
                  <option value="separation_clearance">7. Staff Exit Clearance Form (অব্যাহতি ক্লিয়ারেন্স)</option>
                  <option value="final_settlement">8. Final Settlement & Terminal Benefits</option>
                  <option value="emergency_contact_form">9. Emergency Contact Verification Form</option>
                  <option value="warning_letter">10. Administrative Explanation / Counseling Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Staff Member *</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <optgroup label="Active Employees (বর্তমান কর্মী)">
                    {employees.filter(isEmployeeActive).map((e) => (
                      <option key={e.id} value={e.id}>
                        [{e.id}] {e.fullName} — {e.designation}
                      </option>
                    ))}
                  </optgroup>
                  {/* Separated / Ex-Staff are ONLY accessible for Experience Certificates and Separation Clearance dockets */}
                  {['experience', 'separation_clearance', 'final_settlement'].includes(selectedType) && employees.some((e) => !isEmployeeActive(e)) && (
                    <optgroup label="Separated / Ex-Staff (অব্যাহতিপ্রাপ্ত কর্মী - Experience & Release Only)">
                      {employees.filter((e) => !isEmployeeActive(e)).map((e) => (
                        <option key={e.id} value={e.id}>
                          [{e.id}] {e.fullName} (Exited) — {e.designation}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Dispatch Reference Number (স্বয়ংক্রিয় রেফারেন্স নং)
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl font-mono text-indigo-700 font-bold bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Date of Issue (ইস্যুর তারিখ)</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Dynamic Cadre Category Selector (Permanent, Contractual, Permanent Volunteer) */}
            {(['appointment_letter', 'experience', 'salary_certificate', 'bank_account_opening', 'final_settlement'].includes(selectedType)) && (
              <div className="pt-2 border-t border-indigo-100 bg-indigo-50/50 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-indigo-950 block">Staff Cadre & Employment Category (ক্যাডার ও চাকরির ধরণ):</span>
                  <p className="text-[11px] text-indigo-800">
                    Different terms, compensation/honorarium, and clauses apply for Permanent, Contractual, and Permanent Volunteer.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(['Permanent', 'Contractual', 'Permanent Volunteer'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAppointmentCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        appointmentCategory === cat
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat === 'Permanent' && '1. Permanent (স্থায়ী কর্মকর্তা)'}
                      {cat === 'Contractual' && '2. Contractual (চুক্তিভিত্তিক কর্মী)'}
                      {cat === 'Permanent Volunteer' && '3. Permanent Volunteer (স্থায়ী ভলান্টিয়ার)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedType === 'bank_account_opening' && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <label className="block text-slate-600 font-semibold mb-1">Addressed Bank & Branch:</label>
                <input
                  type="text"
                  value={addressedToBank}
                  onChange={(e) => setAddressedToBank(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
            )}
          </div>

          {/* Printable Letter Sheet (A4 Styled) */}
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 md:p-12 max-w-4xl mx-auto printable-document-container text-slate-900 leading-relaxed text-sm" 
            id="printable-official-letter"
          >
            {/* Organization Official Letterhead */}
            <div className="border-b-2 border-slate-900 pb-5 mb-8 text-center relative">
              <div className="flex items-center justify-between mb-2">
                <div className="h-16 w-auto flex items-center justify-center shrink-0">
                  <img
                    src={company.logoUrl || '/leedo-logo.svg'}
                    alt={company.name}
                    className="h-16 w-auto object-contain max-w-[170px]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/leedo-logo.svg';
                    }}
                  />
                </div>
                <div className="text-center flex-1 px-4">
                  <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-slate-900">
                    {company.name}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{company.headOfficeAddress}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Govt Reg No: {company.registrationNo} • Phone: {company.phone} • Email: {company.contactEmail}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase text-center p-1">
                  Official Seal
                </div>
              </div>
            </div>

            {/* Reference & Date Header */}
            <div className="flex justify-between items-center text-xs text-slate-700 mb-6 font-mono border-b border-slate-200 pb-2">
              <span><strong>Ref:</strong> {referenceNo}</span>
              <span><strong>Date:</strong> {issueDate}</span>
            </div>

            {/* ================= 1. APPOINTMENT LETTER TEMPLATES ================= */}
            {selectedType === 'appointment_letter' && (
              <div className="space-y-4">
                <div className="text-xs space-y-1 mb-4">
                  <p><strong>To:</strong></p>
                  <p className="text-base font-bold text-slate-900">{emp?.fullName}</p>
                  <p>NID / Passport: <span className="font-mono">{emp?.nidOrPassport}</span></p>
                  <p>Address: {emp?.presentAddress}</p>
                  <p>Contact: {emp?.phone}</p>
                </div>

                <h2 className="text-center text-base font-bold uppercase tracking-wider underline decoration-2 underline-offset-4 text-slate-900">
                  {appointmentCategory === 'Permanent' && 'LETTER OF APPOINTMENT (PERMANENT CADRE)'}
                  {appointmentCategory === 'Contractual' && 'LETTER OF APPOINTMENT (PROJECT CONTRACTUAL CADRE)'}
                  {appointmentCategory === 'Permanent Volunteer' && 'LETTER OF APPOINTMENT (PERMANENT VOLUNTEER & HONORARY CADRE)'}
                </h2>

                <p className="text-slate-800 text-justify">
                  Dear <strong>{emp?.fullName}</strong>,
                </p>

                <p className="text-slate-800 text-justify indent-8">
                  We are pleased to offer you an engagement with <strong>{company.name}</strong> as <strong>{emp?.designation}</strong> in the Department of <strong>{emp?.department}</strong>. Your posting will be based at our <strong>{emp?.workStation || (emp?.jobLocations && emp?.jobLocations[0]) || 'Head Office'}</strong>, effective from <strong>{emp?.joiningDate}</strong>.
                </p>

                {/* Terms Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden my-3 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                      <tr>
                        <th className="p-2.5 w-1/3">Engagement Term</th>
                        <th className="p-2.5">Agreed Conditions & Specifications</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-bold">Nature of Cadre</td>
                        <td className="p-2.5">
                          {appointmentCategory === 'Permanent' && 'Permanent Full-time post under organizational personnel cadre'}
                          {appointmentCategory === 'Contractual' && (emp?.assignedProject ? `Contractual Project post (${emp.assignedProject})` : 'Contractual Project post')}
                          {appointmentCategory === 'Permanent Volunteer' && 'Dedicated Permanent Volunteer & Child Protection Field Service'}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">Duty Schedule & Working Hours</td>
                        <td className="p-2.5">
                          {emp?.dutyDays ? emp.dutyDays.join(', ') : 'Saturday to Thursday'} • {emp?.dailyDutyHours || 8} Hours/Day ({emp?.shiftStartTime || '10:00'} - {emp?.shiftEndTime || '18:00'})
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">
                          {appointmentCategory === 'Permanent Volunteer' ? 'Monthly Honorarium & Subsistence' : 'Monthly Gross Remuneration'}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-indigo-900">
                          {appointmentCategory === 'Permanent Volunteer' ? (
                            <span>
                              {formatCurrency(gross || 15000, company.currencySymbol)} (Plus Mobile: {formatCurrency(mob, company.currencySymbol)}, Field Travel & Food: {formatCurrency(trv, company.currencySymbol)})
                            </span>
                          ) : (
                            <span>
                              {formatCurrency(gross, company.currencySymbol)} (Plus Mobile: {formatCurrency(mob, company.currencySymbol)}, Travel: {formatCurrency(trv, company.currencySymbol)})
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">Probation / Review Period</td>
                        <td className="p-2.5">
                          {appointmentCategory === 'Permanent' && 'Six (6) months probationary period subject to confirmation appraisal'}
                          {appointmentCategory === 'Contractual' && 'Three (3) months initial performance review period'}
                          {appointmentCategory === 'Permanent Volunteer' && 'Thirty (30) days initial field induction and child safeguarding orientation'}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">Annual Leave Entitlements</td>
                        <td className="p-2.5">
                          Casual Leave: <strong>{emp?.casualLeaveQuota || 16} days</strong> • Sick Leave: <strong>{emp?.sickLeaveQuota || 14} days</strong> (Pro-rated per organizational HR manual)
                        </td>
                      </tr>
                      {appointmentCategory === 'Permanent' && (
                        <tr>
                          <td className="p-2.5 font-bold">Retirement Benefits & Gratuity</td>
                          <td className="p-2.5">
                            Contributory Provident Fund (8% Basic + equal organizational match) & Gratuity after 3 years continuous service.
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="p-2.5 font-bold">Child Safeguarding Adherence</td>
                        <td className="p-2.5 text-emerald-800 font-semibold">
                          Zero-tolerance policy on child abuse, sexual exploitation, and strict adherence to LEEDO Code of Conduct.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-slate-800 text-justify text-xs">
                  {appointmentCategory === 'Permanent' && 'Separation by either party requires one (1) month written notice or gross salary in lieu thereof.'}
                  {appointmentCategory === 'Contractual' && 'This contract is valid for the designated project duration and renewable upon mutual agreement.'}
                  {appointmentCategory === 'Permanent Volunteer' && 'Voluntary transition requires fifteen (15) days mutual notice to ensure continuous care of shelter children.'}
                </p>

                <p className="text-slate-800 text-xs">
                  Please return the duplicate copy of this letter duly signed as your formal acceptance of these terms.
                </p>
              </div>
            )}

            {/* ================= 2. EXPERIENCE CERTIFICATE ================= */}
            {selectedType === 'experience' && (
              <div className="space-y-5">
                <h2 className="text-center text-base font-bold uppercase tracking-wider underline decoration-2 underline-offset-4 text-slate-900">
                  {appointmentCategory === 'Permanent Volunteer' 
                    ? 'VOLUNTEER SERVICE & RECOGNITION CERTIFICATE' 
                    : 'EXPERIENCE & SERVICE CERTIFICATE'}
                </h2>

                <p className="text-slate-800 text-justify indent-8">
                  {appointmentCategory === 'Permanent' && (
                    <span>
                      This is to officially certify that <strong>{emp?.fullName}</strong> (Staff ID: <strong>{emp?.id}</strong>) has been an integral permanent employee in regular cadre of <strong>{company.name}</strong> from <strong>{emp?.joiningDate}</strong> to <strong>{emp?.status === 'Separated' ? (emp.separationDate || 'October 2026') : 'present'}</strong>.
                    </span>
                  )}
                  {appointmentCategory === 'Contractual' && (
                    <span>
                      This is to officially certify that <strong>{emp?.fullName}</strong> (Staff ID: <strong>{emp?.id}</strong>) was engaged as a project contractual staff of <strong>{company.name}</strong> from <strong>{emp?.joiningDate}</strong> to <strong>{emp?.status === 'Separated' ? (emp.separationDate || 'October 2026') : 'present'}</strong>.
                    </span>
                  )}
                  {appointmentCategory === 'Permanent Volunteer' && (
                    <span>
                      This is to officially certify with highest humanitarian appreciation that <strong>{emp?.fullName}</strong> (Volunteer ID: <strong>{emp?.id}</strong>) has served as an honorary <strong>Permanent Volunteer & Child Protection Worker</strong> with <strong>{company.name}</strong> from <strong>{emp?.joiningDate}</strong> to <strong>{emp?.status === 'Separated' ? (emp.separationDate || 'October 2026') : 'present'}</strong>.
                    </span>
                  )}
                </p>

                <p className="text-slate-800 text-justify">
                  During this tenure, {emp?.gender === 'Female' ? 'she' : 'he'} served as <strong>{emp?.designation}</strong> in our <strong>{emp?.department}</strong> wing, stationed at <strong>{emp?.workStation}</strong>, actively delivering assignments and responsibilities with high dedication.
                </p>

                <p className="text-slate-800 text-justify">
                  Throughout {emp?.gender === 'Female' ? 'her' : 'his'} engagement, {emp?.gender === 'Female' ? 'she' : 'he'} maintained exemplary professional conduct, integrity, and verified compliance with our Child Safeguarding Policy.
                </p>

                <p className="text-slate-800 text-justify">
                  We wish {emp?.gender === 'Female' ? 'her' : 'him'} all success in future humanitarian and professional career pursuits.
                </p>
              </div>
            )}

            {/* ================= 3. SALARY & HONORARIUM CERTIFICATE ================= */}
            {selectedType === 'salary_certificate' && (
              <div className="space-y-5">
                <h2 className="text-center text-base font-bold uppercase tracking-wider underline decoration-2 underline-offset-4 text-slate-900">
                  {appointmentCategory === 'Permanent Volunteer'
                    ? 'VOLUNTEER HONORARIUM & SUBSISTENCE VERIFICATION CERTIFICATE'
                    : 'SALARY & EMPLOYMENT VERIFICATION CERTIFICATE'}
                </h2>

                <p className="text-slate-800 text-justify indent-8">
                  {appointmentCategory === 'Permanent' && (
                    <span>This is to certify that <strong>{emp?.fullName}</strong> (Staff ID: <strong>{emp?.id}</strong>) is a permanent employee in regular cadre of <strong>{company.name}</strong>, currently serving as <strong>{emp?.designation}</strong> in the Department of <strong>{emp?.department}</strong>.</span>
                  )}
                  {appointmentCategory === 'Contractual' && (
                    <span>This is to certify that <strong>{emp?.fullName}</strong> (Staff ID: <strong>{emp?.id}</strong>) is a contractual project employee of <strong>{company.name}</strong>, serving as <strong>{emp?.designation}</strong> in the Department of <strong>{emp?.department}</strong>.</span>
                  )}
                  {appointmentCategory === 'Permanent Volunteer' && (
                    <span>This is to certify that <strong>{emp?.fullName}</strong> (Volunteer ID: <strong>{emp?.id}</strong>) is an honorary permanent volunteer of <strong>{company.name}</strong>, serving as <strong>{emp?.designation}</strong> in voluntary child protection operations.</span>
                  )}
                </p>

                <p className="text-slate-800">
                  {appointmentCategory === 'Permanent Volunteer'
                    ? 'As per our official finance and administration records, their monthly volunteer honorarium and subsistence breakdown is as follows:'
                    : `As per our official payroll records, ${emp?.gender === 'Female' ? 'her' : 'his'} current monthly remuneration breakdown is as follows:`}
                </p>

                {appointmentCategory === 'Permanent Volunteer' ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 max-w-lg mx-auto text-xs space-y-2">
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span>Monthly Volunteer Honorarium (মাসিক সম্মানী ভাতা):</span>
                      <span className="font-mono font-semibold">{formatCurrency(gross || 15000, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span>Field Food & Subsistence Stipend (মাঠপর্যায় খোরাকি ও যাতায়াত ভাতা):</span>
                      <span className="font-mono font-semibold">{formatCurrency(trv, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span>Communication Allowance (মোবাইল ও যোগাযোগ ভাতা):</span>
                      <span className="font-mono font-semibold">{formatCurrency(mob, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 text-sm">
                      <span>Total Monthly Volunteer Disbursement:</span>
                      <span className="font-mono text-indigo-700">
                        {formatCurrency((gross || 15000) + mob + trv, company.currencySymbol)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 max-w-lg mx-auto text-xs space-y-2">
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span>Basic Salary (মূল বেতন):</span>
                      <span className="font-mono font-semibold">{formatCurrency(basic, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span>House Rent Allowance (বাড়ি ভাড়া):</span>
                      <span className="font-mono font-semibold">{formatCurrency(house, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span>Medical Allowance (চিকিৎসা ভাতা):</span>
                      <span className="font-mono font-semibold">{formatCurrency(med, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span>Conveyance Allowance (যাতায়াত ভাতা):</span>
                      <span className="font-mono font-semibold">{formatCurrency(conv, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span>Mobile Phone Allowance (মোবাইল ভাতা):</span>
                      <span className="font-mono font-semibold">{formatCurrency(mob, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span>Travel / Field Mission Allowance (ভ্রমণ ভাতা):</span>
                      <span className="font-mono font-semibold">{formatCurrency(trv, company.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 text-sm">
                      <span>Total Monthly Gross Remuneration:</span>
                      <span className="font-mono text-indigo-700">
                        {formatCurrency(totalGross, company.currencySymbol)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= 4. BANK ACCOUNT OPENING ================= */}
            {selectedType === 'bank_account_opening' && (
              <div className="space-y-4">
                <div className="text-xs space-y-1 mb-4">
                  <p><strong>To:</strong></p>
                  <p className="font-bold text-slate-900">{addressedToBank}</p>
                </div>

                <h2 className="text-center text-base font-bold uppercase tracking-wider underline text-slate-900">
                  RECOMMENDATION FOR SALARY ACCOUNT OPENING
                </h2>

                <p className="text-slate-800 indent-8">
                  We are pleased to introduce our staff member, <strong>{emp?.fullName}</strong>, serving as <strong>{emp?.designation}</strong> in <strong>{company.name}</strong>.
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 my-3">
                  <p><strong>Employee Full Name:</strong> {emp?.fullName}</p>
                  <p><strong>National ID No:</strong> {emp?.nidOrPassport}</p>
                  <p><strong>Present Address:</strong> {emp?.presentAddress}</p>
                  <p><strong>Official Contact Phone:</strong> {emp?.phone}</p>
                </div>

                <p className="text-slate-800">
                  Please open an official individual salary savings account for {emp?.gender === 'Female' ? 'her' : 'him'} to facilitate electronic fund transfers and monthly NGO grant payroll disbursements.
                </p>
              </div>
            )}

            {/* ================= 5. TRAVEL AUTHORIZATION ================= */}
            {selectedType === 'travel_authorization' && (
              <div className="space-y-4">
                <h2 className="text-center text-base font-bold uppercase tracking-wider underline text-slate-900">
                  OFFICIAL TRAVEL & FIELD MISSION AUTHORIZATION
                </h2>
                <p className="text-slate-800 indent-8">
                  Official authorization is hereby granted to <strong>{emp?.fullName}</strong> (Staff ID: {emp?.id}), <strong>{emp?.designation}</strong>, for conducting an authorized field visit under project <em>"{emp?.assignedProject}"</em>.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <p><strong>Primary Centers:</strong> {emp?.jobLocations?.join(', ') || emp?.workStation}</p>
                  <p><strong>Approved Transport:</strong> Inter-district Express & Local Field Transit</p>
                  <p><strong>Safeguarding Protocol:</strong> Mandatory Field Identity Card display & Emergency protocol</p>
                </div>
              </div>
            )}

            {/* ================= 6. EXIT CLEARANCE & SETTLEMENT ================= */}
            {(selectedType === 'separation_clearance' || selectedType === 'final_settlement') && (
              <div className="space-y-4">
                <h2 className="text-center text-base font-bold uppercase tracking-wider underline text-slate-900">
                  STAFF EXIT CLEARANCE & TERMINAL SETTLEMENT STATEMENT
                </h2>
                <p className="text-slate-800">
                  Staff Member <strong>{emp?.fullName}</strong> ({emp?.id}), {emp?.designation}, has completed official departmental handover. All organization assets and financial liabilities have been verified:
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs border border-slate-300 rounded-xl p-4 bg-slate-50">
                  <div>✓ Departmental files & desk assets handed over</div>
                  <div>✓ Advance salary loans cleared / deducted</div>
                  <div>✓ Official ID card, keys & equipment returned</div>
                  <div>✓ Email & cloud drive access revoked</div>
                </div>
              </div>
            )}

            {/* ================= 7. WARNING / EXPLANATION NOTICE ================= */}
            {selectedType === 'warning_letter' && (
              <div className="space-y-4">
                <h2 className="text-center text-base font-bold uppercase tracking-wider underline text-rose-700">
                  OFFICIAL ADMINISTRATIVE EXPLANATION / COUNSELING NOTICE
                </h2>
                <p className="text-slate-800">
                  To: <strong>{emp?.fullName}</strong> ({emp?.id}), <strong>{emp?.designation}</strong>
                </p>
                <p className="text-slate-800 text-justify indent-8">
                  This formal notice is issued regarding adherence to organizational office timings, timesheet submissions, and donor safeguarding compliance standards at your assigned station.
                </p>
                <p className="text-slate-800 text-justify">
                  You are requested to submit your written explanation to the HR & Administration department within three (3) working days.
                </p>
              </div>
            )}

            {/* Official Signatures Block */}
            <div className="pt-16 grid grid-cols-2 gap-8 text-xs text-slate-800 border-t border-slate-200 mt-12">
              <div>
                <div className="border-t border-slate-400 pt-1.5 w-48">
                  <p className="font-bold text-slate-900">{company.signatoryName || 'Forhad Hossain'}</p>
                  <p className="text-slate-600 text-[11px]">{company.signatoryDesignation || 'Executive Director'}</p>
                  <p className="text-slate-500 text-[10px]">{company.name}</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className="border-t border-slate-400 pt-1.5 w-48 text-center">
                  <p className="font-bold text-slate-900">{company.hrSignatoryName || 'Md. Omar Faruque'}</p>
                  <p className="text-slate-600 text-[11px]">{company.hrSignatoryDesignation || 'Manager HR & Admin'}</p>
                  <p className="text-slate-500 text-[10px]">HR & Compliance Division</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center italic pt-8">
              This document is an authentic verifiable record issued under ISO & NGO Human Resource Compliance Standards. Ref: {referenceNo}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
