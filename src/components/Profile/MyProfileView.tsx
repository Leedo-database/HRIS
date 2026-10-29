import React, { useState, useRef } from 'react';
import { Employee, CompanyProfile, Gender } from '../../types/hris';
import { 
  User, 
  Camera, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Building2, 
  CreditCard, 
  HeartHandshake, 
  Check, 
  Save, 
  Clock, 
  Award,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

interface MyProfileViewProps {
  currentUser: Employee;
  company: CompanyProfile;
  onUpdateProfile: (updated: Employee) => void;
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  currentUser,
  company,
  onUpdateProfile,
}) => {
  const [formData, setFormData] = useState<Employee>(currentUser);
  const [activeTab, setActiveTab] = useState<'personal' | 'emergency' | 'job'>('personal');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updated = { ...formData, avatar: result };
        setFormData(updated);
        onUpdateProfile(updated);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            My Personnel Profile & Self-Service Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View your master profile, update personal contact details, emergency information, and change profile photo
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile & Photo saved successfully!</span>
          </div>
        )}
      </div>

      {/* Main Profile Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Staff ID: {formData.id}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              {formData.employmentType || 'Permanent'} Staff
            </span>
          </div>
        </div>

        {/* Profile Header Bar */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Avatar with Photo Change Button */}
            <div className="relative group shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <img
                src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.id}`}
                alt={formData.fullName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white shadow-xl bg-slate-100"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-xs font-semibold gap-1"
                title="Click to change profile photo"
              >
                <Camera className="w-5 h-5 text-indigo-300" />
                <span>Change Photo</span>
              </button>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 text-white rounded-xl shadow-md border-2 border-white cursor-pointer hover:bg-indigo-700 transition-colors"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Name & Title */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {formData.fullName}
              </h1>
              {formData.banglaName && (
                <p className="text-sm font-bangla text-slate-500 font-medium">{formData.banglaName}</p>
              )}
              <p className="text-xs font-semibold text-indigo-600">
                {formData.designation} • {formData.department}
              </p>
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Station: {formData.workStation || 'Head Office'} ({formData.assignedProject || 'LEEDO NGO Project'})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload New Picture</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-slate-100 px-6 sm:px-8 flex items-center gap-6 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'personal'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Information</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emergency')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'emergency'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Emergency Contact</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('job')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'job'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Job, Salary & NGO Compliance</span>
          </button>
        </div>
      </div>

      {/* Tab Contents Form */}
      <form onSubmit={handleSaveSubmit} className="space-y-6">
        {activeTab === 'personal' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Personal Contact & Identity Details</h3>
                <p className="text-slate-500 text-[11px]">Keep your mobile number, personal email, and addresses up to date</p>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Staff Editable
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name (English)</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bangla Name (বাংলা নাম)</label>
                <input
                  type="text"
                  placeholder="যেমন: মোঃ জসীম উদ্দিন"
                  value={formData.banglaName || ''}
                  onChange={(e) => setFormData({ ...formData, banglaName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bangla focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Personal Email Address</label>
                <input
                  type="email"
                  placeholder="personal@gmail.com"
                  value={formData.personalEmail || ''}
                  onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Official {company.name} Email (Locked)</label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup || 'A+'}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Date of Birth</label>
                <input
                  type="text"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">National ID (NID) / Passport</label>
                <input
                  type="text"
                  value={formData.nidOrPassport}
                  onChange={(e) => setFormData({ ...formData, nidOrPassport: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1">Present Residential Address *</label>
                <input
                  type="text"
                  required
                  value={formData.presentAddress}
                  onChange={(e) => setFormData({ ...formData, presentAddress: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1">Permanent Home Village / Town Address *</label>
                <input
                  type="text"
                  required
                  value={formData.permanentAddress}
                  onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Emergency Next-of-Kin Contact</h3>
                <p className="text-slate-500 text-[11px]">Critical for NGO field missions, travel, and medical emergencies</p>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Staff Editable
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Emergency Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={formData.emergencyContact?.name || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: {
                      ...(formData.emergencyContact || { relation: '', phone: '', address: '' }),
                      name: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Relationship with Staff *</label>
                <input
                  type="text"
                  required
                  placeholder="Spouse, Father, Mother, Brother, Sister, Guardian"
                  value={formData.emergencyContact?.relation || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: {
                      ...(formData.emergencyContact || { name: '', phone: '', address: '' }),
                      relation: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Emergency Primary Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.emergencyContact?.phone || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: {
                      ...(formData.emergencyContact || { name: '', relation: '', address: '' }),
                      phone: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Alternate Emergency Phone</label>
                <input
                  type="tel"
                  value={formData.emergencyContact?.alternatePhone || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: {
                      ...(formData.emergencyContact || { name: '', relation: '', phone: '', address: '' }),
                      alternatePhone: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Emergency Contact Full Address *</label>
                <input
                  type="text"
                  required
                  value={formData.emergencyContact?.address || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: {
                      ...(formData.emergencyContact || { name: '', relation: '', phone: '' }),
                      address: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'job' && (
          <div className="space-y-6">
            {/* Employment Record */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Official Employment & Assignment Record</span>
                <span className="text-[11px] font-normal text-slate-400">Maintained by HR Department</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Designation</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{formData.designation}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Department</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{formData.department}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Grade Level</span>
                  <span className="font-bold text-indigo-600 mt-0.5 block">{formData.gradeLevel || 'Standard'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Joining Date</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{formData.joiningDate}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Work Station</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{formData.workStation || 'Head Office'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Assigned Project / Program</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{formData.assignedProject || 'General / Core Programs'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Employment Status</span>
                  <span className="font-bold text-emerald-600 mt-0.5 block">{formData.status}</span>
                </div>
              </div>
            </div>

            {/* Salary Breakdown & Bank Details */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Personal Salary Structure & Bank Advice</span>
                <span className="text-[11px] font-semibold text-indigo-600">Private & Confidential</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] text-indigo-600 font-semibold block uppercase">Gross Monthly Salary</span>
                  <span className="text-base font-bold text-indigo-950 mt-0.5 block">{formatCurrency(formData.grossSalary)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Basic Salary (50%)</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{formatCurrency(formData.basicSalary)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">House Rent (25%)</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{formatCurrency(formData.houseRent)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Medical Allowance</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{formatCurrency(formData.medicalAllowance)}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-800">Bank Account Information:</span>
                  <p className="text-slate-600 font-mono mt-0.5">
                    {formData.bankDetails?.bankName || 'Brac Bank PLC'} • A/C: {formData.bankDetails?.accountNumber || 'N/A'} • Branch: {formData.bankDetails?.branchName || 'Uttara'}
                  </p>
                </div>
                {formData.bankDetails?.mobileBankingType && (
                  <span className="px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 font-semibold">
                    {formData.bankDetails.mobileBankingType}: {formData.bankDetails.mobileBankingNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Safeguarding & NGO Compliance Badges */}
            <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-200/80 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>{company.name} Safeguarding & Regulatory Compliance</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700 font-medium">Child Safeguarding Certified</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700 font-medium">Code of Conduct Signed</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700 font-medium">Police Clearance Verified</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700 font-medium">Non-Disclosure Agreement</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Bar */}
        {(activeTab === 'personal' || activeTab === 'emergency') && (
          <div className="sticky bottom-4 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Changes will update your master employee personnel record across all portals
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
