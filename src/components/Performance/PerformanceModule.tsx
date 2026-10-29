import React, { useState } from 'react';
import { Employee, PerformanceAppraisal, UserRole } from '../../types/hris';
import { 
  Award, 
  Plus, 
  Star, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle, 
  UserCheck, 
  Sparkles,
  FileText,
  Target,
  Edit3,
  Calendar,
  User,
  ShieldCheck,
  ChevronRight,
  X
} from 'lucide-react';
import { isEmployeeActive } from '../../utils/calculations';

interface PerformanceModuleProps {
  appraisals: PerformanceAppraisal[];
  employees: Employee[];
  currentUser: Employee;
  currentRole: UserRole;
  onAddAppraisal: (appraisal: PerformanceAppraisal) => void;
  onUpdateAppraisal: (appraisal: PerformanceAppraisal) => void;
}

interface NewTargetState {
  title: string;
  target: string;
  currentProgress: number;
  status: 'In Progress' | 'Achieved' | 'Exceeded';
  selfNotes: string;
}

export const PerformanceModule: React.FC<PerformanceModuleProps> = ({
  appraisals,
  employees,
  currentUser,
  currentRole,
  onAddAppraisal,
  onUpdateAppraisal,
}) => {
  // Determine subordinates for line_manager (supervisor)
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

  // Filter appraisals strictly according to role
  // Employee: ONLY their own appraisals
  // Supervisor: ONLY their own appraisal + appraisals of subordinates under them
  // HR Admin: All appraisals
  const visibleAppraisals = currentRole === 'employee'
    ? appraisals.filter((a) => a.employeeId === currentUser.id)
    : currentRole === 'line_manager'
    ? appraisals.filter((a) => a.employeeId === currentUser.id || subordinateIds.has(a.employeeId))
    : appraisals;

  // Form state for conducting new appraisal (Supervisor & HR)
  const [isCreating, setIsCreating] = useState(false);
  const eligibleStaff = (currentRole === 'line_manager'
    ? employees.filter((e) => subordinateIds.has(e.id))
    : employees
  ).filter(isEmployeeActive);

  const [selectedStaffId, setSelectedStaffId] = useState(eligibleStaff[0]?.id || employees[0]?.id || '');
  const [cycle, setCycle] = useState('Annual Performance Review 2026');
  
  // Scoring state (1 to 5)
  const [jobKnowledge, setJobKnowledge] = useState(4.5);
  const [workQuality, setWorkQuality] = useState(4.7);
  const [safeguarding, setSafeguarding] = useState(5.0);
  const [teamwork, setTeamwork] = useState(4.6);
  const [compliance, setCompliance] = useState(4.5);
  const [leadership, setLeadership] = useState(4.4);
  const [kpiAchievement, setKpiAchievement] = useState(90);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [recommendation, setRecommendation] = useState<any>('Contract Renewal');

  // KPI Target Management Modal States (Target Setting & Updating)
  const [activeTargetModalAppraisal, setActiveTargetModalAppraisal] = useState<PerformanceAppraisal | null>(null);
  const [editingTargetIndex, setEditingTargetIndex] = useState<number | null>(null);
  const [targetForm, setTargetForm] = useState<NewTargetState>({
    title: '',
    target: '',
    currentProgress: 50,
    status: 'In Progress',
    selfNotes: '',
  });

  // KPI Overall Progress quick update state for staff
  const [editingKpiAchievementAppraisal, setEditingKpiAchievementAppraisal] = useState<PerformanceAppraisal | null>(null);
  const [updatedKpiRate, setUpdatedKpiRate] = useState<number>(85);
  const [staffSelfComment, setStaffSelfComment] = useState<string>('');

  const overallScore = Math.round(
    ((jobKnowledge + workQuality + safeguarding + teamwork + compliance + leadership) / 6) * 10
  ) / 10;

  const handleSaveAppraisal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find((e) => e.id === selectedStaffId) || employees[0];

    const defaultTargets = [
      {
        id: `TGT-${Date.now()}-1`,
        title: 'Child Rights & Street Protection Outreach',
        target: 'Conduct scheduled daily rounds and support vulnerable street children',
        currentProgress: 85,
        status: 'In Progress' as const,
        selfNotes: 'Covered Kamalapur & Sadarghat night outreach missions successfully.',
      },
      {
        id: `TGT-${Date.now()}-2`,
        title: 'SOP & Child Safeguarding Adherence',
        target: '100% adherence to zero-tolerance child protection code of conduct',
        currentProgress: 100,
        status: 'Achieved' as const,
        selfNotes: 'Signed due diligence and attended quarterly safeguarding refresher.',
      },
    ];

    const newAppraisal: PerformanceAppraisal = {
      id: `APP-2026-${Date.now().toString().slice(-4)}`,
      employeeId: targetEmp.id,
      employeeName: targetEmp.fullName,
      designation: targetEmp.designation,
      department: targetEmp.department,
      cycle,
      reviewerId: currentUser.id,
      reviewerName: currentUser.fullName,
      reviewDate: new Date().toISOString().split('T')[0],
      jobKnowledge,
      workQuality,
      safeguardingAndEthics: safeguarding,
      teamCollaboration: teamwork,
      punctualityAndCompliance: compliance,
      leadershipAndInitiative: leadership,
      overallScore,
      kpiAchievementRate: kpiAchievement,
      strengths: strengths || 'Exemplary dedication to community beneficiaries and professional work ethics.',
      areasForImprovement: improvements || 'Continue enhancing digital M&E reporting skills.',
      supervisorRecommendations: recommendation,
      status: 'Finalized',
      kpiTargets: defaultTargets,
    };

    onAddAppraisal(newAppraisal);
    setIsCreating(false);
  };

  // Open modal to add a brand new KPI target
  const handleOpenAddTarget = (app: PerformanceAppraisal) => {
    setActiveTargetModalAppraisal(app);
    setEditingTargetIndex(null);
    setTargetForm({
      title: '',
      target: '',
      currentProgress: 30,
      status: 'In Progress',
      selfNotes: '',
    });
  };

  // Open modal to update an existing KPI target
  const handleOpenEditTarget = (app: PerformanceAppraisal, index: number) => {
    setActiveTargetModalAppraisal(app);
    setEditingTargetIndex(index);
    const existing = (app.kpiTargets || [])[index];
    if (existing) {
      setTargetForm({
        title: existing.title,
        target: existing.target,
        currentProgress: existing.currentProgress,
        status: existing.status,
        selfNotes: existing.selfNotes || '',
      });
    }
  };

  // Save or update KPI target (No delete button allowed per policy)
  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetModalAppraisal || !targetForm.title) return;

    const currentTargets = [...(activeTargetModalAppraisal.kpiTargets || [])];

    if (editingTargetIndex !== null && editingTargetIndex >= 0) {
      // Update existing
      currentTargets[editingTargetIndex] = {
        ...currentTargets[editingTargetIndex],
        title: targetForm.title,
        target: targetForm.target,
        currentProgress: targetForm.currentProgress,
        status: targetForm.status,
        selfNotes: targetForm.selfNotes,
      };
    } else {
      // Add new
      currentTargets.push({
        id: `TGT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: targetForm.title,
        target: targetForm.target,
        currentProgress: targetForm.currentProgress,
        status: targetForm.status,
        selfNotes: targetForm.selfNotes,
      });
    }

    // Auto-calculate average KPI progress if targets exist
    const avgProgress = Math.round(
      currentTargets.reduce((acc, t) => acc + t.currentProgress, 0) / currentTargets.length
    );

    const updatedAppraisal: PerformanceAppraisal = {
      ...activeTargetModalAppraisal,
      kpiTargets: currentTargets,
      kpiAchievementRate: avgProgress,
      employeeUpdatedDate: new Date().toISOString().split('T')[0],
    };

    onUpdateAppraisal(updatedAppraisal);
    setActiveTargetModalAppraisal(null);
  };

  // Save quick KPI Achievement % update by staff
  const handleSaveKpiRateUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKpiAchievementAppraisal) return;

    const updated: PerformanceAppraisal = {
      ...editingKpiAchievementAppraisal,
      kpiAchievementRate: updatedKpiRate,
      employeeComments: staffSelfComment || editingKpiAchievementAppraisal.employeeComments,
      employeeUpdatedDate: new Date().toISOString().split('T')[0],
    };

    onUpdateAppraisal(updated);
    setEditingKpiAchievementAppraisal(null);
  };

  // If regular employee has no appraisal record yet, generate a default one so they can see and manage their KPIs
  const myAppraisal = appraisals.find((a) => a.employeeId === currentUser.id);
  const effectiveAppraisals = visibleAppraisals.length > 0 
    ? visibleAppraisals 
    : (currentRole === 'employee' ? [
        {
          id: `APP-INITIAL-${currentUser.id}`,
          employeeId: currentUser.id,
          employeeName: currentUser.fullName,
          designation: currentUser.designation,
          department: currentUser.department,
          cycle: 'Performance Review 2026',
          reviewerId: currentUser.reportingManagerId || '1001',
          reviewerName: currentUser.reportingManagerName || 'Forhad Hossain (Founder & ED)',
          reviewDate: '2026-10-01',
          jobKnowledge: 4.5,
          workQuality: 4.8,
          safeguardingAndEthics: 5.0,
          teamCollaboration: 4.7,
          punctualityAndCompliance: 4.6,
          leadershipAndInitiative: 4.4,
          overallScore: 4.7,
          kpiAchievementRate: 92,
          strengths: 'Dedicated humanitarian service, proactive center coordination and full adherence to child safeguarding.',
          areasForImprovement: 'Continuous skills enhancement in digital reporting and case records.',
          supervisorRecommendations: 'Contract Renewal' as const,
          status: 'Finalized' as const,
          kpiTargets: [
            {
              id: 'TGT-DEFAULT-1',
              title: 'Field Outreach & Shelter Care Milestone',
              target: 'Execute scheduled monthly field rounds and ensure child protection care',
              currentProgress: 90,
              status: 'In Progress' as const,
              selfNotes: 'Daily tasks fulfilled with verified attendance and duty roster compliance.',
            },
            {
              id: 'TGT-DEFAULT-2',
              title: 'Donor & Project Compliance Adherence',
              target: 'Maintain 100% timely monthly timesheets and attendance logging',
              currentProgress: 100,
              status: 'Achieved' as const,
              selfNotes: 'Timesheets submitted and validated on time.',
            }
          ]
        }
      ] : []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>
              {currentRole === 'employee' 
                ? 'My Performance & KPI Target Management' 
                : currentRole === 'line_manager'
                ? 'Subordinate Performance Evaluation & KPI Tracking'
                : 'Master Performance Evaluation & Appraisal System'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'employee'
              ? 'View your competency evaluation, track KPIs, set achievable targets, and update progress'
              : 'Conduct objective appraisals, set performance targets, and recommend career advancement'}
          </p>
        </div>

        {/* Conduct New Appraisal (Only Supervisor for Subordinates & HR Admin) */}
        {currentRole !== 'employee' && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Conduct New Appraisal</span>
          </button>
        )}
      </div>

      {/* KPI Evaluation Standards Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-2">NGO & Corporate Core Competencies Matrix</h3>
        <p className="text-xs text-slate-500 mb-4">
          Each staff member is assessed on a 1.0 to 5.0 scale across 6 foundational pillars:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-800 block">1. Job Knowledge</span>
            <span className="text-[11px] text-slate-500">Technical skills & domain mastery</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-800 block">2. Work Quality</span>
            <span className="text-[11px] text-slate-500">Accuracy, diligence & deliverables</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="font-bold text-emerald-900 block">3. Safeguarding</span>
            <span className="text-[11px] text-emerald-700">Child rights, zero tolerance ethics</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-800 block">4. Collaboration</span>
            <span className="text-[11px] text-slate-500">Cross-department teamwork</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-800 block">5. Compliance</span>
            <span className="text-[11px] text-slate-500">Donor rules, SOPs & punctuality</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-800 block">6. Leadership</span>
            <span className="text-[11px] text-slate-500">Initiative & crisis management</span>
          </div>
        </div>
      </div>

      {/* New Evaluation Form (Accessible to HR and Supervisor for subordinates) */}
      {isCreating && (
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Staff Performance Evaluation Form</h3>
              <p className="text-xs text-slate-500">
                Evaluator: {currentUser.fullName} ({currentUser.designation})
                {currentRole === 'line_manager' && ' • Subordinate Staff Review'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveAppraisal} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Select Employee to Review * {currentRole === 'line_manager' && '(Your Assigned Subordinates Only)'}
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                >
                  {eligibleStaff.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} — {emp.designation} ({emp.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Evaluation Cycle</label>
                <input
                  type="text"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Sliders for Competencies */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs">Competency Ratings (Scale 1.0 to 5.0):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Job Knowledge:</span>
                    <span className="font-bold text-indigo-700">{jobKnowledge} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={jobKnowledge}
                    onChange={(e) => setJobKnowledge(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Work Quality:</span>
                    <span className="font-bold text-indigo-700">{workQuality} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={workQuality}
                    onChange={(e) => setWorkQuality(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Safeguarding & Ethics:</span>
                    <span className="font-bold text-emerald-700">{safeguarding} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={safeguarding}
                    onChange={(e) => setSafeguarding(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Teamwork & Collaboration:</span>
                    <span className="font-bold text-indigo-700">{teamwork} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={teamwork}
                    onChange={(e) => setTeamwork(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Punctuality & Compliance:</span>
                    <span className="font-bold text-indigo-700">{compliance} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={compliance}
                    onChange={(e) => setCompliance(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Leadership & Initiative:</span>
                    <span className="font-bold text-indigo-700">{leadership} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={leadership}
                    onChange={(e) => setLeadership(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Annual KPI / OKR Achievement Rate (%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={kpiAchievement}
                    onChange={(e) => setKpiAchievement(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="font-bold text-sm text-slate-900 w-12 text-right">{kpiAchievement}%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Supervisor Recommendation:</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Promotion Recommended">Promotion Recommended</option>
                  <option value="Salary Increment">Salary Increment</option>
                  <option value="Contract Renewal">Contract Renewal</option>
                  <option value="Training Required">Training Required</option>
                  <option value="Performance Improvement Plan">Performance Improvement Plan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Major Strengths Demonstrated:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Exceptional community mobilization, timely deliverables..."
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Areas for Professional Growth:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Enhance English grant proposal writing, advanced excel..."
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Finalize & Record Evaluation</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appraisals & KPI Target Management Feed */}
      <div className="space-y-6">
        {effectiveAppraisals.map((app) => {
          const isMyRecord = app.employeeId === currentUser.id;
          const canManageTargets = isMyRecord || currentRole === 'hr_admin' || (currentRole === 'line_manager' && subordinateIds.has(app.employeeId));

          return (
            <div
              key={app.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 hover:border-slate-300 transition-all"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {app.overallScore}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{app.employeeName}</h4>
                      {isMyRecord && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                          My Appraisal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      ID: {app.employeeId} • {app.designation} • {app.department}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cycle: <strong>{app.cycle}</strong> • Evaluated by: <strong>{app.reviewerName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-sm text-slate-900 ml-1.5">{app.overallScore} / 5.0</span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                    {app.supervisorRecommendations}
                  </span>
                </div>
              </div>

              {/* 6 Core Competency Pillars Grid */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 mb-2.5 uppercase tracking-wider">
                  Core Competency Performance Ratings
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Job Knowledge</span>
                    <span className="text-base font-bold text-slate-900">{app.jobKnowledge} <span className="text-xs font-normal text-slate-400">/5</span></span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Work Quality</span>
                    <span className="text-base font-bold text-slate-900">{app.workQuality} <span className="text-xs font-normal text-slate-400">/5</span></span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 uppercase block font-medium">Safeguarding</span>
                    <span className="text-base font-bold text-emerald-700">{app.safeguardingAndEthics} <span className="text-xs font-normal text-emerald-600">/5</span></span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Teamwork</span>
                    <span className="text-base font-bold text-slate-900">{app.teamCollaboration} <span className="text-xs font-normal text-slate-400">/5</span></span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Compliance</span>
                    <span className="text-base font-bold text-slate-900">{app.punctualityAndCompliance} <span className="text-xs font-normal text-slate-400">/5</span></span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Leadership</span>
                    <span className="text-base font-bold text-slate-900">{app.leadershipAndInitiative} <span className="text-xs font-normal text-slate-400">/5</span></span>
                  </div>
                </div>
              </div>

              {/* Overall KPI Achievement Rate & Staff Self-Update Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Overall KPI / Target Achievement Rate</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Based on verifiable deliverables, field milestones, and targets
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xl font-mono font-extrabold text-emerald-700">
                      {app.kpiAchievementRate}%
                    </span>

                    {/* Staff / Supervisor can update overall achievement % */}
                    {canManageTargets && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKpiAchievementAppraisal(app);
                          setUpdatedKpiRate(app.kpiAchievementRate);
                          setStaffSelfComment(app.employeeComments || '');
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="Update overall KPI rate and self-notes"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Update KPI Rate</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${app.kpiAchievementRate}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  />
                </div>

                {app.employeeComments && (
                  <div className="pt-2 text-xs text-slate-600 border-t border-slate-200/60 mt-2">
                    <p>
                      <strong className="text-slate-800">Staff Self-Reflection Note:</strong> "{app.employeeComments}"
                    </p>
                    {app.employeeUpdatedDate && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Updated on: {app.employeeUpdatedDate}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Specific KPI Targets / Goals Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Individual KPI Targets & Deliverables ({app.kpiTargets?.length || 0})
                    </h5>
                  </div>

                  {/* Staff / Supervisor can set a new target */}
                  {canManageTargets && (
                    <button
                      type="button"
                      onClick={() => handleOpenAddTarget(app)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Set New Target / Goal</span>
                    </button>
                  )}
                </div>

                {(!app.kpiTargets || app.kpiTargets.length === 0) ? (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    No specific milestone targets set yet. Click "Set New Target / Goal" above to create your first objective.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {app.kpiTargets.map((tgt, idx) => (
                      <div
                        key={tgt.id || idx}
                        className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h6 className="font-bold text-slate-900 text-xs">{tgt.title}</h6>
                            <p className="text-[11px] text-slate-500 mt-0.5">{tgt.target}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                              tgt.status === 'Achieved' || tgt.status === 'Exceeded'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {tgt.status}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">Progress</span>
                            <span className="font-mono font-bold text-slate-800">{tgt.currentProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${tgt.currentProgress}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                tgt.currentProgress >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                              }`}
                            />
                          </div>
                        </div>

                        {tgt.selfNotes && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-xl">
                            "{tgt.selfNotes}"
                          </p>
                        )}

                        {/* Update Target Button (NO DELETE BUTTON - Permanently Recorded) */}
                        {canManageTargets && (
                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTarget(app, idx)}
                              className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Update Progress & Notes</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Qualitative Review Comments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
                <div className="p-3 rounded-2xl bg-slate-50/60 border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">Key Strengths Demonstrated:</span>
                  <p className="text-slate-600 leading-relaxed">{app.strengths}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50/60 border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">Areas for Professional Growth:</span>
                  <p className="text-slate-600 leading-relaxed">{app.areasForImprovement}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Setting / Updating Modal */}
      {activeTargetModalAppraisal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  {editingTargetIndex !== null ? 'Update KPI Target Progress' : 'Set New KPI Target / Goal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTargetModalAppraisal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target / Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct 50 Child Street Protection Outreach Missions"
                  value={targetForm.title}
                  onChange={(e) => setTargetForm({ ...targetForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Specific Metric / Key Result *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 50 outreach patrols with night-time street child rescue..."
                  value={targetForm.target}
                  onChange={(e) => setTargetForm({ ...targetForm, target: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Current Completion Progress:</span>
                  <span className="text-indigo-700 font-mono">{targetForm.currentProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={targetForm.currentProgress}
                  onChange={(e) => setTargetForm({ ...targetForm, currentProgress: parseInt(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Execution Status</label>
                <select
                  value={targetForm.status}
                  onChange={(e) => setTargetForm({ ...targetForm, status: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Achieved">Achieved</option>
                  <option value="Exceeded">Exceeded</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Self-Reflection & Execution Notes</label>
                <textarea
                  rows={2}
                  placeholder="Document achievements, deliverables, and challenges..."
                  value={targetForm.selfNotes}
                  onChange={(e) => setTargetForm({ ...targetForm, selfNotes: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <strong>Audit Rule:</strong> Per institutional HR governance, performance targets are permanently preserved in your personnel record. Deletion is disabled. You can adjust progress and status at any time.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTargetModalAppraisal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Target Progress</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick KPI Rate Update Modal */}
      {editingKpiAchievementAppraisal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Update Overall KPI Achievement</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingKpiAchievementAppraisal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKpiRateUpdate} className="p-6 space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>KPI Achievement Rate:</span>
                  <span className="text-emerald-700 font-mono font-bold text-base">{updatedKpiRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={updatedKpiRate}
                  onChange={(e) => setUpdatedKpiRate(parseInt(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Self-Reflection Comment / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Summarize your recent deliverables and milestone accomplishments..."
                  value={staffSelfComment}
                  onChange={(e) => setStaffSelfComment(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingKpiAchievementAppraisal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update KPI Rate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
