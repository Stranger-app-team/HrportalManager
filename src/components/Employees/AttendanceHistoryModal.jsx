import React, { useState, useEffect } from "react";
import Modal from "../Shared/Modal";
import { FiCalendar, FiClock, FiDownload, FiInfo } from "react-icons/fi";
import { API_BASE_URL } from "../../config/api";

export default function AttendanceHistoryModal({ isOpen, onClose, userId }) {
  if (!isOpen || !userId) return null;

  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchHistory = async (m, y) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/attendance/employee/${userId}?month=${m}&year=${y}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAttendanceHistory(data.data || []);
      }
    } catch (error) {
      console.error("Fetch attendance error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory(month, year);
    }
  }, [isOpen, userId, month, year]);

  const handleDownload = async (format) => {
    try {
      const token = localStorage.getItem("token");
      const url = `${API_BASE_URL}/reports/attendance/download?format=${format}&employeeId=${userId}&month=${month}&year=${year}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Attendance_Report_${userId}_${month}_${year}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert("Failed to download report: " + error.message);
    }
  };

  const getStatusStyle = (status) => {
    switch(String(status).toLowerCase()) {
      case 'present': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'late': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'absent': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'leave': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'holiday': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'weekly-off': return 'bg-slate-50 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <Modal title="Attendance History" onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-1 min-h-[400px]">
        
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center sm:justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60 mb-6 gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <FiCalendar size={14} className="text-slate-400" />
              <select 
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-transparent text-[11px] font-bold text-slate-600 outline-none cursor-pointer"
              >
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <input 
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-transparent text-[11px] font-bold text-slate-600 outline-none w-16 text-center"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button 
              onClick={() => handleDownload('pdf')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-all shadow-sm"
            >
              <FiDownload size={12}/> PDF
            </button>
            <button 
              onClick={() => handleDownload('excel')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-100 transition-all shadow-sm"
            >
              <FiDownload size={12}/> Excel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Records...</p>
          </div>
        ) : attendanceHistory.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
             <FiInfo size={24} className="mx-auto text-slate-300 mb-3" />
             <p className="text-xs text-slate-400 font-medium italic">No attendance records found for this period.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[55vh] custom-scrollbar">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Date</th>
                    <th className="py-4 px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Status</th>
                    <th className="py-4 px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Check In</th>
                    <th className="py-4 px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Check Out</th>
                    <th className="py-4 px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Work Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceHistory.map((record, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <p className="text-[12px] font-bold text-slate-700">
                          {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-[12px] font-bold text-slate-600">
                         {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "—"}
                      </td>
                      <td className="py-4 px-5 text-[12px] font-bold text-slate-600">
                         {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "—"}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="text-[12px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100/50">
                          {record.totalHours ? `${record.totalHours.toFixed(1)}h` : "0h"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest border border-slate-200/50 shadow-sm"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </Modal>
  );
}
