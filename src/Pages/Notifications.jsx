import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { FiChevronDown, FiChevronUp, FiBell, FiCheck, FiRefreshCw } from "react-icons/fi";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.userType === 'accounts') {
      navigate('/dashboard/accounts');
    }
  }, [navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const url = `${API_BASE_URL}/notifications?all=false`;
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
    fetchNotifications();

    const handleNewNotification = (e) => {
      const newNotif = e.detail;
      setNotifications(prev => [newNotif, ...prev]);
    };

    window.addEventListener("new_notification", handleNewNotification);

    return () => {
      window.removeEventListener("new_notification", handleNewNotification);
    };
  }, []);

  const markAsRead = async (id) => {
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

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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

  const toggleExpand = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FiBell size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Manage your active system alerts. Read notifications are automatically removed.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchNotifications}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
                <button
                  onClick={markAllAsRead}
                  disabled={notifications.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiCheck size={14} />
                  Mark all as read
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white">
            {loading ? (
              <div className="divide-y divide-gray-100">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-6 flex gap-4 animate-pulse">
                    <div className="w-2 h-2 mt-2 rounded-full bg-gray-250 shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-550 mb-4">
                  <FiBell size={24} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">You're all caught up</h3>
                <p className="text-sm text-gray-500 mt-1">There are no new notifications to show right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <div key={n._id} className="p-6 flex gap-4 hover:bg-gray-50 transition-colors bg-blue-50/10">
                    <div className="shrink-0 mt-1.5">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{cleanMessage(n)}</p>
                        </div>
                        <span className="text-xs text-gray-550 whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded font-medium">{formatDate(n.createdAt)}</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                        {n.employeeId ? (
                          <span className="text-xs text-gray-500 font-medium">
                            Employee ID: <span className="font-bold text-gray-700">{n.employeeId}</span>
                          </span>
                        ) : (
                          <div />
                        )}
                        <button
                          onClick={() => markAsRead(n._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <FiCheck size={12} />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
