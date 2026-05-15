import React, { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../config/api";
import {
  Users,
  Clock,
  CalendarDays,
  Activity,
  Plus,
  RefreshCw,
  CheckCircle2,
  X,
  ChevronDown,
  Building,
  UserCheck,
  AlertCircle,
  BarChart3,
  Bell,
  Edit3,
  Trash2
} from "lucide-react";
import { FiDownload, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Shared/Modal";
import CustomSelector from "../components/Shared/CustomSelector";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getFullUrl } from "../utils/urlHelper";

export default function Attendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [holidayDates, setHolidayDates] = useState([]);
  const [dashboardCards, setDashboardCards] = useState({
    today: { present: 0, absent: 0, late: 0, totalEmployees: 0 },
    monthly: { onTime: 0, absent: 0, late: 0, attendanceRatio: 0 },
    onLeaveToday: 0,
    pendingLeaves: 0
  });

  const [leaveRecords, setLeaveRecords] = useState([]);

  const [filter, setFilter] = useState({
    companyId: localStorage.getItem("selectedCompanyId") || "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    searchQuery: ""
  });

  const [showManualMark, setShowManualMark] = useState(false);
  const initialFormData = {
    attendanceId: "",
    employeeId: "",
    date: new Date().toLocaleDateString('en-CA'),
    checkInTime: "",
    checkOutTime: "",
    status: ""
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isEditing, setIsEditing] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const exportMenuRef = useRef(null);

  const getHolidayForDate = (dayIndex) => {
    const d = dayIndex + 1;
    const dateStr = `${filter.year}-${String(filter.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return holidayDates.find(h => (typeof h === 'string' ? h === dateStr : h.date?.substring(0, 10) === dateStr));
  };

  const getEffectiveStatus = (row, dayIndex) => {
    const day = row.days[dayIndex];
    const d = dayIndex + 1;
    const holiday = getHolidayForDate(dayIndex);
    const isHoliday = !!holiday;
    const isSunday = new Date(filter.year, filter.month - 1, d).getDay() === 0;
    const isToday = isCurrentMonth && d === todayDate;

    let status = day?.status;

    if (!day || status === 'absent') {
      if (isHoliday) status = 'holiday';
      else if (isSunday) status = 'weekly-off';
      else if (!day) status = 'absent';
    }

    if ((status === 'weekly-off' || status === 'holiday' || status === 'leave') && day?.checkIn) {
      status = 'present';
    }

    if (isToday && day?.checkIn && !day?.checkOut && status !== 'late') {
      status = 'present';
    }
    return status;
  };

  const getShortStatus = (status, holiday) => {
    if (!status) return "-";
    if (status === 'holiday' && holiday) return `Holiday: ${holiday.title || holiday.name || 'H'}`;
    if (status === 'weekly-off') return 'Week Off';
    if (status === 'work-from-home') return 'WH';
    if (status === 'leave') return 'Lv';
    if (status === 'present') return 'P';
    if (status === 'absent') return 'A';
    if (status === 'half-day') return 'H';
    if (status === 'late') return 'L';
    return status.charAt(0).toUpperCase();
  };

  const getDayStatus = (day, dayIndex) => {
    const d = dayIndex + 1;
    const holiday = getHolidayForDate(dayIndex);
    const isHoliday = !!holiday;
    const isSunday = new Date(filter.year, filter.month - 1, d).getDay() === 0;

    let status = day?.status;

    if (!day && isHoliday) status = 'holiday';
    else if (!day && isSunday) status = 'weekly-off';

    if ((status === 'weekly-off' || status === 'holiday' || status === 'leave') && day?.checkIn) {
      status = 'present';
    }
    return status;
  };

  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = `${API_BASE_URL}/reports/attendance/download?format=excel&companyId=${filter.companyId}&month=${filter.month}&year=${filter.year}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Attendance_Report_${filter.month}_${filter.year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportMenu(false);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export Excel report");
    }
  };

  const exportToPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = `${API_BASE_URL}/reports/attendance/download?format=pdf&companyId=${filter.companyId}&month=${filter.month}&year=${filter.year}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Attendance_Report_${filter.month}_${filter.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportMenu(false);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export PDF report");
    }
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(':');
    if (!h || !m) return "";
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${m} ${ampm}`;
  };

  // ── AUTO-CALCULATE STATUS ──
  useEffect(() => {
    if (!formData.checkInTime) return;

    const [inH, inM] = formData.checkInTime.split(':').map(Number);
    const checkInMinutes = inH * 60 + inM;
    const lateThreshold = 9 * 60 + 15; // 09:15 AM

    let newStatus = "present";

    if (formData.checkOutTime) {
      const [outH, outM] = formData.checkOutTime.split(':').map(Number);
      const checkOutMinutes = outH * 60 + outM;
      const totalMinutes = checkOutMinutes - checkInMinutes;

      if (totalMinutes > 0 && totalMinutes < 4.5 * 60) {
        newStatus = "half-day";
      } else if (checkInMinutes > lateThreshold) {
        newStatus = "late";
      }
    } else if (checkInMinutes > lateThreshold) {
      newStatus = "late";
    }

    if (newStatus !== formData.status && (!formData.status || ["present", "late", "half-day"].includes(formData.status))) {
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  }, [formData.checkInTime, formData.checkOutTime]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const daysInMonth = new Date(filter.year, filter.month, 0).getDate();
  const todayDate = new Date().getDate();
  const isCurrentMonth = filter.month === new Date().getMonth() + 1 && filter.year === new Date().getFullYear();

  // ── INITIAL FETCH ──
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/company`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const comps = data.company || [];
        const compsWithAll = [{ _id: 'all', companyName: 'All Companies' }, ...comps];
        setCompanies(compsWithAll);

        if (!filter.companyId && compsWithAll.length > 0) {
          setFilter(prev => ({ ...prev, companyId: "all" }));
        }
      } catch (err) { console.error(err); }
    };
    fetchCompanies();
  }, []);

  // ── FETCH EMPLOYEES ──
  useEffect(() => {
    const fetchEmps = async () => {
      if (!filter.companyId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/employee?companyId=${filter.companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err) { console.error(err); }
    };
    fetchEmps();
  }, [filter.companyId]);

  // ── FETCH DATA ──
  const fetchData = useCallback(async () => {
    if (!filter.companyId) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const statsRes = await fetch(`${API_BASE_URL}/attendance/dashboard-cards-all?month=${filter.month}&year=${filter.year}&companyId=${filter.companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      console.log("[ATTENDANCE] Summary Stats:", statsData);
      if (statsData.success) setDashboardCards(statsData.data);

      const recRes = await fetch(`${API_BASE_URL}/attendance/all-records?month=${filter.month}&year=${filter.year}&companyId=${filter.companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const recData = await recRes.json();
      console.log("Attendance Records Response:", recData);
      // Wait to process till leaves are fetched below


      const calRes = await fetch(`${API_BASE_URL}/attendance/company-calendar?month=${filter.month}&year=${filter.year}&companyId=${filter.companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const calData = await calRes.json();
      if (calData.success) {
        setHolidayDates(calData.data || []);
      }

      // Fetch leaves for the calendar
      const leaveRes = await fetch(`${API_BASE_URL}/leave/calendar?month=${filter.month}&year=${filter.year}&companyId=${filter.companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const leaveData = await leaveRes.json();
      console.log("-----------------------------------------");
      console.log("LEAVE API RAW RESPONSE:", leaveData);
      console.log("-----------------------------------------");

      const leaves = leaveData.success ? leaveData.data : [];
      setLeaveRecords(leaves);

      // Now process both attendance and leaves
      if (recData.success) {
        processAttendanceData(recData.data, leaves);
      } else {
        processAttendanceData([], leaves);
      }

    } catch (err) { console.error(err); }
    setLoading(false);
  }, [filter.companyId, filter.month, filter.year, employees]); // Added employees so processAttendanceData can use it

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setStatusFilter(null);
  }, [filter.companyId, filter.month, filter.year]);

  useEffect(() => {
    const h = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const processAttendanceData = (apiRecords, leavesIn = []) => {
    const empMap = {};

    // 1. Initialize with relevant employees
    employees.forEach(emp => {
      const uId = emp.user?._id;
      if (!uId) return;

      // ── LIFECYCLE FILTER ──
      // If employee is inactive/terminated/notice_complete, only show them if 
      // the selected month is before or equal to their Last Working Date month.
      const status = String(emp.status).toLowerCase();
      if (['inactive', 'notice_complete', 'terminated'].includes(status) && emp.lastWorkingDate) {
        const lwd = new Date(emp.lastWorkingDate);
        const lwdMonth = lwd.getMonth() + 1;
        const lwdYear = lwd.getFullYear();
        
        // If the filtered month is strictly after the LWD month, skip this employee
        if (filter.year > lwdYear || (filter.year === lwdYear && filter.month > lwdMonth)) {
          return;
        }
      }

      empMap[uId] = {
        userId: uId,
        name: emp.user.name,
        companyName: emp.user.companyId?.companyName || "N/A",
        days: Array(daysInMonth).fill(null)
      };
    });

    // 2. Overlay Attendance Records (Present, Late, etc.)
    apiRecords.forEach(group => {
  const recordsList = Array.isArray(group?.records)
    ? group.records
    : [group]; // fallback if already flat

  recordsList.forEach(rec => {
        const uId = rec.user?._id;
        if (!uId || !empMap[uId]) return;

        if (!rec.date) return;

        // backend already sends IST string
        const dateOnly = rec.date.split("T")[0];
        const [istYear, istMonth, d] = dateOnly.split("-").map(Number);

        if (!d || !istMonth || !istYear) return;

        // Extra debugging
        console.log("RAW DATE:", rec.date);
        console.log("DAY:", d);
        console.log("MONTH:", istMonth);
        console.log("YEAR:", istYear);

        if (d <= daysInMonth && istMonth === filter.month && istYear === filter.year) {
          const existing = empMap[uId].days[d - 1];
          let shouldUpdate = false;

          if (!existing) {
            shouldUpdate = true;
          } else {
            // Priority: Manual > Auto-generated
            if (existing.isAutoGenerated && !rec.isAutoGenerated) {
              shouldUpdate = true;
            }
            // If same type, prioritize active status (Present/Half-day) over passive (Holiday/Absent)
            else if (existing.isAutoGenerated === rec.isAutoGenerated) {
              const priority = {
                'present': 10, 'work-from-home': 10, 'half-day': 9, 'late': 8,
                'on-duty': 7, 'leave': 6, 'holiday': 5, 'weekly-off': 4, 'absent': 1
              };
              if ((priority[rec.status] || 0) > (priority[existing.status] || 0)) {
                shouldUpdate = true;
              }
            }
          }
          if (shouldUpdate) {
            empMap[uId].days[d - 1] = {
              status: rec.status,
              totalHours: rec.totalHours,
              checkIn: rec.checkIn,
              checkOut: rec.checkOut,
              isAutoGenerated: rec.isAutoGenerated,
              _id: rec._id
            };
          }
        }
      });
    });

    // 3. Overlay Approved Leaves
    leavesIn.forEach(leave => {
      // Find employee in empMap
      let targetRow = null;

      // Attempt 1: Match by userId (Most reliable)
      if (leave.userId && empMap[leave.userId]) {
        targetRow = empMap[leave.userId];
      } else {
        // Attempt 2: Fallback to name matching (Case-insensitive)
        const nameToMatch = (leave.userName || leave.employeeName || "").toLowerCase().trim();
        targetRow = Object.values(empMap).find(row =>
          (row.name || "").toLowerCase().trim() === nameToMatch
        );
      }

      if (!targetRow) return;

      const uId = targetRow.userId;

      // Force IST for leaves too
      const leaveStart = new Date(new Date(leave.start).getTime() + (5.5 * 60 * 60 * 1000));
      const leaveEnd = new Date(new Date(leave.end).getTime() + (5.5 * 60 * 60 * 1000));

      // Use getUTC methods for consistent string conversion
      const startStr = leaveStart.getUTCFullYear() + "-" +
        String(leaveStart.getUTCMonth() + 1).padStart(2, '0') + "-" +
        String(leaveStart.getUTCDate()).padStart(2, '0');
      const endStr = leaveEnd.getUTCFullYear() + "-" +
        String(leaveEnd.getUTCMonth() + 1).padStart(2, '0') + "-" +
        String(leaveEnd.getUTCDate()).padStart(2, '0');

      for (let day = 1; day <= daysInMonth; day++) {
        // Current day in local format
        const curStr = filter.year + "-" +
          String(filter.month).padStart(2, '0') + "-" +
          String(day).padStart(2, '0');

        if (curStr >= startStr && curStr <= endStr) {
          const existing = empMap[uId].days[day - 1];

          const priority = {
            'present': 10, 'work-from-home': 10, 'half-day': 9, 'late': 8,
            'on-duty': 7, 'leave': 6, 'holiday': 5, 'weekly-off': 4, 'absent': 1
          };

          if (!existing || (priority['leave'] > (priority[existing.status] || 0))) {
            empMap[uId].days[day - 1] = {
              status: 'leave',
              leaveReason: leave.reason,
              isAutoGenerated: true
            };
          }
        }
      }
    });

    setRecords(Object.values(empMap));
  };

  const handleManualMark = async () => {
    if (!formData.employeeId) { alert("Select an employee"); return; }
    if (!formData.status) { alert("Please select a status"); return; }

    const payload = { ...formData };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/attendance/hr-manual-mark`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setShowManualMark(false);
        setFormData(initialFormData);
        fetchData();
      } else {
        console.error("[MANUAL MARK ERROR]", resData);
        alert(`Failed to save attendance: ${resData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("[MANUAL MARK EXCEPTION]", err);
      alert("Network error. Please try again.");
    }
  };

  const handleDeleteAttendance = async () => {
    if (!formData.attendanceId) return;
    if (!window.confirm("Are you sure you want to delete this attendance record?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/attendance/delete-attendance/${formData.attendanceId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setShowManualMark(false);
        setFormData(initialFormData);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete attendance");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting attendance");
    }
  };

  const openManualMark = (userId, dayIndex) => {
    const emp = employees.find(e => e.user?._id === userId);
    if (!emp) return;

    const row = records.find(r => r.userId === userId);
    const dayData = row?.days[dayIndex];
    const selectedDate = `${filter.year}-${String(filter.month).padStart(2, '0')}-${String(dayIndex + 1).padStart(2, '0')}`;

    setFormData({
      attendanceId: dayData?._id || "",
      employeeId: emp._id,
      date: selectedDate,
      status: dayData?.status || "present",
      checkInTime: dayData?.checkIn ? new Date(dayData.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : "",
      checkOutTime: dayData?.checkOut ? new Date(dayData.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : ""
    });
    setShowManualMark(true);
    setIsEditing(false);
  };

  const getStatusColor = (status, day, isTodayForCell) => {
    if (status === 'late' && day?.checkIn && (day?.checkOut || isTodayForCell)) {
      return 'bg-emerald-100 text-emerald-600 border-emerald-200';
    }
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'absent': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'late': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'holiday': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'half-day': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'leave': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'work-from-home': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'weekly-off': return 'bg-slate-100 text-slate-400 border-slate-200';
      case 'on-duty': return 'bg-cyan-100 text-cyan-600 border-cyan-200';
      default: return 'bg-slate-50 text-slate-300 border-slate-100';
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  };

  const glassCls = "bg-white border border-slate-100 shadow-lg shadow-slate-200/40 rounded-lg";

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 overflow-hidden">

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {(isCurrentMonth ? [
          { label: "Present Today", value: dashboardCards.today?.present || 0, icon: UserCheck, color: "emerald", sub: `OUT OF ${dashboardCards.today?.totalEmployees || 0}`, status: 'present' },
          { label: "Absent Today", value: dashboardCards.today?.absent || 0, icon: X, color: "rose", sub: "EMPLOYEES", status: 'absent' },
          { label: "On Leave", value: dashboardCards.onLeaveToday || 0, icon: CalendarDays, color: "blue", sub: "TODAY", status: 'leave' },
          { label: "Late Today", value: dashboardCards.today?.late || 0, icon: Clock, color: "amber", sub: "ARRIVAL", status: 'late' }
        ] : [
          { label: "Monthly Present", value: dashboardCards.monthly?.onTime || 0, icon: UserCheck, color: "emerald", sub: "TOTAL" },
          { label: "Monthly Absent", value: dashboardCards.monthly?.absent || 0, icon: X, color: "rose", sub: "TOTAL" },
          { label: "Monthly Late", value: dashboardCards.monthly?.late || 0, icon: Activity, color: "amber", sub: "TOTAL" },
          { label: "Attendance Ratio", value: dashboardCards.monthly?.attendanceRatio || 0, icon: BarChart3, color: "blue", sub: "PERCENTAGE" }
        ]).map((s, idx) => (
          <div 
            key={idx} 
            onClick={() => s.status && setStatusFilter(statusFilter === s.status ? null : s.status)}
            className="bg-white border border-slate-200 shadow-sm rounded-lg p-3 flex items-center gap-3 transition-standard hover:shadow-md cursor-pointer"
          >
            <div className={`w-9 h-9 rounded-md bg-${s.color}-500/10 text-${s.color}-600 flex items-center justify-center shrink-0`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{s.label}</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">{s.value}</h2>
                <span className="text-[7px] text-slate-300 font-bold uppercase">{s.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>



      {/* ── LOG TABLE ── */}
      <div className={`${glassCls} border border-slate-100 flex-1 flex flex-col min-h-0 shadow-sm rounded-md`}>
        <div className="p-1 border-b border-slate-50 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/10">

          <div className="flex flex-wrap items-center gap-2 flex-1">
            <h3 className="text-[12px] font-black text-slate-800 tracking-tight uppercase mr-1">Monthly Log</h3>

            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search name..."
                className="pl-8 pr-3 h-8 bg-white border border-slate-200 rounded-md text-[10px] font-bold w-32 sm:w-48 transition-all outline-none"
                value={filter.searchQuery}
                onChange={e => setFilter({ ...filter, searchQuery: e.target.value })}
              />
            </div>

            {/* Company & Date Filters Group */}
            <div className="flex items-center h-8 bg-white rounded-md border border-slate-200 shadow-sm relative z-50">
              <CustomSelector
                icon={<Building size={11} />}
                value={filter.companyId}
                options={companies.map(c => ({ id: c._id, name: c.companyName }))}
                onChange={(id) => setFilter({ ...filter, companyId: id })}
                minWidth="100px" className="!py-0 h-full !rounded-l-md !rounded-r-none hover:bg-slate-50/50"
              />
              <div className="w-px h-4 bg-slate-100 self-center mx-0.5" />
              <CustomSelector
                icon={<CalendarDays size={11} />}
                value={filter.month}
                options={months.map((m, i) => ({ id: i + 1, name: m }))}
                onChange={(id) => setFilter({ ...filter, month: id })}
                minWidth="70px" className="!py-0 h-full !rounded-none hover:bg-slate-50/50"
              />
              <div className="w-px h-4 bg-slate-100 self-center mx-0.5" />
              <input
                type="number"
                className="w-14 bg-transparent text-[10px] font-bold text-slate-600 h-full outline-none text-center rounded-r-md"
                value={filter.year}
                onChange={(e) => setFilter(p => ({ ...p, year: Number(e.target.value) }))}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchData()}
              className="w-8 h-8 bg-white text-slate-400 border border-slate-200 rounded-md flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 h-8 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <FiDownload size={13} /> Export
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-md shadow-lg z-[100] py-1">
                  <button
                    onClick={exportToPDF}
                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> PDF Report
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Excel Sheet
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setFormData(initialFormData);
                setShowManualMark(true);
                setIsEditing(true);
              }}
              className="px-4 h-8 bg-[#24406D] text-white text-[10px] font-bold rounded-md shadow-sm flex items-center justify-center gap-2 hover:bg-[#1a2f50] active:scale-95 transition-all"
            >
              <Plus size={14} /> Add Entry
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 shadow-sm z-30 border-b border-slate-100">
              <tr>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-40 border-r border-slate-200 min-w-[170px]">Employee Name</th>
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const isToday = isCurrentMonth && d === todayDate;
                  return (
                    <th key={i} className={`px-2 py-2.5 text-[9px] font-bold text-center border-r border-slate-100 min-w-[32px] ${isToday ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                      {d}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {records
                .filter(r => r.name.toLowerCase().includes(filter.searchQuery.toLowerCase()))
                .filter(row => {
                  if (!statusFilter || !isCurrentMonth) return true;
                  return getEffectiveStatus(row, todayDate - 1) === statusFilter;
                })
                .map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 group transition-standard">
                  <td className="px-3 py-3.5 sticky left-0 bg-white group-hover:bg-slate-50 z-20 border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[9px]">
                        {row.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[11px] font-bold text-slate-700 tracking-tight leading-none">{row.name}</p>
                        {filter.companyId === 'all' && (
                          <span className="text-[7px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">
                            {row.companyName}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  {row.days.map((day, i) => {
                    const d = i + 1;
                    const isToday = isCurrentMonth && d === todayDate;
                    const dateStr = `${filter.year}-${String(filter.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const holiday = getHolidayForDate(i);
                    const isHoliday = !!holiday;

                    const isSunday = new Date(filter.year, filter.month - 1, d).getDay() === 0;

                    let status = day?.status;

                    // Fallbacks if no record exists or if recorded as absent on a non-working day
                    if (!day || status === 'absent') {
                      if (isHoliday) status = 'holiday';
                      else if (isSunday) status = 'weekly-off';
                    }

                    // If check-in exists on a weekly-off, holiday, or leave, mark as present (aligns with backend)
                    if ((status === 'weekly-off' || status === 'holiday' || status === 'leave') && day?.checkIn) {
                      status = 'present';
                    }

                    // If current date and has check-in but no check-out, show 'Present' instead of 'Half Day'
                    // BUT keep 'late' status if they were late
                    if (isToday && day?.checkIn && !day?.checkOut && status !== 'late') {
                      status = 'present';
                    }

                    let statusChar = status?.charAt(0).toUpperCase() || "";
                    if (status === 'work-from-home') statusChar = "WH";
                    if (status === 'leave') statusChar = "Lv";

                    let hoverText = status || "";
                    if (day?.checkIn) {
                      hoverText = `In: ${formatTime(day.checkIn)}\nOut: ${formatTime(day.checkOut)}`;
                    } else if (status === 'leave' && day?.leaveReason) {
                      hoverText = `On Leave: ${day.leaveReason}`;
                    } else if (status === 'holiday' && holiday) {
                      hoverText = `Holiday: ${holiday.title || holiday.name || 'H'}`;
                    }

                    return (
                      <td
                        key={i}
                        className="px-0 py-2 border-r border-slate-100 text-center align-middle cursor-pointer hover:bg-blue-50/50 transition-colors"
                        onClick={() => openManualMark(row.userId, i)}
                      >
                        {status ? (
                          <div
                            className={`w-4.5 h-4.5 mx-auto rounded-sm border flex items-center justify-center text-[8px] font-bold transition-all ${getStatusColor(status, day, isToday)}`}
                            title={hoverText}
                          >
                            {statusChar}
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 mx-auto flex items-center justify-center text-slate-200">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── TABLE FOOTER / LEGEND ── */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/30 flex flex-wrap gap-x-4 gap-y-1.5 items-center">
          {[
            { char: 'P', label: 'Present', status: 'present' },
            { char: 'A', label: 'Absent', status: 'absent' },
            { char: 'H', label: 'Half Day', status: 'half-day' },
            { char: 'H', label: 'Holiday', status: 'holiday' },
            { char: 'L', label: 'Late', status: 'late' },
            { char: 'Lv', label: 'Leave', status: 'leave' },
            { char: 'WH', label: 'WFH', status: 'work-from-home' },
            { char: 'W', label: 'Weekly Off', status: 'weekly-off' },
            { char: 'O', label: 'On Duty', status: 'on-duty' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center text-[8px] font-bold shadow-sm ${getStatusColor(item.status)}`}>
                {item.char}
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODALS ── */}

      {showManualMark && (
        <Modal
          title={isEditing ? "Add Entry" : "View Entry"}
          onClose={() => { setShowManualMark(false); setFormData(initialFormData); }}
          headerActions={(
            <div className="flex items-center gap-2">
              {formData.attendanceId && (
                <button
                  onClick={isEditing ? handleDeleteAttendance : undefined}
                  disabled={!isEditing}
                  className={`transition-all p-1.5 rounded-md flex items-center gap-1.5 ${isEditing
                      ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      : "text-slate-300 opacity-20 cursor-not-allowed"
                    }`}
                  title={isEditing ? "Delete Entry" : ""}
                >
                  <Trash2 size={15} />
                  {isEditing && <span className="text-[10px] font-black uppercase tracking-tight">Delete</span>}
                </button>
              )}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-500 hover:text-blue-700 transition-all p-1.5 hover:bg-blue-50 rounded-md flex items-center gap-1.5"
                  title="Edit Entry"
                >
                  <Edit3 size={15} />
                  <span className="text-[10px] font-black uppercase tracking-tight">Edit</span>
                </button>
              )}
            </div>
          )}
        >
          <div className={`space-y-2.5 ${!isEditing ? 'opacity-90' : ''}`}>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-0.5">Personnel</label>
              <CustomSelector
                value={formData.employeeId}
                options={employees.map(e => ({ id: e._id, name: e.user?.name }))}
                onChange={(id) => setFormData({ ...formData, employeeId: id })}
                disabled={!isEditing}
                className="!py-2.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-0.5">Date</label>
                <input
                  type="date"
                  disabled={!isEditing}
                  className="w-full bg-slate-50/50 p-2 rounded-md text-[12px] font-black outline-none border border-slate-100 focus:bg-white focus:border-blue-500/30 transition-all text-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed uppercase"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-0.5">Status</label>
                <CustomSelector
                  value={formData.status}
                  options={[
                    { id: 'present', name: 'Present' },
                    { id: 'late', name: 'Late' },
                    { id: 'half-day', name: 'Half Day' },
                    { id: 'leave', name: 'Leave' },
                    { id: 'work-from-home', name: 'WFH' },
                    { id: 'absent', name: 'Absent' }
                  ]}
                  onChange={(s) => {
                    const updates = { status: s };
                    if (s === 'absent' || s === 'leave') {
                      updates.checkInTime = "";
                      updates.checkOutTime = "";
                    }
                    setFormData(prev => ({ ...prev, ...updates }));
                  }}
                  disabled={!isEditing}
                  className="!py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`space-y-1 transition-all duration-300 ${(!isEditing || formData.status === 'absent' || formData.status === 'leave') ? 'opacity-40 blur-[1px] grayscale-[0.5]' : ''}`}>
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check In</label>
                  {formData.checkInTime && <span className="text-[9px] font-black text-blue-500">{convertTo12Hour(formData.checkInTime)}</span>}
                </div>
                <input
                  type="time"
                  disabled={!isEditing || formData.status === 'absent' || formData.status === 'leave'}
                  className="w-full bg-slate-50/50 p-2 rounded-md text-[12px] font-black outline-none border border-slate-100 focus:bg-white focus:border-blue-500/30 transition-all text-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  value={formData.checkInTime}
                  onChange={e => setFormData({ ...formData, checkInTime: e.target.value })}
                />
              </div>
              <div className={`space-y-1 transition-all duration-300 ${(!isEditing || formData.status === 'absent' || formData.status === 'leave') ? 'opacity-40 blur-[1px] grayscale-[0.5]' : ''}`}>
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check Out</label>
                  {formData.checkOutTime && <span className="text-[9px] font-black text-blue-500">{convertTo12Hour(formData.checkOutTime)}</span>}
                </div>
                <input
                  type="time"
                  disabled={!isEditing || formData.status === 'absent' || formData.status === 'leave'}
                  className="w-full bg-slate-50/50 p-2 rounded-md text-[12px] font-black outline-none border border-slate-100 focus:bg-white focus:border-blue-500/30 transition-all text-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  value={formData.checkOutTime}
                  onChange={e => setFormData({ ...formData, checkOutTime: e.target.value })}
                />
              </div>
            </div>

            {isEditing && (
              <button
                onClick={handleManualMark}
                className="w-full py-2.5 mt-2 bg-[#24406D] text-white rounded-md font-black text-[11px] uppercase tracking-widest shadow-sm hover:bg-[#1a2f50] transition-all active:scale-[0.98]"
              >
                Save Changes
              </button>
            )}
          </div>
        </Modal>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
    </div>
  );
}


