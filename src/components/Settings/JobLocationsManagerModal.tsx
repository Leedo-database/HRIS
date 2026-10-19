import React, { useState } from 'react';
import { Employee } from '../../types/hris';
import { 
  X, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  AlertCircle, 
  Building, 
  Users, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { LEEDO_JOB_LOCATIONS } from '../../types/hris';

interface JobLocationsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobLocations: string[];
  employees: Employee[];
  onUpdateJobLocations: (newLocations: string[], oldName?: string, newName?: string) => void;
}

export const JobLocationsManagerModal: React.FC<JobLocationsManagerModalProps> = ({
  isOpen,
  onClose,
  jobLocations,
  employees,
  onUpdateJobLocations,
}) => {
  const [newLocationName, setNewLocationName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Count employees assigned to each location
  const getLocationStaffCount = (loc: string) => {
    return employees.filter((e) => 
      e.workStation === loc || (e.jobLocations && e.jobLocations.includes(loc as any))
    ).length;
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = newLocationName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a valid job location name.');
      return;
    }

    if (jobLocations.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`A job location named "${trimmed}" already exists.`);
      return;
    }

    const updated = [...jobLocations, trimmed];
    onUpdateJobLocations(updated);
    setNewLocationName('');
    setSuccessMsg(`Successfully added "${trimmed}" to official job locations!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const startEditing = (idx: number, currentName: string) => {
    setEditingIndex(idx);
    setEditingValue(currentName);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingValue('');
    setErrorMsg(null);
  };

  const handleSaveRename = (idx: number, oldName: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = editingValue.trim();
    if (!trimmed) {
      setErrorMsg('Location name cannot be empty.');
      return;
    }

    if (trimmed.toLowerCase() !== oldName.toLowerCase() && 
        jobLocations.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Another location named "${trimmed}" already exists.`);
      return;
    }

    if (trimmed === oldName) {
      cancelEditing();
      return;
    }

    const updated = [...jobLocations];
    updated[idx] = trimmed;

    const affectedStaffCount = getLocationStaffCount(oldName);
    onUpdateJobLocations(updated, oldName, trimmed);

    cancelEditing();
    setSuccessMsg(
      `Renamed "${oldName}" to "${trimmed}". ${
        affectedStaffCount > 0 
          ? `Updated ${affectedStaffCount} assigned staff records.` 
          : ''
      }`
    );
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDeleteLocation = (nameToDelete: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

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
    onUpdateJobLocations(updated);
    setSuccessMsg(`Location "${nameToDelete}" has been removed.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset official job locations back to standard LEEDO 13 master centers?')) {
      onUpdateJobLocations([...LEEDO_JOB_LOCATIONS]);
      setSuccessMsg('Job locations reset to LEEDO master defaults.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <MapPin className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Job Locations & Center Management (কর্মস্থল ও সেন্টার ব্যবস্থাপনা)
              </h3>
              <p className="text-xs text-indigo-200/80">
                HR Admin Control: Rename, add or update LEEDO centers and operational stations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto text-xs">
          {/* Notification Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Notice */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-2.5">
            <Building className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-indigo-950">
              <p className="font-bold">Automated Synchronization Rule:</p>
              <p className="text-indigo-800 leading-relaxed">
                When you edit or rename any job location, the system automatically updates all active staff records, duty assignments, attendance punch stations, and timesheet rosters to reflect the updated name.
              </p>
            </div>
          </div>

          {/* Add New Location Form */}
          <form onSubmit={handleAddLocation} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <label className="block font-bold text-slate-800">Add New Job Location / Operational Station:</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g. Kadamtali Vocational Center, Mirpur Transit Shelter..."
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="flex-1 p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Center</span>
              </button>
            </div>
          </form>

          {/* Existing Job Locations List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">
                Configured Job Locations ({jobLocations.length})
              </span>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer font-medium"
                title="Reset locations to LEEDO defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {jobLocations.map((loc, idx) => {
                const isEditing = editingIndex === idx;
                const staffCount = getLocationStaffCount(loc);

                return (
                  <div
                    key={`${loc}-${idx}`}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(idx, loc);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          autoFocus
                          className="flex-1 p-2 text-xs border-2 border-indigo-500 rounded-xl bg-white focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(idx, loc)}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Save new name"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="px-2.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer"
                          title="Cancel editing"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              <span>{loc}</span>
                            </p>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{staffCount} staff member(s) stationed</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditing(idx, loc)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit / Rename this Job Location"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Rename</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLocation(loc)}
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

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
