import React, { useState } from 'react';
import { Employee, CompanyProfile, UserRole, LEEDO_JOB_LOCATIONS } from '../../types/hris';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  UserPlus, 
  LayoutGrid, 
  Table as TableIcon, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  ExternalLink,
  Edit3,
  UserMinus,
  UserCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

interface EmployeeDirectoryProps {
  employees: Employee[];
  company: CompanyProfile;
  currentRole: UserRole;
  currentUser?: Employee;
  jobLocations?: string[];
  onOpenJobLocationsManager?: () => void;
  onSelectEmployee: (emp: Employee) => void;
  onAddEmployee: () => void;
  onEditEmployee: (emp: Employee) => void;
  onGenerateLetter: (emp: Employee, letterType: string) => void;
  onInitiateSeparation?: (emp: Employee) => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  employees,
  company,
  currentRole,
  currentUser,
  jobLocations = [...LEEDO_JOB_LOCATIONS],
  onOpenJobLocationsManager,
  onSelectEmployee,
  onAddEmployee,
  onEditEmployee,
  onGenerateLetter,
  onInitiateSeparation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedSupervisor, setSelectedSupervisor] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const departments = ['All', ...Array.from(new Set(employees.map((e) => e.department).filter(Boolean)))];
  
  // Supervisors list for filtering
  const supervisors = Array.from(
    new Set(
      employees
        .map((e) => e.reportingManagerName)
        .filter((name): name is string => Boolean(name))
    )
  );

  const filtered = employees.filter((emp) => {
    // For line_manager (supervisor), ONLY show subordinates assigned to this supervisor
    if (currentRole === 'line_manager' && currentUser) {
      const isSubordinate = emp.id !== currentUser.id && (
        emp.reportingManagerId === currentUser.id ||
        (emp.reportingManagerName && (emp.reportingManagerName === currentUser.fullName || emp.reportingManagerName.includes(currentUser.fullName)))
      );
      if (!isSubordinate) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    const isExited = emp.status === 'Separated' || emp.status === 'Terminated';

    // Staff who have left are hidden from master directory by default, but appear immediately when searched by ID or name
    if (!q && isExited) {
      return false;
    }

    const matchesSearch =
      !q ||
      emp.fullName.toLowerCase().includes(q) ||
      emp.id.toLowerCase().includes(q) ||
      (emp.banglaName && emp.banglaName.toLowerCase().includes(q)) ||
      emp.designation.toLowerCase().includes(q) ||
      emp.phone.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q);

    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;
    
    // Check assigned locations
    const matchesLocation = selectedLocation === 'All' || 
      (emp.jobLocations && emp.jobLocations.includes(selectedLocation)) ||
      emp.workStation === selectedLocation;

    // Check supervisor
    const matchesSupervisor = selectedSupervisor === 'All' || emp.reportingManagerName === selectedSupervisor;

    return matchesSearch && matchesDept && matchesStatus && matchesLocation && matchesSupervisor;
  });

  const exportDirectoryCSV = () => {
    const headers = [
      'Staff ID',
      'Full Name',
      'Bangla Name',
      'Designation',
      'Department',
      'Grade Level',
      'Supervisor',
      'Job Locations',
      'Duty Days',
      'Daily Hours',
      'Gross Salary',
      'Mobile Allowance',
      'Travel Allowance',
      'Status',
      'Official Phone',
      'Official Email',
    ];

    const rows = filtered.map((e) => [
      `"${e.id}"`,
      `"${e.fullName}"`,
      `"${e.banglaName || ''}"`,
      `"${e.designation}"`,
      `"${e.department}"`,
      `"${e.gradeLevel}"`,
      `"${e.reportingManagerName || 'Founder/ED'}"`,
      `"${(e.jobLocations || [e.workStation]).join('; ')}"`,
      `"${(e.dutyDays || ['Sat-Thu']).join(', ')}"`,
      e.dailyDutyHours || 8,
      e.grossSalary,
      e.mobileAllowance ?? 1000,
      e.travelAllowance ?? 2000,
      `"${e.status}"`,
      `"${e.phone}"`,
      `"${e.email}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LEEDO_Staff_Master_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>
              {currentRole === 'line_manager' 
                ? 'My Assigned Subordinate Staff (আমার অধীনস্থ কর্মী)' 
                : 'Personnel Directory & Central Staff Database'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'line_manager'
              ? `Displaying ${filtered.length} staff members reporting directly under your supervision`
              : `Active roster of ${filtered.length} official staff members across ${jobLocations.length} LEEDO centers and field shelters`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole === 'hr_admin' && (
            <>
              <button
                onClick={onAddEmployee}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Onboard New Employee</span>
              </button>

              {onOpenJobLocationsManager && (
                <button
                  type="button"
                  onClick={onOpenJobLocationsManager}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-2.5 rounded-xl border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                  title="HR Admin: Manage, rename, or add Job Locations & Centers"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Job Locations ({jobLocations.length})</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={exportDirectoryCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster</span>
          </button>

          {/* Table / Grid view toggles */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Department filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700 font-medium"
            >
              <option value="All">All Departments</option>
              {departments.filter(d => d !== 'All').map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Job Location filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700 font-medium"
            >
              <option value="All">All {jobLocations.length} Job Locations</option>
              {jobLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            {currentRole === 'hr_admin' && onOpenJobLocationsManager && (
              <button
                type="button"
                onClick={onOpenJobLocationsManager}
                title="Edit / Rename Job Locations"
                className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl border border-indigo-200 cursor-pointer shrink-0 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Supervisor filter */}
          <div>
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700 font-medium"
            >
              <option value="All">All Supervisors</option>
              {supervisors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Employment status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Probation">Probation</option>
              <option value="Contractual">Contractual</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Separated / Terminated</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Showing <strong>{filtered.length}</strong> of {employees.length} personnel</span>
          {(searchQuery || selectedDept !== 'All' || selectedStatus !== 'All' || selectedLocation !== 'All' || selectedSupervisor !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('All');
                setSelectedStatus('All');
                setSelectedLocation('All');
                setSelectedSupervisor('All');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Directory Content: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Designation & Grade</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Supervisor (কে কার)</th>
                  <th className="py-3 px-3">Job Locations</th>
                  <th className="py-3 px-3">Duty Schedule</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => {
                  const locations = emp.jobLocations && emp.jobLocations.length > 0 
                    ? emp.jobLocations 
                    : [emp.workStation || 'Head Office'];
                  
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => onSelectEmployee(emp)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.id}`}
                            alt={emp.fullName}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {emp.fullName}
                            </p>
                            <p className="text-[11px] font-mono text-slate-500">
                              {emp.id} • {emp.gender}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800">{emp.designation}</p>
                        <p className="text-[11px] text-slate-500">{emp.gradeLevel}</p>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-700">
                        {emp.department}
                      </td>

                      {/* Supervisor Column */}
                      <td className="py-3 px-3">
                        {emp.reportingManagerName ? (
                          <div className="text-[11px]">
                            <span className="font-semibold text-slate-800 block truncate max-w-[150px]" title={emp.reportingManagerName}>
                              {emp.reportingManagerName}
                            </span>
                            {emp.reportingManagerId && (
                              <span className="text-[10px] font-mono text-indigo-600">ID: {emp.reportingManagerId}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Founder/ED</span>
                        )}
                      </td>

                      {/* Job Locations Column */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[170px]">
                          {locations.slice(0, 2).map((loc) => (
                            <span key={loc} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-medium border border-slate-200 truncate">
                              {loc}
                            </span>
                          ))}
                          {locations.length > 2 && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md font-bold">
                              +{locations.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Duty Schedule Column */}
                      <td className="py-3 px-3">
                        <div className="text-[11px]">
                          <span className="font-bold text-slate-800 block">
                            {emp.dutyDays?.length || 6}d • {emp.dailyDutyHours || 8}h
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {emp.shiftStartTime || '10:00'}-{emp.shiftEndTime || '18:00'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            emp.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : emp.status === 'Probation'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <p className="font-mono text-[11px]">{emp.phone}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{emp.email}</p>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditEmployee(emp)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Full Employee Profile & Duty Schedule"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectEmployee(emp)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="View Complete Profile & Dossier"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          {onInitiateSeparation && currentRole === 'hr_admin' && (
                            <button
                              type="button"
                              onClick={() => onInitiateSeparation(emp)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Mark Separation & Final Settlement"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onGenerateLetter(emp, 'salary_certificate')}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Generate Letter"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => {
            const locations = emp.jobLocations && emp.jobLocations.length > 0 
              ? emp.jobLocations 
              : [emp.workStation || 'Head Office'];

            return (
              <div
                key={emp.id}
                onClick={() => onSelectEmployee(emp)}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.id}`}
                        alt={emp.fullName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-indigo-400 transition-all shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                          {emp.fullName}
                        </h3>
                        <p className="text-xs text-slate-500">{emp.designation}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{emp.id} • {emp.department}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        emp.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  {/* Supervisor & Duty Schedule Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-medium">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">
                        Supervisor: <strong>{emp.reportingManagerName || 'Founder/ED'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.dutyDays?.length || 6} Days/Wk ({emp.dailyDutyHours || 8}h • {emp.shiftStartTime || '10:00'}-{emp.shiftEndTime || '18:00'})</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{locations.join(', ')}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {formatCurrency(emp.grossSalary, company.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      +৳{emp.mobileAllowance ?? 1000} mob / +৳{emp.travelAllowance ?? 2000} trv
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditEmployee(emp)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Edit Full Employee Profile"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    {onInitiateSeparation && currentRole === 'hr_admin' && (
                      <button
                        type="button"
                        onClick={() => onInitiateSeparation(emp)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        title="Mark Separation"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectEmployee(emp)}
                      className="text-indigo-600 font-semibold hover:underline text-[11px] cursor-pointer"
                    >
                      Details →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
