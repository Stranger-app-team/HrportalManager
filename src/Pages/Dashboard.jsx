import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import { API_BASE_URL } from "../config/api";
import { FiArrowDown, FiArrowUp, FiSettings, FiUser, FiLogOut, FiCalendar, FiActivity, FiTag, FiClock, FiCheckCircle, FiAlertCircle, FiChevronRight, FiChevronLeft, FiInfo, FiEye, FiEyeOff } from "react-icons/fi";
import { FaBirthdayCake } from "react-icons/fa";
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController
} from "chart.js";

import { getFullUrl } from "../utils/urlHelper";
import CustomSelector from "../components/Shared/CustomSelector";
import { Building, Activity, Filter } from "lucide-react";

ChartJS.register(
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController
);

const STATUS_FILTERS = [
  { key: "all",     label: "All",     color: "#64748b",  bg: "rgba(100,116,139,0.08)" },
  { key: "present", label: "Present", color: "#24406D",  bg: "rgba(36,64,109,0.08)"   },
  { key: "late",    label: "Late",    color: "#64748b",  bg: "rgba(100,116,139,0.08)" },
  { key: "absent",  label: "Absent",  color: "#94a3b8",  bg: "rgba(148,163,184,0.08)" },
  { key: "leave",   label: "Leave",   color: "#cbd5e1",  bg: "rgba(203,213,225,0.08)" },
];

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  // dateStr is expected to be YYYY-MM-DD
  const parts = dateStr.split("T")[0].split("-").map(Number);
  if (parts.length < 3) return new Date();
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function getLocalDateString(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  
  // Use Intl.DateTimeFormat to get parts in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(d); // Returns YYYY-MM-DD in IST
}

export default function Dashboard() {
  const now = new Date();
  const [showAll, setShowAll] = useState(false);
  const [employeesData, setEmployeesData] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(40);
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [summary, setSummary] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showMonthMenu, setShowMonthMenu] = useState(false);

  const [trendViewType, setTrendViewType] = useState("monthly");
  const [showTrendViewMenu, setShowTrendViewMenu] = useState(false);

  const [showDonutMenu, setShowDonutMenu] = useState(false);
  const [donutMonth, setDonutMonth] = useState(now.getMonth());
  const [donutYear, setDonutYear] = useState(now.getFullYear());
  const [attendanceViewType, setAttendanceViewType] = useState("weekly");
  const [showAttendanceViewMenu, setShowAttendanceViewMenu] = useState(false);

  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);

  const [monthStats, setMonthStats] = useState({
    onTime: 0,
    late: 0,
    workHours: 0,
    todaySummary: { present: 0, absent: 0, late: 0, wfh: 0, leave: 0 }
  });

  const [birthdays, setBirthdays] = useState([]);
  const [currentBirthdayIndex, setCurrentBirthdayIndex] = useState(0);
  const [autoSlide, setAutoSlide] = useState(true);
  const [activeSeries, setActiveSeries] = useState(null);

  // â”€â”€ New dashboard bottom state â”€â”€
  const [companies, setCompanies] = useState([]);
  const [empCompanyFilter, setEmpCompanyFilter] = useState("all");
  const [empStatusFilter, setEmpStatusFilter] = useState("all");
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]); // unfiltered, for explorer

  // Activity feed state
  const [todayEvents, setTodayEvents] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [pendingLifecycle, setPendingLifecycle] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Presence state
  const [presenceDate, setPresenceDate] = useState(now.toISOString().split("T")[0]);
  const [presenceRecords, setPresenceRecords] = useState([]);
  const [presenceLoading, setPresenceLoading] = useState(false);
  const [lateStreaks, setLateStreaks] = useState({});
  const [latePercentMap, setLatePercentMap] = useState({});
  const [showConsistentLate, setShowConsistentLate] = useState(false);
  const [showMonthWiseLate, setShowMonthWiseLate] = useState(false);
  const [activeToggleLate, setActiveToggleLate] = useState(false);
  const [activeToggleAbsent, setActiveToggleAbsent] = useState(false);
  const [activeToggleLeave, setActiveToggleLeave] = useState(false);

  const toggleSeries = (label) => {
    setActiveSeries((prev) => (prev === label ? null : label));
  };

  const isSeriesVisible = (label) => activeSeries === null || activeSeries === label;

  const [donutTrendData, setDonutTrendData] = useState(null);
  const [donutLoading, setDonutLoading] = useState(true);
  const [liveLastUpdated, setLiveLastUpdated] = useState(null);

  const dropdownRef = useRef(null);
  const monthMenuRef = useRef(null);
  const donutMenuRef = useRef(null);
  const attendanceViewMenuRef = useRef(null);
  const trendViewMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setSelectedCard(null);
      if (monthMenuRef.current && !monthMenuRef.current.contains(e.target)) setShowMonthMenu(false);
      if (donutMenuRef.current && !donutMenuRef.current.contains(e.target)) setShowDonutMenu(false);
      if (attendanceViewMenuRef.current && !attendanceViewMenuRef.current.contains(e.target)) setShowAttendanceViewMenu(false);
      if (trendViewMenuRef.current && !trendViewMenuRef.current.contains(e.target)) setShowTrendViewMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("username");
    if (!token) navigate("/login", { replace: true });
    if (name) setUsername(name);
    fetchEmployees();
    fetchUserProfile();
  }, [navigate]);

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
    fetchAttendanceTrend(selectedYear, selectedMonth);
    fetchDashboardSummary();
    fetchUpcomingBirthdays();
  }, [selectedYear, selectedMonth, empCompanyFilter]);

  useEffect(() => {
    if (autoSlide && birthdays.length > 1) {
      const interval = setInterval(() => {
        setCurrentBirthdayIndex((prev) => (prev + 1) % birthdays.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [birthdays.length, autoSlide]);

  useEffect(() => {
    fetchCompanies();
    fetchAllEmployees();
    fetchTodayAttendance();
    fetchActivityFeed();
  }, [empCompanyFilter]);

  useEffect(() => {
    fetchAttendanceTrend(donutYear, donutMonth);
  }, [donutYear, donutMonth]);

  useEffect(() => {
    fetchPresenceDateRecords(presenceDate);
  }, [presenceDate, empCompanyFilter]);

  useEffect(() => {
    const timer = setInterval(() => fetchAttendanceTrend(donutYear, donutMonth), 60000);
    return () => clearInterval(timer);
  }, [donutYear, donutMonth]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      // Enterprise-wide fetch for dashboard summary count with filter
      let url = `${API_BASE_URL}/employee`;
      if (empCompanyFilter && empCompanyFilter !== "all") {
        url += `?companyId=${empCompanyFilter}`;
      }
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      console.log("[DASHBOARD] Fetched Employees:", result);
      if (result) {
        setEmployeesData(result);
        setTotalEmployees(result.length || 40);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  // Always fetch ALL employees (no company filter) so the explorer dropdown can filter client-side
  const fetchAllEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/employee`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (Array.isArray(result)) {
        setAllEmployees(result);
      }
    } catch (err) {
      console.error("Error fetching all employees for explorer:", err);
    }
  };


  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/company`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCompanies(data.company || []);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/attendance/all-records?flat=true&year=${now.getFullYear()}&month=${now.getMonth() + 1}${empCompanyFilter && empCompanyFilter !== "all" ? `&companyId=${empCompanyFilter}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        const todayStr = getLocalDateString(now);
        const todayRecs = result.data.filter(r => {
          const d = getLocalDateString(r.date);
          return d === todayStr;
        });
        setTodayAttendance(todayRecs);
      }
    } catch (err) {
      console.error("Error fetching today attendance:", err);
    }
  };

  const fetchPresenceDateRecords = async (dateStr) => {
    try {
      setPresenceLoading(true);
      const token = localStorage.getItem("token");
      const [y, m, d] = dateStr.split('-');
      
      const res = await fetch(`${API_BASE_URL}/attendance/all-records?flat=true&year=${y}&month=${parseInt(m, 10)}${empCompanyFilter && empCompanyFilter !== "all" ? `&companyId=${empCompanyFilter}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        const recs = result.data.filter(r => {
          const rd = getLocalDateString(r.date);
          return rd === dateStr;
        });
        setPresenceRecords(recs);
      }
    } catch (err) {
      console.error("Error fetching presence records:", err);
    } finally {
      setPresenceLoading(false);
    }
  };

  const fetchActivityFeed = async () => {
    setActivityLoading(true);
    try {
      const token = localStorage.getItem("token");
      // 1. Fetch calendar events/holidays with filter
      const calRes = await fetch(
        `${API_BASE_URL}/attendance/company-calendar?month=${now.getMonth() + 1}&year=${now.getFullYear()}${empCompanyFilter && empCompanyFilter !== "all" ? `&companyId=${empCompanyFilter}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const calData = await calRes.json();
      if (calData.success) {
        const todayStr = getLocalDateString(now);
        const todayCalEvents = calData.data.filter(e => {
          const eDate = getLocalDateString(e.date);
          return eDate === todayStr;
        });
        setTodayEvents(todayCalEvents);
      }

      // 2. Fetch pending leaves
      const leaveRes = await fetch(`${API_BASE_URL}/leave/all?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const leaveData = await leaveRes.json();
      if (leaveData.success) {
        const allPending = leaveData.data || [];
        const filtered = empCompanyFilter && empCompanyFilter !== "all"
          ? allPending.filter(l => (l.companyId?._id || l.companyId) === empCompanyFilter)
          : allPending;
        
        // Sort by most recent first
        const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPendingLeaves(sorted.slice(0, 5));
      }

      // 3. Fetch open tickets
      const ticketRes = await fetch(`${API_BASE_URL}/tickets/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ticketData = await ticketRes.json();
      const allTickets = Array.isArray(ticketData) ? ticketData
        : Array.isArray(ticketData?.data) ? ticketData.data
        : Array.isArray(ticketData?.tickets) ? ticketData.tickets : [];
      const openTickets = allTickets.filter(t => t.status === "Pending" || t.status === "in-progress");
      const compFiltered = empCompanyFilter && empCompanyFilter !== "all"
        ? openTickets.filter(t => (t.companyId?._id || t.companyId) === empCompanyFilter)
        : openTickets;
      setPendingTickets(compFiltered.slice(0, 5));

      // 4. Fetch lifecycle requests
      const empRes = await fetch(`${API_BASE_URL}/employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const empData = await empRes.json();
      const lifecycleReqs = (empData || []).filter(e => e.resignationRequested || e.withdrawalRequested);
      setPendingLifecycle(lifecycleReqs);
    } catch (err) {
      console.error("Error fetching activity feed:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchAttendanceTrend = async (year, month) => {
    try {
      setTrendLoading(true);
      const token = localStorage.getItem("token");
      // Fetch all records for the enterprise or company to aggregate trend and summaries
      let url = `${API_BASE_URL}/attendance/all-records?flat=true&year=${year}&month=${month + 1}`;
      if (empCompanyFilter && empCompanyFilter !== "all") {
        url += `&companyId=${empCompanyFilter}`;
      }

      const res = await fetch(
        url,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      console.log(`[DASHBOARD] Attendance Records (${year}-${month + 1}):`, result);
      if (result.success) {
        const records = result.data;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dailyData = {};

        // Initialize daily data
        for (let d = 1; d <= daysInMonth; d++) {
          dailyData[d] = { present: 0, late: 0, leave: 0, wfh: 0, absent: 0 };
        }

        const todayStr = getLocalDateString(new Date());
        let todayStats = { present: 0, absent: 0, late: 0, wfh: 0, leave: 0 };

        records.forEach(v => {
          const dStr = getLocalDateString(v.date);
          const d = parseInt(dStr.split("-")[2], 10);
          
          let effectiveStatus = (v.status || "").toLowerCase();

          // For today, if they have a check-in but are marked as absent/nothing, treat as present.
          // BUT if they are ALREADY marked as 'late', keep them as 'late'.
          if (dStr === todayStr && v.checkIn) {
            if (effectiveStatus === "absent" || effectiveStatus === "" || !effectiveStatus || effectiveStatus === "—") {
              effectiveStatus = "present";
            }
          }

          if (dailyData[d]) {
            if (effectiveStatus === "present") dailyData[d].present++;
            else if (effectiveStatus === "late") dailyData[d].late++;
            else if (effectiveStatus === "leave") dailyData[d].leave++;
            else if (effectiveStatus === "work-from-home") dailyData[d].wfh++;
            else if (effectiveStatus === "absent") dailyData[d].absent++;
            else if (effectiveStatus === "half-day") dailyData[d].present += 0.5; 
          }

          if (dStr === todayStr) {
            if (effectiveStatus === "present") todayStats.present++;
            else if (effectiveStatus === "late") todayStats.late++;
            else if (effectiveStatus === "leave") todayStats.leave++;
            else if (effectiveStatus === "work-from-home") todayStats.wfh++;
            else if (effectiveStatus === "absent") todayStats.absent++;
          }
        });
        const labels = Object.keys(dailyData).map(Number);
        const present = labels.map(l => dailyData[l].present + dailyData[l].wfh);
        const late = labels.map(l => dailyData[l].late);
        const leave = labels.map(l => dailyData[l].leave);

        // Calculate late streaks ending today (or the end of the selected month)
        const todayObj = new Date();
        let anchorDateStr = getLocalDateString(todayObj);
        
        // If the selected month/year is different from the current month/year,
        // anchor at the end of that selected month.
        if (year !== todayObj.getFullYear() || month !== todayObj.getMonth()) {
          const lastDay = new Date(year, month + 1, 0);
          anchorDateStr = getLocalDateString(lastDay);
        }

        // Find all holidays in the records to know if a date is a holiday
        const holidayDates = new Set();
        records.forEach(r => {
          if (r.status?.toLowerCase() === "holiday") {
            const dStr = getLocalDateString(r.date);
            if (dStr) holidayDates.add(dStr);
          }
        });

        const streaks = {};
        const monthLatePercent = {};
        const userRecordsMap = {};
        records.forEach(r => {
          const uid = r.user?._id || r.user;
          if (!uid) return;
          const uidStr = String(uid);
          if (!userRecordsMap[uidStr]) {
            userRecordsMap[uidStr] = [];
          }
          userRecordsMap[uidStr].push(r);
        });

        Object.keys(userRecordsMap).forEach(uidStr => {
          const empRecs = userRecordsMap[uidStr];
          const dateMap = {};
          empRecs.forEach(r => {
            const dateStr = getLocalDateString(r.date);
            if (!dateStr) return;
            dateMap[dateStr] = r.status?.toLowerCase();
          });
          
          let streak = 0;
          let currentDate = parseLocalDate(anchorDateStr);
          
          // Go backwards day by day for up to 30 days
          for (let i = 0; i < 30; i++) {
            const dStr = getLocalDateString(currentDate);
            
            // Do not check future dates compared to today
            const todayStr = getLocalDateString(todayObj);
            if (dStr > todayStr) {
              currentDate.setDate(currentDate.getDate() - 1);
              continue;
            }

            const status = dateMap[dStr];
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ...
            
            const isSunday = dayOfWeek === 0;
            const isHoliday = holidayDates.has(dStr) || status === "holiday";
            const isWeeklyOff = status === "weekly-off" || isSunday;

            if (status === "late") {
              streak++;
            } else if (status === "present" || status === "work-from-home" || status === "on-field") {
              // Present on time breaks the streak, even if holiday/sunday
              break;
            } else if (isWeeklyOff || isHoliday || status === "absent" || status === "leave") {
              // Ignore weekly off, holidays, absent, and leave (keep walking backwards)
            } else {
              // no record on a working day breaks the streak
              break;
            }
            
            currentDate.setDate(currentDate.getDate() - 1);
          }
          
          streaks[uidStr] = streak;

          // Calculate > 50% late in current month (up to anchor date)
          let currentMonthDaysPassed = 0;
          let currentMonthLateDays = 0;
          let checkDate = new Date(year, month, 1);
          const anchorDateObj = parseLocalDate(anchorDateStr);
          
          while (checkDate <= anchorDateObj) {
            const dStr = getLocalDateString(checkDate);
            const status = dateMap[dStr];
            const dayOfWeek = checkDate.getDay();
            const isSunday = dayOfWeek === 0;
            const isHoliday = holidayDates.has(dStr) || status === "holiday";
            const isWeeklyOff = status === "weekly-off" || isSunday;
            
            if (!isWeeklyOff && !isHoliday) {
              currentMonthDaysPassed++;
              if (status === "late") {
                currentMonthLateDays++;
              }
            }
            checkDate.setDate(checkDate.getDate() + 1);
          }
          
          if (currentMonthDaysPassed > 0) {
            if ((currentMonthLateDays / currentMonthDaysPassed) >= 0.5 && currentMonthLateDays > 0) {
               monthLatePercent[uidStr] = { late: currentMonthLateDays, total: currentMonthDaysPassed };
            }
          }
        });
        setLateStreaks(streaks);
        setLatePercentMap(monthLatePercent);

        setTrendData({ labels, present, late, leave, raw: records });
        setMonthStats(prev => ({ ...prev, todaySummary: todayStats }));
        
        // Also update donut trend data
        setDonutTrendData({ 
          present, 
          late, 
          leave, 
          dates: labels.map(l => `${year}-${String(month + 1).padStart(2, '0')}-${String(l).padStart(2, '0')}`) 
        });
        setLiveLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching trend:", error);
    } finally {
      setTrendLoading(false);
    }
  };


  const fetchDashboardSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      // Dashboard summary with filter
      let url = `${API_BASE_URL}/attendance/dashboard-cards-all?month=${selectedMonth + 1}&year=${selectedYear}`;
      if (empCompanyFilter && empCompanyFilter !== "all") {
        url += `&companyId=${empCompanyFilter}`;
      }

      const res = await fetch(
        url,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      console.log("[DASHBOARD] Summary Stats:", result);
      if (result.success) {
        const data = result.data;
        const today = data?.today || {};
        
        setSummary({
          onTime: today.onTime ?? 0,
          late: today.late ?? 0,
          absent: today.absent ?? 0,
          leave: today.leave ?? 0,
          // Handle cases where totalEmployees might be at the root or inside 'today'
          totalEmployees: data.totalEmployees ?? today.totalEmployees ?? 0,
          absentEmployees: data.absentEmployees || [],
          lateEmployees: data.lateEmployees || [],
          onLeaveEmployees: data.onLeaveEmployees || [],
          totalWorkingHours: {
            hours: Math.floor(Number(data.monthly?.totalWorkingHours) || 0),
            minutes: Math.round((Number(data.monthly?.totalWorkingHours) % 1) * 60)
          }
        });
      }
    } catch (err) {
      console.error("Error fetching dashboard summary:", err);
    }
  };

  const fetchUpcomingBirthdays = async () => {
    try {
      const token = localStorage.getItem("token");
      // Birthdays with filter
      let url = `${API_BASE_URL}/dashboard/upcoming-birthdays`;
      if (empCompanyFilter && empCompanyFilter !== "all") {
        url += `?companyId=${empCompanyFilter}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      console.log("[DASHBOARD] Birthdays:", result);
      if (Array.isArray(result)) {
        setBirthdays(result);
      }
    } catch (err) {
      console.error("Error fetching birthdays:", err);
    }
  };

  const getAttendanceViewData = () => {
    if (!donutTrendData) return { present: 0, late: 0, leave: 0, total: 0 };
    const { present, late, leave, dates } = donutTrendData;
    const sumArr = (arr) => arr.reduce((a, b) => a + (b ?? 0), 0);

    if (attendanceViewType === "daily") {
      const todayStr = getLocalDateString(now);
      const idx = dates.findIndex(d => d === todayStr);
      if (idx === -1) {
        const lastIdx = dates.length - 1;
        if (lastIdx < 0) return { present: 0, late: 0, leave: 0, total: 0 };
        const p = present[lastIdx] ?? 0;
        const l = late[lastIdx] ?? 0;
        const lv = leave[lastIdx] ?? 0;
        return { present: p, late: l, leave: lv, total: p + l + lv };
      }
      const p = present[idx] ?? 0;
      const l = late[idx] ?? 0;
      const lv = leave[idx] ?? 0;
      return { present: p, late: l, leave: lv, total: p + l + lv };
    }

    if (attendanceViewType === "weekly") {
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const todayIdx = dates.findIndex(d => d === todayStr);
      const endIdx = todayIdx === -1 ? dates.length : todayIdx + 1;
      const startIdx = Math.max(0, endIdx - 7);
      const slice = (arr) => arr.slice(startIdx, endIdx).reduce((a, b) => a + (b ?? 0), 0);
      const p = slice(present);
      const l = slice(late);
      const lv = slice(leave);
      return { present: p, late: l, leave: lv, total: p + l + lv };
    }

    const p = sumArr(present);
    const l = sumArr(late);
    const lv = sumArr(leave);
    return { present: p, late: l, leave: lv, total: p + l + lv };
  };

  const donutStats = getAttendanceViewData();
  const donutTotal = donutStats.total || 1;
  const pct = (v) => Math.round((v / donutTotal) * 100);

  const CIRCUMFERENCE = 2 * Math.PI * 38;
  const presentDash = (donutStats.present / donutTotal) * CIRCUMFERENCE;
  const lateDash = (donutStats.late / donutTotal) * CIRCUMFERENCE;
  const leaveDash = (donutStats.leave / donutTotal) * CIRCUMFERENCE;
  const lateDashOffset = -presentDash;
  const leaveDashOffset = -(presentDash + lateDash);

  const availableMonths = (() => {
    const list = [];
    for (let y = now.getFullYear() - 1; y <= now.getFullYear(); y++) {
      const maxM = y === now.getFullYear() ? now.getMonth() : 11;
      for (let m = 0; m <= maxM; m++) {
        list.push({ year: y, month: m, label: `${MONTH_NAMES_SHORT[m]} ${y}` });
      }
    }
    return list.reverse();
  })();

  const handleMonthSelect = (yr, mo) => {
    setSelectedMonth(mo);
    setSelectedYear(yr);
    setShowMonthMenu(false);
  };

  const avg = (arr) => {
    if (!arr || !arr.length) return 0;
    const nonZero = arr.filter((v) => v > 0);
    if (!nonZero.length) return 0;
    return Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length);
  };

  const avgSlice = (arr) => {
    if (!arr || !arr.length) return 0;
    return Math.round(arr.reduce((a, b) => a + (b ?? 0), 0) / arr.length);
  };

  const getAggregatedTrendData = () => {
    if (!trendData) return null;
    const { labels, present, late, leave } = trendData;
    const computedAbsent = labels.map((_, i) => Math.max(0, totalEmployees - (present[i] + late[i] + leave[i])));
    return { labels, present, late, leave, absent: computedAbsent };
  };

  const aggregatedTrend = getAggregatedTrendData();
  const sumArr = (arr) => arr ? arr.reduce((a, b) => a + (b ?? 0), 0) : 0;
  const maxArr = (arr) => (arr && arr.length) ? Math.max(...arr) : 0;

  const footerTotalLate    = trendData ? sumArr(trendData.late) : 0;
  const footerTotalLeave   = trendData ? sumArr(trendData.leave) : 0;
  const footerPeakAttendance = trendData ? maxArr(trendData.present) : 0;
  const avgPresent = trendData ? avg(trendData.present) : 0;
  const footerAttendancePct = totalEmployees > 0 ? Math.round((avgPresent / totalEmployees) * 100) : 0;

  const SERIES_CONFIG = [
    { label: "Present", data: aggregatedTrend?.present, color: "#60A5FA" }, // Soft Blue
    { label: "Late",    data: aggregatedTrend?.late,    color: "#FBBF24" }, // Soft Amber
    { label: "Leave",   data: aggregatedTrend?.leave,   color: "#34D399" }, // Soft Emerald
    { label: "Absent",  data: aggregatedTrend?.absent,  color: "#F8FAFC" }, // Subtle Ghost Grey
  ];

  const activeSeriesConfig = SERIES_CONFIG.filter(s => isSeriesVisible(s.label) && aggregatedTrend);
  const isStacked = true; // Always stack to show parts of whole


  // âœ… Y-axis scaled to total employee count (dynamic)
  const yAxisMax  = totalEmployees;
  const yStepSize = Math.ceil(totalEmployees / 5);

  const attendanceTrendChartData = aggregatedTrend ? {
    labels: aggregatedTrend.labels,
    datasets: [
      ...activeSeriesConfig.map((s, idx) => {
        const isFirst = idx === 0;
        const isLast  = idx === activeSeriesConfig.length - 1;
        const isPresent = s.label === "Present";
        
        return {
          type: "bar",
          label: s.label,
          data:  s.data,
          backgroundColor: s.color, // Using colors from SERIES_CONFIG
          borderColor: "transparent",
          borderWidth: 0,
          borderRadius: {
            topLeft:     isLast  ? 3 : 0,
            topRight:    isLast  ? 3 : 0,
            bottomLeft:  isFirst ? 3 : 0,
            bottomRight: isFirst ? 3 : 0,
          },
          borderSkipped:      isFirst ? "bottom" : false,
          barPercentage:      0.65,
          categoryPercentage: 0.8,
          order: 1, // Bars behind line
        };
      }),
      // Add the High-Contrast Trend Line for 'Present'
      ...(isSeriesVisible("Present") ? [{
        type: "line",
        label: "Present (Trend)",
        data:  aggregatedTrend.present,
        borderColor: "#2563EB", // Vibrant Blue Trend Line
        backgroundColor: "rgba(37, 99, 235, 0.05)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 10,
        order: 0, // Line on top
      }] : [])
    ],
  } : null;

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    animation: { duration: 500, easing: "easeInOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        padding: { top: 10, bottom: 10, left: 14, right: 14 },
        titleFont: { size: 11, weight: "600" },
        bodyFont:  { size: 11 },
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          title: (items) => `Day ${items[0].label} · ${MONTH_NAMES_SHORT[selectedMonth]} ${selectedYear}`,
          label: (ctx) => {
            if (ctx.dataset.label === "Present (Trend)") return null; // Hide the trend line duplicate from tooltip
            return `  ${ctx.dataset.label}  ${ctx.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: isStacked,
        grid:    { display: false },
        border:  { display: false },
        ticks: {
          color: "#9CA3AF",
          font:  { size: 9 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 16,
        },
      },
      y: {
        stacked: isStacked,
        beginAtZero: true,
        // âœ… Y-axis always goes 0 â†’ total employees (e.g. 0 â†’ 40)
        min: 0,
        max: yAxisMax,
        grid:   { color: "rgba(0,0,0,0.04)", lineWidth: 1 },
        border: { display: false },
        ticks: {
          color: "#9CA3AF",
          font:  { size: 10 },
          padding: 6,
          maxTicksLimit: 6,
          stepSize: yStepSize,
        },
      },
    },
  };

  const handleLogout = () => {
    setShowLogoutPopup(true);
    localStorage.clear();
    setTimeout(() => navigate("/login", { replace: true }), 1000);
  };

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.split(" ");
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const selectedMonthLabel = `${MONTH_NAMES_SHORT[selectedMonth]} ${selectedYear}`;
  const selectedMonthFull  = `${MONTH_NAMES_FULL[selectedMonth]} ${selectedYear}`;

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: "2-digit", 
      minute: "2-digit",
      timeZone: 'Asia/Kolkata' 
    });
  };

  // Calculate Presence Groups
  const getPresenceGroups = () => {
    const attMap = {};
    const targetDateStr = presenceDate; 
    
    presenceRecords.forEach(r => {
      const recDate = getLocalDateString(r.date);
      if (recDate === targetDateStr) {
        const uid = r.user?._id || r.user;
        if (uid) attMap[String(uid)] = r;
      }
    });

    const structure = {}; 

    allEmployees.filter(e => e.status === 'active').forEach(emp => {
      const rawComp = emp.user?.companyId || emp.companyId;
      const compId = (typeof rawComp === "object" && rawComp !== null) ? String(rawComp._id || rawComp) : String(rawComp);
      const compObj = companies.find(c => String(c._id) === compId);
      const compName = compObj ? compObj.companyName : "Unknown Company";
      
      const deptRaw = emp.department?.departmentName || (typeof emp.department === "string" ? emp.department : null) || emp.departmentId;
      const deptName = (deptRaw && deptRaw.length > 1) ? deptRaw : "No Department";

      if (!structure[compName]) {
        structure[compName] = { total: 0, present: 0, departments: {} };
      }
      if (!structure[compName].departments[deptName]) {
        structure[compName].departments[deptName] = { total: 0, present: 0 };
      }

      structure[compName].total++;
      structure[compName].departments[deptName].total++;

      const userId = emp.user?._id || emp.userId || emp._id;
      const rec = attMap[String(userId)];
      if (rec) {
        const s = rec.status?.toLowerCase();
        // Count as present if check-in is recorded
        const hasCheckIn = !!rec.checkIn;
        if (hasCheckIn || s === "present" || s === "work-from-home" || s === "late" || s === "on-field") {
          structure[compName].present++;
          structure[compName].departments[deptName].present++;
        }
      }
    });

    return Object.entries(structure).map(([name, data]) => ({
      name,
      total: data.total,
      present: data.present,
      percent: Math.round((data.present / (data.total || 1)) * 100),
      sortedDepts: Object.entries(data.departments).map(([dName, dData]) => ({
        name: dName,
        total: dData.total,
        present: dData.present,
        percent: Math.round((dData.present / (dData.total || 1)) * 100)
      })).sort((a,b) => b.total - a.total)
    })).sort((a, b) => b.total - a.total);
  };

  const presenceGroups = getPresenceGroups();

  return (
    <div className="w-full h-full flex flex-col overflow-hidden pt-2 px-3 sm:px-4 pb-2">
      <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="flex-1 p-0 bg-white">

        {/* TOP 6 CARDS â€” Professional Compact Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-2 relative overflow-hidden flex flex-col gap-0.5 transition-standard hover:shadow-md">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-30 bg-green-500/20" />
            <div className="flex flex-col">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">On Time</p>
              <p className="text-[10px] text-slate-400 font-bold">Today</p>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-slate-800 leading-none">{summary?.onTime || 0}</p>
              <span className="text-[9px] text-slate-400 font-bold uppercase ml-2">Employees</span>
            </div>
            <p className="text-[9px] font-bold flex items-center gap-1 leading-tight mt-0.5">
              <span className="text-slate-300 font-medium tracking-tighter">Daily Track</span>
            </p>
          </div>

          <div className="group bg-white rounded-md border border-slate-200 shadow-sm p-2 relative overflow-hidden flex flex-col gap-0.5 transition-standard hover:shadow-md">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-30 bg-rose-500/20" />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveToggleLate(!activeToggleLate);
              }}
              className={`absolute top-1.5 right-1.5 z-20 p-0.5 rounded-full transition-colors ${activeToggleLate ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              title={activeToggleLate ? "Close details" : "Keep details open"}
            >
              {activeToggleLate ? <FiEyeOff size={11} /> : <FiEye size={11} />}
            </button>
            <div className="flex flex-col">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Late Coming</p>
              <p className="text-[10px] text-slate-400 font-bold">Today</p>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-slate-800 leading-none">{summary?.lateEmployees?.length || summary?.late || 0}</p>
              <span className="text-[9px] text-slate-400 font-bold uppercase ml-2">Employees</span>
            </div>
            <p className="text-[9px] font-bold flex items-center gap-1 leading-tight mt-0.5">
              <span className="text-slate-300 font-medium tracking-tighter">Daily Track</span>
            </p>
            <div className={`absolute inset-0 bg-white/95 backdrop-blur-sm transition-opacity duration-300 z-10 flex flex-col p-2 ${activeToggleLate ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
               <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-1 border-b border-rose-100 pb-0.5">Late Today</p>
               <div className="flex-1 overflow-y-auto custom-scrollbar-thin pr-1">
                 {summary?.lateEmployees?.length > 0 ? (
                   summary.lateEmployees.map((emp, i) => {
                     const empName = typeof emp === 'object' && emp !== null ? emp.name : emp;
                     const empId = typeof emp === 'object' && emp !== null ? (emp.userId || emp._id) : null;
                     let streakVal = 0;
                     if (empId) {
                       streakVal = lateStreaks[String(empId)] || 0;
                     } else if (empName) {
                       const match = allEmployees.find(e => e.user?.name === empName || e.name === empName);
                       if (match) {
                         const userId = match.user?._id || match.userId || match._id;
                         streakVal = lateStreaks[String(userId)] || 0;
                       }
                     }
                     const isStreak = streakVal >= 5;
                     return (
                        <div key={i} className="flex justify-between items-center py-0.5 border-b border-slate-50 last:border-0">
                          <p className={`text-[10px] font-medium truncate flex items-center gap-1 ${isStreak ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                            <span>{empName}</span>
                            {isStreak && (
                              <span 
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[7px] font-black bg-rose-50 border border-rose-200 text-rose-600 shrink-0"
                                title={`Continuous late for ${streakVal} days`}
                              >
                                <FiAlertCircle size={8} className="animate-pulse" />
                                {streakVal}d
                              </span>
                            )}
                          </p>
                          <p className="text-[9px] font-bold text-rose-400 ml-2 shrink-0">{emp.checkIn || ""}</p>
                        </div>
                      );
                   })
                 ) : (
                   <p className="text-[10px] text-slate-400 italic mt-2">No late arrivals today</p>
                 )}
               </div>
            </div>
          </div>

          <div className="group bg-white rounded-md border border-slate-200 shadow-sm p-2 relative overflow-hidden flex flex-col gap-0.5 transition-standard hover:shadow-md">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-30 bg-orange-500/20" />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveToggleAbsent(!activeToggleAbsent);
              }}
              className={`absolute top-1.5 right-1.5 z-20 p-0.5 rounded-full transition-colors ${activeToggleAbsent ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              title={activeToggleAbsent ? "Close details" : "Keep details open"}
            >
              {activeToggleAbsent ? <FiEyeOff size={11} /> : <FiEye size={11} />}
            </button>
            <div className="flex flex-col">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Absent</p>
              <p className="text-[10px] text-slate-400 font-bold">Today</p>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-slate-800 leading-none">{summary?.absentEmployees?.length || summary?.absent || 0}</p>
              <span className="text-[9px] text-slate-400 font-bold uppercase ml-2">Employees</span>
            </div>
            <p className="text-[9px] font-bold flex items-center gap-1 leading-tight mt-0.5">
              <span className="text-slate-300 font-medium tracking-tighter">Daily Track</span>
            </p>
            <div className={`absolute inset-0 bg-white/95 backdrop-blur-sm transition-opacity duration-300 z-10 flex flex-col p-2 ${activeToggleAbsent ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
               <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider mb-1 border-b border-orange-100 pb-0.5">Absent Today</p>
               <div className="flex-1 overflow-y-auto custom-scrollbar-thin pr-1">
                 {summary?.absentEmployees?.length > 0 ? (
                   summary.absentEmployees.map((emp, i) => (
                     <div key={i} className="flex justify-between items-center py-0.5 border-b border-slate-50 last:border-0">
                       <p className="text-[10px] font-medium text-slate-700 truncate">{typeof emp === 'object' && emp !== null ? emp.name : emp}</p>
                       {typeof emp === 'object' && emp !== null && emp.checkIn && (
                         <p className="text-[9px] font-bold text-orange-400 ml-2 shrink-0">{emp.checkIn}</p>
                       )}
                     </div>
                   ))
                 ) : (
                   <p className="text-[10px] text-slate-400 italic mt-2">No absentees today</p>
                 )}
               </div>
            </div>
          </div>

          <div className="group bg-white rounded-md border border-slate-200 shadow-sm p-2 relative overflow-hidden flex flex-col gap-0.5 transition-standard hover:shadow-md">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-30 bg-amber-500/20" />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveToggleLeave(!activeToggleLeave);
              }}
              className={`absolute top-1.5 right-1.5 z-20 p-0.5 rounded-full transition-colors ${activeToggleLeave ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              title={activeToggleLeave ? "Close details" : "Keep details open"}
            >
              {activeToggleLeave ? <FiEyeOff size={11} /> : <FiEye size={11} />}
            </button>
            <div className="flex flex-col">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Leave</p>
              <p className="text-[10px] text-slate-400 font-bold">Today</p>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-slate-800 leading-none">{summary?.onLeaveEmployees?.length || summary?.leave || 0}</p>
              <span className="text-[9px] text-slate-400 font-bold uppercase ml-2">Employees</span>
            </div>
            <p className="text-[9px] font-bold flex items-center gap-1 leading-tight mt-0.5">
              <span className="text-slate-300 font-medium tracking-tighter">Daily Track</span>
            </p>
            <div className={`absolute inset-0 bg-white/95 backdrop-blur-sm transition-opacity duration-300 z-10 flex flex-col p-2 ${activeToggleLeave ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
               <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mb-1 border-b border-amber-100 pb-0.5">On Leave</p>
               <div className="flex-1 overflow-y-auto custom-scrollbar-thin pr-1">
                 {summary?.onLeaveEmployees?.length > 0 ? (
                   summary.onLeaveEmployees.map((emp, i) => (
                     <div key={i} className="flex justify-between items-center py-0.5 border-b border-slate-50 last:border-0">
                       <p className="text-[10px] font-medium text-slate-700 truncate">{emp.name || emp}</p>
                       <p className="text-[9px] font-bold text-amber-400 ml-2 shrink-0">{emp.duration || ""}</p>
                     </div>
                   ))
                 ) : (
                   <p className="text-[10px] text-slate-400 italic mt-2">No leaves today</p>
                 )}
               </div>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-2 relative overflow-hidden flex flex-col gap-0.5 transition-standard hover:shadow-md">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-30 bg-blue-500/20" />
            <div className="flex flex-col">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Employee</p>
              <p className="text-[10px] text-slate-400 font-bold">Organization</p>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-slate-800 leading-none">{summary?.totalEmployees || 0}</p>
              <span className="text-[9px] text-slate-400 font-bold uppercase ml-2">Staff</span>
            </div>
             <p className="text-[9px] font-bold flex items-center gap-1 leading-tight mt-0.5">
              <span className="text-slate-300 font-medium tracking-tighter">Live Database</span>
            </p>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-2 relative overflow-hidden flex flex-col transition-standard hover:shadow-md">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-30 bg-purple-500/20" />
            <div className="flex flex-col h-full">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Birthdays</p>
              <div className="flex-1 relative flex flex-col justify-center">
                {birthdays.length > 0 ? (
                  <>
                    {/* Animated Content */}
                    <div key={currentBirthdayIndex} className="animate-in fade-in slide-in-from-right-4 duration-500">
                      {(() => {
                        const b = birthdays[currentBirthdayIndex];
                        if (!b) return null;
                        return (
                          <div className="flex items-center gap-3 pr-12">
                            {b.profilePhoto ? (
                              <img 
                                src={getFullUrl(b.profilePhoto, API_BASE_URL)} 
                                alt={b.name} 
                                className="w-10 h-10 rounded-full object-cover border-2 border-rose-100 shadow-sm shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(b.name) + "&background=random";
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[12px] font-bold text-rose-500 shadow-sm border border-rose-100 shrink-0">
                                 {getInitials(b.name)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <FaBirthdayCake className="text-rose-500 shrink-0" size={10} />
                                <p className="text-[13px] font-black text-slate-800 truncate leading-none">{b.name}</p>
                              </div>
                              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                                {new Date(b.dob).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Minimalist Navigation Icons */}
                    {birthdays.length > 1 && (
                      <div className="absolute top-0 right-0 flex items-center gap-0.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAutoSlide(false);
                            setCurrentBirthdayIndex((prev) => (prev - 1 + birthdays.length) % birthdays.length);
                          }}
                          className="text-slate-300 hover:text-rose-500 p-0.5 transition-colors active:scale-90"
                        >
                          <FiChevronLeft size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAutoSlide(false);
                            setCurrentBirthdayIndex((prev) => (prev + 1) % birthdays.length);
                          }}
                          className="text-slate-300 hover:text-rose-500 p-0.5 transition-colors active:scale-90"
                        >
                          <FiChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-[10px] text-slate-400 italic font-medium">No upcoming birthdays</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2.5 mb-1 mt-3">

          {/* â•â•â•â•â•â•â•â• ATTENDANCE TREND â•â•â•â•â•â•â•â• */}
          <div className="lg:col-span-3 bg-white rounded-md border border-slate-200 shadow-sm p-3.5 flex flex-col transition-standard" style={{ height: "340px" }}>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
              <div>
                <p className="text-[14px] font-bold text-slate-800 leading-tight flex items-center gap-2">
                   <FiActivity className="text-blue-500" size={14} /> Attendance Flow
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                  {trendViewType === "daily" && `Daily · ${selectedMonthFull}`}
                  {trendViewType === "weekly" && `Weekly · ${selectedMonthFull}`}
                  {trendViewType === "monthly" && `Monthly Overview · ${selectedMonthFull}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end w-full sm:w-auto">
                {/* Clickable legend pills - Slimmer */}
                <div className="flex items-center gap-1.5">
                  {[
                    { color: "#60A5FA", bg: "rgba(96,165,250,0.1)",  label: "P",  fullLabel: "Present" },
                    { color: "#FBBF24", bg: "rgba(251,191,36,0.1)",  label: "L",  fullLabel: "Late" },
                    { color: "#34D399", bg: "rgba(52,211,153,0.1)",  label: "Lv", fullLabel: "Leave" },
                    { color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  label: "A",  fullLabel: "Absent" },
                  ].map(({ color, bg, label, fullLabel }) => {
                    const isActive = activeSeries === null || activeSeries === fullLabel;
                    return (
                      <button
                        key={label}
                        onClick={() => toggleSeries(fullLabel)}
                        className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all duration-200"
                        style={{
                          color:           isActive ? color : "#94a3b8",
                          backgroundColor: isActive ? bg    : "rgba(241,245,249,0.5)",
                          border:          `1px solid ${isActive ? color + "22" : "transparent"}`,
                        }}
                      >
                        {label} - {fullLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Month picker */}
                <div className="relative" ref={monthMenuRef}>
                  <button
                    onClick={() => setShowMonthMenu((v) => !v)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    {selectedMonthLabel}
                    <FiCalendar size={10} />
                  </button>
                  {showMonthMenu && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-52 overflow-y-auto">
                      {availableMonths.map(({ year: y, month: m, label }) => {
                        const isActive = y === selectedYear && m === selectedMonth;
                        return (
                          <button
                            key={`${y}-${m}`}
                            onClick={() => handleMonthSelect(y, m)}
                            className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${isActive ? "bg-[#24406D] text-white font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart area */}
            <div className="w-full" style={{ height: "260px" }}>
              {trendLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <div className="flex items-end gap-1 h-16">
                    {[40, 65, 50, 80, 55, 70, 45, 75, 60, 85, 50, 65].map((h, i) => (
                      <div
                        key={i}
                        className="w-4 rounded-sm animate-pulse"
                        style={{
                          height: `${h}%`,
                          backgroundColor: "#f1f5f9",
                          animationDelay: `${i * 60}ms`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-300 tracking-wide">Loading trend dataâ€¦</p>
                </div>
              ) : attendanceTrendChartData ? (
                <Bar
                   key={`attendance-mix-chart-${selectedYear}-${selectedMonth}`}
                  data={attendanceTrendChartData}
                  options={trendChartOptions}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-xs text-gray-300">No data for this period</p>
                </div>
              )}
            </div>

{/* 
            <div className="border-t border-gray-100 mt-4 pt-4">
              <div className="grid grid-cols-4 divide-x divide-slate-100">
                {[
                  { label: "Total Late",  value: footerTotalLate,         unit: "today",  color: "#FBBF24" },
                  { label: "Total Leave", value: footerTotalLeave,        unit: "today",  color: "#34D399" },
                  { label: "Peak Count",  value: footerPeakAttendance,    unit: "employees", color: "#64748b" },
                  { label: "Avg. Rate",   value: `${footerAttendancePct}%`,unit: "monthly",  color: "#64748b" },
                ].map((s, idx) => (
                  <div key={idx} className="px-3 py-1 hover:bg-slate-50 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{s.label}</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <h4 className="text-[16px] font-black text-slate-800 tracking-tight leading-none" style={{ color: s.color !== "#64748b" ? s.color : "" }}>{s.value}</h4>
                      <span className="text-[8px] font-bold text-slate-300 uppercase">{s.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
*/}

          </div>

          {/* â•â•â•â•â•â•â•â• ATTENDANCE LIVE â•â•â•â•â•â•â•â• */}
          <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col transition-standard" style={{ height: "340px" }}>

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                  <FiClock className="text-orange-500" size={14} /> Presence
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                  Company & Department Summary
                </p>
              </div>

              {/* Date Filter */}
              <div className="flex items-center">
                <input
                  type="date"
                  value={presenceDate}
                  onChange={(e) => setPresenceDate(e.target.value)}
                  className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-300 transition-colors cursor-pointer"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1">
              {presenceLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3">
                      <div className="flex-1 h-8 bg-slate-100 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : presenceGroups.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-1.5">
                   <FiAlertCircle size={20} />
                   <p className="text-[10px] italic">No data found for this date.</p>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {presenceGroups.map((comp, idx) => (
                    <div key={idx} className="pb-3 border-b border-slate-50 last:border-none last:pb-0">
                      {/* Company Header Row */}
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#24406D]" />
                            <span className="text-[12px] font-extrabold text-[#24406D] uppercase tracking-tight">{comp.name}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold">{comp.present} / {comp.total}</span>
                            <span className="text-[12px] font-black text-[#24406D]">{comp.percent}%</span>
                         </div>
                      </div>
                      
                      {/* Department Inline Badges */}
                      <div className="flex flex-wrap gap-2 pl-3.5">
                        {comp.sortedDepts.map((dept, dIdx) => {
                          // const palette = [
                          //   { bg: "#f8fafc", border: "#f1f5f9", text: "#475569" }, // Slate
                          //   { bg: "#f0f9ff", border: "#e0f2fe", text: "#0284c7" }, // Blue
                          //   { bg: "#f0fdf4", border: "#dcfce7", text: "#16a34a" }, // Green
                          //   { bg: "#fdf4ff", border: "#fae8ff", text: "#c026d3" }, // Fuchsia
                          //   { bg: "#fff7ed", border: "#ffedd5", text: "#ea580c" }, // Orange
                          //   { bg: "#fef2f2", border: "#fee2e2", text: "#dc2626" }, // Red
                          //   { bg: "#ecfeff", border: "#cffafe", text: "#0891b2" }, // Cyan
                          // ][dIdx % 7];

                           const palette =[
                            { bg: "#f0f9ff", border: "#e0f2fe", text: "#475569" },
                           ]


                          return (
                            <div 
                              key={dIdx} 
                              className="group flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all duration-200"
                              style={{ 
                                backgroundColor: palette.bg + "80", // 50% opacity for even lighter look
                                borderColor: palette.border + "60",
                                cursor: "default"
                              }}
                              title={`${dept.present}/${dept.total} Present`}
                            >
                              <span className="text-[9px] font-bold uppercase tracking-widest opacity-80" style={{ color: palette.text }}>
                                {dept.name}
                              </span>
                              <div className="w-px h-2 opacity-10" style={{ backgroundColor: palette.text }} />
                              <span className="text-[10px] font-black" style={{ color: palette.text }}>
                                {dept.present} / {dept.total}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mt-4">

          {/* â•â•â•â•â•â• EMPLOYEE ATTENDANCE EXPLORER â•â•â•â•â•â• */}
          <div className="lg:col-span-3 bg-white rounded-md border border-slate-200 shadow-sm flex flex-col" style={{ height: "380px" }}>
            
            {/* Header + filters */}
            <div className="px-4 py-1.5 border-b border-slate-100 flex-shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-800 text-[11px] uppercase tracking-widest">Attendance Explorer</p>
                    <Link to="/dashboard/employees" className="text-[9px] font-black text-blue-600 hover:underline uppercase tracking-tighter">VIEW ALL →</Link>
                  </div>
                  {showMonthWiseLate && (
                    <span className="text-[9px] text-amber-500 italic mt-0.5 font-medium tracking-tight">
                      *Showing employees late for ≥50% of the current month
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => {
                      setShowConsistentLate(!showConsistentLate);
                      if (!showConsistentLate) setShowMonthWiseLate(false);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold border rounded-md transition-colors ${showConsistentLate ? 'text-white bg-rose-600 border-rose-600' : 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100'}`}
                  >
                    <FiAlertCircle size={11} /> Consistently Late
                  </button>
                  {showConsistentLate && (
                    <button 
                      onClick={() => setShowMonthWiseLate(!showMonthWiseLate)}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold border rounded-md transition-colors ${showMonthWiseLate ? 'text-white bg-amber-500 border-amber-500' : 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'}`}
                    >
                      <FiAlertCircle size={11} /> Month Wise
                    </button>
                  )}
                  <CustomSelector 
                    icon={<Building size={11} className="text-slate-400" />}
                    value={empCompanyFilter}
                    options={[
                      { id: "all", name: "All Companies" },
                      ...companies.map(c => ({ id: c._id, name: c.companyName }))
                    ]}
                    onChange={(val) => setEmpCompanyFilter(val)}
                    minWidth="140px"
                    className="!py-1 !rounded-md border border-slate-100 bg-slate-50/50 hover:bg-white transition-all"
                  />
                  
                  <div className="w-px h-3 bg-slate-200 self-center mx-0.5" />

                  <CustomSelector 
                    icon={<Filter size={11} className="text-slate-400" />}
                    value={empStatusFilter}
                    options={STATUS_FILTERS.map(f => ({ id: f.key, name: f.label }))}
                    onChange={(val) => setEmpStatusFilter(val)}
                    minWidth="100px"
                    className="!py-1 !rounded-md border border-slate-100 bg-slate-50/50 hover:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {(() => {
                // Build a map: userId -> today's attendance record
                const attMap = {};
                todayAttendance.forEach(r => {
                  const uid = r.user?._id || r.user;
                  if (uid) attMap[String(uid)] = r;
                });

                // Helper: extract plain string company ID from an employee (handles ObjectId objects)
                const getEmpCompanyId = (emp) => {
                  const raw = emp.user?.companyId || emp.companyId;
                  if (!raw) return "";
                  // If it's a Mongoose ObjectId object it has _id or toString
                  if (typeof raw === "object" && raw !== null) {
                    return String(raw._id || raw);
                  }
                  return String(raw);
                };

                // Use allEmployees (unfiltered) as base so company dropdown works for all companies
                let baseData = allEmployees.length > 0 ? allEmployees : employeesData;
                
                // Filter out inactive and terminated employees
                baseData = baseData.filter(emp => {
                  const status = (emp.status || "").toLowerCase();
                  return status !== "inactive" && status !== "terminated";
                });

                // Filter by company
                let filtered = empCompanyFilter === "all"
                  ? baseData
                  : baseData.filter(emp => getEmpCompanyId(emp) === empCompanyFilter);

                // Filter by today's attendance status
                if (empStatusFilter !== "all") {
                  filtered = filtered.filter(emp => {
                    const userId = emp.user?._id || emp.userId;
                    const rec = attMap[String(userId)];
                    if (!rec) {
                      return empStatusFilter === "absent";
                    }
                    const s = rec.status?.toLowerCase();
                    const hasCheckIn = !!rec.checkIn;
                    if (empStatusFilter === "present") return hasCheckIn || s === "present" || s === "work-from-home" || s === "on-field";
                    if (empStatusFilter === "late") return s === "late";
                    if (empStatusFilter === "absent") return !hasCheckIn && s === "absent";
                    if (empStatusFilter === "leave") return s === "leave";
                    return true;
                  });
                }

                if (showConsistentLate) {
                  filtered = filtered.filter(emp => {
                    const userId = String(emp.user?._id || emp.userId || emp._id);
                    if (showMonthWiseLate) {
                       return latePercentMap[userId];
                    } else {
                       return lateStreaks[userId] >= 5;
                    }
                  });
                }

                if (filtered.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300">
                      <FiAlertCircle size={28} />
                      <p className="text-[11px] font-bold uppercase tracking-wider">No employees found</p>
                    </div>
                  );
                }

                return (
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today</th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">In</th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out</th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((emp, i) => {
                        const userId = emp.user?._id || emp.userId;
                        const rec = attMap[String(userId)];
                        let todayStatus = rec?.status?.toLowerCase() || "absent";
                        
                        // Derived Status logic: if check-in exists, they are present or late
                        if (rec?.checkIn) {
                          if (todayStatus === "absent" || todayStatus === "—") {
                             todayStatus = "present";
                          }
                        }
                        
                        const checkIn = rec?.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

                        const statusStyle = {
                          present: { color: "#16a34a", bg: "rgba(22,163,74,0.08)", label: "Present" },
                          "work-from-home": { color: "#2563eb", bg: "rgba(37,99,235,0.08)", label: "WFH" },
                          late: { color: "#d97706", bg: "rgba(217,119,6,0.08)", label: "Late" },
                          absent: { color: "#dc2626", bg: "rgba(220,38,38,0.08)", label: "Absent" },
                          leave: { color: "#7c3aed", bg: "rgba(124,58,237,0.08)", label: "Leave" },
                          "half-day": { color: "#0891b2", bg: "rgba(8,145,178,0.08)", label: "Half Day" },
                          "on-field": { color: "#0891b2", bg: "rgba(8,145,178,0.08)", label: "On Field" },
                        };
                        const st = statusStyle[todayStatus] || { color: "#64748b", bg: "rgba(100,116,139,0.08)", label: todayStatus };

                        return (
                          <tr key={i} className="border-b border-slate-50 last:border-none hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={emp.profilePhoto ? getFullUrl(emp.profilePhoto, API_BASE_URL) : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.user?.name || "Unknown")}&size=40&background=f1f5f9&color=64748b`}
                                  onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.user?.name || "Unknown")}&size=40&background=f1f5f9&color=64748b`; }}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-100"
                                  alt={emp.user?.name || "Employee"}
                                />
                                <div>
                                  <p className={`font-bold text-[12px] leading-tight flex items-center gap-1.5 ${lateStreaks[String(userId)] >= 5 ? 'text-rose-600 font-black' : 'text-slate-700'}`}>
                                    {emp.user?.name || "N/A"}
                                    {lateStreaks[String(userId)] >= 5 && !showMonthWiseLate && (
                                      <span 
                                        className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-600 animate-pulse"
                                        title={`Continuous late for ${lateStreaks[String(userId)]} days`}
                                      >
                                        <FiAlertCircle size={9} />
                                        {lateStreaks[String(userId)]} Days Streak
                                      </span>
                                    )}
                                    {latePercentMap[String(userId)] && showMonthWiseLate && (
                                      <span 
                                        className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-600 animate-pulse"
                                        title={`Late for ${latePercentMap[String(userId)].late} out of ${latePercentMap[String(userId)].total} days`}
                                      >
                                        <FiAlertCircle size={9} />
                                        {Math.round((latePercentMap[String(userId)].late / latePercentMap[String(userId)].total) * 100)}% Late
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">{emp.employeeId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <p className="text-[11px] font-bold text-slate-600 leading-tight">{emp.designation || "—"}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">
                                {typeof emp.department === "string" ? emp.department : (emp.department?.name || emp.department?.departmentName || emp.departmentId || "")}
                              </p>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                                style={{ color: st.color, backgroundColor: st.bg }}
                              >
                                {st.label}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {checkIn ? (
                                <span className="text-[10px] text-slate-600 font-bold">{checkIn}</span>
                              ) : (
                                <span className="text-[10px] text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              {rec?.checkOut ? (
                                <span className="text-[10px] text-slate-600 font-bold">
                                  {new Date(rec.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <Link to={`/dashboard/profile/${emp.employeeId}`}>
                                <button className="text-[9px] font-bold px-2.5 py-1 border border-slate-200 rounded text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all whitespace-nowrap">
                                  Profile
                                </button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>

          {/* â•â•â•â•â•â• TODAY'S ACTIVITY FEED â•â•â•â•â•â• */}
          <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm flex flex-col" style={{ height: "380px" }}>
            <div className="px-4 pt-3 pb-2.5 border-b border-slate-100 flex-shrink-0 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 text-[14px] uppercase tracking-wide">Today's Activity</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  {now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={fetchActivityFeed}
                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                title="Refresh"
              >
                <svg className={`w-3.5 h-3.5 text-slate-400 ${activityLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-3">
              {activityLoading ? (
                <div className="flex flex-col gap-2 mt-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* â”€â”€ Section: Events/Holidays â”€â”€ */}
                  <details open={todayEvents.length > 0} className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none mb-1.5 focus:outline-none">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-open:text-slate-500 transition-colors">
                        <FiCalendar size={10} /> Events & Holidays
                      </p>
                      <FiChevronRight size={12} className="text-slate-300 group-open:rotate-90 transition-transform" />
                    </summary>
                    {todayEvents.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {todayEvents.map((ev, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-2.5 p-2.5 rounded-md border border-slate-200 bg-slate-50 transition-colors ${ev.status === "holiday" ? "border-l-2 border-l-rose-400" : "border-l-2 border-l-indigo-400"}`}
                          >
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase mt-0.5 flex-shrink-0"
                              style={{
                                color: ev.status === "holiday" ? "#ef4444" : "#6366f1",
                                backgroundColor: ev.status === "holiday" ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)",
                              }}
                            >
                              {ev.status === "holiday" ? "HOL" : "EVT"}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-700 leading-tight">{ev.remark || ev.title}</p>
                              {ev.description && <p className="text-[9px] text-slate-400 mt-0.5">{ev.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-300 italic pl-1 mt-1 pb-1">No events or holidays today</p>
                    )}
                  </details>

                  {/* â”€â”€ Section: Pending Leaves â”€â”€ */}
                  <details open={pendingLeaves.length > 0} className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none mb-1.5 focus:outline-none">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-open:text-slate-500 transition-colors">
                        <FiClock size={10} /> Pending Leaves
                      </p>
                      <div className="flex items-center gap-2">
                        {pendingLeaves.length > 0 && (
                          <Link to="/dashboard/approvals" className="text-[9px] font-bold text-blue-500 hover:underline uppercase tracking-wider">
                            See All
                          </Link>
                        )}
                        <FiChevronRight size={12} className="text-slate-300 group-open:rotate-90 transition-transform" />
                      </div>
                    </summary>
                    {pendingLeaves.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {pendingLeaves.map((lv, i) => (
                          <Link key={i} to="/dashboard/approvals" className="block">
                            <div className="flex items-center gap-2.5 p-2 rounded-md border border-slate-200 border-l-2 border-l-blue-400 bg-slate-50 hover:bg-white hover:border-blue-200 transition-colors cursor-pointer group/item">
                              <div className="w-7 h-7 rounded bg-blue-100 text-blue-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                {lv.name?.charAt(0) || "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-slate-700 truncate leading-tight group-hover/item:text-blue-600 transition-colors">{lv.name || "Unknown"}</p>
                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                  {new Date(lv.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                  {" → "}
                                  {new Date(lv.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                  {" · "}<span className="text-blue-500">{lv.totalDays}d</span>
                                </p>
                              </div>
                              <FiChevronRight size={12} className="text-slate-300 group-hover/item:text-blue-500 transition-colors flex-shrink-0" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-300 italic pl-1 mt-1 pb-1">No pending leave requests</p>
                    )}
                  </details>

                  {/* ── Section: Employee Applications ── */}
                  <details open={pendingLifecycle.length > 0} className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none mb-1.5 focus:outline-none">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-open:text-slate-500 transition-colors">
                        <FiActivity size={10} /> Employee Requests
                      </p>
                      <div className="flex items-center gap-2">
                        {pendingLifecycle.length > 0 && (
                          <Link to="/dashboard/employee-requests" className="text-[9px] font-bold text-blue-500 hover:underline uppercase tracking-wider">
                            Review
                          </Link>
                        )}
                        <FiChevronRight size={12} className="text-slate-300 group-open:rotate-90 transition-transform" />
                      </div>
                    </summary>
                    {pendingLifecycle.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {pendingLifecycle.map((req, i) => {
                          const isWithdrawal = req.withdrawalRequested;
                          return (
                            <Link key={i} to="/dashboard/employee-requests" className="block">
                              <div className={`flex items-center gap-2.5 p-2 rounded-md border border-slate-200 border-l-2 ${isWithdrawal ? 'border-l-rose-400 bg-rose-50/30' : 'border-l-blue-400 bg-blue-50/30'} hover:bg-white transition-colors cursor-pointer group/item`}>
                                <div className={`w-7 h-7 rounded ${isWithdrawal ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'} font-bold text-[10px] flex items-center justify-center flex-shrink-0`}>
                                  {req.user?.name?.charAt(0) || "?"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold text-slate-700 truncate leading-tight">{req.user?.name || "Unknown"}</p>
                                  <p className="text-[9px] text-slate-500 italic truncate max-w-[150px] mt-0.5">
                                    "{req.withdrawalRequested ? req.withdrawalRequestReason : req.resignationRequestReason}"
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">

                                    <span className={`text-[8px] font-black uppercase tracking-widest ${isWithdrawal ? 'text-rose-500' : 'text-blue-500'}`}>
                                      {isWithdrawal ? 'Withdrawal' : 'Resignation'}
                                    </span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <span className="text-[8px] text-slate-400 font-bold uppercase">{req.employeeId}</span>
                                  </div>
                                </div>
                                <FiChevronRight size={12} className="text-slate-300 group-hover/item:text-slate-500 transition-colors flex-shrink-0" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-300 italic pl-1 mt-1 pb-1">No pending lifecycle requests</p>
                    )}
                  </details>

                  {/* â”€â”€ Section: Open Tickets â”€â”€ */}
                  <details open={pendingTickets.length > 0} className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none mb-1.5 focus:outline-none">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-open:text-slate-500 transition-colors">
                        <FiTag size={10} /> Open Tickets
                      </p>
                      <div className="flex items-center gap-2">
                        {pendingTickets.length > 0 && (
                          <Link to="/dashboard/tickets" className="text-[9px] font-bold text-blue-500 hover:underline uppercase tracking-wider">
                            See All
                          </Link>
                        )}
                        <FiChevronRight size={12} className="text-slate-300 group-open:rotate-90 transition-transform" />
                      </div>
                    </summary>
                    {pendingTickets.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {pendingTickets.map((tk, i) => {
                          const priorityColor = { high: "#ef4444", medium: "#f59e0b", low: "#3b82f6" }[tk.priority] || "#94a3b8";
                          const isOpen = tk.status === "Pending";
                          return (
                            <Link key={i} to="/dashboard/tickets" className="block">
                              <div className="flex items-center gap-2.5 p-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-white transition-colors cursor-pointer group/item" style={{ borderLeftWidth: "2px", borderLeftColor: priorityColor}}>
                                <span
                                  className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0"
                                  style={{ color: priorityColor, backgroundColor: priorityColor + "15" }}
                                >
                                  {tk.priority || "med"}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold text-slate-700 truncate leading-tight group-hover/item:text-amber-600 transition-colors">{tk.title}</p>
                                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                    {tk.user?.name || "Unknown"}
                                    {" · "}
                                    <span style={{ color: isOpen ? "#f59e0b" : "#3b82f6" }}>{isOpen ? "Pending" : "In Progress"}</span>
                                  </p>
                                </div>
                                <FiChevronRight size={12} className="text-slate-300 group-hover/item:text-amber-500 transition-colors flex-shrink-0" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-300 italic pl-1 mt-1 pb-1">No open tickets</p>
                    )}
                  </details>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

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
      {/* LATE EMPLOYEES POPUP REMOVED */}
      </div>
    </div>
  );
}
