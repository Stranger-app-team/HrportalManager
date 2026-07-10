import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiSettings,
  FiUser,
  FiLink,
  FiChevronLeft,
  FiBriefcase,
  FiFileText,
  FiLayers,
  FiTarget,
  FiActivity,
  FiTag,
  FiMonitor,
  FiHome
} from "react-icons/fi";

import { IndianRupee } from "lucide-react";

import { API_BASE_URL } from "./config/api";
import { getFullUrl } from "./utils/urlHelper";
import NotificationBell from "./components/Shared/NotificationBell";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState({ name: "Admin", role: "HR Manager", profilePhoto: null });
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const dropdownRef = useRef(null);
   const location = useLocation();
  const navigate = useNavigate();

  const [selectedCompany, setSelectedCompany] = useState(
  JSON.parse(localStorage.getItem("selectedCompany"))
);
useEffect(() => {
  const updateCompany = () => {
    const company = JSON.parse(localStorage.getItem("selectedCompany"));
    if (company) {
      setSelectedCompany(company);
    }
  };

  // initial load
  updateCompany();

  // listen for instant update
  window.addEventListener("companyChanged", updateCompany);

  return () => {
    window.removeEventListener("companyChanged", updateCompany);
  };
}, []);

  const getPageIdentity = (path) => {
    if (path === "/dashboard") return { title: "Dashboard", sub: "Enterprise Performance Overview" };
    if (path.includes("/employees")) return { title: "Employees", sub: "Personnel Management & Records" };
    if (path.includes("/attendance")) return { title: "Attendance Portal", sub: "Real-time Tracking" };
    if (path.includes("/assets")) return { title: "Hardware Assets", sub: "Lifecycle Tracking & Inventory" };
    if (path.includes("/payments")) return { title: "Draft Payroll", sub: "Review & Authorize Disbursements" };
    if (path.includes("/accounts")) return { title: "Financial Accounts", sub: "Enterprise Revenue & Expense" };
    if (path.includes("/tickets")) return { title: "Ticket Management", sub: "Monitor & Resolve Requests" };
    if (path.includes("/companies")) {
  if (path.match(/\/companies\/[a-f0-9]{24}$/i)) {
    return {
      title: selectedCompany?.companyName || "Organization Intel",
      sub: selectedCompany?.address || "Entity Deep-Dive & Hierarchy"
    };
  }
  return { title: "Organizations", sub: "Manage Associated Entities" };
}
    if (path.includes("/jd-requirement")) return { title: "Job Requirements", sub: "Talent Acquisition & Planning" };
    if (path.includes("/approvals")) return { title: "Leave Approval", sub: "Manage Employee Time-off" };
    if (path.includes("/settings")) return { title: "Settings", sub: "System Configuration & Access" };
    if (path.includes("/admin-profile")) return { title: "Admin Identity", sub: "Manage Your System Profile" };
    if (path.includes("/profile/")) return { title: "Employee Profile", sub: "Identity & Professional Records" };
    if (path.includes("/departments")) return { title: "Business Units", sub: "Departments & Team Structure" };
    if (path.includes("/add-employee")) return { title: "Talent Onboarding", sub: "Register New Personnel" };
    if (path.includes("/edit-employee")) return { title: "Personnel Update", sub: "Modify Existing Records" };
    if (path.includes("/manage-employee")) return { title: "Employee Lifecycle", sub: "Advanced Personnel Management" };
    if (path.includes("/add-company")) return { title: "Entity Expansion", sub: "Register New Organization" };
    if (path.includes("/add-department")) return { title: "Structure Management", sub: "Create Business Unit" };
    if (path.includes("/wfh-requests")) return { title: "Remote Work", sub: "Manage WFH Applications & Policy" };
    if (path.includes("/offer-letters")) return { title: "Offer Letters", sub: "Pending Approvals & Letter History" };
    return { title: "Manager Portal", sub: "Team Management System" };

  };

  const { title, sub } = getPageIdentity(location.pathname);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));

    // Check authentication and authorization
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    if (storedUser.userType !== "manager") {
      localStorage.clear();
      navigate("/login");
      return;
    }

    if (storedUser.userType === "accounts" && location.pathname === "/dashboard") {
      navigate("/dashboard/accounts");
      return;
    }

    try {
      setUser(storedUser);
    } catch(e) {}
    
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || !token) return;

        let endpoint = "";
        if (storedUser.userType === "hr") endpoint = "/hr/profile";
        else if (storedUser.userType === "manager") endpoint = "/manager/profile";
        else return;

        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
          return;
        }

        const data = await res.json();

        if (data.success) {
          const profileData = data.data;
          const name = profileData.userId?.name || profileData.user?.name || storedUser.name;
          const userType = profileData.userId?.userType || profileData.user?.userType || storedUser.userType;
          
          setUser({
            ...storedUser,
            name: name,
            userType: userType,
            profilePhoto: profileData.profilePhoto ? profileData.profilePhoto : null
          });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserProfile();

    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/company`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setCompanies(data.company || []);
        if (data.company?.length > 0) {
           const saved = localStorage.getItem("selectedCompanyId");
           setSelectedCompanyId(saved || data.company[0]._id);
        }
      } catch (err) { console.error(err); }
    };
    fetchCompanies();

    const fetchRequestsCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/employee`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const pending = (data || []).filter(emp => emp.resignationRequested || emp.withdrawalRequested).length;
        setPendingRequests(pending);
      } catch (err) { console.error(err); }
    };
    fetchRequestsCount();

    const handleOutsideClick = (e) => {
       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setSelectedCard(null);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const [pendingRequests, setPendingRequests] = useState(0);

  const handleCompanyChange = (id) => {
    setSelectedCompanyId(id);
    localStorage.setItem("selectedCompanyId", id);
    window.location.reload();
  };

  const navClass = ({ isActive }) =>
    `group relative w-full flex items-center gap-2.5 px-3.5 py-2 rounded-md font-[600] transition-all duration-200
     ${
       isActive
         ? "bg-white/10 text-white shadow-sm"
         : "text-slate-400 hover:bg-white/5 hover:text-white"
     } ${isCollapsed ? "md:justify-center md:px-0 md:mx-auto" : "mb-0.5"}`;

  const activeIndicator = "absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full transition-all";

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const getInitials = (name) => {
    if (!name) return "AD";
    const words = name.trim().split(" ");
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col md:flex-row bg-[#F8FAFC] overflow-hidden">
      
      {/* ========== MOBILE HEADER ========== */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#061633] border-b border-white/5 z-[60]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <FiTarget className="text-white" size={18} />
          </div>
          <h1 className="text-sm font-[800] text-white tracking-tight uppercase">MANAGER PORTAL</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-9 h-9 flex items-center justify-center text-white bg-white/5 rounded-md"
        >
          {isMobileMenuOpen ? <FiChevronLeft size={20} /> : (
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-white"></div>
              <div className="w-5 h-0.5 bg-white"></div>
              <div className="w-5 h-0.5 bg-white"></div>
            </div>
          )}
        </button>
      </div>

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-[80px]" : "md:w-[260px]"} 
          fixed md:relative top-0 left-0 w-[260px] md:w-auto h-[100dvh] bg-[#061633] flex flex-col transition-all duration-300 overflow-hidden z-[55] border-r border-white/5
        `}
      >
        {/* LOGO SECTION */}
        <div className={`hidden md:flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-5 mb-1`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
               <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center shadow-md">
                  <FiTarget className="text-white" size={16} />
               </div>
               <h1 className="text-md font-[800] text-white tracking-tight uppercase">MANAGER PORTAL</h1>
            </div>
          )}
          {isCollapsed && <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white font-black text-md">P</div>}
          
          {(isCollapsed || isMobileMenuOpen) && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-6 h-6 bg-white/5 text-slate-400 rounded-md flex items-center justify-center hover:bg-white/10 hover:text-white transition-all border border-white/5"
            >
              <FiChevronLeft className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} size={12} />
            </button>
          )}
        </div>

        {/* ORGANIZATION SWITCHER */}
        {/* {(!isCollapsed || isMobileMenuOpen) && companies.length > 0 && (
          <div className="px-5 mb-6 mt-6 md:mt-0">
             <div className="bg-white/5 border border-white/10 rounded-xl p-1.5 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                <select 
                   className="w-full bg-transparent text-white text-[11px] font-bold outline-none cursor-pointer p-0.5"
                  value={selectedCompanyId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                >
                  {companies.map(c => <option key={c._id} value={c._id} className="text-black">{c.companyName}</option>)}
                </select>
             </div>
          </div>
        )} */}

        {/* NAV SCROLL AREA */}
        <div className="flex-1 px-4 overflow-y-auto no-scrollbar pt-2">
          {(!isCollapsed || isMobileMenuOpen) && <p className="text-[10px] font-black text-slate-500 px-4 mb-4 tracking-[0.3em] uppercase opacity-60">Operations</p>}
          
          {[
            { to: "/dashboard", icon: FiGrid, label: "Dashboard", end: true },
            { to: "/dashboard/employees", icon: FiUsers, label: "Employees" },
            { to: "/dashboard/attendance", icon: FiActivity, label: "Attendance" },
            { to: "/dashboard/tickets", icon: FiTag, label: "Tickets" },
            { divider: "Team Management" },
            { to: "/dashboard/jd-requirement", icon: FiFileText, label: "Job Requirements" },
            { to: "/dashboard/approvals", icon: FiCalendar, label: "Leave Approval" },
            { 
              to: "/dashboard/employee-requests", 
              icon: FiActivity, 
              label: "Employee Requests", 
              hidden: pendingRequests === 0,
              badge: true 
            },
            { to: "/dashboard/wfh-requests", icon: FiHome, label: "WFH Requests" },
            { to: "/dashboard/offer-letters", icon: FiFileText, label: "Offer Letters", badge: true },
          ].filter(item => !item.hidden).map((item, idx) => {

            if (item.divider) {
              return (!isCollapsed || isMobileMenuOpen) ? (
                <p key={idx} className="text-[10px] font-black text-slate-500 px-4 mt-8 mb-4 tracking-[0.3em] uppercase opacity-60">{item.divider}</p>
              ) : null;
            }
            return (
              <NavLink 
                key={item.to} 
                to={item.to} 
                end={item.end} 
                className={navClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (!isCollapsed || isMobileMenuOpen) && <div className={activeIndicator} />}
                    <div className="relative">
                      <item.icon size={20} className={isActive ? "text-blue-400" : ""} />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#061633] animate-pulse" />
                      )}
                    </div>
                    {(!isCollapsed || isMobileMenuOpen) && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* PROFILE MINI FOOTER */}
        <div className={`mt-auto p-4 ${isCollapsed ? "md:flex md:justify-center" : ""}`}>
           <div className={`bg-white/5 rounded-lg p-3 border border-white/5 ${isCollapsed ? "md:w-12 md:h-12 md:p-0 md:flex md:items-center md:justify-center md:overflow-hidden" : ""}`}>
              <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center text-white font-black shadow-lg overflow-hidden">
                    {user?.profilePhoto ? (
                      <img 
                        src={getFullUrl(user.profilePhoto, API_BASE_URL)} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      user?.name?.charAt(0)
                    )}
                  </div>
                 {(!isCollapsed || isMobileMenuOpen) && (
                   <div className="min-w-0">
                      <p className="text-[11px] font-[800] text-white truncate uppercase">{user?.name}</p>
                      <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">{user?.userType || "Administrator"}</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ========== PAGE CONTENT ========== */}
      <main className="flex-1 overflow-hidden flex flex-col h-full">
          {/* Top Decorative Border */}
          <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.5)] z-10" />
          
          {/* Global Header Bar */}
          <header className="bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between shrink-0 box-shadow-sm">
             <div>
                <h2 className="text-xl font-[900] text-slate-800 tracking-tight uppercase leading-tight">{title}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{sub}</p>
             </div>

             <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="relative" ref={dropdownRef}>
                   <button 
                     onClick={() => setSelectedCard(selectedCard === "avatar" ? null : "avatar")}
                     className="flex items-center gap-3 group transition-all"
                   >
                      <div className="text-right hidden sm:block">
                         <p className="text-[12.5px] font-black text-slate-700 leading-tight group-hover:text-blue-600 transition-colors uppercase">{user?.name}</p>
                         <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{user?.userType || "Administrator"}</p>
                      </div>
                      <div className="w-10 h-10 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-[14px] shadow-sm overflow-hidden border border-slate-100 ring-2 ring-white group-hover:ring-blue-100 transition-all">
                         {user?.profilePhoto ? (
                           <img 
                             src={getFullUrl(user.profilePhoto, API_BASE_URL)} 
                             alt="Profile" 
                             className="w-full h-full object-cover" 
                           />
                         ) : (
                           getInitials(user?.name)
                         )}
                      </div>
                   </button>

                   {selectedCard === "avatar" && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl border border-slate-100 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150">
                         <div className="px-4 py-2 border-b border-slate-50 mb-1 sm:hidden">
                            <p className="text-[11px] font-bold text-slate-800 uppercase">{user?.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{user?.userType}</p>
                         </div>
                         {/*
                         <button 
                            onClick={() => { navigate("/dashboard/admin-profile"); setSelectedCard(null); }}
                            className="w-full px-4 py-2 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase"
                         >
                            My Profile
                         </button>
                         <button 
                            onClick={() => { navigate("/dashboard/admin-profile", { state: { activeTab: "security" } }); setSelectedCard(null); }}
                            className="w-full px-4 py-2 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase"
                         >
                            Account Security
                         </button>
                         <div className="border-t border-slate-50 my-1" />
                         */}
                         <button 
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-[11px] font-bold text-rose-600 hover:bg-slate-50 transition-colors uppercase"
                         >
                            Logout
                         </button>
                      </div>
                   )}
                </div>
             </div>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
            <Outlet />
          </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { margin: 0; padding: 0; overflow: hidden; }
      `}</style>
    </div>
  );
}
