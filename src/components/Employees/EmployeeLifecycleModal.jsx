import React from "react";
import Modal from "../Shared/Modal";
import { FiClock, FiCalendar, FiCheckCircle, FiUser, FiArrowRight, FiInfo, FiHash } from "react-icons/fi";

export default function EmployeeLifecycleModal({ isOpen, onClose, employee }) {
  if (!isOpen || !employee) return null;

  const history = employee.statusHistory || [];
  const sortedHistory = [...history].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

  const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-GB", {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : "—";

  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s === 'resigned') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (s === 'terminated') return 'bg-rose-50 text-rose-700 border-rose-100';
    if (s === 'inactive' || s === 'notice_complete') return 'bg-slate-50 text-slate-700 border-slate-100';
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  return (
    <Modal title="Employee Lifecycle" onClose={onClose} maxWidth="max-w-xl">
      <div className="p-1 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
        
        {/* Header Summary Card */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Status</span>
            <div className={`w-fit px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getStatusColor(employee.status)}`}>
              {String(employee.status).replace('_', ' ')}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</span>
            <span className="text-xs font-bold text-slate-700">{formatDate(employee.joiningDate || employee.createdAt)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Working Day</span>
            <span className="text-xs font-bold text-slate-700">{formatDate(employee.lastWorkingDate)}</span>
          </div>
        </div>

        {/* Notice Period Details (If Resigned/Notice Complete) */}
        {employee.noticeStartDate && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <FiCalendar size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notice Period</p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span>{formatDate(employee.noticeStartDate)}</span>
                  <FiArrowRight size={12} className="text-slate-300" />
                  <span>{formatDate(employee.lastWorkingDate)}</span>
                </div>
              </div>
            </div>
            {employee.noticePeriodReason && (
              <div className="text-right max-w-[200px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason</p>
                <p className="text-[11px] text-slate-600 truncate italic">"{employee.noticePeriodReason}"</p>
              </div>
            )}
          </div>
        )}

        {/* Exit Checklist Details */}
        {["inactive", "notice_complete", "terminated"].includes(String(employee.status).toLowerCase()) && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Exit Interview', val: employee.exitInterviewDone },
              { label: 'Assets Returned', val: employee.assetsReturned },
              { label: 'F&F Settled', val: employee.fullAndFinalSettled }
            ].map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border flex flex-col gap-1 ${item.val ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  {item.val ? <FiCheckCircle size={12} className="text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                  <span className={`text-[10px] font-bold ${item.val ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {item.val ? 'DONE' : 'PENDING'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline Section */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-6">
            <FiClock size={14} className="text-indigo-500" />
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Journey History</h4>
          </div>

          <div className="space-y-8 ml-3 border-l-[1.5px] border-slate-100 pl-8">
            {sortedHistory.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-white border-[1.5px] border-slate-200 group-hover:border-indigo-400 transition-colors flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-colors" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">{formatDate(item.changedAt)}</span>
                      <span className="text-slate-200">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{String(item.from).replace('_', ' ')}</span>
                        <FiArrowRight size={10} className="text-slate-300" />
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusColor(item.to)}`}>
                          {String(item.to).replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {item.reason && (
                    <div className="bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 group-hover:bg-slate-50 transition-colors">
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        {item.reason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider opacity-60">
                    <FiUser size={10}/> HR Action
                  </div>
                </div>
              </div>
            ))}

            {/* Initial Hire */}
            <div className="relative">
              <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-emerald-50 border-[1.5px] border-emerald-100 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Onboarding Completed</p>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-slate-700">{formatDate(employee.joiningDate || employee.createdAt)}</span>
                   <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">JOINED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-blue-50/30 border border-blue-100/50 rounded-xl p-3 flex gap-3">
          <FiInfo size={14} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-blue-600 leading-relaxed">
            All lifecycle transitions are recorded in real-time. Automated transitions (e.g., notice completion) are marked as system actions.
          </p>
        </div>
      </div>
    </Modal>
  );
}
