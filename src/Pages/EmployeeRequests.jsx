import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { getFullUrl } from "../utils/urlHelper";
import { FiActivity, FiUser, FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiSend, FiCheck, FiChevronRight, FiAlertCircle, FiX, FiArrowLeft ,FiFileText } from "react-icons/fi";
import EmployeeStatusModal from "../components/Employees/EmployeeStatusModal";
import Modal from "../components/Shared/Modal";

export default function EmployeeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rejectingEmployee, setRejectingEmployee] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/employee`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const pending = (data || []).filter(emp => emp.resignationRequested || emp.withdrawalRequested);
      setRequests(pending);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageStatus = (emp) => {
    setSelectedEmployee(emp);
    setIsStatusModalOpen(true);
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setIsHistoryModalOpen(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/employee/lifecycle/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectReason.trim()) return alert("Please provide a reason for rejection");
    setIsRejecting(true);
    try {
      const token = localStorage.getItem("token");
      const isWithdrawal = rejectingEmployee.withdrawalRequested;
      const endpoint = isWithdrawal ? 'reject-withdrawal' : 'reject-resignation';
      
      const res = await fetch(`${API_BASE_URL}/employee/${rejectingEmployee.employeeId}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      
      if (res.ok) {
        setRejectingEmployee(null);
        setRejectReason("");
        fetchRequests();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to reject request");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        
        {/* Header - Compact & Professional */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl font-[900] text-slate-800 tracking-tight uppercase flex items-center gap-2">
              <FiActivity className="text-blue-600" size={18} />
              Personnel Employee Approvals
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Review and authorize employee exit & withdrawal applications
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{requests.length} Pending Action(s)</span>
             </div>
             <button 
                onClick={fetchHistory}
                className="p-2 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                title="View History"
              >
                <FiClock size={16} />
              </button>
              <button 
                onClick={fetchRequests}
                className="p-2 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                title="Refresh"
              >
                <FiActivity size={16} />
              </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white rounded-lg border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-3">
              <FiCheckCircle size={32} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Queue Empty</h3>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1">No pending applications to review</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee Profile</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Request Type</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Application Details</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((emp) => {
                  const isWithdrawal = emp.withdrawalRequested;
                  const reason = isWithdrawal ? emp.withdrawalRequestReason : emp.resignationRequestReason;
                  const date = isWithdrawal ? emp.withdrawalRequestDate : emp.resignationRequestDate || emp.createdAt;
                  
                  return (
                    <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                            {emp.profilePhoto ? (
                              <img src={getFullUrl(emp.profilePhoto, API_BASE_URL)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-lg">
                                {emp.user?.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-black text-slate-800 leading-tight uppercase truncate">{emp.user?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${isWithdrawal ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {isWithdrawal ? <FiCheck size={10}/> : <FiSend size={10}/>}
                          {isWithdrawal ? 'Withdrawal' : 'Resignation'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="max-w-[300px]">
                          <p className="text-[11px] text-slate-600 font-medium italic line-clamp-1 group-hover:line-clamp-none transition-all">
                            "{reason || 'No reason provided'}"
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <FiCalendar size={10} className="text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Applied {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setRejectingEmployee(emp)}
                            className="px-3 py-2 rounded-md text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleManageStatus(emp)}
                            className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${isWithdrawal ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-blue-600 text-white hover:bg-blue-700'} shadow-sm`}
                          >
                            {isWithdrawal ? 'Approve Withdrawal' : 'Review & Process'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isStatusModalOpen && selectedEmployee && (
        <EmployeeStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            fetchRequests();
          }}
          employee={selectedEmployee}
          onRefresh={fetchRequests}
        />
      )}

      {/* Global History Modal */}
      {isHistoryModalOpen && (
        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Request History Audit">
          <div className="min-w-[500px]">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 -mt-2">Audit trail of all resignation & withdrawal actions taken</p>
             
             {historyLoading ? (
               <div className="py-20 text-center text-slate-400">Loading history...</div>
             ) : history.length === 0 ? (
               <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-tight">No history records found</div>
             ) : (
               <div className="max-h-[600px] overflow-y-auto pr-4 space-y-0 no-scrollbar pb-4">
                  {history.map((item, idx) => (
                    <div key={idx} className="relative pl-10 pb-8 last:pb-0 group">
                       {/* Timeline Line */}
                       <div className="absolute left-[15px] top-[24px] bottom-0 w-[2px] bg-slate-100 group-last:hidden" />
                       
                       {/* Timeline Dot */}
                       <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center z-10 transition-transform group-hover:scale-110
                        ${item.status === 'applied' ? 'bg-blue-600' : 
                          item.status === 'approved' ? 'bg-emerald-600' : 
                          item.status === 'rejected' ? 'bg-rose-600' : 'bg-slate-500'}`}>
                         {item.status === 'applied' ? <FiSend size={12} className="text-white"/> : 
                          item.status === 'approved' ? <FiCheck size={12} className="text-white"/> :
                          item.status === 'rejected' ? <FiX size={12} className="text-white"/> :
                          <FiArrowLeft size={12} className="text-white"/>}
                       </div>
                       
                       {/* Card */}
                       <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                             <div className="flex items-center gap-3">
                                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                                  ${item.status === 'applied' ? 'bg-blue-50 text-blue-700' : 
                                    item.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 
                                    item.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                                  {item.type} {item.status}
                                </div>
                                <div className="flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                   <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{item.employeeName}</span>
                                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">({item.employeeId})</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                <FiCalendar size={11} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-500 uppercase">
                                   {new Date(item.date || item.actedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                             </div>
                          </div>
                          
                          <div className="space-y-4">
                             <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                   <FiFileText size={10} /> Original Reason
                                </p>
                                <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                                   "{item.reason || 'No reason provided'}"
                                </p>
                             </div>

                             {item.adminRemarks && (
                               <div className="bg-slate-900/[0.02] rounded-xl p-4 border border-slate-100 border-dashed">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                     <FiActivity size={10} className="text-blue-500" /> Action Remarks
                                  </p>
                                  <p className="text-xs text-slate-800 font-bold leading-relaxed">{item.adminRemarks}</p>
                                  <div className="mt-2 flex items-center gap-1.5">
                                     <span className="text-[9px] text-slate-400 font-medium uppercase italic">Processed By Admin</span>
                                  </div>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        </Modal>
      )}

      {/* Reject Confirmation Modal */}
      {rejectingEmployee && (
        <Modal isOpen={!!rejectingEmployee} onClose={() => setRejectingEmployee(null)} title="Reject Request">
          <div className="min-w-[400px] space-y-4">
             <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <FiAlertCircle className="text-rose-600" size={20} />
                <div>
                   <p className="text-xs font-black text-rose-700 uppercase">Confirm Rejection</p>
                   <p className="text-[10px] text-rose-600 font-bold uppercase">Rejecting {rejectingEmployee.withdrawalRequested ? 'Withdrawal' : 'Resignation'} for {rejectingEmployee.user?.name}</p>
                </div>
             </div>
             
             <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Rejection Reason / Remarks</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  rows={3}
                  placeholder="Explain why this request is being rejected..."
                />
             </div>
             
             <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={() => setRejectingEmployee(null)}
                  className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRejectRequest}
                  disabled={isRejecting}
                  className="flex-[2] py-2 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50"
                >
                  {isRejecting ? "Processing..." : "Confirm Rejection"}
                </button>
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
