import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  RefreshCw, 
  Check, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  Link as LinkIcon 
} from 'lucide-react';

interface LogoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string;
  onSaveLogo: (newLogoUrl: string) => void;
  organizationName: string;
}

export const LogoEditorModal: React.FC<LogoEditorModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  onSaveLogo,
  organizationName,
}) => {
  const [logoPreview, setLogoPreview] = useState<string>(currentLogoUrl || '/leedo-logo.svg');
  const [urlInput, setUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setLogoPreview(urlInput.trim());
    }
  };

  const handleResetToDefault = () => {
    setLogoPreview('/leedo-logo.svg');
    setUrlInput('');
  };

  const handleSave = () => {
    onSaveLogo(logoPreview);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Organization Logo & Branding</h3>
              <p className="text-xs text-slate-300">HR Admin Logo Customizer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Logo updated successfully! Applied across all letters, payslips, and header.</span>
            </div>
          )}

          {/* Live Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-600" />
                Live Logo Preview
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewTheme('light')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                    previewTheme === 'light' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  Light BG
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('dark')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                    previewTheme === 'dark' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Dark BG
                </button>
              </div>
            </div>

            <div
              className={`h-36 rounded-2xl border flex items-center justify-center p-4 transition-colors relative overflow-hidden ${
                previewTheme === 'light'
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <img
                src={logoPreview}
                alt={organizationName}
                className="max-h-24 max-w-[240px] object-contain drop-shadow-sm"
                onError={() => {
                  setLogoPreview('/leedo-logo.svg');
                }}
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">
                Official Letterhead & Portal Header Format
              </span>
            </div>
          </div>

          {/* Upload Method Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 font-semibold text-center border-b-2 cursor-pointer transition-colors ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Upload Device Image
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 font-semibold text-center border-b-2 cursor-pointer transition-colors ${
                activeTab === 'url'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Image URL Link
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all rounded-2xl p-6 text-center cursor-pointer space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Click to upload new logo image</p>
                  <p className="text-[11px] text-slate-400">PNG, SVG, JPG, or WebP (Transparent background recommended)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Direct Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.org/logo.png"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 p-2 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer py-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to LEEDO Official Vector Logo</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer flex items-center gap-1.5 text-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply Logo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
