import { useState, useEffect } from "react";
import { FiBell, FiCheck, FiInfo, FiCreditCard, FiUserCheck, FiClock, FiActivity } from "react-icons/fi";
import { API_BASE_URL } from "../config/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("unread"); // "unread" or "all"
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (tab) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const url = `${API_BASE_URL}/notifications?all=${tab === "all" ? "true" : "false"}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        if (activeTab === "unread") {
          setNotifications((prev) => prev.filter((n) => n._id !== id));
        } else {
          setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
          );
        }
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        if (activeTab === "unread") {
          setNotifications([]);
        } else {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "bank_approval":
        return <FiCreditCard className="text-amber-500" size={16} />;
      case "profile_edit":
        return <FiUserCheck className="text-blue-500" size={16} />;
      default:
        return <FiInfo className="text-slate-500" size={16} />;
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        
        {/* Header - Compact & Matching Style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl font-[900] text-slate-800 tracking-tight uppercase flex items-center gap-2">
              <FiBell className="text-blue-600" size={18} />
              Notifications Centre
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Review history logs and profile changes audit details
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={markAllAsRead}
              disabled={notifications.filter(n => !n.isRead).length === 0}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 disabled:opacity-50 disabled:pointer-events-none text-xs font-black uppercase tracking-wider hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm flex items-center gap-1.5"
            >
              <FiCheck size={14} /> Mark All Read
            </button>
            <button 
              onClick={() => fetchNotifications(activeTab)}
              className="p-2 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
              title="Refresh"
            >
              <FiActivity size={16} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab("unread")}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "unread"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Unread Notifications
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "all"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            All History
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 w-full bg-white rounded-xl border border-slate-100 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
              <FiCheck size={32} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">All caught up</h3>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1">No pending notifications to review</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative ${
                  n.isRead ? "border-slate-200/80" : "border-blue-200 ring-1 ring-blue-50 bg-blue-50/10"
                }`}
              >
                {/* Left Section: Icon + Text Content */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[8px] font-black uppercase tracking-wider leading-none">
                          New
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <FiClock size={10} />
                        {formatDate(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                      {n.message}
                    </p>

                    {/* Audit details sub-box (renders inline inside the bar) */}
                    {n.changes && n.changes.length > 0 && (
                      <div className="mt-3 bg-slate-50/60 p-3 rounded-lg border border-slate-100 space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-200/50 pb-1">
                          Audited Changes
                        </span>
                        <div className="flex flex-wrap gap-3 max-h-36 overflow-y-auto pr-1">
                          {n.changes.map((c, idx) => (
                            <div key={idx} className="text-[10px] flex items-center gap-2 bg-white border border-slate-100 rounded px-2.5 py-1 shadow-sm">
                              <span className="font-bold text-slate-500 uppercase text-[8.5px] tracking-wide">{c.field}:</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="line-through text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-mono text-[9px]">
                                  {typeof c.oldValue === "object" ? JSON.stringify(c.oldValue) : String(c.oldValue)}
                                </span>
                                <span className="text-slate-400 text-[9px]">→</span>
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">
                                  {typeof c.newValue === "object" ? JSON.stringify(c.newValue) : String(c.newValue)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section: Metadata + CTA Action Button */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 w-full md:w-auto">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
                    {n.employeeId ? `Emp ID: ${n.employeeId}` : "System Event"}
                  </span>
                  
                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n._id)}
                      className="px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:border-blue-200 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <FiCheck size={13} /> Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
