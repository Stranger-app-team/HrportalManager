import { useState, useEffect, useRef } from "react";
import { FiBell, FiCheck, FiInfo, FiCreditCard, FiUserCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30s

    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    const handleNewNotification = (e) => {
      const newNotif = e.detail;
      setNotifications(prev => [newNotif, ...prev]);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("new_notification", handleNewNotification);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("new_notification", handleNewNotification);
    };
  }, []);

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
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
        setNotifications([]);
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

  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
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
        const oldVal = typeof c.oldValue === "object" ? "..." : String(c.oldValue || 'None');
        const newVal = typeof c.newValue === "object" ? "..." : String(c.newValue || 'None');
        return `${c.field} changed from '${oldVal}' to '${newVal}'`;
      });
      
      msg += ' ' + changeStrings.join(', ') + '.';
    }

    return msg;
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-md bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors border border-slate-100 relative"
      >
        <FiBell size={20} className={unreadCount > 0 ? "animate-[swing_1s_ease-in-out_infinite]" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-16 right-2 left-2 sm:left-auto sm:absolute sm:top-auto sm:right-0 sm:mt-2 sm:w-80 sm:max-w-sm bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[100] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[28rem] overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <FiBell className="mx-auto mb-2 opacity-30" size={24} />
                <p className="text-[10px] font-bold uppercase tracking-wider">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className="px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 flex gap-3 group relative transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[11.5px] font-black text-slate-700 leading-tight uppercase truncate" title={n.title}>{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2" title={cleanMessage(n)}>{cleanMessage(n)}</p>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide block mt-1">{getRelativeTime(n.createdAt || new Date())}</span>
                  </div>
                  <button
                    onClick={(e) => markAsRead(n._id, e)}
                    className="absolute right-3 top-3 w-5 h-5 rounded bg-slate-50 hover:bg-green-50 text-slate-400 hover:text-green-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                    title="Mark as read"
                  >
                    <FiCheck size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-slate-50 flex justify-center mt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/dashboard/notifications");
              }}
              className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider flex items-center gap-1.5"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
