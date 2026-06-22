import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, X } from "lucide-react";

const BASE = import.meta.env.VITE_API_BASE_URL;

export default function ViewWarningModal({ warning, onClose, onAcknowledged, readOnly = false }) {
  const [loading, setLoading] = useState(false);

  if (!warning) return null;

  const handleAcknowledge = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE}/warnings/${warning._id}/acknowledge`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (result.success) {
        if (onAcknowledged) {
          onAcknowledged(warning._id);
        }
      } else {
        alert(result.message || "Failed to acknowledge.");
      }
    } catch (error) {
      console.error("Error acknowledging:", error);
      alert("Error acknowledging the action.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-100 relative">
        
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 z-10 bg-white/50 rounded-full p-1 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className={`px-5 py-4 flex items-center gap-3 border-b border-slate-100 ${warning.type === 'Alert' ? 'bg-orange-50' : 'bg-rose-50'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${warning.type === 'Alert' ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-base ${warning.type === 'Alert' ? 'text-orange-800' : 'text-rose-800'}`}>{warning.type} Issued</h3>
              {warning.severityLevel && (
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  warning.severityLevel === 'Low' ? 'bg-blue-100 text-blue-700' :
                  warning.severityLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {warning.severityLevel} Severity
                </span>
              )}
            </div>
            {!warning.isAcknowledged ? (
              <p className={`text-xs font-semibold uppercase tracking-wider mt-0.5 ${warning.type === 'Alert' ? 'text-orange-600/80' : 'text-rose-600/80'}`}>Requires Acknowledgment</p>
            ) : (
              <p className={`text-xs font-semibold uppercase tracking-wider mt-0.5 text-green-600`}>Acknowledged</p>
            )}
          </div>
        </div>
        
        {/* Body */}
        <div className="p-5 md:p-6">
          <div className="mb-5 pb-5 border-b border-slate-100">
            <h4 className="text-lg font-bold text-slate-800 leading-tight mb-3">{warning.title}</h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 max-h-[30vh] overflow-y-auto overflow-x-hidden break-words">
              <div 
                className="text-[13px] text-slate-700 leading-relaxed prose prose-sm max-w-none break-words whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: warning.description }}
              />
            </div>
            
            {warning.employeeComments && (
              <div className="mt-4 bg-white border border-slate-200 rounded-lg shadow-sm p-3">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Employee Comments</h5>
                <div className="max-h-[12vh] overflow-y-auto pr-1">
                  <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{warning.employeeComments}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              <Clock size={14} /> 
              Issued on {new Date(warning.createdAt).toLocaleDateString()}
            </div>
            
            {!warning.isAcknowledged ? (
              <>
                {readOnly ? (
                  <div className="w-full py-2.5 rounded-lg bg-orange-50/50 text-orange-600 text-sm font-semibold flex justify-center items-center gap-2 border border-orange-100 border-dashed">
                    <Clock size={18} /> Pending Acknowledgment
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleAcknowledge}
                      disabled={loading}
                  className={`w-full py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98] flex justify-center items-center gap-2 ${warning.type === 'Alert' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-rose-600 hover:bg-rose-700'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <CheckCircle size={18} /> I have read and acknowledge
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                  You must acknowledge this record to proceed.
                </p>
              </>
            )}
            </>
            ) : (
              <div className="w-full py-2.5 rounded-lg bg-green-50 text-green-700 text-sm font-semibold flex justify-center items-center gap-2 border border-green-100">
                <CheckCircle size={18} /> Acknowledged on {new Date(warning.acknowledgedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
