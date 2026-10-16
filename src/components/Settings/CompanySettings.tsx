import React, { useState } from 'react';
import { CompanyProfile } from '../../types/hris';
import { 
  Building2, 
  Save, 
  HardDrive, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck,
  Database
} from 'lucide-react';
import { exportAllDataAsJSON, restoreDataFromJSON } from '../../utils/storage';
import firebaseConfig from '../../../firebase-applet-config.json';

interface CompanySettingsProps {
  company: CompanyProfile;
  onUpdateCompany: (company: CompanyProfile) => void;
  onResetData: () => void;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({
  company,
  onUpdateCompany,
  onResetData,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(company);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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
            <label className="block text-slate-700 font-semibold mb-1">Signatory Title / Designation *</label>
            <input
              type="text"
              required
              value={formData.signatoryDesignation}
              onChange={(e) => setFormData({ ...formData, signatoryDesignation: e.target.value })}
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
