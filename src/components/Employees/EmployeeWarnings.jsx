import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import { AlertTriangle, Plus, FileText, Download, X, Eye } from "lucide-react";
import ViewWarningModal from "../Shared/ViewWarningModal";

export default function EmployeeWarnings({ employeeId, refreshTrigger }) {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState(null);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/warnings/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setWarnings(result.data);
      }
    } catch (error) {
      console.error("Error fetching warnings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();

    const handleAck = (e) => {
      const data = e.detail;
      // Re-fetch if the acknowledgment is for the currently viewed employee
      if (data && data.employeeId === employeeId) {
        fetchWarnings();
      }
    };

    window.addEventListener('warning_alert_acknowledged', handleAck);
    return () => window.removeEventListener('warning_alert_acknowledged', handleAck);
  }, [employeeId, refreshTrigger]);

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40 mt-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Disciplinary Records</h2>
            <p className="text-[10px] text-gray-400 font-medium">Alerts and Warnings</p>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-gray-400 italic">Loading records...</p>
        ) : warnings.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No alerts or warnings on record.</p>
        ) : (
          <div className="max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warnings.map((record) => (
              <div key={record._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${record.type === "Alert" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {record.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => setSelectedWarning(record)}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-1 bg-white rounded-full shadow-sm border border-slate-100"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-gray-800 break-words">{record.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 break-words">{record.description}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  <span className="text-[10px] text-gray-500">Issued by: {record.issuedBy?.name || 'Unknown'}</span>
                  <div className="flex items-center gap-2">
                    {record.documentUrl && (
                      <a href={record.documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[10px] font-bold">
                        <Download size={12} /> Document
                      </a>
                    )}
                    {record.isAcknowledged ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold uppercase tracking-wider">
                        ✓ Ack: {new Date(record.acknowledgedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-bold uppercase tracking-wider">
                        Pending Ack
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

      </div>
      
      {selectedWarning && (
        <ViewWarningModal
          warning={selectedWarning}
          onClose={() => setSelectedWarning(null)}
          readOnly={true}
        />
      )}
    </div>
  );
}
