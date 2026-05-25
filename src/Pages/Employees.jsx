import React, { useState, useEffect, useRef } from "react";
import moment from 'moment-timezone';
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import Modal from "../components/Shared/Modal";
import ConfirmModal from "../components/Shared/ConfirmModal";
import CustomSelector from "../components/Shared/CustomSelector";
import { FiEye, FiEdit2, FiTrash2, FiSearch, FiUserMinus, FiGift, FiPlus, FiArrowDown, FiArrowUp, FiUsers, FiCalendar,FiLayers, FiClock, FiUserPlus, FiBox ,FiDownload, FiMoreVertical} from "react-icons/fi";
import AssetAssignmentModal from "../components/Employees/AssetAssignmentModal";
import EmployeeStatusModal from "../components/Employees/EmployeeStatusModal";
import EmployeeLifecycleModal from "../components/Employees/EmployeeLifecycleModal";
import AttendanceHistoryModal from "../components/Employees/AttendanceHistoryModal";
import { getFullUrl } from '../utils/urlHelper';

export default function Employees() {

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEmpForStatus, setSelectedEmpForStatus] = useState(null);
  
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);
  const [selectedEmpForLifecycle, setSelectedEmpForLifecycle] = useState(null);
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [exitReason, setExitReason] = useState("");
  const [birthdays, setBirthdays] = useState([]);
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStat, setSelectedStat] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lifecycleStatus, setLifecycleStatus] = useState("ALL");
  const dropdownRef = useRef(null);

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEmployeeForAttendance, setSelectedEmployeeForAttendance] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [selectedEmpForAsset, setSelectedEmpForAsset] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    dynamicSections: [], // Real companies from backend
    newJoinees: 0,
    employeesLeft: 0,
    deptMapping: {}
  });
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [cardMode, setCardMode] = useState('DEFAULT'); // DEFAULT or LIST
  const [activeCompany, setActiveCompany] = useState(null);
  const [userRole, setUserRole] = useState("");

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser || !token) return;

      let endpoint = "";
      const userType = String(storedUser.userType).toLowerCase();
      if (userType === "hr") endpoint = "/hr/profile";
      else if (userType === "manager") endpoint = "/manager/profile";
      else return;

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        const profileData = data.data;
        const userData = profileData.userId || profileData.user;
        const name = userData?.name || storedUser.name;
        setUsername(name);
        if (profileData.profilePhoto) {
          setProfilePhoto(getFullUrl(profileData.profilePhoto, API_BASE_URL));
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  useEffect(() => {
    // Basic initialization if any
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.userType) {
      setUserRole(storedUser.userType.toLowerCase());
    }
  }, []);

  const getInitials = (firstName, lastName) => {
    if (!firstName) return "";

    // If firstName is a full name and lastName is missing
    if (!lastName && firstName.includes(" ")) {
      const parts = firstName.trim().split(/\s+/);
      const first = parts[0]?.[0]?.toUpperCase() || "";
      const last = parts[parts.length - 1]?.[0]?.toUpperCase() || "";
      return first + last;
    }

    const first = firstName.charAt(0).toUpperCase();

    if (!lastName || lastName === "null" || lastName === "undefined") {
      return first;
    }

    const last = lastName.charAt(0).toUpperCase();
    return first + last;
  };

  const isNewEmployee = (date) => {
    if (!date) return false;
    const joinDate = new Date(date);
    if (isNaN(joinDate.getTime())) return false;
    const today = new Date();
    const diffDays = (today - joinDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 30 && diffDays >= 0; // last 30 days = new joinee
  };

  const getNoticeProgress = (emp) => {
    const today = moment().tz('Asia/Kolkata').startOf('day');
    const start = moment(emp.noticeStartDate).tz('Asia/Kolkata').startOf('day');
    const end = moment(emp.lastWorkingDate).tz('Asia/Kolkata').startOf('day');

    const totalDays = Math.max(1, end.diff(start, 'days') + 1);
    const servedDays = Math.max(0, today.diff(start, 'days') + 1);
    const leftDays = Math.max(0, end.diff(today, 'days'));

    const progress = Math.min(100, Math.max(0, (servedDays / totalDays) * 100));

    return { totalDays, servedDays, leftDays, progress };
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();

    const fullName = (emp.user?.name || `${emp.firstName || ""} ${emp.lastName || ""}`).trim().toLowerCase();
    const employeeId = (emp.employeeId || "").toLowerCase();
    const department = (typeof emp.department === "string" ? emp.department : (emp.department?.name || emp.department?.departmentName || "")).toLowerCase();
    const designation = (emp.designation || "").toLowerCase();

    const matchesSearch =
      fullName.includes(query) ||
      employeeId.includes(query) ||
      department.includes(query) ||
      designation.includes(query);

    const matchesType =
      selectedType === "ALL" ||
      String(emp.user?.companyId?._id || emp.user?.companyId || emp.companyId?._id || emp.companyId) === String(selectedType);

    const matchesStat =
      !selectedStat ||
      (selectedStat === "NEW" && isNewEmployee(emp.joiningDate)) ||
      (selectedStat === "LEFT" && emp.status === "Left");

    const matchesDateRange = () => {
      if (!startDate && !endDate) return true;
      if (!emp.joiningDate) return false;
      const joinDate = new Date(emp.joiningDate).getTime();
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
      
      if (start && joinDate < start) return false;
      if (end && joinDate > end) return false;
      return true;
    };

    const matchesLifecycle = 
      lifecycleStatus === "ALL" ? String(emp.status).toLowerCase() !== "inactive" :
      lifecycleStatus === "OTHER" ? (String(emp.status).toLowerCase() !== "active" && String(emp.status).toLowerCase() !== "resigned" && String(emp.status).toLowerCase() !== "inactive") :
      String(emp.status).toLowerCase() === lifecycleStatus.toLowerCase();

    return matchesSearch && matchesType && matchesStat && matchesDateRange() && matchesLifecycle;
  });

  // ================= PAGINATION LOGIC =================
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

  const currentRecords = filteredEmployees.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredEmployees.length / recordsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedStat, startDate, endDate, lifecycleStatus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setSelectedCard(null); // close dropdown
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest(".action-dropdown-container")) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const getRoleBadge = (role) => {
    const r = String(role || "employee").toLowerCase();
    switch (r) {
      case "hr":
        return <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-[800] border border-purple-100/50 text-[10px] uppercase tracking-wide">HR</span>;
      case "manager":
        return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-[800] border border-amber-100/50 text-[10px] uppercase tracking-wide">Manager</span>;
      case "accounts":
        return <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-[800] border border-teal-100/50 text-[10px] uppercase tracking-wide">Accounts</span>;
      case "admin":
        return <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-[800] border border-rose-100/50 text-[10px] uppercase tracking-wide">Admin</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 font-[800] border border-slate-100/50 text-[10px] uppercase tracking-wide">Employee</span>;
    }
  };

  const getEmployeeActions = (emp) => {
    const list = [];
    
    // 1. Edit (Only for non-inactive, and userRole !== 'manager')
    if (String(emp.status).toLowerCase() !== "inactive") {
      if (userRole !== "manager") {
        list.push({
          label: "Edit Details",
          icon: <FiEdit2 size={13} />,
          onClick: () => navigate(`/dashboard/edit-employee/${emp.employeeId}`),
          className: "text-slate-600 hover:text-amber-600 hover:bg-amber-50"
        });
      }
    } else {
      // Delete (Only for inactive, and userRole !== 'manager')
      if (userRole !== "manager") {
        list.push({
          label: "Delete",
          icon: <FiTrash2 size={13} />,
          onClick: () => handleDelete(emp.employeeId),
          className: "text-rose-600 hover:bg-rose-50"
        });
      }
    }

    // 2. Manage Assets (userRole !== 'manager')
    if (userRole !== "manager") {
      list.push({
        label: "Manage Assets",
        icon: <FiBox size={13} />,
        onClick: () => {
          setSelectedEmpForAsset(emp);
          setShowAssetModal(true);
        },
        className: "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
      });
    }

    // 3. Lifecycle History (always shown in manager portal)
    list.push({
      label: "Lifecycle History",
      icon: <FiClock size={13} />,
      onClick: () => {
        setSelectedEmpForLifecycle(emp);
        setShowLifecycleModal(true);
      },
      className: "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
    });

    // 4. Update Status (userRole !== 'manager')
    if (userRole !== "manager") {
      list.push({
        label: "Update Status",
        icon: <FiUserMinus size={13} />,
        onClick: () => {
          setSelectedEmpForStatus(emp);
          setShowStatusModal(true);
        },
        className: "text-slate-600 hover:text-rose-500 hover:bg-rose-50"
      });
    }

    return list;
  };
 
  // ✅ CALCULATE STATS FROM EMPLOYEE LIST
  useEffect(() => {
    if (employees.length > 0) {
      const active = employees.filter(e => String(e.status).toLowerCase() === "active").length;
      const left = employees.filter(e => String(e.status).toLowerCase() === "left").length;
       
      const isNewEmployee = (date) => {
        if (!date) return false;
        const joinDate = new Date(date);
        if (isNaN(joinDate.getTime())) return false;
        const today = new Date();
        const diffDays = (today - joinDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 30 && diffDays >= 0;
      };
       
      const newStaff = employees.filter(e => isNewEmployee(e.joiningDate)).length;
      
      const grouped = {};
      employees.forEach(e => {
        const companyName = e.user?.companyId?.companyName || "General";
        const dept = typeof e.department === "string" ? e.department.trim() : (e.department?.name || e.department?.departmentName || "General");
        if (dept) {
          if (!grouped[companyName]) grouped[companyName] = new Set();
          grouped[companyName].add(dept);
        }
      });
      
      const deptMap = {};
      let totalUniqueDepts = 0;
      const allDepts = new Set();
      Object.keys(grouped).forEach(k => {
        deptMap[k] = Array.from(grouped[k]);
        deptMap[k].forEach(d => allDepts.add(d));
      });
      totalUniqueDepts = allDepts.size;
 
      setStats(prev => ({
        ...prev,
        totalEmployees: active,
        newJoinees: newStaff,
        employeesLeft: left,
        totalDepartments: totalUniqueDepts,
        deptMapping: deptMap
        // Note: dynamicSections are preserved from the fetchStats call
      }));
    }
  }, [employees]);
 
  useEffect(() => {
    fetchEmployees();
    fetchStats();
    fetchUpcomingBirthdays();
  }, [selectedType]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Token not found. Please login again.");
        return;
      }

      let url = `${import.meta.env.VITE_API_BASE_URL}/employee`;
      if (selectedType && selectedType !== "ALL") {
        url += `?companyId=${selectedType}`;
      }

      const response = await fetch(
        url,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unauthorized");
      }

      const result = await response.json();
      console.log("Employees State:", result);

      setEmployees(result); // Directly setting the array
      setLoading(false);

    } catch (error) {
      console.error("Fetch error:", error);

      localStorage.clear();
      navigate("/login", { replace: true });
    }
  };


  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);


  // ================= DELETE EMPLOYEE =================
  const handleDelete = (employeeId) => {
    setEmployeeToDelete(employeeId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleting(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/employee/${employeeToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      fetchEmployees();

    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = `${API_BASE_URL}/dashboard/stats`;
      if (selectedType && selectedType !== "ALL") {
        url += `?companyId=${selectedType}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok) {
        setStats(prev => ({ ...prev, ...result }));
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
    }
  };

  // ================= FETCH UPCOMING BIRTHDAYS =================
  const fetchUpcomingBirthdays = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = `${API_BASE_URL}/dashboard/upcoming-birthdays`;
      if (selectedType && selectedType !== "ALL") {
        url += `?companyId=${selectedType}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok) {
        setBirthdays(result);
      }
    } catch (error) {
      console.error("Birthdays error:", error);
    }
  };

  const navigate = useNavigate();
  // 🔐 Protect page if user not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Logout logic
  const [selectedCard, setSelectedCard] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);



  const handleLogout = () => {
    setShowLogoutPopup(true);

    // remove login data
    localStorage.clear();

    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1000);
  };

  return (
    <div className="w-full h-full flex flex-col p-3 overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar">




      {/* TOP SUMMARY CARDS - Standardized with Attendance Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Total Staff */}
        <div 
          onClick={() => { setSelectedType("ALL"); setSelectedStat(null); }} 
          className={`bg-white border transition-all cursor-pointer rounded-lg p-3 flex items-center gap-3 h-[74px] shadow-sm hover:shadow-md shadow-slate-200/40 ${selectedType === "ALL" && !selectedStat ? "border-amber-400 bg-amber-50/20 shadow-amber-200/20" : "border-slate-200 bg-white hover:border-amber-200"}`}
        >
          <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <FiUsers size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">All Staff</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{stats.totalEmployees}</h2>
              <span className="text-[7px] text-slate-300 font-bold uppercase">Active</span>
            </div>
          </div>
        </div>


        {/* New Joinees */}
        <div 
          onClick={() => setSelectedStat("NEW")} 
          className={`bg-white border transition-all cursor-pointer rounded-lg p-3 flex items-center gap-3 h-[74px] shadow-sm hover:shadow-md shadow-slate-200/40 ${selectedStat === "NEW" ? "border-emerald-400 bg-emerald-50/20 shadow-emerald-200/20" : "border-slate-200 bg-white hover:border-emerald-200"}`}
        >
          <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <FiUserPlus size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">New Joinees</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{stats.newJoinees}</h2>
              <span className="text-[7px] text-slate-300 font-bold uppercase">Last 30d</span>
            </div>
          </div>
        </div>

        {/* Total Departments Interactive Card */}
        <div 
          onMouseEnter={() => setCardMode('LIST')}
          onMouseLeave={() => {
            setCardMode('DEFAULT');
            setActiveCompany(null);
          }}
          className="group relative bg-white border border-slate-200 transition-all cursor-pointer rounded-lg p-3 flex flex-col justify-center h-[74px] shadow-sm hover:shadow-md shadow-slate-200/40 hover:border-violet-200 overflow-hidden"
        >
          {cardMode === 'DEFAULT' ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              <div className="w-9 h-9 rounded-md bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                <FiLayers size={18} />
              </div>
              <div className="truncate">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Departments</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{stats.totalDepartments}</h2>
                  <span className="text-[7px] text-slate-300 font-bold uppercase">Active</span>
                </div>
              </div>
            </div>
          ) : activeCompany ? (
            /* DEPARTMENT LIST VIEW */
            <div className="animate-in slide-in-from-right-2 fade-in duration-300 h-full flex flex-col overflow-hidden">
               <div className="flex items-center gap-2 mb-1 shrink-0">
                  <div className="w-1 h-1 rounded-full bg-violet-500" />
                  <p className="text-[8px] font-black text-violet-600 uppercase truncate">{activeCompany}</p>
               </div>
               <div className="flex flex-wrap gap-1 overflow-y-auto pr-1 custom-scrollbar-thin">
                  {stats.deptMapping[activeCompany]?.map((d, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-violet-50 text-violet-500 rounded-[2px] text-[7px] font-black border border-violet-100/50">
                       {d}
                    </span>
                  ))}
               </div>
            </div>
          ) : (
            /* COMPANY LIST VIEW */
            <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 h-full overflow-y-auto custom-scrollbar-thin pr-1">
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1 shrink-0">Select Company</p>
                <div className="space-y-1">
                   {Object.keys(stats.deptMapping || {}).length === 0 ? (
                     <p className="text-[8px] text-slate-400 italic">No companies</p>
                   ) : (
                     Object.keys(stats.deptMapping).map((comp, idx) => (
                       <div 
                         key={idx} 
                         onClick={(e) => {
                           e.stopPropagation();
                           setActiveCompany(comp);
                         }}
                         className="flex items-center justify-between group/item p-1 rounded hover:bg-violet-50 transition-all border border-transparent hover:border-violet-100"
                       >
                          <span className="text-[9px] font-black text-slate-600 truncate">{comp}</span>
                          <FiPlus size={8} className="text-slate-300 group-hover/item:text-violet-500" />
                       </div>
                     ))
                   )}
                </div>
            </div>
          )}
        </div>

        
        {/* Birthdays Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 h-[74px] shadow-sm hover:shadow-md shadow-slate-200/40 overflow-hidden">
          <div className="w-9 h-9 rounded-md bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <FiGift size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight mb-1">Birthdays</p>
            <div className="max-h-[38px] overflow-y-auto pr-1">
              {birthdays.length === 0 ? (
                <p className="text-[9px] text-slate-300 italic font-bold">None upcoming</p>
              ) : (
                birthdays.map((emp, i) => (
                  <div key={emp._id || i} className="flex items-center justify-between py-0.5 border-b border-slate-100 last:border-none">
                    <span className="text-[11px] font-black text-slate-700 truncate mr-1">{emp.name}</span>
                    <span className="text-[10px] font-black text-blue-500 shrink-0">{new Date(emp.dob).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
 
      {/* SEARCH BAR AND ADD EMPLOYEE BUTTON - Slimmed */}
      <div className="mt-1 mb-3 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-2.5">
 
        {/* LEFT - SEARCH BAR & COMPANY DROPDOWN */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full max-w-4xl">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search by Employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-[11px] font-medium"
            />
          </div>
 
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Picker - Boxy Styled */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md py-1.5 px-3">
               <div className="flex items-center gap-1.5">
                  <FiCalendar size={12} className="text-slate-400" />
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-24 cursor-pointer"
                  />
               </div>
               <div className="w-[1px] h-3 bg-slate-200 mx-1" />
               <div className="flex items-center gap-1.5">
                  <FiCalendar size={12} className="text-slate-400" />
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-24 cursor-pointer"
                  />
               </div>
            </div>

            <CustomSelector
              icon={<FiUsers size={14} />}
              value={selectedType}
              options={[{ id: "ALL", name: "All Companies" }, ...(stats.dynamicSections || [])]}
              onChange={(val) => setSelectedType(val)}
              minWidth="160px"
              placeholder="Select Company"
            />
            
            <CustomSelector
              icon={<FiLayers size={14} />}
              value={lifecycleStatus}
              options={[
                { id: "ALL", name: "All" },
                { id: "ACTIVE", name: "Active" },
                { id: "RESIGNED", name: "Resigned" },
                { id: "OTHER", name: "Other" },
                { id: "INACTIVE", name: "Inactive" }
              ]}
              onChange={(val) => setLifecycleStatus(val)}
              minWidth="160px"
              placeholder="Select Status"
            />
    
            {(searchQuery || selectedType !== "ALL" || selectedStat || startDate || endDate || lifecycleStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("ALL");
                  setSelectedStat(null);
                  setStartDate("");
                  setEndDate("");
                  setLifecycleStatus("ALL");
                }}
                className="whitespace-nowrap text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-md transition-standard border border-rose-100 flex-1 sm:flex-none"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* RIGHT - ADD EMPLOYEE BUTTON */}
        {userRole !== "manager" && (
          <button
            onClick={() => navigate("/dashboard/add-employee")}
            className="bg-blue-600 text-white py-1.5 px-4 rounded-md text-[11px] font-bold shadow-sm hover:bg-blue-700 transition-standard flex items-center justify-center gap-2 w-full xl:w-auto"
          >
            <FiPlus size={14} /> Add Employee
          </button>
        )}

      </div>

      {/* TABLE - Professional & Compact with Attendance-style Shadow/Radius */}
      <div className={`bg-white rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40 mt-1 ${activeDropdownId ? 'overflow-visible' : 'overflow-hidden'}`}>
        <div className={`custom-scrollbar ${activeDropdownId ? 'overflow-visible' : 'overflow-x-auto'}`}>
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Full name</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Employee ID</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Role</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Email</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Department</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Job Title</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentRecords.map((emp, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">

                  {/* Full Name */}
                  <td className="py-4 px-4 flex items-center gap-3">

                    {emp.profilePhoto ? (
                      <img
                        src={getFullUrl(emp.profilePhoto, API_BASE_URL)}
                        className="w-8 h-8 rounded-full object-cover"
                        alt="profile"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {(!emp.profilePhoto) && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold ring-1 ring-slate-100">
                        {getInitials(emp.user?.name || emp.firstName, emp.lastName)}
                      </div>
                    )}
                    {/* Fallback for broken images if needed (handled by onError above in a slightly different way, but this is simpler for React): */}
                    {emp.profilePhoto && (
                       <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hidden items-center justify-center text-xs font-bold ring-1 ring-slate-100" id={`fallback-${emp._id}`}>
                        {getInitials(emp.user?.name || emp.firstName, emp.lastName)}
                      </div>
                    )}

                    <span 
                      className="text-gray-800 text-[14px] font-bold cursor-pointer hover:text-blue-600 hover:underline transition-all"
                      onClick={() => navigate(`/dashboard/profile/${emp.employeeId}`)}
                    >
                      {emp.user?.name || `${emp.firstName} ${emp.lastName}`}
                    </span>

                  </td>

                  {/* Employee ID */}
                  <td className="py-4 px-4 text-[12px] font-bold text-gray-500">{emp.employeeId}</td>

                  {/* Role */}
                  <td className="py-4 px-4 text-[12px] font-medium text-gray-700">
                    {getRoleBadge(emp.user?.userType)}
                  </td>

                  {/* Email */}
                  <td className="py-4 px-4 text-[12px] font-medium text-gray-600">
                    {emp.personalEmail || emp.user?.email || emp.email || "N/A"}
                  </td>

                  {/* Department */}
                  <td className="py-4 px-4 text-[12px] font-medium text-gray-700">
                    {typeof emp.department === "string" ? emp.department : (emp.department?.name || emp.department?.departmentName || "General")}
                  </td>

                  {/* Designation */}
                  <td className="py-4 px-4 text-[12px] text-gray-600">{emp.designation}</td>

                  {/* Type */}
                  <td className="py-4 px-4 text-[12px]">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100/50">
                      {emp.employmentType || "Fixed"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-[11px] uppercase tracking-wider shrink-0 ${
                        String(emp.status).toLowerCase() === "active" ? "text-emerald-500" :
                        String(emp.status).toLowerCase() === "resigned" ? "text-amber-500" :
                        String(emp.status).toLowerCase() === "inactive" ? "text-slate-400" :
                        "text-rose-500"
                      }`}>
                        {String(emp.status || "Active").replace('_', ' ')}
                      </span>
                      
                      {String(emp.status).toLowerCase() === "resigned" && emp.noticeStartDate && emp.lastWorkingDate && (
                        (() => {
                          const { totalDays, servedDays, leftDays, progress } = getNoticeProgress(emp);
                          return (
                            <div 
                              className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-100 rounded-md py-0.5 px-1.5"
                              title={`${servedDays} days served, ${leftDays} days remaining of notice period`}
                            >
                              <div className="w-8 h-1 bg-slate-200/60 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-400 rounded-full transition-all" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-tight whitespace-nowrap">
                                {servedDays}/{totalDays}d
                              </span>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-center">
                    <div className="relative inline-block text-left action-dropdown-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(activeDropdownId === emp.employeeId ? null : emp.employeeId);
                        }}
                        className="p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all duration-300"
                        title="Actions"
                      >
                        <FiMoreVertical size={16} />
                      </button>

                      {activeDropdownId === emp.employeeId && (
                        <div className={`absolute right-0 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-[150] py-1 animate-in fade-in zoom-in-95 duration-200 ${idx >= currentRecords.length - 2 && currentRecords.length > 2 ? 'bottom-full mb-1 origin-bottom' : 'top-full mt-1 origin-top'}`}>
                          {getEmployeeActions(emp).length === 0 ? (
                            <p className="px-4 py-2 text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center italic">
                              No actions
                            </p>
                          ) : (
                            getEmployeeActions(emp).map((act, i) => (
                              <button
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(null);
                                  act.onClick();
                                }}
                                className={`w-full text-left px-4 py-2 text-[11px] font-bold tracking-tight transition-colors flex items-center gap-2.5 ${act.className}`}
                              >
                                {act.icon}
                                <span>{act.label}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 mt-2 px-2 md:px-4 gap-3">

          {/* LEFT: Showing text */}
          <span className="text-xs">
            Showing {indexOfFirstRecord + 1}–
            {Math.min(indexOfLastRecord, filteredEmployees.length)} of {filteredEmployees.length} records
          </span>

          {/* PAGINATION RIGHT SIDE */}
          <div className="flex items-center gap-2 flex-wrap justify-center">

            <button
              onClick={() =>
                currentPage > 1 && setCurrentPage(currentPage - 1)
              }
              className="px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-100 text-xs"
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-2 py-0.5 rounded border text-xs ${currentPage === i + 1
                  ? "bg-purple-600 text-white"
                  : "border-gray-300 hover:bg-gray-100"
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() =>
                currentPage < totalPages && setCurrentPage(currentPage + 1)
              }
              className="px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-100 text-xs"
            >
              Next
            </button>

          </div>

        </div>
      </div>

      {/* LOGOUT POPUP */}
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-xl px-6 py-5 w-[300px] text-center">

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Logged Out
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              You have been successfully logged out.
            </p>

            <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-red-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      <EmployeeStatusModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedEmpForStatus(null);
        }}
        employee={selectedEmpForStatus}
        onRefresh={() => {
          fetchEmployees();
          fetchStats();
        }}
      />

      <EmployeeLifecycleModal
        isOpen={showLifecycleModal}
        onClose={() => {
          setShowLifecycleModal(false);
          setSelectedEmpForLifecycle(null);
        }}
        employee={selectedEmpForLifecycle}
      />

      <AttendanceHistoryModal
        isOpen={showAttendanceModal}
        onClose={() => {
          setShowAttendanceModal(false);
          setSelectedEmployeeForAttendance(null);
        }}
        userId={selectedEmployeeForAttendance}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? It will delete employee all records and history."
      />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
      </div>
      <AssetAssignmentModal 
        isOpen={showAssetModal} 
        onClose={() => setShowAssetModal(false)}
        employee={selectedEmpForAsset}
        onRefresh={fetchEmployees}
      />
    </div>
  );
}