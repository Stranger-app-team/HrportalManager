import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { FiCheckCircle, FiXCircle, FiClock, FiLoader, FiShield, FiAlertTriangle } from "react-icons/fi";
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <FiShield className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Team Asset Approvals</h1>
            <p className="text-sm text-slate-500">Review equipment requests from your direct reports.</p>
          </div>
        </div>
        <button 
          onClick={() => {
            const allHistory = requests.flatMap(r => 
              (r.history || []).map(h => ({
                ...h, 
                requestContext: `${r.requesterId?.firstName || ''} ${r.requesterId?.lastName || ''} - ${r.requestType}`
              }))
            ).sort((a, b) => new Date(b.date) - new Date(a.date));
            setSelectedHistory(allHistory);
            setShowHistoryModal(true);
          }}
          className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
        >
          <FiClock size={16} />
          View All History
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 shadow-sm mt-8">
          <FiCheckCircle size={64} className="text-emerald-400 mb-6" />
          <h2 className="text-xl font-semibold text-slate-700">All caught up!</h2>
          <p className="mt-2 text-slate-500 text-center">There are no pending asset requests for your team.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl">
          {requests.map(request => (
            <div key={request._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Header */}
              <div className="bg-slate-50/50 p-5 border-b border-slate-100 flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
                    {request.requesterId?.firstName?.[0]}{request.requesterId?.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">
                      {request.requesterId?.firstName} {request.requesterId?.lastName}
                    </h3>
                    <div className="flex items-center space-x-3 mt-1 text-xs">
                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">Type: {request.requestType}</span>
                      <span className="text-slate-500 flex items-center"><FiClock className="mr-1"/> {new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wider`}>
                      {request.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Justification */}
              {request.reason && (
                <div className="px-5 py-4 border-b border-slate-100 bg-amber-50/30">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1 flex items-center">
                    <FiAlertTriangle className="mr-1.5" /> Justification
                  </p>
                  <p className="text-sm text-slate-700 italic">"{request.reason}"</p>
                </div>
              )}

              {/* Items Table */}
              <div className="p-5">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="pb-3 px-2">Requested Item</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2 text-right">Approval Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {request.items.map(item => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-2 font-medium text-slate-800">
                           <div className="flex flex-col gap-1 items-start">
                             <span>{item.assetId?.assetName || (item.bundleId ? `Legacy Bundle Request` : 'Unknown Asset')}</span>
                             {item.bundleId && item.assetId && (
                               <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                 BUNDLE: {item.bundleId.bundleName}
                               </span>
                             )}
                           </div>
                        </td>
                        <td className="py-3 px-2">
                           {item.status === 'PENDING_MANAGER' ? (
                             <span className="text-orange-600 font-medium">Awaiting Your Review</span>
                           ) : (
                             <span className="text-slate-500 font-medium">{item.status}</span>
                           )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {item.status === 'PENDING_MANAGER' && (
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => {
                                  setRejectingItem({ requestId: request._id, itemId: item._id });
                                  setShowRejectModal(true);
                                }}
                                className="flex items-center px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                              >
                                <FiXCircle className="mr-1.5" size={14} /> Reject
                              </button>
                              <button 
                                onClick={() => handleApprove(request._id, item._id)}
                                className="flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                              >
                                <FiCheckCircle className="mr-1.5" size={14} /> Approve
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Reason for Rejection</h3>
              <p className="text-sm text-slate-500 mt-1">Please provide a reason to the employee.</p>
            </div>
            <form onSubmit={submitRejection} className="p-5">
              <textarea
                required
                rows="3"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:border-red-500 transition-colors resize-none"
                placeholder="e.g., We are not upgrading equipment this quarter."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingItem(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 flex items-center text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Request History</h3>
                <p className="text-xs text-slate-500 mt-0.5">Timeline of actions for this request</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {selectedHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FiClock className="mx-auto text-slate-300 mb-3" size={32} />
                  <p className="text-sm text-slate-500">No history events found for this request.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedHistory.map((item, index) => (
                    <div key={index} className="flex gap-4 relative">
                      {index !== selectedHistory.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-slate-100"></div>
                      )}
                      
                      <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center flex-shrink-0 z-10 text-blue-600">
                        <FiCheckCircle size={14} />
                      </div>
                      
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-slate-800 text-sm">{item.action}</h4>
                          <span className="text-xs font-medium text-slate-400">{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        {item.requestContext && <p className="text-xs font-bold text-slate-500 mt-0.5">{item.requestContext}</p>}
                        <p className="text-xs font-medium text-blue-600 mt-1 mb-1.5 inline-block px-2 py-0.5 bg-blue-50 rounded">Status: {item.status}</p>
                        <p className="text-sm text-slate-600">{item.comment}</p>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          By <span className="font-medium text-slate-500 capitalize">{item.updatedByRole}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
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
