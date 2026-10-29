import React, { useState, useEffect } from 'react';
import { CompanyProfile, Employee, LEEDO_JOB_LOCATIONS } from '../../types/hris';
import { 
  Building2, 
  Save, 
  HardDrive, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck,
  Database,
  MapPin,
  Edit3,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  Users,
  RotateCcw
} from 'lucide-react';
import { exportAllDataAsJSON, restoreDataFromJSON } from '../../utils/storage';
import firebaseConfig from '../../../firebase-applet-config.json';
import { JobLocationsManagerModal } from './JobLocationsManagerModal';

interface CompanySettingsProps {
  company: CompanyProfile;
  onUpdateCompany: (company: CompanyProfile) => void;
  onResetData: () => void;
  jobLocations?: string[];
  employees?: Employee[];
  onUpdateJobLocations?: (newLocations: string[], oldName?: string, newName?: string) => void;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({
  company,
  onUpdateCompany,
  onResetData,
  jobLocations = [...LEEDO_JOB_LOCATIONS],
  employees = [],
  onUpdateJobLocations,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(company);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Sync formData whenever company prop changes
  useEffect(() => {
    setFormData(company);
  }, [company]);

  // Job location management local states
  const [newLocationInput, setNewLocationInput] = useState('');
  const [editingLocIndex, setEditingLocIndex] = useState<number | null>(null);
  const [editingLocValue, setEditingLocValue] = useState('');
  const [locFeedback, setLocFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Count employees assigned to each location
  const getLocationStaffCount = (loc: string) => {
    return employees.filter((e) => 
      e.workStation === loc || (e.jobLocations && e.jobLocations.includes(loc as any))
    ).length;
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setLocFeedback(null);
    const trimmed = newLocationInput.trim();
    if (!trimmed) {
      setLocFeedback({ type: 'error', msg: 'Please enter a valid job location name.' });
      return;
    }
    if (jobLocations.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setLocFeedback({ type: 'error', msg: `A job location named "${trimmed}" already exists.` });
      return;
    }
    const updated = [...jobLocations, trimmed];
    onUpdateJobLocations?.(updated);
    setNewLocationInput('');
    setLocFeedback({ type: 'success', msg: `Successfully added "${trimmed}" to official job locations!` });
    setTimeout(() => setLocFeedback(null), 3500);
  };

  const startEditingLoc = (idx: number, name: string) => {
    setEditingLocIndex(idx);
    setEditingLocValue(name);
    setLocFeedback(null);
  };

  const cancelEditingLoc = () => {
    setEditingLocIndex(null);
    setEditingLocValue('');
    setLocFeedback(null);
  };

  const handleSaveRenameLoc = (idx: number, oldName: string) => {
    setLocFeedback(null);
    const trimmed = editingLocValue.trim();
    if (!trimmed) {
      setLocFeedback({ type: 'error', msg: 'Location name cannot be empty.' });
      return;
    }
    if (trimmed.toLowerCase() !== oldName.toLowerCase() && jobLocations.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setLocFeedback({ type: 'error', msg: `Another location named "${trimmed}" already exists.` });
      return;
    }
    if (trimmed === oldName) {
      cancelEditingLoc();
      return;
    }
    const updated = [...jobLocations];
    updated[idx] = trimmed;
    const affectedStaffCount = getLocationStaffCount(oldName);
    onUpdateJobLocations?.(updated, oldName, trimmed);
    cancelEditingLoc();
    setLocFeedback({
      type: 'success',
      msg: `Renamed "${oldName}" to "${trimmed}". ${affectedStaffCount > 0 ? `Updated ${affectedStaffCount} assigned staff records.` : ''}`
    });
    setTimeout(() => setLocFeedback(null), 4000);
  };

  const handleDeleteLoc = (nameToDelete: string) => {
    setLocFeedback(null);
    const assignedCount = getLocationStaffCount(nameToDelete);
    if (assignedCount > 0) {
      if (!confirm(`Warning: ${assignedCount} staff member(s) are currently stationed at "${nameToDelete}". Are you sure you want to delete this job location?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to remove "${nameToDelete}" from job locations?`)) {
        return;
      }
    }
    const updated = jobLocations.filter((l) => l !== nameToDelete);
    onUpdateJobLocations?.(updated);
    setLocFeedback({ type: 'success', msg: `Location "${nameToDelete}" has been removed.` });
    setTimeout(() => setLocFeedback(null), 3000);
  };

  const handleResetLocDefaults = () => {
    if (confirm('Reset official job locations back to standard LEEDO 13 master centers?')) {
      onUpdateJobLocations?.([...LEEDO_JOB_LOCATIONS]);
      setLocFeedback({ type: 'success', msg: 'Job locations reset to LEEDO master defaults.' });
      setTimeout(() => setLocFeedback(null), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportBackup = () => {
    const json = exportAllDataAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ProHRIS_Cloud_Master_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = restoreDataFromJSON(content);
      if (success) {
        setImportStatus('Backup restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportStatus('Failed to restore backup: Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Organization Profile & Cloud Infrastructure Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure legal entity letterhead, executive signatories, currency, and long-term cloud database backup
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Organization settings updated successfully!</span>
        </div>
      )}

      {/* Cloud Database Status Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Firebase Firestore Enterprise Cloud Storage</h3>
              <p className="text-xs text-slate-400">Persistent Master Storage Vault (Guaranteed 5–10+ Years Retention)</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            Connected & Encrypted
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-500 block uppercase">Project ID:</span>
            <span className="text-indigo-300 truncate block">{firebaseConfig.projectId}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-500 block uppercase">Database Instance:</span>
            <span className="text-indigo-300 truncate block">{firebaseConfig.firestoreDatabaseId}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] text-slate-500 block uppercase">Auth Domain:</span>
            <span className="text-indigo-300 truncate block">{firebaseConfig.authDomain}</span>
          </div>
        </div>
      </div>

      {/* Organization Logo & Branding Settings (HR Admin Only) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Organization Logo & Letterhead Branding</h3>
            <p className="text-slate-500 text-[11px]">This logo appears on the Header, Login Screen, Payslips, and Official Letters</p>
          </div>
          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
            HR Admin Control
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Logo Preview Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[140px] text-center">
            <img
              src={formData.logoUrl || '/leedo-logo.svg'}
              alt={formData.name}
              className="max-h-20 max-w-[180px] object-contain drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/leedo-logo.svg';
              }}
            />
            <span className="text-[10px] text-slate-400 mt-2">Active Logo Preview</span>
          </div>

          {/* Upload and URL Controls */}
          <div className="sm:col-span-2 space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Upload New Logo Image (File)</label>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold rounded-xl border border-indigo-200 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Choose Logo File (PNG, JPG, SVG)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const res = event.target?.result as string;
                        if (res) {
                          setFormData({ ...formData, logoUrl: res });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-slate-400 ml-2">Vector SVG or High-Res PNG recommended</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Or Logo Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://.../logo.png or /leedo-logo.svg"
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="flex-1 p-2 border border-slate-300 rounded-xl font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: '/leedo-logo.svg' })}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer text-xs transition-colors shrink-0"
                  title="Reset to official LEEDO vector logo"
                >
                  Reset to LEEDO Logo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LEEDO Job Locations & Center Management (HR Admin Control) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <MapPin className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Job Locations & Center Management (কর্মস্থল ও সেন্টার ব্যবস্থাপনা)
              </h3>
              <p className="text-slate-500 text-[11px]">
                HR Admin can add, rename, or edit official LEEDO centers. Renaming cascades to all employee profiles and rosters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Full Manager Window</span>
            </button>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
              {jobLocations.length} Centers Active
            </span>
          </div>
        </div>

        {/* Feedback alert */}
        {locFeedback && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 ${
              locFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {locFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{locFeedback.msg}</span>
          </div>
        )}

        {/* Add New Job Location Input */}
        <form onSubmit={handleAddLocation} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <label className="block font-bold text-slate-800">
            Add New Job Location / Operational Station:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. Kadamtali Vocational Center, Mirpur Transit Shelter..."
              value={newLocationInput}
              onChange={(e) => setNewLocationInput(e.target.value)}
              className="flex-1 p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Location</span>
            </button>
          </div>
        </form>

        {/* Locations List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs">
              Official Job Locations List ({jobLocations.length})
            </span>
            <button
              type="button"
              onClick={handleResetLocDefaults}
              className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer font-medium"
              title="Reset locations to LEEDO defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {jobLocations.map((loc, idx) => {
              const isEditing = editingLocIndex === idx;
              const staffCount = getLocationStaffCount(loc);

              return (
                <div
                  key={`${loc}-${idx}`}
                  className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingLocValue}
                        onChange={(e) => setEditingLocValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRenameLoc(idx, loc);
                          if (e.key === 'Escape') cancelEditingLoc();
                        }}
                        autoFocus
                        className="flex-1 p-2 text-xs border-2 border-indigo-500 rounded-xl bg-white focus:outline-hidden font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRenameLoc(idx, loc)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer shadow-xs text-xs"
                        title="Save renamed location"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingLoc}
                        className="px-2.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span>{loc}</span>
                            {loc === 'Kadamtali Vocational Center' && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.2 rounded-full font-semibold">
                                Vocational
                              </span>
                            )}
                          </p>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{staffCount} active staff member(s) stationed</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => startEditingLoc(idx, loc)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Rename / Edit this Job Location"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Rename</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteLoc(loc)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete this location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal for full management */}
      <JobLocationsManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobLocations={jobLocations}
        employees={employees}
        onUpdateJobLocations={(updated, oldName, newName) => {
          onUpdateJobLocations?.(updated, oldName, newName);
        }}
      />

      {/* Organization Details Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          Official Organization Details (Printed on Letters & Payslips)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-semibold mb-1">Organization Legal Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Organization Category</label>
            <select
              value={formData.organizationType}
              onChange={(e) => setFormData({ ...formData, organizationType: e.target.value as any })}
              className="w-full p-2 border border-slate-300 rounded-xl bg-white"
            >
              <option value="Non-Governmental Organization (NGO)">Non-Governmental Organization (NGO)</option>
              <option value="Development Trust">Development Trust</option>
              <option value="Private Limited">Private Limited Company</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Govt NGO Registration No. *</label>
            <input
              type="text"
              required
              value={formData.registrationNo}
              onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tax Identification Number (TIN)</label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Currency Code & Symbol</label>
            <select
              value={formData.currency}
              onChange={(e) => {
                const cur = e.target.value as any;
                setFormData({
                  ...formData,
                  currency: cur,
                  currencySymbol: cur === 'BDT (৳)' ? '৳' : '$',
                });
              }}
              className="w-full p-2 border border-slate-300 rounded-xl bg-white font-semibold"
            >
              <option value="BDT (৳)">Bangladeshi Taka (BDT ৳)</option>
              <option value="USD ($)">US Dollars (USD $)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-semibold mb-1">Head Office Postal Address *</label>
            <input
              type="text"
              required
              value={formData.headOfficeAddress}
              onChange={(e) => setFormData({ ...formData, headOfficeAddress: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Official Contact Email *</label>
            <input
              type="email"
              required
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Phone / Emergency Hotline</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Authorized Executive Signatory *</label>
            <input
              type="text"
              required
              value={formData.signatoryName}
              onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Executive Title / Designation *</label>
            <input
              type="text"
              required
              value={formData.signatoryDesignation}
              onChange={(e) => setFormData({ ...formData, signatoryDesignation: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Authorized HR & Admin Signatory</label>
            <input
              type="text"
              placeholder="e.g. Md. Omar Faruque"
              value={formData.hrSignatoryName || ''}
              onChange={(e) => setFormData({ ...formData, hrSignatoryName: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">HR Signatory Title / Designation</label>
            <input
              type="text"
              placeholder="e.g. Manager HR & Admin"
              value={formData.hrSignatoryDesignation || ''}
              onChange={(e) => setFormData({ ...formData, hrSignatoryDesignation: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Organization Settings</span>
          </button>
        </div>
      </form>

      {/* Backup and Restore Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          Manual Data Vault & Emergency Disaster Recovery
        </h3>
        <p className="text-slate-600">
          Download an encrypted snapshot of the entire HRIS database (all employees, attendance, payroll, leaves, separations, and appraisals) or restore from an existing file.
        </p>

        {importStatus && (
          <p className="p-2.5 rounded-lg bg-indigo-50 text-indigo-800 font-medium">
            {importStatus}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Database Backup (JSON)</span>
          </button>

          <label className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl border border-slate-300 flex items-center gap-2 cursor-pointer shadow-xs">
            <Upload className="w-4 h-4" />
            <span>Restore Backup JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all data to default mock records?')) {
                onResetData();
              }
            }}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl border border-rose-200 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Sample Dataset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
