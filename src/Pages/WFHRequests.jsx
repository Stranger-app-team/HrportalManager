import React, { useState, useEffect } from "react";
import { 
  FiSearch, 
  FiFilter, 
  FiCheckCircle, 
  FiXCircle, 
  FiCalendar, 
  FiUser, 
  FiBriefcase,
  FiClock,
  FiInfo,
  FiHome,
  FiMoreVertical,
  FiCheck,
  FiX,
  FiMousePointer,
  FiType,
  FiZap,
  FiActivity,
  FiRefreshCw,
  FiExternalLink,
  FiTrash2
} from "react-icons/fi";
import { API_BASE_URL } from "../config/api";
import { getFullUrl } from "../utils/urlHelper";
import moment from "moment-timezone";

const WFHRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Monitoring States
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const [monitoringData, setMonitoringData] = useState(null);
  const [fetchingMonitor, setFetchingMonitor] = useState(false);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/attendance/wfh-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const sortedData = data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRequests(sortedData);
      } else {
        alert(data.message || "Failed to fetch requests");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while fetching requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, status, reason = "") => {
    try {
      setProcessingId(id);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/attendance/wfh-request/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Request ${status} successfully`);
        fetchRequests();
        setShowRejectModal(false);
        setRejectionReason("");
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this WFH request? This action cannot be undone.")) return;

    try {
      setProcessingId(id);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/attendance/wfh-request/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert("Request deleted successfully");
        fetchRequests();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  const fetchMonitoringData = async (request) => {
    try {
      setFetchingMonitor(true);
      setSelectedRequest(request);
      setShowMonitorModal(true);
      
      const token = localStorage.getItem("token");
      const userId = request.user?._id || request.user;
      const res = await fetch(`${API_BASE_URL}/attendance/employee/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const targetDate = moment(request.wfhDate).format("YYYY-MM-DD");
        const dayRecord = data.data.find(r => moment(r.date).format("YYYY-MM-DD") === targetDate);
        setMonitoringData(dayRecord || null);
      }
    } catch (err) {
      console.error("Monitor Error:", err);
    } finally {
      setFetchingMonitor(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "rejected": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-3 overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
        {/* TOP SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Requests", value: stats.total, icon: FiActivity, color: "blue" },
            { label: "Pending Review", value: stats.pending, icon: FiClock, color: "amber" },
            { label: "Approved", value: stats.approved, icon: FiCheckCircle, color: "emerald" },
            { label: "Rejected", value: stats.rejected, icon: FiXCircle, color: "rose" },
          ].map((stat, i) => (
            <div 
              key={i} 
              className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 h-[74px] shadow-sm hover:shadow-md shadow-slate-200/40 transition-all"
            >
              <div className={`w-9 h-9 rounded-md bg-${stat.color}-500/10 text-${stat.color}-600 flex items-center justify-center shrink-0`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{stat.label}</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{stat.value}</h2>
                  <span className="text-[7px] text-slate-300 font-bold uppercase">Requests</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH BAR AND FILTERS */}
        <div className="mt-1 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-2.5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full max-w-4xl">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search by name or ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-[11px] font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-md">
                {["all", "pending", "approved", "rejected"].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-tight transition-all ${
                      statusFilter === status 
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button 
                onClick={fetchRequests}
                className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                title="Refresh Requests"
              >
                <FiRefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-lg border border-slate-100 overflow-hidden shadow-lg shadow-slate-200/40 mt-1">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500">
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Employee Info</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">WFH Date</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Reason / Notes</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-center">Tracking</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-center">Status</th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-100">
                      <td colSpan={6} className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                          <FiHome size={24} />
                        </div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">No requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-all group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0">
                            {req.employee?.profilePhoto ? (
                              <img src={getFullUrl(req.employee.profilePhoto, API_BASE_URL)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              req.name?.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-slate-700 leading-tight">{req.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{req.employeeId || "No ID"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <FiCalendar className="text-blue-500" size={14} />
                          <span className="text-[12px] font-semibold">{moment(req.wfhDate).format("DD MMM YYYY")}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[12px] text-slate-600 line-clamp-1 font-medium">{req.reason}</p>
                          {req.rejectionReason && (
                            <p className="text-[9px] text-rose-500 font-bold uppercase">Rejection: {req.rejectionReason}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${req.trackingEnabled ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          {req.trackingEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === "pending" ? (
                            <>
                              <button
                                onClick={() => handleAction(req._id, "approved")}
                                disabled={processingId === req._id}
                                className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                                title="Approve"
                              >
                                <FiCheck size={16} />
                              </button>
                              <button
                                onClick={() => { setSelectedRequest(req); setShowRejectModal(true); }}
                                disabled={processingId === req._id}
                                className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-md hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                                title="Reject"
                              >
                                <FiX size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              {req.status === "approved" && (
                                <button
                                  onClick={() => fetchMonitoringData(req)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all group/btn"
                                >
                                  <FiActivity size={12} className="group-hover/btn:animate-pulse" />
                                  Monitor
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDelete(req._id)}
                                disabled={processingId === req._id}
                                className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-md hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                                title="Delete Request"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monitoring Modal */}
      {showMonitorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMonitorModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20">
                    {selectedRequest?.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">Live WFH Monitoring</h3>
                    <p className="text-[11px] text-slate-400 font-medium uppercase mt-0.5">{selectedRequest?.name} • {moment(selectedRequest?.wfhDate).format("DD MMM")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => fetchMonitoringData(selectedRequest)}
                    className={`p-2 rounded-lg text-slate-400 hover:bg-slate-50 transition-all ${fetchingMonitor ? 'animate-spin text-blue-500' : ''}`}
                  >
                    <FiRefreshCw size={18} />
                  </button>
                  <button onClick={() => setShowMonitorModal(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 transition-all">
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              {!monitoringData ? (
                <div className="py-12 flex flex-col items-center gap-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm">
                    <FiZap size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">No Active Session Found</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Tracking starts once the employee checks in.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${monitoringData.isOnline ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${monitoringData.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${monitoringData.isOnline ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {monitoringData.isOnline ? 'Active Now' : 'Currently Offline'}
                        </p>
                        {monitoringData.lastActivityAt && (
                          <p className="text-[10px] text-slate-400 font-medium">Last activity: {moment(monitoringData.lastActivityAt).fromNow()}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Check-In</p>
                      <p className="text-sm font-black text-slate-800">
                        {monitoringData.checkIn ? moment(monitoringData.checkIn).format("hh:mm A") : "--:--"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Check-Out</p>
                      <p className="text-sm font-black text-slate-800">
                        {monitoringData.checkOut 
                          ? moment(monitoringData.checkOut).format("hh:mm A") 
                          : (moment(monitoringData.date).startOf('day').isBefore(moment().startOf('day')) 
                            ? "Day Completed" 
                            : "Ongoing")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FiMousePointer size={24} />
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Mouse Events</p>
                      <p className="text-2xl font-black text-slate-800 tracking-tight">{monitoringData.mouseMovementCount || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FiType size={24} />
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Keyboard Events</p>
                      <p className="text-2xl font-black text-slate-800 tracking-tight">{monitoringData.keyboardPressCount || 0}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Activity Analysis</p>
                        {(() => {
                          const startTime = moment(monitoringData.checkIn);
                          const endTime = monitoringData.checkOut ? moment(monitoringData.checkOut) : moment();
                          const totalSecs = Math.max(0, endTime.diff(startTime, 'seconds'));
                          const activeSecs = monitoringData.activeSeconds || 0;
                          const idleSecs = Math.max(0, totalSecs - activeSecs);
                          
                          return (
                            <div className="flex gap-3">
                              <span className="text-[10px] font-bold text-blue-600">Active: {Math.floor(activeSecs / 60)}m</span>
                              <span className="text-[10px] font-bold text-amber-600">Other Tab: {Math.floor(idleSecs / 60)}m</span>
                            </div>
                          );
                        })()}
                      </div>
                      <p className="text-[10px] font-black text-slate-400">
                        {Math.round(((monitoringData.activeSeconds || 0) / ((monitoringData.activeSeconds || 1) + (monitoringData.idleSeconds || 0))) * 100)}% Productive
                      </p>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((monitoringData.activeSeconds || 0) / ((monitoringData.activeSeconds || 1) + (monitoringData.idleSeconds || 0))) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setShowMonitorModal(false)}
                className="w-full py-4 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
              >
                Close Monitoring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Reject WFH Request</h3>
                <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600"><FiX size={20} /></button>
              </div>
              <textarea
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-medium resize-none"
                placeholder="Reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2 text-[11px] font-bold text-slate-500 uppercase">Cancel</button>
                <button onClick={() => handleAction(selectedRequest._id, "rejected", rejectionReason)} className="flex-[2] py-2 bg-rose-600 text-white text-[11px] font-bold uppercase rounded-lg">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Badge */}
      {stats.pending > 0 && (
        <div className="fixed bottom-6 right-6 bg-[#061633] text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce border border-white/10 z-50">
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{stats.pending} Pending</span>
        </div>
      )}

      <style>{`
        .bg-emerald-50 { background-color: #ecfdf5; }
        .text-emerald-600 { color: #059669; }
        .border-emerald-100 { border-color: #d1fae5; }
        .bg-emerald-600 { background-color: #059669; }
        .bg-amber-50 { background-color: #fffbeb; }
        .text-amber-600 { color: #d97706; }
        .border-amber-100 { border-color: #fef3c7; }
        .bg-rose-50 { background-color: #fff1f2; }
        .text-rose-600 { color: #e11d48; }
        .border-rose-100 { border-color: #ffe4e6; }
        .bg-rose-600 { background-color: #e11d48; }
        .bg-rose-700 { background-color: #be123c; }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default WFHRequests;
