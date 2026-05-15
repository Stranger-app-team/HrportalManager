import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiGrid, 
  FiMenu, 
  FiFilter, 
  FiRefreshCw, 
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiMoreHorizontal,
  FiEye,
  FiCheck,
  FiX
} from "react-icons/fi";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function Tickets() {
  const [view, setView] = useState("list");
  const [openTicket, setOpenTicket] = useState(null);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companyMap, setCompanyMap] = useState({});
  const [companiesList, setCompaniesList] = useState([]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCompany, setFilterCompany] = useState(localStorage.getItem("selectedCompanyId") || "all");
  const [filterPriority, setFilterPriority] = useState("all");

  const [username, setUsername] = useState("");
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.userType?.toLowerCase();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login", { replace: true });
    
    const storedUsername = localStorage.getItem("username");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUsername(storedUsername || storedUser.name || "Admin");
    
    fetchCompanies();
    fetchTickets();
  }, [navigate]);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/company`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.company) {
        setCompaniesList(response.data.company);
        const map = {};
        response.data.company.forEach(c => {
          map[c._id] = c.companyName;
        });
        setCompanyMap(map);
      }
    } catch (err) {
      console.error("Fetch companies error:", err);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/tickets/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Tickets API Response:", response.data);
      
      if (Array.isArray(response.data)) {
        setAllTickets(response.data);
      } else if (response.data.success && Array.isArray(response.data.data)) {
        setAllTickets(response.data.data);
      } else if (response.data.tickets && Array.isArray(response.data.tickets)) {
        setAllTickets(response.data.tickets);
      }

    } catch (err) {
      console.error("Fetch tickets error:", err);
      setError("Failed to load tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API_BASE_URL}/tickets/${id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Update Status Response:", response.data);
      setOpenTicket(null);
      fetchTickets();
    } catch (err) {
      console.error("Update status error:", err);
      alert("Failed to update status");
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this ticket?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpenTicket(null);
      fetchTickets();
    } catch (err) {
      console.error("Delete ticket error:", err);
      alert("Failed to delete ticket. Only HR has this authority.");
    }
  };

  // Dynamic Stats Calculation - Filtered by Company
  const baseTickets = allTickets.filter(t => {
    const ticketId = t.companyId?._id || t.companyId;
    return filterCompany === "all" || ticketId === filterCompany;
  });

  const stats = {
    total: baseTickets.length,
    pending: baseTickets.filter(t => t.status === "Pending").length,
    inProgress: baseTickets.filter(t => t.status === "in-progress").length,
    resolved: baseTickets.filter(t => t.status === "resolved").length,
  };

  // Dynamic Company List for Filter
  const companies = ["all", ...new Set(allTickets.map(t => t.companyId?.companyName || companyMap[t.companyId]).filter(Boolean))];

  // Filtering Logic
  const filteredTickets = baseTickets.filter(t => {
    const matchesSearch = 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employee?.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.companyId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "in-progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "resolved": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "closed": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status) => {
    if (status === "in-progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-rose-500";
      case "medium": return "text-amber-500";
      case "low": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 overflow-hidden">

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-1">
        {[
          { label: "Total Tickets", value: stats.total, color: "blue", icon: <FiMoreHorizontal /> },
          { label: "Pending", value: stats.pending, color: "amber", icon: <FiClock /> },
          { label: "In Progress", value: stats.inProgress, color: "indigo", icon: <FiRefreshCw /> },
          { label: "Resolved", value: stats.resolved, color: "emerald", icon: <FiCheckCircle /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3.5 rounded-md border border-slate-200 shadow-sm flex items-center justify-between transition-standard hover:shadow-md">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-800">{stat.value}</h3>
            </div>
            <div className={`w-9 h-9 bg-${stat.color}-500/10 text-${stat.color}-600 rounded-md flex items-center justify-center`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-1 shadow-sm flex flex-wrap items-center justify-between mb-1">
        <div className="flex flex-wrap items-center gap-1 flex-1">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-sm relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search tickets..."
              className="w-full bg-slate-50 border border-transparent py-1.5 pl-9 pr-3 rounded text-[11px] font-bold outline-none focus:bg-white focus:border-blue-500/20 transition-all text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 py-1.5 px-3 rounded font-bold text-[10px] outline-none text-slate-600 focus:bg-white cursor-pointer transition-all"
            >
              <option value="all">Statuses</option>
              <option value="Pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select 
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="bg-slate-50 border border-slate-200 py-1.5 px-3 rounded font-bold text-[10px] outline-none text-slate-600 focus:bg-white cursor-pointer transition-all"
            >
              <option value="all">Companies</option>
              {companiesList.map(c => (
                <option key={c._id} value={c._id}>{c.companyName}</option>
              ))}
            </select>

            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 py-1.5 px-3 rounded font-bold text-[10px] outline-none text-slate-600 focus:bg-white cursor-pointer transition-all"
            >
              <option value="all">Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button 
            onClick={fetchTickets}
            className="p-1.5 bg-white border border-slate-200 rounded text-slate-500 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={14} />
          </button>

          {/* View Switcher */}
          <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded">
            <button 
              onClick={() => setView("list")}
              className={`p-1.5 rounded transition-all ${view === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <FiMenu size={14} />
            </button>
            <button 
              onClick={() => setView("grid")}
              className={`p-1.5 rounded transition-all ${view === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <FiGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List View */}
      {view === "list" ? (
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm border-b border-slate-200">
              <tr className="text-slate-500">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticket</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Priority</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket, i) => (
                <tr key={ticket._id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-standard">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-800 text-[13px]">{ticket.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {ticket._id?.slice(-6)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-[10px]">
                        {ticket.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-700">{ticket.user?.name || "Unknown"}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{ticket.user?.email || "No Email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
                        {ticket.companyId?.companyName || companyMap[ticket.companyId] || "N/A"}
                      </span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{ticket.employee?.department || "General"}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {ticket.priority || "Medium"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusBadge(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setOpenTicket(ticket)}
                      className="text-slate-400 hover:text-blue-600 transition-standard p-1.5 hover:bg-slate-100 rounded-md"
                    >
                      <FiEye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <FiAlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold tracking-wide uppercase italic">No tickets found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        /* Grid View - Professional Compact */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map(ticket => (
            <div key={ticket._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-standard group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${getStatusBadge(ticket.status)}`}>
                  {getStatusLabel(ticket.status)}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                   {ticket.priority}
                </span>
              </div>
              <h3 className="text-[14px] font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{ticket.title}</h3>
              <p className="text-slate-400 text-[12px] font-medium mb-4 line-clamp-2">{ticket.description}</p>
              
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-[9px] text-slate-500 font-bold">
                    {ticket.user?.name?.charAt(0)}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{ticket.user?.name}</span>
                </div>
                <button 
                  onClick={() => setOpenTicket(ticket)}
                  className="bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-standard"
                >
                  <FiEye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Details Modal */}
      {openTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpenTicket(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border mb-3 inline-block ${getStatusBadge(openTicket.status)}`}>
                    {getStatusLabel(openTicket.status)}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">{openTicket.title}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Ref: {openTicket._id}</p>
                </div>
                <button onClick={() => setOpenTicket(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-standard">
                  <FiX size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Requester</p>
                   <p className="font-bold text-slate-700 text-[13px]">{openTicket.user?.name}</p>
                   <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">ID: {openTicket.employee?.employeeId || "N/A"}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Organization</p>
                   <p className="font-bold text-slate-700 text-[13px]">{openTicket.companyId?.companyName || companyMap[openTicket.companyId] || "N/A"}</p>
                   <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">{openTicket.employee?.department || "General"}</p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <p className="text-slate-600 text-[13px] font-medium leading-relaxed italic line-clamp-4 hover:line-clamp-none transition-all cursor-default">
                    {openTicket.description}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                {openTicket.status === "Pending" && (
                  <button 
                    onClick={() => handleUpdateStatus(openTicket._id, "in-progress")}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-[10px] uppercase tracking-wider transition-standard flex items-center justify-center gap-2"
                  >
                    <FiRefreshCw size={14} /> Start Progress
                  </button>
                )}
                {(openTicket.status === "Pending" || openTicket.status === "in-progress") && (
                  <button 
                    onClick={() => handleUpdateStatus(openTicket._id, "resolved")}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[10px] uppercase tracking-wider transition-standard flex items-center justify-center gap-2"
                  >
                    <FiCheck size={14} /> Mark Resolved
                  </button>
                )}
                {openTicket.status === "resolved" && (
                   <button 
                    onClick={() => handleUpdateStatus(openTicket._id, "closed")}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-bold text-[10px] uppercase tracking-wider transition-standard flex items-center justify-center gap-2"
                  >
                    <FiX size={14} /> Close Ticket
                  </button>
                )}
                {userRole !== "manager" && (
                  <button 
                    onClick={() => handleDeleteTicket(openTicket._id)}
                    className="flex-1 py-2.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-md font-bold text-[10px] uppercase tracking-wider transition-standard flex items-center justify-center gap-2"
                  >
                    <FiX size={14} /> Delete Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}