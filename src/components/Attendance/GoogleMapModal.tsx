import React from 'react';
import { X, MapPin, ExternalLink, Navigation, Clock, User } from 'lucide-react';
import { AttendanceRecord } from '../../types/hris';

interface GoogleMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
}

export const GoogleMapModal: React.FC<GoogleMapModalProps> = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  const lat = record.latitude || 23.7937;
  const lng = record.longitude || 90.4066;
  // Use OpenStreetMap embed which never blocks iframe embedding in browser sandboxes
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Google Maps / GPS Punch Verification</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  GPS Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Staff check-in physical coordinates & live map pin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Staff Member</span>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{record.employeeName}</p>
              <span className="text-[10px] font-mono text-slate-500">ID: {record.employeeId}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Clock In Time</span>
              <p className="text-xs font-bold text-indigo-700 mt-0.5 font-mono">{record.clockInTime}</p>
              <span className="text-[10px] text-slate-500">{record.date}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Station / Center</span>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                {record.punchLocationName || record.locationNote || 'LEEDO Job Center'}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold">{record.status}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">GPS Accuracy</span>
              <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                ±{record.locationAccuracy ? `${record.locationAccuracy}m` : '15m'}
              </p>
              <span className="text-[10px] font-mono text-slate-500">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Embedded Map with guaranteed loading */}
          <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative bg-slate-100">
            <iframe
              title="Attendance Punch Geolocation Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={osmEmbedUrl}
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Exact GPS Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}</span>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Google Maps (গুগল ম্যাপে দেখুন)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
