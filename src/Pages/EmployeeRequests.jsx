import { useState, useEffect, useMemo, Fragment } from "react";
import { API_BASE_URL } from "../config/api";
import { getFullUrl } from "../utils/urlHelper";
import { FiActivity, FiUser, FiCalendar, FiClock, FiCheckCircle, FiSend, FiCheck, FiAlertCircle, FiX, FiArrowLeft, FiFileText, FiCreditCard, FiInbox } from "react-icons/fi";
import EmployeeStatusModal from "../components/Employees/EmployeeStatusModal";
import Modal from "../components/Shared/Modal";

export default function EmployeeRequests() {
  const [requests, setRequests] = useState([]);
  const [bankApprovals, setBankApprovals] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
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
    refreshAll();
  }, []);

  const fetchRequests = async () => {
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
    }
  };

  const fetchBankApprovals = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/employee/lifecycle/pending-bank-approvals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBankApprovals(data || []);
      }
    } catch (err) {
      console.error("Error fetching bank approvals:", err);
    }
  };

  const fetchDocumentRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/document-requests/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocumentRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching document requests:", err);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchRequests(), fetchBankApprovals(), fetchDocumentRequests()]);
    setLoading(false);
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
        refreshAll();
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

  const handleApproveBank = async (empId) => {
    if (!window.confirm("Are you sure you want to approve this bank details change?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/employee/${empId}/approve-bank`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        refreshAll();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to approve bank details");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleRejectBank = async (empId) => {
    if (!window.confirm("Are you sure you want to reject this bank details change?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/employee/${empId}/reject-bank`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        refreshAll();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to reject bank details");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleFulfillDocument = async (reqId) => {
    if (!window.confirm("Approve and fulfill this document request?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/document-requests/${reqId}/fulfill`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        refreshAll();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to fulfill request");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleRejectDocument = async (reqId) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason === null) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/document-requests/${reqId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        refreshAll();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to reject request");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // --- MERGE & SORT LOGIC ---
  const combinedRequests = useMemo(() => {
    const exits = requests.map(emp => ({
      ...emp,
      categoryType: emp.withdrawalRequested ? 'withdrawal' : 'resignation',
      sortDate: new Date(emp.withdrawalRequested ? emp.withdrawalRequestDate : (emp.resignationRequestDate || emp.createdAt)).getTime(),
      isBank: false
    }));
    
    const banks = bankApprovals.map(emp => ({
      ...emp,
      categoryType: 'bank',
      sortDate: new Date(emp.updatedAt || emp.createdAt).getTime(),
      isBank: true
    }));

    const docs = documentRequests.map(doc => ({
      ...doc,
      categoryType: 'document',
      sortDate: new Date(doc.createdAt).getTime(),
      isDocument: true,
      profilePhoto: doc.employee?.profilePhoto,
      user: doc.employee?.user,
      employeeId: doc.employee?.employeeId,
    }));

    return [...exits, ...banks, ...docs].sort((a, b) => b.sortDate - a.sortDate);
  }, [requests, bankApprovals, documentRequests]);

  let lastCategory = null;

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-['Plus_Jakarta_Sans',sans-serif]">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600 rounded-md text-white shadow-sm">
                <FiInbox size={16} />
              </span>
              Personnel Inbox
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl">
              Review and authorize employee exits, withdrawals, and bank details modifications
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                  {combinedRequests.length} Pending
                </span>
             </div>
             <button 
                onClick={fetchHistory}
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm group"
                title="View History"
              >
                <FiClock size={18} className="group-hover:-rotate-90 transition-transform duration-300" />
              </button>
              <button 
                onClick={refreshAll}
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm group"
                title="Refresh"
              >
                <FiActivity size={18} className={`${loading ? "animate-spin text-emerald-600" : "group-hover:scale-110"} transition-transform`} />
              </button>
          </div>
        </div>

        {/* Unified Feed */}
        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : combinedRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm mt-4">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
              <FiCheckCircle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Inbox Zero</h3>
            <p className="text-slate-500 text-sm font-medium mt-2">You are all caught up! No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {/* Group requests by category */}
            {['document', 'withdrawal', 'resignation', 'bank'].map(catType => {
              const categoryRequests = combinedRequests.filter(req => req.categoryType === catType);
              if (categoryRequests.length === 0) return null;
              
              return (
                <div key={catType} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg shadow-sm ${
                      catType === 'bank' ? 'bg-emerald-100 text-emerald-600' : 
                      catType === 'document' ? 'bg-purple-100 text-purple-600' :
                      catType === 'withdrawal' ? 'bg-amber-100 text-amber-600' : 
                      'bg-indigo-100 text-indigo-600'
                    }`}>
                      {catType === 'bank' ? <FiCreditCard size={16} /> : 
                       catType === 'document' ? <FiFileText size={16} /> :
                       catType === 'withdrawal' ? <FiCheck size={16} /> : 
                       <FiSend size={16} />}
                    </div>
                    <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                      {catType === 'bank' ? 'Bank Details Updates' : 
                       catType === 'document' ? 'Document Requests' :
                       catType === 'withdrawal' ? 'Withdrawal Requests' : 
                       'Resignation Requests'}
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                  </div>

                  {/* List of Items */}
                  <div className="flex flex-col gap-3">
                    {categoryRequests.map(req => {
                      const isBank = req.isBank;
                      const isWithdrawal = req.categoryType === 'withdrawal';
                      
                      return (
                        <div key={`${req._id}-${req.categoryType}`} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow hover:border-indigo-200 transition-all p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          
                          <div className="flex items-center gap-3 w-full md:w-auto min-w-[220px]">
                              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {req.profilePhoto ? (
                                  <img src={getFullUrl(req.profilePhoto, API_BASE_URL)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-bold text-slate-400 text-sm">{req.user?.name?.charAt(0)}</span>
                                )}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{req.user?.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{req.employeeId}</p>
                                  <span className="text-slate-300 text-[10px]">•</span>
                                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                    <FiCalendar size={10} />
                                    {new Date(req.sortDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                          </div>

                          {/* Request Details */}
                          <div className="flex-1 w-full md:w-auto bg-slate-50/70 rounded-lg p-2.5 px-4 flex items-center text-sm border border-slate-100 overflow-hidden">
                             {req.isDocument ? (
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-semibold text-slate-700">Document: <span className="text-indigo-600">{req.documentType}</span></span>
                                  {req.documentType === 'Offer Letter' && (
                                    <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1"><FiAlertCircle size={10} /> Use Offer Letters Page</span>
                                  )}
                                </div>
                             ) : isBank ? (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 sm:gap-4 text-xs">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-slate-500">Proposed:</span>
                                    <span className="font-mono font-medium text-slate-800">{req.pendingBankDetails?.bankName || '—'}</span>
                                    <span className="text-slate-300 hidden sm:inline">|</span>
                                    <span className="font-mono font-medium text-slate-800">{req.pendingBankDetails?.accountNumber || '—'}</span>
                                  </div>
                                  {req.pendingBankDetails?.bankAccountProof && (
                                    <a href={getFullUrl(req.pendingBankDetails.bankAccountProof, API_BASE_URL)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 shrink-0">View Proof &rarr;</a>
                                  )}
                                </div>
                             ) : (
                                <span className="text-slate-600 italic truncate max-w-lg">"{isWithdrawal ? req.withdrawalRequestReason : req.resignationRequestReason || 'No reason provided'}"</span>
                             )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                            <button 
                              onClick={() => req.isDocument ? handleRejectDocument(req._id) : isBank ? handleRejectBank(req.employeeId) : setRejectingEmployee(req)}
                              className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <FiX size={14}/> Reject
                            </button>
                            <button 
                              onClick={() => req.isDocument ? handleFulfillDocument(req._id) : isBank ? handleApproveBank(req.employeeId) : handleManageStatus(req)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5"
                            >
                              <FiCheck size={14}/> {req.isDocument ? 'Fulfill' : isBank ? 'Approve' : 'Process'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {isStatusModalOpen && selectedEmployee && (
        <EmployeeStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            refreshAll();
          }}
          employee={selectedEmployee}
          onRefresh={refreshAll}
        />
      )}

      {/* Global History Modal */}
      {isHistoryModalOpen && (
        <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Personnel History Audit" maxWidth="max-w-2xl">
          <div className="w-full">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 -mt-2">Audit trail of all resignation & withdrawal actions taken</p>
             
             {historyLoading ? (
               <div className="py-20 text-center text-slate-400">Loading history...</div>
             ) : history.length === 0 ? (
               <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-tight">No history records found</div>
             ) : (
               <div className="max-h-[600px] overflow-y-auto space-y-3 pb-4 no-scrollbar">
                  {history.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:shadow transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                       <div className="flex items-start sm:items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0
                            ${item.status === 'applied' ? 'bg-blue-100 text-blue-600' : 
                              item.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                              item.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                             {item.status === 'applied' ? <FiSend size={14}/> : 
                              item.status === 'approved' ? <FiCheck size={14}/> :
                              item.status === 'rejected' ? <FiX size={14}/> :
                              <FiArrowLeft size={14}/>}
                          </div>
                          
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                               <span className={`text-[10px] font-black uppercase tracking-wider
                                 ${item.status === 'applied' ? 'text-blue-700' : 
                                   item.status === 'approved' ? 'text-emerald-700' : 
                                   item.status === 'rejected' ? 'text-rose-700' : 'text-slate-700'}`}>
                                 {item.type} {item.status}
                               </span>
                               <span className="text-slate-300 text-[10px] hidden sm:inline">•</span>
                               <span className="text-xs font-bold text-slate-900">{item.employeeName}</span>
                               <span className="text-[10px] text-slate-500 font-bold">({item.employeeId})</span>
                             </div>
                             
                             <div className="text-xs text-slate-600 italic mt-1 sm:mt-0.5 leading-relaxed">
                                "{item.reason || item.adminRemarks || 'No reason provided'}"
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center self-start sm:self-auto gap-1.5 shrink-0 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 ml-11 sm:ml-0">
                          <FiCalendar size={11} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500 uppercase">
                             {new Date(item.date || item.actedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
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
