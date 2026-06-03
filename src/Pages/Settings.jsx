import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { FiPlus, FiTrash2, FiDownload } from "react-icons/fi";
import ConfirmModal from "../components/Shared/ConfirmModal";
import { getFullUrl } from "../utils/urlHelper";

export default function SettingsPage() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [companyId, setCompanyId] = useState(localStorage.getItem("companyId") || "");
  const [showEventModal, setShowEventModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [activeListTab, setActiveListTab] = useState("holiday");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef(null);
  const [eventForm, setEventForm] = useState({ name: "", date: "", time: "", category: "green", companyId: "" });
  const [events, setEvents] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [totalWorkingDays, setTotalWorkingDays] = useState(0);
  const [weeklyOffDays, setWeeklyOffDays] = useState(0);
  const [holidayDates, setHolidayDates] = useState([]);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const years = Array.from({ length: 10 }, (_, i) => 2020 + i);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const [holidayForm, setHolidayForm] = useState({ holidayName: "", date: "", branch: [], category: "", description: "" });

  const todayDate = new Date();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(todayDate.getDate() + 1);
  const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const todayStr = formatDate(todayDate);
  const tomorrowStr = formatDate(tomorrowDate);
  const todayEvents = events.filter((e) => e.date && e.date.substring(0, 10) === todayStr);
  const tomorrowEvents = events.filter((e) => e.date && e.date.substring(0, 10) === tomorrowStr);

  const handleDateClick = (day) => {
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setEventForm({ name: "", date: formattedDate, time: "", category: "green", companyId: companyId });
    setShowEventModal(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setSelectedCard(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/company`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const loadedCompanies = data.company || [];
        setCompanies(loadedCompanies);
        
        // If no companyId in localStorage or it's invalid, select the first one
        const storedId = localStorage.getItem("companyId");
        if (loadedCompanies.length > 0 && (!storedId || storedId === "1")) {
          const firstId = loadedCompanies[0]._id;
          setCompanyId(firstId);
          localStorage.setItem("companyId", firstId);
        }
      } catch (err) { console.error(err); }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => { if (!e.target.closest(".relative")) setShowBranchDropdown(false); };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const addHoliday = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (holidayForm.branch.length === 0) { alert("Please select at least one company"); return; }
      
      const selectedCompanyIds = holidayForm.branch.map(bName => {
        const found = companies.find(c => c.companyName === bName);
        return found ? found._id : null;
      }).filter(id => id !== null);

      for (let cid of selectedCompanyIds) {
        await axios.post(`${API_BASE_URL}/attendance/add-holiday`,
          { holidayName: holidayForm.holidayName, date: holidayForm.date, category: holidayForm.category, description: holidayForm.description, companyId: cid },
          { headers: { Authorization: `Bearer ${token}`, "x-company-id": cid } }
        );
      }
      alert("✅ Holiday added for selected companies");
      setHolidayForm({ holidayName: "", date: "", branch: [], category: "", description: "" });
      fetchEvents();
    } catch (error) { console.error(error); alert("❌ Error adding holiday"); }
  };

  const handleAddEvent = async () => {
    if (!eventForm.name || !eventForm.date || !eventForm.companyId) { alert("Please fill name, date and company"); return; }
    try {
      const token = localStorage.getItem("token");
      const payload = { 
        eventName: eventForm.name, 
        date: eventForm.date, 
        time: eventForm.time, 
        category: eventForm.category,
        companyId: eventForm.companyId 
      };
      console.log("Adding Event Payload:", payload);

      await axios.post(`${API_BASE_URL}/attendance/add-event`,
        payload,
        { headers: { "Content-Type": "application/json", "x-company-id": companyId, Authorization: `Bearer ${token}` } }
      );
      alert("Event saved successfully!!");
      fetchEvents();
      setShowEventModal(false);
      setEventForm({ name: "", date: "", time: "", category: "green", companyId: "" });
    } catch (error) { 
      console.error("Event save failed:", error.response || error); 
      const errMsg = error.response?.data?.message || "Event NOT saved ❌";
      alert(errMsg); 
    }
  };

  const fetchPolicies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/policies?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPolicies(res.data.data);
      }
    } catch (error) { console.error("Policy fetch error:", error); }
  };

  useEffect(() => { fetchEvents(); fetchPolicies(); }, [selectedMonth, selectedYear, companyId]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/attendance/employee-calendar?month=${selectedMonth + 1}&year=${selectedYear}&companyId=${companyId}`, { 
        headers: { 
          "Authorization": `Bearer ${token}`,
          "x-company-id": companyId 
        } 
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
        const holidays = data.data.filter(e => e.status?.toLowerCase() === "holiday").map(e => e.date?.substring(0, 10));
        setHolidayDates(holidays);
        let sundayCount = 0;
        for (let d = 1; d <= daysInMonth; d++) { if (new Date(selectedYear, selectedMonth, d).getDay() === 0) sundayCount++; }
        setWeeklyOffDays(sundayCount);
        let workingDayCount = 0;
        for (let d = 1; d <= daysInMonth; d++) {
          const isSunday = new Date(selectedYear, selectedMonth, d).getDay() === 0;
          const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          // Correctly check if date exists in holidays array (ISO strings from backend)
          if (!isSunday && !holidays.some(h => h.startsWith(dateStr))) workingDayCount++;
        }
        setTotalWorkingDays(workingDayCount);
      }
    } catch (error) { console.error("Event fetch error:", error); }
  };

  const handleDelete = (event) => {
    setItemToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const isHoliday = itemToDelete.status?.toLowerCase() === "holiday";
      const endpoint = isHoliday ? "delete-holiday" : "delete-event";
      
      const res = await axios.delete(`${API_BASE_URL}/attendance/${endpoint}/${itemToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setShowDeleteModal(false);
        setItemToDelete(null);
        fetchEvents();
      }
    } catch (error) {
      console.error("Delete error:", error);
      const errMsg = error.response?.data?.message || "Failed to delete item ❌";
      alert(errMsg);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const token = localStorage.getItem("token");
      const currentCompanyId = localStorage.getItem("companyId");

      // Fetch events (omitting month to get data for the whole year/overall)
      // The backend returns all for enterpriseId if month/year are omitted or partially provided
      const res = await fetch(`${API_BASE_URL}/attendance/employee-calendar?year=${selectedYear}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "x-company-id": currentCompanyId 
        }
      });
      const data = await res.json();
      
      if (!data.success) {
        alert("Failed to fetch events for PDF");
        return;
      }

      // Filter by the selected year in frontend to be sure
      const allEvents = (data.data || []).filter(e => e.year === selectedYear);
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.text("Annual Organization Schedule", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Year: ${selectedYear}`, 14, 30);
      
      let currentY = 40;

      // Grouping Logic: Company -> Month -> Events
      const companyGroups = companies.map(company => {
        const companyEvents = allEvents.filter(e => String(e.companyId) === String(company._id));
        const monthsData = months.map((mName, mIdx) => {
          const monthNum = mIdx + 1;
          const monthEvents = companyEvents.filter(e => e.month === monthNum);
          return {
            name: mName,
            holidays: monthEvents.filter(e => e.status?.toLowerCase() === 'holiday'),
            events: monthEvents.filter(e => e.status?.toLowerCase() === 'event')
          };
        }).filter(m => m.holidays.length > 0 || m.events.length > 0);

        return { name: company.companyName, months: monthsData };
      }).filter(group => group.months.length > 0);

      // Handle Organization Wide / Global
      const unassignedEvents = allEvents.filter(e => !e.companyId);
      if (unassignedEvents.length > 0) {
        const unassignedMonths = months.map((mName, mIdx) => {
          const monthNum = mIdx + 1;
          const monthEvents = unassignedEvents.filter(e => e.month === monthNum);
          return {
            name: mName,
            holidays: monthEvents.filter(e => e.status?.toLowerCase() === 'holiday'),
            events: monthEvents.filter(e => e.status?.toLowerCase() === 'event')
          };
        }).filter(m => m.holidays.length > 0 || m.events.length > 0);

        if (unassignedMonths.length > 0) {
          companyGroups.unshift({ name: "Organization Wide / Global", months: unassignedMonths });
        }
      }

      if (companyGroups.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        doc.text("No holidays or events scheduled for this year.", 14, currentY);
      } else {
        companyGroups.forEach((group) => {
          // Page break check for Company Header
          if (currentY > 260) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(16);
          doc.setTextColor(30, 41, 59); // Slate-800
          doc.setFont("helvetica", "bold");
          doc.text(group.name, 14, currentY);
          currentY += 8;

          group.months.forEach((monthData) => {
            // Page break check for Month Header
            if (currentY > 260) {
              doc.addPage();
              currentY = 20;
            }

            doc.setFontSize(11);
            doc.setTextColor(79, 70, 229);
            doc.setFont("helvetica", "bold");
            doc.text(monthData.name, 14, currentY);
            currentY += 4;

            const tableData = [];
            const maxRows = Math.max(monthData.holidays.length, monthData.events.length);
            
            for (let i = 0; i < maxRows; i++) {
              const h = monthData.holidays[i];
              const ev = monthData.events[i];
              
              const hText = h ? `Date ${new Date(h.date).getDate()} - ${h.remark || h.title}` : "-";
              const eText = ev ? `Date ${new Date(ev.date).getDate()} - ${ev.remark || ev.title}` : "-";
              
              tableData.push([hText, eText]);
            }

            autoTable(doc, {
              startY: currentY,
              head: [['Holidays', 'Events']],
              body: tableData,
              theme: 'grid',
              headStyles: { fillColor: [79, 70, 229], fontSize: 9, halign: 'center' },
              bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
              columnStyles: {
                0: { cellWidth: 90 },
                1: { cellWidth: 90 }
              },
              margin: { left: 14 }
            });

            currentY = doc.lastAutoTable.finalY + 10;
          });

          currentY += 5; // Extra space between companies
        });
      }

      doc.save(`Annual_Schedule_${selectedYear}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Error generating PDF");
    }
  };

  const [selectedCard, setSelectedCard] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

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
    fetchUserProfile();
    const name = localStorage.getItem("username"); 
    if (name) setUsername(name); 
  }, []);
  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const navigate = useNavigate();
  useEffect(() => { const token = localStorage.getItem("token"); if (!token) navigate("/login", { replace: true }); }, [navigate]);

  const handleLogout = () => {
    setShowLogoutPopup(true);
    localStorage.clear();
    setTimeout(() => navigate("/login", { replace: true }), 1000);
  };

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* ===================== TOP CARDS - Slim ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 shrink-0">

          {/* CARD 1 — Working Days */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-3 flex items-center gap-3 transition-standard hover:shadow-md">
             <div className="w-9 h-9 rounded bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">WORKING DAYS</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                   <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{totalWorkingDays}</h2>
                   <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">{months[selectedMonth].slice(0, 3)} EXCL. HOLIDAYS</span>
                </div>
             </div>
          </div>

          {/* CARD 2 — Weekly Off */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-3 flex items-center gap-3 transition-standard hover:shadow-md">
             <div className="w-9 h-9 rounded bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">WEEKLY OFF</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                   <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{weeklyOffDays}</h2>
                   <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">SUNDAYS ONLY</span>
                </div>
             </div>
          </div>

          {/* CARD 3 — Monthly Overview */}
          <div onClick={() => setShowListModal(true)} className="relative bg-white border border-slate-200 shadow-sm rounded-lg p-3 flex items-center gap-3 transition-standard hover:shadow-md cursor-pointer group">
             <button 
                onClick={(e) => { e.stopPropagation(); handleDownloadPDF(); }}
                className="absolute top-2 right-2 p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-40 group-hover:opacity-100"
                title="Download PDF Report"
             >
                <FiDownload size={14} />
             </button>
             <div className="w-9 h-9 rounded bg-indigo-50 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">MONTHLY EVENTS</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                   <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{events.length}</h2>
                   <span className="text-[7px] text-indigo-500 font-bold uppercase tracking-tighter">CLICK ON DOWNLOAD FOR HOLIDAY EVENT LIST</span>
                </div>
             </div>
          </div>

          {/* CARD 4 — Company Policies */}
          <div onClick={() => setShowPolicyModal(true)} className="relative bg-white border border-slate-200 shadow-sm rounded-lg p-3 flex items-center gap-3 transition-standard hover:shadow-md cursor-pointer group">
             <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">COMPANY POLICIES</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                   <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{policies.length}</h2>
                   <span className="text-[7px] text-emerald-500 font-bold uppercase tracking-tighter">CLICK TO VIEW</span>
                </div>
             </div>
          </div>
        </div>

        {/* ================= CONTENT AREA - Compact ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-3 flex-1 min-h-0">

          {/* ADD HOLIDAY (LEFT) */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col overflow-y-auto no-scrollbar">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <h2 className="text-[14px] font-black text-slate-800 tracking-tight uppercase">New Holiday</h2>
              </div>

              <form onSubmit={addHoliday} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Holiday Name</label>
                  <input type="text" placeholder="e.g. Republic Day" required value={holidayForm.holidayName}
                    onChange={(e) => setHolidayForm({ ...holidayForm, holidayName: e.target.value })}
                    className="w-full h-10 px-4 text-[12px] font-bold border border-slate-200 bg-slate-50 rounded-lg focus:ring-1 focus:ring-blue-500 transition-all outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Date</label>
                    <input type="date" required value={holidayForm.date}
                      onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                      className="w-full h-10 px-3 text-[11px] font-bold border border-slate-200 bg-slate-50 rounded-lg focus:ring-1 focus:ring-blue-500 transition-all outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Company</label>
                    <div className="relative">
                      <div onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                        className="w-full h-10 px-3 border border-slate-200 bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer">
                        <span className="text-[11px] font-bold text-slate-600 truncate">
                          {holidayForm.branch.length === 0 ? "Select..." : (holidayForm.branch.length === 1 ? holidayForm.branch[0] : `Mixed (${holidayForm.branch.length})`)}
                        </span>
                        <span className="text-slate-300 text-[8px]">▼</span>
                      </div>
                      {showBranchDropdown && (
                        <div className="absolute z-50 bg-white border border-slate-100 rounded-xl mt-1 w-full shadow-xl py-1 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                          {companies.map((c) => (
                            <label key={c._id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors">
                              <input type="checkbox" className="w-3.5 h-3.5 accent-blue-600 rounded" checked={holidayForm.branch.includes(c.companyName)}
                                onChange={(e) => {
                                  let updated = [...holidayForm.branch];
                                  if (e.target.checked) updated.push(c.companyName);
                                  else updated = updated.filter((b) => b !== c.companyName);
                                  setHolidayForm({ ...holidayForm, branch: updated });
                                }} />
                              <span className="text-[10px] font-bold text-slate-600">{c.companyName}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Category</label>
                  <select required value={holidayForm.category}
                    onChange={(e) => setHolidayForm({ ...holidayForm, category: e.target.value })}
                    className="w-full h-10 px-4 text-[11px] font-bold border border-slate-200 bg-slate-50 rounded-lg appearance-none cursor-pointer focus:ring-1 focus:ring-blue-500 transition-all outline-none">
                    <option value="" disabled hidden>Choose type...</option>
                    <option value="National Holiday">National Holiday</option>
                    <option value="Festival">Festival</option>
                    <option value="Company Leave">Company Leave</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Description</label>
                  <textarea placeholder="Reason or details..." value={holidayForm.description}
                    onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                    className="w-full h-20 px-4 py-3 text-[11px] font-bold border border-slate-200 bg-slate-50 rounded-lg resize-none outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium" />
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all">
                    Register Holiday
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT CALENDAR PANEL */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col xl:flex-row overflow-hidden flex-1 min-h-[620px]">
            <aside className="border-b xl:border-b-0 xl:border-r border-slate-100 w-full xl:w-64 p-5 overflow-y-auto bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tighter">{months[selectedMonth]} {selectedYear}</h2>
              <div className="grid grid-cols-7 gap-1 text-[9px] text-slate-400 font-bold mb-6">
                {["M","T","W","T","F","S","S"].map((d, i) => <p key={i} className="text-center">{d}</p>)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((n) => (
                  <div key={n} className={`text-center py-1 rounded-md ${(n === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear()) ? "bg-blue-600 text-white font-bold" : "text-slate-600"}`}>
                    {n}
                  </div>
                ))}
              </div>
              
              <div className="space-y-5">
                <div>
                   <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">TODAY'S AGENDA</h3>
                   <div className="space-y-2">
                     {todayEvents.length === 0 ? <p className="text-slate-300 text-[10px] italic">Free day</p> : todayEvents.map((event, i) => {
                       const isHoliday = event.status?.toLowerCase() === "holiday";
                       return (
                         <div key={i} className={`p-2.5 rounded-lg text-[10px] border transition-all ${isHoliday ? "bg-rose-50 border-rose-100" : "bg-blue-50 border-blue-100"}`}>
                           <div className="flex items-center justify-between mb-1">
                             <span className={`font-bold px-1.5 py-0.5 rounded uppercase text-[8px] ${isHoliday ? "bg-rose-200 text-rose-700" : "bg-blue-200 text-blue-700"}`}>{isHoliday ? "HOLIDAY" : "EVENT"}</span>
                             <span className="text-slate-400 font-bold">{event.time || "All Day"}</span>
                           </div>
                           <p className={`font-bold truncate ${isHoliday ? "text-rose-600" : "text-blue-600"}`}>{event.remark}</p>
                         </div>
                       );
                     })}
                   </div>
                </div>

                <div>
                   <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">UPCOMING</h3>
                   <div className="space-y-2">
                     {tomorrowEvents.length === 0 ? <p className="text-slate-300 text-[10px] italic">Clear</p> : tomorrowEvents.map((event, i) => {
                       const isHoliday = event.status?.toLowerCase() === "holiday";
                       return (
                         <div key={i} className={`p-3 rounded-lg text-[10px] border transition-all ${isHoliday ? "bg-rose-50 border-rose-100" : "bg-blue-50 border-blue-100"}`}>
                           <div className="flex items-center justify-between mb-1">
                             <span className={`font-bold px-1.5 py-0.5 rounded uppercase text-[8px] ${isHoliday ? "bg-rose-200 text-rose-700" : "bg-blue-200 text-blue-700"}`}>{isHoliday ? "HOLIDAY" : "EVENT"}</span>
                             <span className="text-slate-400 font-bold">{event.time || "All Day"}</span>
                           </div>
                           <p className={`font-bold truncate ${isHoliday ? "text-rose-600" : "text-blue-600"}`}>{event.remark}</p>
                         </div>
                       );
                     })}
                   </div>
                </div>
              </div>
            </aside>

            <div className="flex-1 p-2 overflow-y-auto bg-white no-scrollbar">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div>
                   <h2 className="text-[14px] font-black text-slate-800 tracking-tight uppercase leading-none">{months[selectedMonth]} {selectedYear}</h2>
                   <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Calendar Overview</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap bg-slate-50 rounded-xl border border-slate-200 p-1 shadow-sm">
                    <select 
                      value={companyId} 
                      onChange={(e) => { const id = e.target.value; setCompanyId(id); localStorage.setItem("companyId", id); }} 
                      className="bg-transparent text-[10px] font-bold text-slate-600 px-3 py-1 outline-none cursor-pointer"
                    >
                      {companies.map(c => (
                        <option key={c._id} value={c._id}>{c.companyName}</option>
                      ))}
                    </select>

                    <div className="hidden sm:block w-px h-4 bg-slate-200 self-center mx-1" />
                    
                    <select 
                      className="bg-transparent text-[10px] font-bold text-slate-600 px-3 py-1 outline-none cursor-pointer" 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                      {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>

                    <div className="hidden sm:block w-px h-4 bg-slate-200 self-center mx-1" />

                    <input 
                      type="number" 
                      className="flex-1 sm:w-14 bg-transparent text-[10px] font-bold text-slate-600 px-2 py-1 outline-none text-center" 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                    />
                  </div>

                  <button 
                    onClick={() => {
                      setEventForm({ name: "", date: "", time: "", category: "green", companyId: companyId });
                      setShowEventModal(true);
                    }} 
                    className="flex-1 sm:flex-none h-9 px-4 bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    <FaPlus size={10} /> Add Event
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center font-bold text-[10px] border-b border-slate-50 pb-3 mb-3 text-slate-400 uppercase tracking-widest">
                <p>Sun</p><p>Mon</p><p>Tue</p><p>Wed</p><p>Thu</p><p>Fri</p><p>Sat</p>
              </div>
              <div className="grid grid-cols-7 text-xs" style={{ gridAutoRows: "90px" }}>
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="border-b border-r border-slate-50 bg-slate-50/20" />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = events.filter(e => e.date && e.date.substring(0, 10) === formattedDate);
                  const isSunday = new Date(selectedYear, selectedMonth, day).getDay() === 0;
                  const isToday = day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
                  return (
                    <div key={day} onClick={() => handleDateClick(day)} className={`p-2 border-b border-r border-slate-100 cursor-pointer transition-colors hover:bg-slate-50/50 ${isSunday ? 'bg-rose-50/30' : ''}`}>
                      <p className={`text-[10px] font-bold mb-1.5 ${isToday ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : isSunday ? 'text-rose-400' : 'text-slate-400'}`}>
                        {day}
                      </p>
                      <div className="space-y-1">
                         {dayEvents.slice(0, 2).map((event, idx) => {
                           const isHoliday = event.status?.toLowerCase() === "holiday";
                           return (
                             <div key={idx} className={`text-[10px] font-black px-1.5 py-0.5 rounded truncate ${isHoliday ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}>
                               {event.remark}
                             </div>
                           );
                         })}
                        {dayEvents.length > 2 && <p className="text-[7px] text-slate-300 font-bold ml-1">+{dayEvents.length - 2} more</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      {/* ADD EVENT MODAL - Modern Compact */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl relative border border-slate-200 overflow-hidden">
            <button onClick={() => setShowEventModal(false)} className="absolute top-5 right-5 text-slate-300 hover:text-slate-600 transition-colors z-20"><FiPlus className="rotate-45" size={20}/></button>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase mb-6">New Company Event</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Event Title</label>
                <input type="text" value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} 
                  className="w-full h-10 px-4 text-[12px] font-bold border border-slate-200 bg-slate-50 rounded-lg focus:ring-1 focus:ring-blue-500 transition-all outline-none" 
                  placeholder="e.g. Monthly Review" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Date</label>
                  <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} 
                    className="w-full h-10 px-3 text-[11px] font-bold border border-slate-200 bg-slate-50 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Company</label>
                  <select 
                    value={eventForm.companyId} 
                    onChange={(e) => setEventForm({ ...eventForm, companyId: e.target.value })}
                    className="w-full h-10 px-3 text-[11px] font-bold border border-slate-200 bg-slate-50 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="" disabled>Select Company</option>
                    {companies.map(c => (
                      <option key={c._id} value={c._id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Time</label>
                  <input type="time" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} 
                    className="w-full h-10 px-3 text-[11px] font-bold border border-slate-200 bg-slate-50 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">Priority</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'green',  label: 'Meet', color: 'bg-emerald-500' },
                      { id: 'red',    label: 'Urgent',  color: 'bg-rose-500'    },
                      { id: 'blue',   label: 'Info', color: 'bg-blue-500'    },
                      { id: 'yellow', label: 'Social',  color: 'bg-amber-500'   }
                    ].map(cat => (
                      <button 
                        key={cat.id}
                        type="button"
                        onClick={() => setEventForm({ ...eventForm, category: cat.id })}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${eventForm.category === cat.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                        <span className="text-[8px] font-bold text-slate-500 uppercase">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <button onClick={() => { setShowEventModal(false); setEventForm({ name: "", date: "", time: "", category: "green" }); }} 
                  className="flex-1 h-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                  Cancel
                </button>
                <button onClick={handleAddEvent} 
                  className="flex-[2] h-10 bg-blue-600 text-white text-[11px] font-bold rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest">
                  Save Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POLICY VIEW MODAL (Manager: Read Only) */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-xl p-6 shadow-2xl relative border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <button onClick={() => setShowPolicyModal(false)} className="absolute top-5 right-5 text-slate-300 hover:text-slate-600 transition-colors z-20"><FiPlus className="rotate-45" size={20}/></button>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase mb-6">Company Policies</h3>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="space-y-3">
                {policies.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No policies available.</p>
                ) : (
                  policies.map(p => (
                    <div key={p._id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg group relative">
                      <h5 className="text-[14px] font-bold text-slate-800 pr-10">{p.title}</h5>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">{p.category}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${p.isGlobal ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                          {p.isGlobal ? 'Global' : 'Company Specific'}
                        </span>
                      </div>
                      <div className="mt-4 text-[12px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {p.description}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALL HOLIDAYS LIST MODAL */}
      {showListModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative border border-slate-200 overflow-hidden flex flex-col max-h-[75vh]">
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-extrabold text-slate-800 tracking-tight uppercase">Monthly Schedule</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{months[selectedMonth]} {selectedYear}</p>
                </div>
                <button onClick={() => setShowListModal(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-600 transition-all"><FiPlus className="rotate-45" size={18}/></button>
              </div>
              
              {/* COMPACT TOGGLE TAB */}
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner w-full">
                <button 
                  onClick={() => setActiveListTab("holiday")}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeListTab === "holiday" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Holidays
                </button>
                <button 
                  onClick={() => setActiveListTab("event")}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeListTab === "event" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Events
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
              {events.filter(e => e.status?.toLowerCase() === activeListTab).length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-50">
                    <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <p className="text-slate-350 text-[9px] font-bold uppercase tracking-widest">No entries found</p>
                </div>
              ) : (
                events
                  .filter(e => e.status?.toLowerCase() === activeListTab)
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((item, idx) => {
                    const isHoliday = item.status?.toLowerCase() === "holiday";
                    const itemDate = new Date(item.date);
                    return (
                      <div key={idx} className="group flex items-center gap-3 p-2.5 rounded-xl border border-slate-50 hover:border-indigo-50 hover:bg-indigo-50/20 transition-all cursor-default">
                        <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 border ${isHoliday ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-indigo-50 border-indigo-100 text-indigo-500"}`}>
                          <span className="text-[7px] font-bold uppercase leading-none">{itemDate.toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-sm font-black leading-tight">{itemDate.getDate()}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${isHoliday ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"}`}>
                              {isHoliday ? "Holiday" : "Event"}
                            </span>
                            <span className="text-[8px] text-slate-350 font-bold uppercase">{item.time || "Full Day"}</span>
                          </div>
                          <h4 className="text-[11px] font-bold text-slate-700 truncate leading-tight">{item.remark}</h4>
                        </div>

                        <button 
                          onClick={() => handleDelete(item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 shrin-0"
                          title="Delete"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-center">
              <button 
                onClick={() => setShowListModal(false)}
                className="w-full h-9 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm active:scale-[0.98]"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT POPUP */}
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-xl px-6 py-5 w-[300px] text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Logged Out</h3>
            <p className="text-sm text-gray-600 mb-4">You have been successfully logged out.</p>
            <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-red-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={`Delete ${itemToDelete?.status === 'holiday' ? 'Holiday' : 'Event'}`}
        message={`Are you sure you want to delete "${itemToDelete?.remark || 'this item'}"? This will remove it from the company calendar.`}
      />
    </div>
  );
}