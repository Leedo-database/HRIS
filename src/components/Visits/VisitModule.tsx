import React, { useState } from 'react';
import { Employee, VisitAuthorization, CompanyProfile, UserRole } from '../../types/hris';
import { 
  Compass, 
  Plus, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  UserCheck, 
  FileText, 
  Printer, 
  X,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

interface VisitModuleProps {
  visits: VisitAuthorization[];
  employees: Employee[];
  company: CompanyProfile;
  currentUser: Employee;
  currentRole: UserRole;
  onAddVisit: (visit: VisitAuthorization) => void;
  onUpdateVisit: (visit: VisitAuthorization) => void;
}

export const VisitModule: React.FC<VisitModuleProps> = ({
  visits,
  employees,
  company,
  currentUser,
  currentRole,
  onAddVisit,
  onUpdateVisit,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState('2026-10-20');
  const [endDate, setEndDate] = useState('2026-10-22');
  const [transportMode, setTransportMode] = useState('Bus & Local Transit');
  const [assignedProject, setAssignedProject] = useState('Child Protection & Street Hub');
  const [estimatedExpense, setEstimatedExpense] = useState(6500);

  const [activePrintVisit, setActivePrintVisit] = useState<VisitAuthorization | null>(null);

  // Subordinate employees who report to this supervisor
  const subordinateIds = new Set(
    employees
      .filter((e) => 
        e.id !== currentUser.id && (
          e.reportingManagerId === currentUser.id || 
          (e.reportingManagerName && (e.reportingManagerName === currentUser.fullName || e.reportingManagerName.includes(currentUser.fullName)))
        )
      )
      .map((e) => e.id)
  );

  // Scoped display based on role
  const displayVisits = currentRole === 'employee'
    ? visits.filter((v) => v.employeeId === currentUser.id)
    : currentRole === 'line_manager'
    ? visits.filter((v) => v.employeeId === currentUser.id || subordinateIds.has(v.employeeId))
    : visits;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !purpose) return;

    const newVisit: VisitAuthorization = {
      id: `VISIT-2026-${Date.now().toString().slice(-4)}`,
      employeeId: currentUser.id,
      employeeName: currentUser.fullName,
      department: currentUser.department,
      destination,
      purpose,
      startDate,
      endDate,
      assignedProject,
      modeOfTransport: transportMode,
      estimatedExpense,
      supervisorRecommendation: 'Pending',
      supervisorRemarks: 'Submitted for supervisor review',
      status: 'Pending',
      appliedDate: '2026-10-14',
    };

    onAddVisit(newVisit);
    setIsApplying(false);
    setDestination('');
    setPurpose('');
  };

  const handleRecommend = (v: VisitAuthorization, recommendation: 'Recommended' | 'Not Recommended') => {
    onUpdateVisit({
      ...v,
      supervisorRecommendation: recommendation,
      supervisorName: currentUser.fullName,
      supervisorRemarks: recommendation === 'Recommended'
        ? `Recommended by Line Manager ${currentUser.fullName} on ${new Date().toISOString().split('T')[0]}`
        : `Not recommended due to station staffing coverage needs.`,
    });
  };

  const handleFinalApprove = (v: VisitAuthorization) => {
    onUpdateVisit({
      ...v,
      status: 'Approved',
      approvedBy: currentUser.fullName,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            Official Field Visits & Travel Authorization
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit field mission requests with multi-tier supervisor recommendation and administrative approval
          </p>
        </div>

        <button
          onClick={() => setIsApplying(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Apply For Field Visit</span>
        </button>
      </div>

      {/* Application Drawer */}
      {isApplying && (
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Official Travel Authorization Form</h3>
              <p className="text-xs text-slate-500">Applicant: {currentUser.fullName} ({currentUser.id})</p>
            </div>
            <button onClick={() => setIsApplying(false)} className="text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
          </div>

          <form onSubmit={handleApply} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Destination & Field Outposts *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cox's Bazar Field Station & Ukhiya Camp Outreach"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Assigned NGO Project</label>
                <input
                  type="text"
                  value={assignedProject}
                  onChange={(e) => setAssignedProject(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Departure Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Return Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Mode of Transport</label>
                <input
                  type="text"
                  placeholder="e.g. AC Bus / Express Train / Project Vehicle"
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Estimated Travel & Per Diem (BDT)</label>
                <input
                  type="number"
                  value={estimatedExpense}
                  onChange={(e) => setEstimatedExpense(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Specific Mission Purpose & Activities *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detail the objectives of the visit, community sessions, and key deliverables..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApplying(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Submit Authorization Request</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visits List */}
      <div className="space-y-3">
        {displayVisits.map((visit) => (
          <div
            key={visit.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
          >
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{visit.employeeName}</span>
                <span className="font-mono text-slate-400">({visit.employeeId})</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    visit.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {visit.status}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    visit.supervisorRecommendation === 'Recommended'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Supervisor: {visit.supervisorRecommendation || 'Pending'}
                </span>
              </div>

              <p className="font-semibold text-indigo-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Destination: {visit.destination} • Project: {visit.assignedProject}
              </p>

              <p className="text-slate-600 text-[11px] leading-relaxed">
                {visit.purpose}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                <span>Dates: <strong>{visit.startDate}</strong> to <strong>{visit.endDate}</strong></span>
                <span>•</span>
                <span>Transit: {visit.modeOfTransport}</span>
                <span>•</span>
                <span>Budget: <strong>{formatCurrency(visit.estimatedExpense, company.currencySymbol)}</strong></span>
              </div>

              {visit.supervisorRemarks && (
                <p className="text-[10px] text-slate-400 italic bg-slate-50 p-1.5 rounded">
                  {visit.supervisorRemarks}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActivePrintVisit(visit)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Form</span>
              </button>

              {/* Supervisor Approval & Recommendation Controls for Subordinates */}
              {currentRole === 'line_manager' && subordinateIds.has(visit.employeeId) && visit.status === 'Pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleFinalApprove(visit)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Visit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRecommend(visit, 'Not Recommended')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs border border-rose-200 cursor-pointer"
                  >
                    Decline
                  </button>
                </>
              )}

              {/* HR Admin Final Approval */}
              {currentRole === 'hr_admin' && visit.status === 'Pending' && (
                <button
                  type="button"
                  onClick={() => handleFinalApprove(visit)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Final Approval</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Printable Travel Authorization Modal */}
      {activePrintVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden printable-document-container">
            <div className="no-print bg-slate-900 p-4 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Official Field Visit Authorization</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="allow-print px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button onClick={() => setActivePrintVisit(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-slate-900 text-xs bg-white">
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <img
                    src={company.logoUrl || '/leedo-logo.svg'}
                    alt={company.name}
                    className="h-12 w-auto object-contain max-w-[150px]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/leedo-logo.svg';
                    }}
                  />
                </div>
                <h1 className="text-xl font-bold uppercase tracking-wide">{company.name}</h1>
                <p className="text-xs text-slate-600 mt-1">{company.headOfficeAddress}</p>
                <div className="mt-3 inline-block bg-slate-100 px-4 py-1 rounded-full font-bold uppercase text-xs">
                  Official Travel Authorization & Field Movement Order
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="space-y-1">
                  <p><span className="text-slate-500">Applicant:</span> <strong>{activePrintVisit.employeeName}</strong></p>
                  <p><span className="text-slate-500">Staff ID:</span> <strong className="font-mono">{activePrintVisit.employeeId}</strong></p>
                  <p><span className="text-slate-500">Department:</span> <strong>{activePrintVisit.department}</strong></p>
                </div>
                <div className="space-y-1">
                  <p><span className="text-slate-500">Destination:</span> <strong>{activePrintVisit.destination}</strong></p>
                  <p><span className="text-slate-500">Project Charge:</span> <strong>{activePrintVisit.assignedProject}</strong></p>
                  <p><span className="text-slate-500">Duration:</span> <strong>{activePrintVisit.startDate} to {activePrintVisit.endDate}</strong></p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Approved Objectives & Route:</span>
                <p className="text-slate-800 leading-relaxed">{activePrintVisit.purpose}</p>
                <p className="mt-2 text-slate-600">Mode of Transport: <strong>{activePrintVisit.modeOfTransport}</strong> • Approved Budget: <strong>{formatCurrency(activePrintVisit.estimatedExpense, company.currencySymbol)}</strong></p>
              </div>

              <div className="pt-12 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-700 border-t border-slate-300 mt-8">
                <div>
                  <div className="border-t border-slate-400 pt-1">Applicant Signature</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1">Line Supervisor Recommendation</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1">Director / HR Approval</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
