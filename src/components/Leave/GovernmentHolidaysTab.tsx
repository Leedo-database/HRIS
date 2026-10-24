import React, { useState } from 'react';
import { GovernmentHoliday, HolidayType, UserRole, LEEDO_JOB_LOCATIONS } from '../../types/hris';
import { 
  CalendarDays, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Calendar, 
  Flag, 
  Sparkles, 
  ShieldCheck, 
  Printer, 
  Download, 
  Filter, 
  X, 
  Building2, 
  Landmark, 
  Clock 
} from 'lucide-react';

interface GovernmentHolidaysTabProps {
  holidays: GovernmentHoliday[];
  currentRole: UserRole;
  jobLocations?: string[];
  onAddHoliday: (holiday: GovernmentHoliday) => void;
  onUpdateHoliday: (holiday: GovernmentHoliday) => void;
  onDeleteHoliday: (holidayId: string) => void;
}

const HOLIDAY_TYPES: HolidayType[] = [
  'National Holiday (জাতীয় দিবস)',
  'Public / Religious (সাধারণ ও ধর্মীয় ছুটি)',
  'Executive Order (নির্বাহী আদেশে সরকারি ছুটি)',
  'Optional / Restricted (ঐচ্ছিক ছুটি)',
];

export const GovernmentHolidaysTab: React.FC<GovernmentHolidaysTabProps> = ({
  holidays,
  currentRole,
  jobLocations = [...LEEDO_JOB_LOCATIONS],
  onAddHoliday,
  onUpdateHoliday,
  onDeleteHoliday,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [holidayToEdit, setHolidayToEdit] = useState<GovernmentHoliday | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [titleBangla, setTitleBangla] = useState('');
  const [startDate, setStartDate] = useState('2026-03-26');
  const [endDate, setEndDate] = useState('2026-03-26');
  const [type, setType] = useState<HolidayType>('Public / Religious (সাধারণ ও ধর্মীয় ছুটি)');
  const [description, setDescription] = useState('');
  const [isGazetted, setIsGazetted] = useState(true);
  const [applicableLocation, setApplicableLocation] = useState('All');

  const openAddModal = () => {
    setHolidayToEdit(null);
    setTitle('');
    setTitleBangla('');
    setStartDate('2026-03-26');
    setEndDate('2026-03-26');
    setType('Public / Religious (সাধারণ ও ধর্মীয় ছুটি)');
    setDescription('');
    setIsGazetted(true);
    setApplicableLocation('All');
    setIsModalOpen(true);
  };

  const openEditModal = (h: GovernmentHoliday) => {
    setHolidayToEdit(h);
    setTitle(h.title);
    setTitleBangla(h.titleBangla || '');
    setStartDate(h.startDate);
    setEndDate(h.endDate);
    setType(h.type);
    setDescription(h.description || '');
    setIsGazetted(h.isGazetted);
    setApplicableLocation(h.applicableLocations?.[0] || 'All');
    setIsModalOpen(true);
  };

  const calculateDays = (s: string, e: string) => {
    const start = new Date(s);
    const end = new Date(e);
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 1;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) {
      alert('Please fill out Holiday Title and Start Date.');
      return;
    }

    const calculatedDays = calculateDays(startDate, endDate);
    const yearOfHoliday = parseInt(startDate.split('-')[0], 10) || 2026;

    if (holidayToEdit) {
      const updated: GovernmentHoliday = {
        ...holidayToEdit,
        title: title.trim(),
        titleBangla: titleBangla.trim() || undefined,
        startDate,
        endDate: endDate >= startDate ? endDate : startDate,
        daysCount: calculatedDays,
        type,
        description: description.trim() || undefined,
        isGazetted,
        year: yearOfHoliday,
        applicableLocations: [applicableLocation],
      };
      onUpdateHoliday(updated);
    } else {
      const newHoliday: GovernmentHoliday = {
        id: `HOL-${yearOfHoliday}-${Date.now().toString().slice(-4)}`,
        title: title.trim(),
        titleBangla: titleBangla.trim() || undefined,
        startDate,
        endDate: endDate >= startDate ? endDate : startDate,
        daysCount: calculatedDays,
        type,
        description: description.trim() || undefined,
        isGazetted,
        year: yearOfHoliday,
        applicableLocations: [applicableLocation],
        createdAt: new Date().toISOString(),
      };
      onAddHoliday(newHoliday);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (h: GovernmentHoliday) => {
    if (confirm(`Are you sure you want to delete "${h.title}" from official government holidays?`)) {
      onDeleteHoliday(h.id);
    }
  };

  const filteredHolidays = holidays.filter((h) => {
    const matchesYear = h.year === selectedYear || parseInt(h.startDate.split('-')[0], 10) === selectedYear;
    const matchesType = selectedType === 'All' || h.type === selectedType;
    return matchesYear && matchesType;
  });

  const totalHolidayDays = filteredHolidays.reduce((acc, h) => acc + (h.daysCount || 1), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingHolidays = filteredHolidays.filter((h) => h.startDate >= todayStr);
  const nextHoliday = upcomingHolidays[0];

  const exportHolidaysCSV = () => {
    const headers = ['Holiday ID', 'Title', 'Bangla Title', 'Start Date', 'End Date', 'Days Count', 'Holiday Type', 'Gazetted', 'Applicable Centers', 'Description'];
    const rows = filteredHolidays.map((h) => [
      `"${h.id}"`,
      `"${h.title}"`,
      `"${h.titleBangla || ''}"`,
      `"${h.startDate}"`,
      `"${h.endDate}"`,
      h.daysCount,
      `"${h.type}"`,
      h.isGazetted ? 'Yes' : 'No',
      `"${h.applicableLocations?.join(', ') || 'All'}"`,
      `"${h.description || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bangladesh_Govt_Holidays_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700">Total Govt Holidays</span>
            <div className="p-2 bg-indigo-100/60 rounded-xl text-indigo-600">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {totalHolidayDays} <span className="text-xs font-normal text-slate-500">days ({filteredHolidays.length} events)</span>
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
            Year: {selectedYear} Official Gazette
          </span>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Upcoming Holiday</span>
            <div className="p-2 bg-emerald-100/60 rounded-xl text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-2 truncate">
            {nextHoliday ? nextHoliday.title : 'No upcoming holidays in current year'}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
            {nextHoliday ? `${nextHoliday.startDate} (${nextHoliday.daysCount} days)` : 'Completed for current year'}
          </span>
        </div>

        <div className="p-4 bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">National Days</span>
            <div className="p-2 bg-amber-100/60 rounded-xl text-amber-600">
              <Flag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {filteredHolidays.filter(h => h.type.includes('National')).length}
          </p>
          <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
            Victory, Language & Independence Days
          </span>
        </div>

        <div className="p-4 bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Religious Festivals</span>
            <div className="p-2 bg-rose-100/60 rounded-xl text-rose-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {filteredHolidays.filter(h => h.type.includes('Religious')).length}
          </p>
          <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">
            Eid, Puja, Christmas, Buddha Purnima
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Calendar Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value={2026}>2026 (Official Calendar)</option>
              <option value={2027}>2027 (Upcoming Year)</option>
              <option value={2025}>2025 (Previous Year)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Holiday Category</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Categories ({filteredHolidays.length})</option>
              {HOLIDAY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={exportHolidaysCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* HR Admin Input Option */}
          {currentRole === 'hr_admin' && (
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Input Government Holiday (সরকারি ছুটি যোগ করুন)</span>
            </button>
          )}
        </div>
      </div>

      {/* Holiday Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Holiday Title & Details</th>
                <th className="py-3.5 px-4">Dates & Duration</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Applicable Center</th>
                <th className="py-3.5 px-4">Gazette Status</th>
                {currentRole === 'hr_admin' && (
                  <th className="py-3.5 px-4 text-right">Actions (HR)</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">No Government Holidays Found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {currentRole === 'hr_admin'
                        ? 'Click "+ Input Government Holiday" above to add official gazette or executive holidays.'
                        : 'No public holidays match the selected filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((h) => {
                  const isPast = h.endDate < todayStr;
                  const isCurrent = h.startDate <= todayStr && h.endDate >= todayStr;

                  return (
                    <tr
                      key={h.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCurrent ? 'bg-indigo-50/30' : isPast ? 'opacity-80' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            h.type.includes('National')
                              ? 'bg-amber-100 text-amber-700'
                              : h.type.includes('Religious')
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            <Landmark className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">
                              {h.title}
                            </p>
                            {h.titleBangla && (
                              <p className="text-xs font-bangla text-indigo-700 font-semibold mt-0.5">
                                {h.titleBangla}
                              </p>
                            )}
                            {h.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {h.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800">
                          <p className="font-bold text-xs">{h.startDate}</p>
                          {h.endDate !== h.startDate && (
                            <p className="text-[11px] text-slate-500">to {h.endDate}</p>
                          )}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                          {h.daysCount} {h.daysCount === 1 ? 'Day' : 'Days'} Holiday
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          h.type.includes('National')
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : h.type.includes('Religious')
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}>
                          {h.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-700 font-medium">
                          {h.applicableLocations && h.applicableLocations[0] !== 'All'
                            ? h.applicableLocations.join(', ')
                            : 'All LEEDO Centers (সারাদেশ)'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {h.isGazetted ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Official Gazette
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                            Executive Notice
                          </span>
                        )}
                      </td>

                      {currentRole === 'hr_admin' && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(h)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Government Holiday Details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(h)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Government Holiday"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HR Admin Add / Edit Government Holiday Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {holidayToEdit ? 'Edit Government Holiday (ছুটি সংশোধন)' : 'Input Government Holiday (সরকারি ছুটি যোগ করুন)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add gazette or executive public holiday to official organization calendar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Holiday Title (English) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shab-e-Barat, Independence Day, Eid-ul-Fitr"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ছুটির নাম (বাংলায়)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: পবিত্র শবে বরাত, মহান স্বাধীনতা দিবস, ঈদুল ফিতর"
                  value={titleBangla}
                  onChange={(e) => setTitleBangla(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bangla"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate < e.target.value) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Calculated Holiday Duration:</span>
                <span className="font-bold text-indigo-700 font-mono">
                  {calculateDays(startDate, endDate)} Day(s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Holiday Type / Category
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as HolidayType)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {HOLIDAY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Applicable Center / Location
                  </label>
                  <select
                    value={applicableLocation}
                    onChange={(e) => setApplicableLocation(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="All">All LEEDO Centers (সবার জন্য)</option>
                    {jobLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Official Gazette / Remarks (গেজেট / বিবরণ)
                </label>
                <textarea
                  rows={2}
                  placeholder="Government circular ref, religious observance, or ministry order details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="gazettedCheckbox"
                  checked={isGazetted}
                  onChange={(e) => setIsGazetted(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="gazettedCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Official Gazette Holiday (সরকারি গেজেটভুক্ত সাধারণ ছুটি)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {holidayToEdit ? 'Save Changes' : 'Save Holiday to Cloud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
