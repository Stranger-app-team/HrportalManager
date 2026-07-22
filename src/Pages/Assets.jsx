import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { FiCheckCircle, FiXCircle, FiClock, FiLoader, FiShield, FiAlertTriangle, FiBox, FiMessageSquare } from "react-icons/fi";
import { useSocket } from "../context/SocketContext";

export default function Assets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingItem, setRejectingItem] = useState(null); // { requestId, itemId }
  const [rejectionReason, setRejectionReason] = useState("");
  
  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  
  const socket = useSocket();

  useEffect(() => {
    fetchRequests();
  }, []);

  // Listen for real-time socket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      console.log("Socket: Asset request updated, refreshing dashboard...");
      fetchRequests();
    };
    
    socket.on('asset_request_updated', handleUpdate);
    
    return () => {
      socket.off('asset_request_updated', handleUpdate);
    };
  }, [socket]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // Fetch only requests pending for THIS manager
      const res = await fetch(`${API_BASE_URL}/asset-requests?status=PENDING_MANAGER&role=manager`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch requests error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, itemId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/asset-requests/${requestId}/manager-review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemReviews: [{ itemId, action: "APPROVE" }]
        })
      });
      
      if (res.ok) {
        fetchRequests(); // Refresh the list
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to approve request");
      }
    } catch (err) {
      console.error("Approval error", err);
    }
  };

  const submitRejection = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/asset-requests/${rejectingItem.requestId}/manager-review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemReviews: [{ itemId: rejectingItem.itemId, action: "REJECT", rejectionReason }]
        })
      });
      
      if (res.ok) {
        setShowRejectModal(false);
        setRejectingItem(null);
        setRejectionReason("");
        fetchRequests();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to reject request");
      }
    } catch (err) {
      console.error("Rejection error", err);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-slate-50"><FiLoader className="animate-spin text-blue-500" size={32} /></div>;
  }

  return (
    <div className="w-full h-full p-4 sm:p-6 bg-slate-50 overflow-y-auto">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center shrink-0">
              <FiShield className="text-blue-600" size={16} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Team Approvals</h1>
              <p className="text-[11px] text-slate-500 font-medium">Review equipment requests from your direct reports.</p>
            </div>
          </div>
          
          <button 
            title="View History"
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");
                const resReqs = await fetch(`${API_BASE_URL}/asset-requests?status=all&role=manager`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (resReqs.ok) {
                  const dataReqs = await resReqs.json();
                  if (Array.isArray(dataReqs)) {
                    const allHistory = dataReqs.flatMap(r => 
                      (r.history || []).map(h => ({
                        ...h, 
                        requestContext: `${r.requesterId?.name || (r.requesterId?.firstName ? `${r.requesterId.firstName} ${r.requesterId.lastName || ''}` : '')} - ${r.requestType}`
                      }))
                    ).sort((a, b) => new Date(b.date) - new Date(a.date));
                    setSelectedHistory(allHistory);
                    setShowHistoryModal(true);
                  }
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 p-1.5 rounded-md text-slate-600 transition-colors shadow-sm"
          >
            <FiClock size={16} className="text-slate-500" />
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <FiCheckCircle size={32} className="text-emerald-400 mb-3" />
            <h2 className="text-base font-bold text-slate-700">All caught up!</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">There are no pending asset requests for your team.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {requests.map(request => (
              <div key={request._id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                
                {/* Header: User Info */}
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/50">
                  <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs border border-blue-100 shrink-0 uppercase">
                    {request.requesterId?.name?.[0] || request.requesterId?.firstName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-[13px] truncate">
                      {request.requesterId?.name || (request.requesterId?.firstName ? `${request.requesterId.firstName} ${request.requesterId.lastName || ''}` : 'Unknown')}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{request.requestType}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-[9px] font-medium text-slate-400">{new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Body: Items and Reason */}
                <div className="p-2.5 flex-1 flex flex-col gap-2">
                  {request.items.map(item => (
                    <div key={item._id} className="bg-slate-50 rounded p-2 border border-slate-100 flex flex-col gap-1.5">
                      <div className="flex items-start gap-1.5">
                        <FiBox className="text-slate-400 mt-0.5 shrink-0" size={12} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] font-bold text-slate-700 leading-tight truncate flex items-center gap-1.5 flex-wrap">
                            {item.assetId?.assetName || (item.bundleId ? `Legacy Bundle Request` : 'Unknown Asset')}
                            {item.assetId?.condition && !item.bundleId && <span className="px-1 py-0.5 rounded bg-blue-50/80 border border-blue-100 text-blue-600 text-[8px] font-bold uppercase tracking-wider">{item.assetId.condition}</span>}
                          </span>
                          {item.bundleId && item.assetId && (
                            <span className="text-[9px] font-bold text-purple-600 mt-0.5 uppercase tracking-wide truncate">Bundle: {item.bundleId.bundleName}</span>
                          )}
                        </div>
                      </div>
                      
                      {item.status === 'PENDING_MANAGER' ? (
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 mt-0.5">
                          <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Needs Review
                          </span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => { setRejectingItem({ requestId: request._id, itemId: item._id }); setShowRejectModal(true); }}
                              className="px-2 py-1 text-[10px] font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                            >
                              <FiXCircle size={10} /> Reject
                            </button>
                            <button 
                              onClick={() => handleApprove(request._id, item._id)}
                              className="px-2 py-1 text-[10px] font-bold text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <FiCheckCircle size={10} /> Approve
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1.5 border-t border-slate-200/60 mt-0.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {request.reason && (
                    <div className="flex items-start gap-1.5 text-[10px] text-slate-500 px-1 pt-0.5">
                      <FiMessageSquare className="text-slate-400 shrink-0 mt-[1px]" size={10} />
                      <span className="italic leading-snug line-clamp-2">"{request.reason}"</span>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Reason for Rejection</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Please provide a reason to the employee.</p>
            </div>
            <form onSubmit={submitRejection} className="p-3">
              <textarea
                required
                rows="3"
                className="w-full bg-white border border-slate-200 rounded p-2 text-xs outline-none focus:border-red-500 transition-colors resize-none shadow-sm"
                placeholder="e.g., Equipment freeze this quarter."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingItem(null);
                    setRejectionReason("");
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectionReason.trim()}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Request History</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Timeline of actions</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="p-3 max-h-[50vh] overflow-y-auto">
              {selectedHistory.length === 0 ? (
                <div className="text-center py-6">
                  <FiClock className="text-slate-300 mx-auto mb-2" size={16} />
                  <p className="text-[11px] font-medium text-slate-500">No history events found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedHistory.map((item, index) => (
                    <div key={index} className="flex gap-3 relative">
                      {index !== selectedHistory.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-12px] w-[1px] bg-slate-100"></div>
                      )}
                      
                      <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center flex-shrink-0 z-10 text-blue-600">
                        <FiCheckCircle size={10} />
                      </div>
                      
                      <div className="flex-1 pb-1 pt-0.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800 text-[11px]">{item.action}</h4>
                          <span className="text-[9px] font-semibold text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        {item.requestContext && <p className="text-[9px] font-medium text-slate-500 mt-0.5">{item.requestContext}</p>}
                        
                        <div className="mt-1 bg-slate-50 rounded p-1.5 border border-slate-100">
                          <p className="text-[10px] text-slate-600">{item.comment}</p>
                          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-200">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Status: {item.status}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-200"></span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">
                              By {item.updatedByRole}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="px-3 py-1 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
