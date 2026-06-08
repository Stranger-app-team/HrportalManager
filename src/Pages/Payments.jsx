import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FiSearch, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiLayers,
  FiChevronDown,
  FiFileText,
  FiFilter,
  FiActivity,
  FiCheck,
  FiEdit
} from 'react-icons/fi';
import { 
  Building, 
  CalendarDays, 
  RefreshCw,
  CheckCircle2,
  Bell,
  IndianRupee,
  Receipt,
  Gift,
  Plus,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFullUrl } from "../utils/urlHelper";
import { API_BASE_URL } from '../config/api';
import Modal from "../components/Shared/Modal";

export default function Payments() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.userType?.toLowerCase();
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [payrolls, setPayrolls] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [allowances, setAllowances] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState({
    companyId: localStorage.getItem("selectedCompanyId") || "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    searchQuery: ""
  });
  const [activeTab, setActiveTab] = useState("salaries");
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [editFormData, setEditFormData] = useState({
    officeExpenses: 0,
    penalties: 0,
    incentives: 0,
    bonus: 0,
    perks: 0
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [showPayAllowanceModal, setShowPayAllowanceModal] = useState(false);
  const [payingAllowance, setPayingAllowance] = useState(null);
  const [allowancePaymentData, setAllowancePaymentData] = useState({
    paymentDate: new Date().toLocaleDateString('en-CA'),
    paidFrom: ""
  });

  // Modals for Expense/Allowance
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddAllowance, setShowAddAllowance] = useState(false);
  const [showAllowanceDetails, setShowAllowanceDetails] = useState(false);
  const [selectedAllowanceDetails, setSelectedAllowanceDetails] = useState(null);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [selectedExpenseDetails, setSelectedExpenseDetails] = useState(null);

  const [newExpense, setNewExpense] = useState({ category: "", amount: "", description: "", expenseDate: new Date().toLocaleDateString('en-CA'), approvedBy: "" });
  const [newAllowance, setNewAllowance] = useState({ employeeId: "", category: "", amount: "", description: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), approvedBy: "" });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    fetchInitial();
    fetchUserProfile();
    const name = localStorage.getItem("username"); 
    if (name) setUsername(name);
  }, []);

  const fetchInitial = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/company`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const comps = data.company || [];
      setCompanies(comps);
      if (!filter.companyId && comps.length > 0) {
        setFilter(prev => ({ ...prev, companyId: comps[0]._id }));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
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
    fetchEmployees();
  }, [filter.companyId]);

  const fetchData = useCallback(async () => {
    if (!filter.companyId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (activeTab === "salaries") {
        const res = await fetch(`${API_BASE_URL}/payroll?companyId=${filter.companyId}&month=${filter.month}&year=${filter.year}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setPayrolls(Array.isArray(data) ? data : []);
        setSelectedIds([]);
      } else if (activeTab === "expenses") {
        const res = await fetch(`${API_BASE_URL}/payroll/expenses?companyId=${filter.companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      } else if (activeTab === "allowances") {
        const res = await fetch(`${API_BASE_URL}/payroll/allowances?companyId=${filter.companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setAllowances(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [filter.companyId, filter.month, filter.year, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAutoCalculate = async () => {
    if (!filter.companyId) {
      alert("Please select a company first.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payroll/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
           companyId: filter.companyId, 
           month: Number(filter.month), 
           year: Number(filter.year)
        })
      });
      const data = await res.json();
      console.log("[PAYROLL_DEBUG_RESPONSE]", data);
      if (data.version) {
        console.log(`%c Backend Version: ${data.version} `, 'background: #222; color: #bada55; font-size: 16px');
      }
      if (data.debugLogs) {
        console.group("Payroll Debug Logs (IST Standardized)");
        data.debugLogs.forEach(log => console.log(log));
        console.groupEnd();
      }
      if (res.ok) {
        alert("Batch payroll synced successfully! Existing approved payrolls were skipped.");
        fetchData();
      } else {
        alert(data.message || "Failed to generate payroll");
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const updateStatus = async (payrollId, status) => {
    try {
      const token = localStorage.getItem("token");
      let url = `${API_BASE_URL}/payroll/${payrollId}`;
      let method = "PUT";
      let body = { approvalStatus: status };

      if (status === 'approved') {
        url = `${API_BASE_URL}/payroll/approve`;
        method = "POST";
        body = { payrollId };
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleBulkApprove = async () => {
    const toApprove = payrolls.filter(p => !['approved', 'paid'].includes(p.approvalStatus));
    if (toApprove.length === 0) {
      alert("No pending/draft payrolls to approve.");
      return;
    }
    if (!window.confirm(`Are you sure you want to approve all ${toApprove.length} payrolls?`)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await Promise.all(toApprove.map(p => 
        fetch(`${API_BASE_URL}/payroll/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ payrollId: p._id })
        })
      ));
      fetchData();
      alert("Bulk approval completed!");
    } catch (err) { 
      console.error(err); 
      alert("Something went wrong during bulk approval.");
    }
    setLoading(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendings = payrolls.filter(p => !['approved', 'paid'].includes(p.approvalStatus)).map(p => p._id);
    if (selectedIds.length === pendings.length && pendings.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendings);
    }
  };

  const handleApproveSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Approve ${selectedIds.length} selected records?`)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await Promise.all(selectedIds.map(id => 
        fetch(`${API_BASE_URL}/payroll/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ payrollId: id })
        })
      ));
      fetchData();
      setSelectedIds([]);
      alert("Approved successfully!");
    } catch (err) { console.error(err); }
    setLoading(false);
  };
  
  const openEditModal = (payroll) => {
    setEditingPayroll(payroll);
    setEditFormData({
      officeExpenses: payroll.officeExpenses || 0,
      penalties: payroll.penalties || 0,
      incentives: payroll.incentives || 0,
      bonus: 0,
      perks: payroll.perks || 0
    });
    setShowEditModal(true);
  };

  const handleUpdatePayroll = async () => {
    if (!editingPayroll) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payroll/edit/${editingPayroll._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        alert("Payroll updated successfully!");
        setShowEditModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update payroll");
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAddExpense = async () => {
    if (!newExpense.category.trim()) {
      alert("Please enter an expense category.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payroll/expense`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...newExpense, companyId: filter.companyId, amount: Number(newExpense.amount) })
      });
      if (res.ok) { 
        setShowAddExpense(false); 
        setNewExpense({ category: "", amount: "", description: "", expenseDate: new Date().toLocaleDateString('en-CA'), approvedBy: "" });
        fetchData(); 
      }
    } catch (err) { console.error(err); }
  };

  const handleAddAllowance = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payroll/allowance`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAllowance, amount: Number(newAllowance.amount) })
      });
      if (res.ok) { setShowAddAllowance(false); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const openPayAllowanceModal = (allowance) => {
    setPayingAllowance(allowance);
    setAllowancePaymentData({
      paymentDate: new Date().toLocaleDateString('en-CA'),
      paidFrom: ""
    });
    setShowPayAllowanceModal(true);
  };

  const handlePayAllowance = async () => {
    if (!payingAllowance) return;
    if (!allowancePaymentData.paidFrom.trim()) {
      alert("Please specify how it was paid (e.g., Cash, Bank Transfer).");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payroll/allowance/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
           allowanceId: payingAllowance._id, 
           ...allowancePaymentData 
        })
      });
      if (res.ok) {
        alert("Allowance marked as paid!");
        setShowPayAllowanceModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to process payment");
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    const h = (e) => { 
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) 
        setSelectedCard(null); 
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className="w-full h-full flex flex-col p-1 sm:p-2 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] bg-[#F1F5F9]">
      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden">
        {/* Slim Unified Toolbar */}
        <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white shrink-0">
          <div className="flex items-center gap-4">
             {/* Tab Icons before Title */}
             <div className="flex items-center bg-slate-50 p-0.5 rounded-md border border-slate-100">
                {[
                  { id: "salaries", label: "Salaries", icon: IndianRupee, color: "text-blue-600" },
                  { id: "expenses", label: "Expenses", icon: Receipt, color: "text-emerald-600" },
                  { id: "allowances", label: "Allowances", icon: Gift, color: "text-indigo-600" }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${activeTab === tab.id ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    <tab.icon size={12} className={activeTab === tab.id ? tab.color : ""} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${activeTab === tab.id ? 'text-slate-800' : 'text-slate-400'}`}>{tab.label}</span>
                  </button>
                ))}
             </div>

             <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-black text-slate-800 tracking-tight uppercase shrink-0">
                  {activeTab} List
                </h3>
                <span className="text-[8px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
                   {activeTab === 'salaries' ? payrolls.length : activeTab === 'expenses' ? expenses.length : allowances.length}
                </span>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Company & Date Filter */}
             <div className="flex items-center bg-slate-50 rounded-md border border-slate-100 p-0.5">
                <CustomSelector 
                   icon={<Building size={11}/>}
                   value={filter.companyId}
                   options={companies.map(c => ({ id: c._id, name: c.companyName }))}
                   onChange={(id) => setFilter({...filter, companyId: id})}
                   minWidth="100px"
                />
                <div className="w-px h-3 bg-slate-200 mx-1" />
                <CustomSelector 
                   icon={<CalendarDays size={11}/>}
                   value={filter.month}
                   options={months.map((m, i) => ({ id: i + 1, name: m }))}
                   onChange={(id) => setFilter({...filter, month: id})}
                   minWidth="60px"
                />
                <div className="w-px h-3 bg-slate-200 mx-1" />
                <input 
                  type="number" 
                  className="w-12 bg-transparent text-[10px] font-bold text-slate-600 px-1 outline-none text-center"
                  value={filter.year}
                  onChange={(e) => setFilter(p => ({...p, year: Number(e.target.value)}))}
                />
             </div>

             {/* Search and Action Buttons */}
             <div className="flex items-center gap-1.5">
               {activeTab === 'salaries' && (
                 <>
                   <div className="relative group w-36">
                     <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                     <input 
                       type="text" 
                       placeholder="Search..." 
                       className="w-full pl-8 pr-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] outline-none font-bold focus:bg-white focus:border-blue-500/20 transition-all text-slate-600"
                       value={filter.searchQuery}
                       onChange={e => setFilter({...filter, searchQuery: e.target.value})}
                     />
                   </div>
                   <button 
                      onClick={handleAutoCalculate}
                      disabled={loading}
                      className="px-2.5 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      title="Generate"
                    >
                      <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Generate</span>
                    </button>
                   
                   {selectedIds.length > 0 && userRole !== 'accounts' && (
                     <button onClick={handleApproveSelected} disabled={loading} className="px-2 py-1 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-black shadow-sm flex items-center gap-1.5 transition-all">
                       <FiCheckCircle size={12} /> Approve ({selectedIds.length})
                     </button>
                   )}
                 </>
               )}

               {activeTab === 'expenses' && userRole !== "manager" && (
                 <button onClick={()=>setShowAddExpense(true)} className="px-2.5 py-1 bg-blue-600 text-white rounded text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-sm flex items-center gap-1.5"><Plus size={12}/> Expense</button>
               )}
               {activeTab === 'allowances' && userRole !== "manager" && (
                 <button onClick={()=>setShowAddAllowance(true)} className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"><Plus size={12}/> Allowance</button>
               )}
             </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto no-scrollbar flex flex-col min-h-0">
          {loading ? (
            <div className="p-10 text-center text-slate-300 font-bold uppercase tracking-widest animate-pulse text-[11px]">Loading...</div>
          ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
               <tr className="text-slate-400">
                  {activeTab === 'salaries' ? (
                    <>
                      <th className="px-3 py-3 w-10 text-center">
                          <input 
                            type="checkbox" 
                            className="accent-blue-600 w-3.5 h-3.5 cursor-pointer" 
                            checked={selectedIds.length > 0 && selectedIds.length === payrolls.filter(p => !['approved', 'paid'].includes(p.approvalStatus)).length}
                            onChange={toggleSelectAll}
                          />
                       </th>
                      <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-left w-1/4">Personnel</th>
                      <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-left w-1/6">Base Salary</th>
                      <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-center w-1/6">Stats</th>
                      <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-left w-1/4">Adjustments</th>
                      <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-left w-1/6">Net Payable</th>
                      <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-right w-24">Actions</th>
                    </>
                   ) : activeTab === 'expenses' ? (
                     <>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/4">Category / Date</th>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-2/5">Description</th>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/6">Amount</th>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-1/6">Status</th>
                       <th className="px-4 py-3 w-10"></th>
                     </>
                   ) : (
                     <>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/5">Employee</th>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/6">Category</th>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/6">Amount</th>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/4">Description</th>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-1/12">Cycle</th>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-1/6">Status</th>
                       <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-1/6">Approved By</th>
                       <th className="px-4 py-3 w-10"></th>
                     </>
                   )}
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
               {activeTab === 'salaries' && payrolls
                 .filter(p => p.user?.name.toLowerCase().includes(filter.searchQuery.toLowerCase()))
                 .sort((a, b) => {
                    const weights = { approved: 2, paid: 3, default: 1 };
                    const wa = weights[a.approvalStatus] || weights.default;
                    const wb = weights[b.approvalStatus] || weights.default;
                    return wa - wb;
                 })
                 .map((p) => (
                 <tr key={p._id} className={`hover:bg-slate-50 transition-all group ${selectedIds.includes(p._id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-3 py-3 text-center">
                       {!['approved', 'paid'].includes(p.approvalStatus) ? (
                          <input 
                            type="checkbox" 
                            className={`accent-blue-600 w-3.5 h-3.5 cursor-pointer transition-opacity duration-200 ${selectedIds.includes(p._id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
                            checked={selectedIds.includes(p._id)}
                            onChange={() => toggleSelect(p._id)}
                          />
                       ) : (
                          <div className="w-4 h-4 mx-auto text-emerald-500/20"><FiCheck size={14}/></div>
                       )}
                    </td>
                   <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[11px] border border-slate-200 shrink-0">
                            {p.user?.name.charAt(0)}
                         </div>
                         <div className="min-w-0">
                            <p className="text-[12px] font-bold text-slate-800 truncate leading-none">{p.user?.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium mt-1 truncate">{p.user?.email}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-3 py-3">
                      <p className="text-[12px] font-bold text-slate-700">₹{(p.baseSalary || 0).toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400 font-medium">LPA: {((p.baseSalary || 0) * 12 / 100000).toFixed(1)}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <div className="flex flex-col items-center min-w-[28px]">
                             <p className="text-[11px] font-black text-emerald-600 leading-none">
                                {p.actualWorkDays !== undefined ? p.actualWorkDays : '-'}
                             </p>
                             <p className="text-[7px] text-slate-400 uppercase font-black tracking-tight mt-1">Work</p>
                          </div>
                          <div className="w-px h-5 bg-slate-100" />
                          <div className="flex flex-col items-center min-w-[28px]">
                             <p className="text-[11px] font-black text-blue-600 leading-none">
                                {p.actualWorkDays !== undefined ? (p.presentDays || 0) - (p.actualWorkDays || 0) : '-'}
                             </p>
                             <p className="text-[7px] text-slate-400 uppercase font-black tracking-tight mt-1">Hol</p>
                          </div>
                          <div className="w-px h-5 bg-slate-100" />
                          <div className="flex flex-col items-center min-w-[28px]">
                             <p className="text-[11px] font-black text-rose-500 leading-none">
                                {p.absentDays !== undefined ? p.absentDays : '-'}
                             </p>
                             <p className="text-[7px] text-slate-400 uppercase font-black tracking-tight mt-1">Abs</p>
                          </div>
                          <div className="w-px h-5 bg-slate-100" />
                          <div className="flex flex-col items-center min-w-[28px]">
                             <p className="text-[11px] font-black text-indigo-500 leading-none">
                                {p.leaveDays !== undefined ? p.leaveDays : '-'}
                             </p>
                             <p className="text-[7px] text-slate-400 uppercase font-black tracking-tight mt-1">Leave</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-3 py-3">
                        <div className="flex flex-col gap-0.5">
                           {(p.sundayPay > 0 || p.sundayWorkingDays > 0) && (
                              <p className="text-[9px] text-slate-600 font-bold leading-tight">
                                 <span className="text-emerald-500 mr-1">+</span>Sun Work: ₹{(p.sundayPay || Math.round((p.baseSalary / (p.workingDays || 26)) * (p.sundayWorkingDays || 0))).toLocaleString()} 
                              </p>
                           )}
                           {p.attendanceBonus > 0 && (
                              <p className="text-[9px] text-indigo-600 font-black leading-tight">
                                 <span className="text-indigo-500 mr-1">+</span>ATTENDANCE: ₹{p.attendanceBonus.toLocaleString()}
                              </p>
                           )}
                           {p.paidLeaveBonus > 0 && (
                              <p className="text-[9px] text-indigo-600 font-black leading-tight">
                                 <span className="text-indigo-500 mr-1">+</span>LEAVE CREDIT: ₹{p.paidLeaveBonus.toLocaleString()}
                              </p>
                           )}
                           {!(p.attendanceBonus > 0 || p.paidLeaveBonus > 0) && (p.bonusAmount > 0 || p.bonus > 0) && (
                              <p className="text-[9px] text-indigo-600 font-black leading-tight">
                                 <span className="text-indigo-500 mr-1">+</span>BONUS: ₹{(p.bonusAmount || (p.bonus * (p.baseSalary / (p.workingDays || 26)))).toLocaleString()}
                              </p>
                           )}
                           {p.incentives > 0 && <p className="text-[9px] text-emerald-600 font-bold leading-tight"><span className="text-emerald-500 mr-1">+</span>Incentive: ₹{p.incentives.toLocaleString()}</p>}
                           {p.perks > 0 && <p className="text-[9px] text-emerald-600 font-bold leading-tight"><span className="text-emerald-500 mr-1">+</span>Perks: ₹{p.perks.toLocaleString()}</p>}
                           {p.officeExpenses > 0 && <p className="text-[9px] text-emerald-600 font-bold leading-tight"><span className="text-emerald-500 mr-1">+</span>Expenses: ₹{p.officeExpenses.toLocaleString()}</p>}
                           {p.penalties > 0 && <p className="text-[9px] text-rose-500 font-bold leading-tight"><span className="mr-1">-</span>Penalty: ₹{p.penalties.toLocaleString()}</p>}
                           {!(p.officeExpenses || p.incentives || p.bonusAmount || p.perks || p.penalties || p.sundayPay || p.sundayWorkingDays || p.attendanceBonus || p.paidLeaveBonus) && <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest">No Adjustments</span>}
                        </div>
                    </td>
                   <td className="px-3 py-3 group/payable">
                      <div className="flex items-center gap-2">
                         <div className="min-w-0">
                            <p className="text-[13px] font-black text-slate-900 tracking-tight leading-none">₹{(p.totalPayable || 0).toLocaleString()}</p>
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Net Pay</p>
                         </div>
                         {userRole !== "manager" && !['approved', 'paid'].includes(p.approvalStatus) && (
                            <button 
                               onClick={() => openEditModal(p)}
                               className="text-blue-500 hover:text-blue-700 transition-all p-1.5 bg-blue-50 rounded border border-blue-100 shadow-sm opacity-100 group-hover/payable:scale-110"
                               title="Edit Details"
                            >
                               <FiEdit size={12} />
                            </button>
                         )}
                         {['approved', 'paid'].includes(p.approvalStatus) && (
                            <div className="text-emerald-500 p-1.5 bg-emerald-50 rounded border border-emerald-100">
                               <FiCheckCircle size={12} />
                            </div>
                         )}
                      </div>
                   </td>
                   <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {!['approved', 'paid'].includes(p.approvalStatus) ? (
                             <>
                               <button 
                                  onClick={!["manager", "accounts"].includes(userRole) ? () => updateStatus(p._id, 'approved') : undefined}
                                  className={`px-3 py-1.5 rounded text-[8px] font-black uppercase tracking-widest transition-all shadow-sm ${["manager", "accounts"].includes(userRole) ? 'bg-slate-50 text-slate-300' : 'bg-slate-900 text-white hover:bg-black active:scale-95'}`}
                               >
                                  Approve
                               </button>
                             </>
                           ) : p.approvalStatus === 'paid' ? (
                              <div className="px-3 py-1.5 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-100 bg-emerald-50 text-emerald-600">
                                 Paid
                              </div>
                           ) : null}
                        </div>
                     </td>
                 </tr>
              ))}

                {activeTab === 'expenses' && [...expenses]
                  .sort((a, b) => {
                     // Status priority: unpaid first
                     if (a.status !== b.status) return a.status === 'unpaid' ? -1 : 1;
                     // Newest first
                     return new Date(b.expenseDate || b.createdAt) - new Date(a.expenseDate || a.createdAt);
                  })
                  .map(row => (
                  <tr key={row._id} className="hover:bg-slate-50 transition-standard group cursor-pointer" onClick={() => { setSelectedExpenseDetails(row); setShowExpenseDetails(true); }}>
                     <td className="px-4 py-3">
                        <p className="text-slate-800 uppercase font-black tracking-widest text-[9px]">{row.category}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{row.expenseDate ? new Date(row.expenseDate).toLocaleDateString() : 'N/A'}</p>
                     </td>
                     <td className="px-4 py-3">
                        <p className="text-[10px] text-slate-600 font-bold truncate" title={row.description}>{row.description}</p>
                        {row.status === 'paid' && row.paidFromAccount && (
                           <div className="flex items-center gap-1.5 mt-0.5 text-[8px] text-blue-500 font-black uppercase tracking-widest">
                              Paid via: {row.paidFromAccount.bankName}
                           </div>
                        )}
                     </td>
                     <td className="px-4 py-3 text-[13px] font-black text-slate-900">₹{(row.amount || 0).toLocaleString()}</td>
                     <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${row.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>{row.status}</span>
                     </td>
                     <td className="px-4 py-3 text-center">
                        <button className="text-slate-300 group-hover:text-slate-600 transition-colors">
                           <ChevronRight size={14} />
                        </button>
                     </td>
                  </tr>
                ))}

                {activeTab === 'allowances' && [...allowances]
                  .sort((a, b) => {
                     // Status priority: processing > others > paid
                     const statusOrder = { 'processing': 1, 'paid': 3 };
                     const orderA = statusOrder[a.status] || 2;
                     const orderB = statusOrder[b.status] || 2;
                     
                     if (orderA !== orderB) return orderA - orderB;

                     if (b.year !== a.year) return b.year - a.year;
                     if (b.month !== a.month) return b.month - a.month;
                     return new Date(b.createdAt) - new Date(a.createdAt);
                  })
                  .map(row => (
                  <tr key={row._id} className="hover:bg-slate-50 transition-standard group cursor-pointer" onClick={() => { setSelectedAllowanceDetails(row); setShowAllowanceDetails(true); }}>
                     <td className="px-4 py-3 text-slate-800 text-[11px] font-bold">{row.employee?.user?.name}</td>
                     <td className="px-4 py-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">{row.category}</td>
                     <td className="px-4 py-3 text-[13px] font-black text-indigo-600">₹{(row.amount || 0).toLocaleString()}</td>
                     <td className="px-4 py-3 text-[10px] text-slate-500 font-medium max-w-[150px] truncate" title={row.description}>{row.description || '-'}</td>
                     <td className="px-4 py-3 text-[9px] text-slate-400 font-black tracking-widest uppercase text-center">{row.month}/{row.year}</td>
                     <td className="px-4 py-3 text-center">
                        {row.status === 'paid' ? (
                           <div className="flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-500">Paid</span>
                              <span className="text-[7px] text-slate-400 mt-0.5 uppercase font-black">{row.paidFrom}</span>
                           </div>
                        ) : (
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${row.status === 'processing' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>{row.status}</span>
                        )}
                     </td>
                     <td className="px-4 py-3 text-[10px] text-slate-500 font-medium text-center">{row.approvedBy || '-'}</td>
                     <td className="px-4 py-3 text-center">
                        <button className="text-slate-300 group-hover:text-slate-600 transition-colors">
                           <ChevronRight size={14} />
                        </button>
                     </td>
                  </tr>
                ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)}>
           <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-0.5">Incentives</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 p-2 rounded-md text-[13px] font-semibold outline-none border border-slate-100 focus:bg-white focus:border-blue-500/30 transition-all text-slate-700" 
                      value={editFormData.incentives} 
                      onChange={e => setEditFormData({...editFormData, incentives: Number(e.target.value)})} 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-0.5">Office Expenses</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 p-2 rounded-md text-[13px] font-semibold outline-none border border-slate-100 focus:bg-white focus:border-blue-500/30 transition-all text-slate-700" 
                      value={editFormData.officeExpenses} 
                      onChange={e => setEditFormData({...editFormData, officeExpenses: Number(e.target.value)})} 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-0.5">Perks</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 p-2 rounded-md text-[13px] font-semibold outline-none border border-slate-100 focus:bg-white focus:border-blue-500/30 transition-all text-slate-700" 
                      value={editFormData.perks} 
                      onChange={e => setEditFormData({...editFormData, perks: Number(e.target.value)})} 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest px-0.5">Penalties (Deduction)</label>
                    <input 
                      type="number" 
                      className="w-full bg-rose-50/30 p-2 rounded-md text-[13px] font-semibold outline-none border border-rose-100 focus:bg-white focus:border-rose-500/30 transition-all text-rose-700" 
                      value={editFormData.penalties} 
                      onChange={e => setEditFormData({...editFormData, penalties: Number(e.target.value)})} 
                    />
                 </div>
              </div>

              <div className="pt-2">
                 <button 
                   onClick={handleUpdatePayroll}
                   disabled={loading}
                   className="w-full py-2.5 bg-blue-600 text-white rounded-md font-bold text-[12px] shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 uppercase tracking-widest"
                 >
                    {loading ? "Saving Changes..." : "Save Payroll Changes"}
                 </button>
              </div>
           </div>
        </Modal>
      )}

      {showAddExpense && (
        <Modal onClose={()=>setShowAddExpense(false)}>
           <div className="space-y-4">
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[14px]">Add Expense</h3>
              <div className="flex gap-4">
                 <div className="flex-1">
                    <Input label="Category" value={newExpense.category} onChange={v=>setNewExpense({...newExpense, category:v})} placeholder="Rent, Electricity..." />
                 </div>
                 <div className="flex-1"><Input label="Date" value={newExpense.expenseDate} onChange={v=>setNewExpense({...newExpense, expenseDate:v})} type="date" /></div>
              </div>
               <div className="flex gap-4">
                  <div className="flex-1">
                     <Input label="Amount (₹)" value={newExpense.amount} onChange={v=>setNewExpense({...newExpense, amount:v})} type="number" />
                  </div>
                  <div className="flex-1">
                     <Input label="Approved By" value={newExpense.approvedBy} onChange={v=>setNewExpense({...newExpense, approvedBy:v})} placeholder="Person Name" />
                  </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                 <textarea className="w-full bg-slate-50 p-3 rounded-lg outline-none font-bold text-[12px] h-20 resize-none border border-slate-200 focus:border-blue-500" placeholder="Details..." value={newExpense.description} onChange={e=>setNewExpense({...newExpense, description:e.target.value})} />
              </div>
              <button onClick={handleAddExpense} className="w-full py-3 bg-blue-600 text-white rounded-md font-bold text-[12px] uppercase shadow-sm hover:bg-blue-700 transition-all">Save Expense</button>
           </div>
        </Modal>
      )}

      {showAddAllowance && (
        <Modal onClose={()=>setShowAddAllowance(false)}>
           <div className="space-y-4">
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[14px]">Add Allowance</h3>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase px-1">Select Employee</label>
                 <CustomSelector 
                    value={newAllowance.employeeId}
                    options={employees
                      .filter(e => ['active', 'resigned'].includes(String(e.status).toLowerCase()))
                      .map(e => ({ id: e._id, name: e.user?.name }))
                    }
                    onChange={v=>setNewAllowance({...newAllowance, employeeId:v})}
                    isLarge
                 />
              </div>
              <div className="flex gap-4">
                 <div className="flex-1"><Input label="Category" value={newAllowance.category} onChange={v=>setNewAllowance({...newAllowance, category:v})} placeholder="Travel, Food, Bonus" /></div>
                 <div className="flex-1">
                    <Input 
                      label="Cycle" 
                      value={`${newAllowance.year}-${String(newAllowance.month).padStart(2,'0')}`} 
                      onChange={v => {
                        const [y, m] = v.split('-');
                        setNewAllowance({...newAllowance, year: Number(y), month: Number(m)});
                      }} 
                      type="month" 
                    />
                 </div>
              </div>
               <div className="flex gap-4">
                  <div className="flex-1">
                     <Input label="Amount (₹)" value={newAllowance.amount} onChange={v=>setNewAllowance({...newAllowance, amount:v})} type="number" />
                  </div>
                  <div className="flex-1">
                     <Input label="Approved By" value={newAllowance.approvedBy} onChange={v=>setNewAllowance({...newAllowance, approvedBy:v})} placeholder="Person Name" />
                  </div>
               </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                 <textarea className="w-full bg-slate-50 p-3 rounded-lg outline-none font-bold text-[12px] h-20 resize-none border border-slate-200 focus:border-indigo-500" placeholder="Details..." value={newAllowance.description} onChange={e=>setNewAllowance({...newAllowance, description:e.target.value})} />
              </div>
              <button onClick={handleAddAllowance} className="w-full py-3 bg-indigo-600 text-white rounded-md font-bold text-[12px] uppercase shadow-sm hover:bg-indigo-700 transition-all">Save Allowance</button>
           </div>
        </Modal>
      )}

      {showPayAllowanceModal && (
        <Modal onClose={() => setShowPayAllowanceModal(false)}>
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[14px]">Process Allowance Payment</h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
               <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Amount</p>
                  <p className="text-[16px] font-black text-slate-800">₹{payingAllowance?.amount?.toLocaleString()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Employee</p>
                  <p className="text-[11px] font-bold text-slate-700">{payingAllowance?.employee?.user?.name}</p>
               </div>
            </div>

            <div className="space-y-3">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-0.5">Date of Pay</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 p-2 rounded-md text-[13px] font-semibold outline-none border border-slate-100 focus:bg-white focus:border-blue-500/30 transition-all text-slate-700" 
                    value={allowancePaymentData.paymentDate} 
                    onChange={e => setAllowancePaymentData({...allowancePaymentData, paymentDate: e.target.value})} 
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-0.5">Paid From (Cash, Bank name, etc.)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cash, HDFC Bank, GPay"
                    className="w-full bg-slate-50 p-2 rounded-md text-[13px] font-semibold outline-none border border-slate-100 focus:bg-white focus:border-blue-500/30 transition-all text-slate-700" 
                    value={allowancePaymentData.paidFrom} 
                    onChange={e => setAllowancePaymentData({...allowancePaymentData, paidFrom: e.target.value})} 
                  />
               </div>
            </div>

            <div className="pt-2">
               <button 
                 onClick={handlePayAllowance}
                 disabled={loading}
                 className="w-full py-3 bg-indigo-600 text-white rounded-md font-bold text-[12px] shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 uppercase tracking-widest"
               >
                  {loading ? "Processing..." : "Confirm Payment"}
               </button>
            </div>
          </div>
        </Modal>
      )}
     {showAllowanceDetails && selectedAllowanceDetails && (
        <Modal onClose={() => setShowAllowanceDetails(false)}>
           <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Allowance Details</h3>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedAllowanceDetails.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : selectedAllowanceDetails.status === 'processing' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                   {selectedAllowanceDetails.status}
                </span>
             </div>
             
             <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</p>
                   <p className="text-[12px] font-bold text-slate-800">{selectedAllowanceDetails.employee?.user?.name || '-'}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                   <p className="text-[15px] font-black text-indigo-600">₹{(selectedAllowanceDetails.amount || 0).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                   <p className="text-[11px] font-bold text-slate-700">{selectedAllowanceDetails.category || '-'}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cycle</p>
                   <p className="text-[11px] font-bold text-slate-700">{selectedAllowanceDetails.month}/{selectedAllowanceDetails.year}</p>
                </div>
                <div className="col-span-2 space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                   <p className="text-[11px] font-medium text-slate-600">{selectedAllowanceDetails.description || '-'}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Approved By</p>
                   <p className="text-[11px] font-bold text-slate-700">{selectedAllowanceDetails.approvedBy || '-'}</p>
                </div>
                {selectedAllowanceDetails.status === 'paid' && (
                  <>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paid From</p>
                        <p className="text-[11px] font-bold text-slate-700">{selectedAllowanceDetails.paidFrom || '-'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Date</p>
                        <p className="text-[11px] font-bold text-slate-700">{selectedAllowanceDetails.paymentDate ? new Date(selectedAllowanceDetails.paymentDate).toLocaleDateString() : '-'}</p>
                     </div>
                  </>
                )}
             </div>
           </div>
        </Modal>
      )}

      {showExpenseDetails && selectedExpenseDetails && (
        <Modal onClose={() => setShowExpenseDetails(false)}>
           <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Expense Details</h3>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedExpenseDetails.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                   {selectedExpenseDetails.status}
                </span>
             </div>
             
             <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                   <p className="text-[12px] font-bold text-slate-800">{selectedExpenseDetails.category || '-'}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                   <p className="text-[15px] font-black text-emerald-600">₹{(selectedExpenseDetails.amount || 0).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                   <p className="text-[11px] font-bold text-slate-700">{selectedExpenseDetails.expenseDate ? new Date(selectedExpenseDetails.expenseDate).toLocaleDateString() : '-'}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Approved By</p>
                   <p className="text-[11px] font-bold text-slate-700">{selectedExpenseDetails.approvedBy || '-'}</p>
                </div>
                <div className="col-span-2 space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                   <p className="text-[11px] font-medium text-slate-600">{selectedExpenseDetails.description || '-'}</p>
                </div>
                {selectedExpenseDetails.status === 'paid' && selectedExpenseDetails.paidFromAccount && (
                  <div className="col-span-2 space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paid Via</p>
                     <p className="text-[11px] font-bold text-blue-600">{selectedExpenseDetails.paidFromAccount.bankName} ({selectedExpenseDetails.paidFromAccount.accountNumber})</p>
                  </div>
                )}
             </div>
           </div>
        </Modal>
      )}

    </div>
  );
}

// ── CUSTOM SELECTOR COMPONENT ──

function CustomSelector({ icon, value, options, onChange, minWidth = "auto", isLarge = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const clickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="relative" ref={dropRef} style={{ minWidth }}>
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`w-full flex items-center justify-between gap-3 px-3 transition-all duration-300
         ${isLarge ? 'bg-[#F8FAFC] py-3 rounded-md' : 'py-1.5 rounded-md hover:bg-slate-50'}`}
       >
          <div className="flex items-center gap-2 overflow-hidden">
             {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
             <span className={`text-[11px] font-[900] truncate tracking-tight transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-700'}`}>
                {selectedOption?.name || "Select..."}
             </span>
          </div>
          <FiChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
       </button>

       {isOpen && (
         <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white border border-slate-100 rounded shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-60 overflow-y-auto custom-scrollbar-thin">
               {options.length === 0 && <p className="px-4 py-2 text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center">No results</p>}
               {options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { onChange(opt.id); setIsOpen(false); }}
                    className={`w-full text-left px-5 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between
                    ${value === opt.id ? 'bg-blue-50/50' : ''}`}
                  >
                     <span className={`text-[11px] font-[800] tracking-tight ${value === opt.id ? 'text-blue-600' : 'text-slate-600'}`}>
                        {opt.name}
                     </span>
                     {value === opt.id && <CheckCircle2 size={12} className="text-blue-500" />}
                  </button>
               ))}
            </div>
         </div>
       )}
    </div>
  );
}

// ── UTILITY COMPONENTS ──

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1.5">
       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">{label}</label>
       <input 
         type={type}
         placeholder={placeholder}
         value={value}
         onChange={e => onChange(e.target.value)}
         className="w-full bg-slate-50 p-2.5 rounded-lg outline-none font-bold text-[12px] border border-slate-200 focus:bg-white focus:border-blue-500 transition-standard text-slate-700"
       />
    </div>
  );
}

