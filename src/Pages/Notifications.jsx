import React, { useState, useEffect } from "react";
import { Bell, User, Lock, Check, RefreshCw, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function HRNotificationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const path = location.pathname;
  const isProfile       = path.endsWith("/profile");
  const isSecurity      = path.endsWith("/security");
  const isNotifications = path.endsWith("/notifications");

  const goTo = (page) => {
    const base = path.includes("/dashboard") ? "/dashboard" : "";
    navigate(`${base}/${page}`);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/notifications?all=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleNew = (e) => setNotifications(prev => [e.detail, ...prev]);
    window.addEventListener("new_notification", handleNew);
    return () => window.removeEventListener("new_notification", handleNew);
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications([]);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const cleanMessage = (n) => {
    let msg = n.message || "";
    let parts = msg.split(". Changes:");
    if (parts.length > 1) msg = parts[0] + ".";
    parts = msg.split(" bank details: ");
    if (parts.length > 1) msg = parts[0] + " bank details.";

    if (n.changes && n.changes.length > 0) {
      if (!msg.endsWith(':') && !msg.endsWith('.')) {
        msg += ':';
      } else if (msg.endsWith('.')) {
        msg = msg.slice(0, -1) + ':';
      }
      
      const changeStrings = n.changes.map(c => {
        const oldVal = typeof c.oldValue === "object" ? "..." : String(c.oldValue || "None");
        const newVal = typeof c.newValue === "object" ? "..." : String(c.newValue || "None");
        return `${c.field} changed from '${oldVal}' to '${newVal}'`;
      });
      
      msg += ' ' + changeStrings.join(', ') + '.';
    }

    return msg;
  };

  return (
    <div
      className="w-full min-h-full bg-[#F4F6FB] p-5 overflow-y-auto"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Top Bar (matches Profile exactly) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 sm:gap-0">
        <div>
          <h1 className="text-[15px] font-bold text-gray-900 tracking-widest uppercase">Settings</h1>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5">Manage your notifications</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <TabBtn
              active={isProfile}
              icon={<User size={12} />}
              label="Profile"
              onClick={() => goTo("profile")}
            />
            <TabBtn
              active={isSecurity}
              icon={<Lock size={12} />}
              label="Security"
              onClick={() => goTo("security")}
            />
            <TabBtn
              active={isNotifications}
              icon={<Bell size={12} />}
              label="Notifications"
              onClick={() => goTo("notifications")}
            />
          </div>
        </div>
      </div>

      {/* ── Main Card ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1A56DB] flex-shrink-0">
              <Bell size={13} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">Notifications</p>
              <p className="text-[10px] text-gray-400">
                {notifications.length > 0
                  ? `${notifications.length} unread notification${notifications.length > 1 ? "s" : ""}`
                  : "No new notifications"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap mt-2 sm:mt-0">
            <button
              onClick={fetchNotifications}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={markAllAsRead}
              disabled={notifications.length === 0}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-[11px] sm:text-[12px] font-bold text-white bg-[#1A56DB] hover:bg-blue-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={12} />
              Mark all as read
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="min-h-[300px] p-4 space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 flex gap-3 animate-pulse">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Bell size={22} className="text-[#1A56DB]" />
              </div>
              <p className="text-sm font-bold text-gray-800">You're all caught up</p>
              <p className="text-[12px] text-gray-400 mt-1">No new notifications to show right now.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n._id}
                className="relative border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors bg-blue-50/20 shadow-sm"
              >
                <div className="flex gap-3">
                  {/* Blue dot */}
                  <div className="shrink-0 mt-1.5">
                    <div className="w-2 h-2 bg-[#1A56DB] rounded-full" />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    {/* Title + date */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                      <p className="text-[13px] font-bold text-gray-900">{n.title}</p>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-medium whitespace-nowrap shrink-0">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-[12px] text-gray-600 mt-0.5">{cleanMessage(n)}</p>

                    {/* Employee ID */}
                    {n.employeeId && (
                      <span className="text-[10px] text-gray-400 font-medium mt-1.5 block uppercase tracking-wide">
                        Emp ID: <span className="font-bold text-gray-600">{n.employeeId}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => markAsRead(n._id)}
                  className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Dismiss"
                >
                  <X size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
      `}</style>
    </div>
  );
}

/* ── TabBtn — exact copy from Profile ── */
function TabBtn({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
        active
          ? "bg-[#1A56DB] text-white shadow-sm"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
    >
      {icon} {label}
    </button>
  );
}
