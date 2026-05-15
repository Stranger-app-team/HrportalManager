import React, { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../config/api";
import { 
  CreditCard, 
  Wallet, 
  ChevronDown, 
  Search, 
  Plus, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  CalendarDays,
  ArrowRightLeft,
  ArrowUpRight,
  Receipt,
  Gift,
  RefreshCw,
  Trash2,
  X
} from "lucide-react";
import Modal from "../components/Shared/Modal";
import CustomSelector from "../components/Shared/CustomSelector";

export default function Accounts() {
  const [loading, setLoading] = useState(false);
  const [payrolls, setPayrolls] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAccountant = user.userType === 'accounts';

  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [allowances, setAllowances] = useState([]);
  const [activeTab, setActiveTab] = useState("salaries");
  
  const [filter, setFilter] = useState({
    companyId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [selectedBankId, setSelectedBankId] = useState("");
  const [stats, setStats] = useState({
    totalPayable: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddAllowance, setShowAddAllowance] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);

  // Forms
  const [newExpense, setNewExpense] = useState({ category: "", amount: "", description: "", expenseDate: new Date().toLocaleDateString('en-CA'), approvedBy: "" });
  const [newAllowance, setNewAllowance] = useState({ employeeId: "", category: "", amount: "", description: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), approvedBy: "" });
  const [newBank, setNewBank] = useState({ accountName: "", accountNumber: "", bankName: "", ifsc: "", branch: "", balance: 0 });
  const [showPayAllowanceModal, setShowPayAllowanceModal] = useState(false);
  const [payingAllowance, setPayingAllowance] = useState(null);
  const [allowancePaymentData, setAllowancePaymentData] = useState({
    paymentDate: new Date().toLocaleDateString('en-CA'),
    paidFrom: ""
  });

  // ── FETCH STANDALONE BANK ACCOUNTS ──
  const fetchBanks = useCallback(async (targetCompanyId) => {
    const cid = targetCompanyId || filter.companyId;
    if (!cid) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/company/${cid}/bank-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBankAccounts(data || []);
      if (data.length > 0 && !selectedBankId) {
        setSelectedBankId(data[0]._id);
      }
    } catch (err) { console.error("Error fetching banks:", err); }
  }, [filter.companyId, selectedBankId]);

  // ── INITIAL FETCH ──
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/company`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const comps = data.company || [];
        setCompanies(comps);
        
        let initialCid = "";
        const savedId = localStorage.getItem("selectedCompanyId");
        if (savedId && comps.find(c => c._id === savedId)) {
          initialCid = savedId;
        } else if (comps.length > 0) {
          initialCid = comps[0]._id;
        }

        if (initialCid) {
          setFilter(prev => ({ ...prev, companyId: initialCid }));
          fetchBanks(initialCid);
        }
      } catch (err) { console.error("Error in initial fetch:", err); }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (filter.companyId) fetchBanks(filter.companyId);
  }, [filter.companyId, fetchBanks]);

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

  const fetchData = async () => {
    if (!filter.companyId) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      if (activeTab === "salaries") {
        const res = await fetch(`${API_BASE_URL}/payroll?companyId=${filter.companyId}&month=${filter.month}&year=${filter.year}&approvalStatus=approved`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setPayrolls(Array.isArray(data) ? data : []);
        calculateStats(data);
      } else if (activeTab === "expenses") {
        const res = await fetch(`${API_BASE_URL}/payroll/expenses?companyId=${filter.companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      } else if (activeTab === "allowances" || activeTab === "approvals") {
        const res = await fetch(`${API_BASE_URL}/payroll/allowances?companyId=${filter.companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();
        console.log("allowances", data);
        setAllowances(Array.isArray(data) ? data : []);
      }
      
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filter, activeTab]);

  const calculateStats = (data) => {
    let total = 0, paid = 0, pending = 0;
    if (Array.isArray(data)) {
      data.forEach(p => {
        total += p.totalPayable;
        if (p.paymentStatus === 'paid') paid += p.totalPayable;
        else pending += p.totalPayable;
      });
      setStats({ totalPayable: total, paidAmount: paid, pendingAmount: pending });
    }
  };

  const handleAddBank = async () => {
    if (!newBank.accountNumber || !newBank.bankName) { alert("Please fill required fields."); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/company/bank-account`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...newBank, companyId: filter.companyId, balance: Number(newBank.balance) })
      });
      if (res.ok) { setShowAddBank(false); fetchBanks(); }
    } catch (err) { console.error(err); }
  };

  const handleAddExpense = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payroll/expense`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...newExpense, companyId: filter.companyId, amount: Number(newExpense.amount) })
      });
      if (res.ok) { setShowAddExpense(false); fetchData(); }
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

  const handleProcessPayment = async (payrollId) => {
    if (!selectedBankId) { alert("Select a bank account first."); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payroll/pay`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ payrollId, bankAccountId: selectedBankId })
      });
      if (res.ok) { fetchData(); fetchBanks(); }
    } catch (err) { console.error(err); }
  };

  const payExpenseItem = async (expenseId) => {
    if (!selectedBankId) { alert("Select a bank account first."); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payroll/expense/pay`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId, bankAccountId: selectedBankId })
      });
      if (res.ok) { fetchData(); fetchBanks(); }
    } catch (err) { console.error(err); }
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* ── STATS ── - Compact Top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 shrink-0">
        {[
          { label: "Total Salaries", value: `₹${stats.totalPayable.toLocaleString()}`, icon: ArrowUpRight, color: "blue" },
          { label: "Pending Payments", value: `₹${stats.pendingAmount.toLocaleString()}`, icon: Clock, color: "amber" },
          { label: "Cash Balance", value: `₹${bankAccounts.reduce((acc,b)=>acc+b.balance,0).toLocaleString()}`, icon: Wallet, color: "emerald" },
          { label: "Bank Accounts", value: bankAccounts.length, icon: CreditCard, color: "indigo" }
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-slate-200 shadow-sm rounded-lg p-3 flex items-center gap-3 transition-standard hover:shadow-md">
             <div className={`w-9 h-9 rounded-md bg-${s.color}-500/10 text-${s.color}-600 flex items-center justify-center shrink-0`}>
                <s.icon size={18} />
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{s.label}</p>
                <h2 className="text-lg font-bold text-slate-800 mt-0.5 tracking-tight">{s.value}</h2>
             </div>
          </div>
        ))}
      </div>

      {/* ── FILTER & TAB BAR ── - High Density */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 shrink-0 bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
           {[
             { id: "salaries", label: "Salaries", icon: DollarSign },
             { id: "expenses", label: "Expenses", icon: Receipt },
             { id: "allowances", label: "Allowances", icon: Gift }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all
               ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
             >
               <tab.icon size={13} /> {tab.label}
             </button>
           ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <div className="flex items-center bg-slate-50 rounded-md border border-slate-200 p-0.5">
             <CustomSelector 
                icon={<Building2 size={11} />}
                value={filter.companyId}
                options={companies.map(c => ({ id: c._id, name: c.companyName }))}
                onChange={(id) => setFilter(p => ({...p, companyId: id}))}
                minWidth="110px"
             />
             <div className="w-px h-3 bg-slate-200 self-center mx-1" />
             <CustomSelector 
                icon={<CalendarDays size={11} />}
                value={filter.month}
                options={months.map((m, i) => ({ id: i + 1, name: m }))}
                onChange={(id) => setFilter(p => ({...p, month: id}))}
                minWidth="70px"
             />
             <div className="w-px h-3 bg-slate-200 self-center mx-1" />
             <input type="number" className="w-12 bg-transparent text-[10px] font-bold text-slate-600 px-1 outline-none text-center" value={filter.year} onChange={(e) => setFilter(p => ({...p, year: Number(e.target.value)}))} />
           </div>

           <button onClick={() => fetchData()} className="p-2 bg-slate-50 text-slate-400 border border-slate-200 rounded-md hover:bg-slate-100 transition-all flex items-center justify-center">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
           </button>
        </div>
      </div>

      {/* Content Columns */}
      <div className="flex-1 flex flex-col xl:flex-row gap-3 min-h-0 overflow-hidden">

        {/* Left Column: Ledger */}
        <div className={`${activeTab === 'allowances' ? 'flex-1' : 'flex-[2.5]'} flex flex-col min-w-0 h-full`}>
           <div className="flex-1 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                 <h3 className="text-[12px] font-black text-slate-800 tracking-tight uppercase">{activeTab === 'salaries' ? 'Salary List' : activeTab === 'expenses' ? 'Expense List' : 'Allowance List'}</h3>
                 <div className="flex items-center gap-2">

                    <div className="relative group">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={13} />
                       <input type="text" placeholder="Search..." className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] outline-none font-bold w-40 focus:border-blue-500/20" />
                    </div>
                 </div>
              </div>

               <div className="flex-1 overflow-y-auto no-scrollbar">
                  {loading ? (
                     <div className="p-10 text-center text-slate-300 font-bold uppercase tracking-widest animate-pulse text-[11px]">Loading...</div>
                  ) : (
                  <table className="w-full text-left border-collapse">
                     <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100">
                        <tr>
                          {activeTab === "salaries" ? (
                            <>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee Name</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Days Worked</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Sun Work</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Bonus</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                            </>
                          ) : activeTab === "expenses" ? (
                            <>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category / Date</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Pay</th>
                            </>
                          ) : (
                            <>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Cycle</th>
                              <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                            </>
                          )}
                        </tr>
                     </thead>
                    <tbody className="divide-y divide-slate-50 font-bold">
                       {activeTab === "salaries" && payrolls.map(row => (
                         <tr key={row._id} className="hover:bg-slate-50/50 transition-all group">
                            <td className="px-5 py-2.5 font-bold text-slate-700 text-[11px]">{row.user?.name}</td>
                            <td className="px-5 py-2.5 text-[10px] text-slate-400 text-center">{row.presentDays}D / {row.workingDays}D</td>
                            <td className="px-5 py-2.5 text-[10px] text-blue-500 text-center">{row.sundayWorkingDays || 0}D</td>
                            <td className="px-5 py-2.5 text-[10px] text-indigo-500 text-center">₹{(row.bonusAmount || 0).toLocaleString()}</td>
                            <td className="px-5 py-2.5 text-[12px] font-black text-slate-800">₹{(row.totalPayable || 0).toLocaleString()}</td>
                            <td className="px-5 py-2.5 uppercase tracking-widest text-[8px] text-center">
                               <span className={`px-2.5 py-1 rounded-full border ${row.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{row.paymentStatus}</span>
                            </td>
                            <td className="px-5 py-2.5 text-center">
                               {row.paymentStatus === 'pending' ? (
                                 <button 
                                   disabled={!isAccountant}
                                   onClick={()=>handleProcessPayment(row._id)} 
                                   className={`px-3.5 py-1.5 bg-[#0B2D5C] text-white text-[9px] font-black uppercase rounded shadow transition-all ${!isAccountant ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1a3a6c] active:scale-95'}`}
                                 >
                                   Pay
                                 </button>
                               ) : <CheckCircle2 className="mx-auto text-emerald-500" size={16}/>}
                            </td>
                         </tr>
                       ))}
                       {activeTab === "expenses" && [...expenses]
                         .sort((a, b) => {
                            if (a.status !== b.status) return a.status === 'unpaid' ? -1 : 1;
                            return new Date(b.expenseDate || b.createdAt) - new Date(a.expenseDate || a.createdAt);
                         })
                         .map(row => (
                         <tr key={row._id} className="hover:bg-[#F8FAFC]">
                            <td className="px-6 py-6">
                               <p className="text-[#0B2D5C] uppercase tracking-widest text-[11px]">{row.category}</p>
                               <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest mt-0.5">{row.expenseDate ? new Date(row.expenseDate).toLocaleDateString() : 'N/A'}</p>
                            </td>
                            <td className="px-6 py-6">
                               <p className="text-[11px] text-slate-400 font-medium">{row.description}</p>
                               {row.status === 'paid' && row.paidFromAccount && (
                                  <div className="flex items-center gap-1.5 mt-1 text-[9px] text-blue-500 font-black uppercase tracking-widest">
                                     <CreditCard size={10} /> {row.paidFromAccount.bankName}
                                  </div>
                               )}
                            </td>
                            <td className="px-6 py-6 text-lg font-black text-[#0B2D5C]">₹{(row.amount || 0).toLocaleString()}</td>
                            <td className="px-6 py-6">
                               <span className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-widest ${row.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>{row.status}</span>
                            </td>
                            <td className="px-6 py-6 text-center">
                               {row.status === 'unpaid' ? (
                                 <button 
                                   disabled={!isAccountant}
                                   onClick={()=>payExpenseItem(row._id)} 
                                   className={`px-4 py-2 bg-[#0B2D5C] text-white text-[10px] rounded-xl transition-all ${!isAccountant ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1a3a6c] focus:scale-95'}`}
                                 >
                                   Clear
                                 </button>
                               ) : (
                                 <div className="flex flex-col items-center gap-1">
                                    <CheckCircle2 className="text-emerald-500" size={16} />
                                    {row.approvedBy && <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest text-center">By: {row.approvedBy}</span>}
                                 </div>
                               )}
                            </td>
                         </tr>
                       ))}
                       {activeTab === "allowances" && [...allowances]
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
                         <tr key={row._id} className="hover:bg-[#F8FAFC]">
                            <td className="px-6 py-6 text-[#0B2D5C] text-[13px]">{row.employee?.user?.name}</td>
                            <td className="px-6 py-6 text-[12px] text-slate-400 italic">{row.category}</td>
                            <td className="px-6 py-6 text-lg font-black text-indigo-600">₹{(row.amount || 0).toLocaleString()}</td>
                            <td className="px-6 py-6 text-[11px] text-slate-400 max-w-[150px] truncate" title={row.description}>{row.description || '-'}</td>
                            <td className="px-6 py-6 text-[10px] text-slate-400 tracking-widest uppercase">{row.month}/{row.year}</td>
                             <td className="px-6 py-6 text-center">
                                {row.status === 'paid' ? (
                                   <div className="flex flex-col items-center">
                                      <span className="px-3 py-1.5 rounded-full text-[9px] uppercase tracking-widest bg-emerald-50 text-emerald-500 font-bold">Paid</span>
                                      <span className="text-[7px] text-slate-400 mt-1 uppercase font-black">{row.paidFrom}</span>
                                      {row.paymentDate && <span className="text-[7px] text-slate-300 mt-0.5 uppercase">{new Date(row.paymentDate).toLocaleDateString()}</span>}
                                   </div>
                                ) : (
                                   <button 
                                      onClick={['accounts', 'hr'].includes(user.userType?.toLowerCase()) ? () => openPayAllowanceModal(row) : undefined}
                                      disabled={!['accounts', 'hr'].includes(user.userType?.toLowerCase())}
                                      className={`px-4 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${
                                         ['accounts', 'hr'].includes(user.userType?.toLowerCase()) ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' : 'bg-slate-50 text-slate-400 cursor-default'
                                      }`}
                                   >
                                      {['accounts', 'hr'].includes(user.userType?.toLowerCase()) ? 'Pay' : row.status}
                                   </button>
                                )}
                             </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
                  )}
               </div>
            </div>
         </div>

        {/* Right Column: Bank List - Hidden for allowances */}
        {activeTab !== 'allowances' && (
           <div className="flex-1 flex flex-col min-w-[320px]">
              <div className="bg-[#0B2D5C] rounded-lg p-4 shadow-lg relative overflow-hidden flex flex-col flex-1 border border-white/5">
                 <div className="absolute top-[-20%] right-[-20%] w-[150%] h-[50%] bg-blue-400/10 blur-[80px] pointer-events-none" />
                 
                 <div className="flex justify-between items-center mb-4 relative z-10 pb-2.5 border-b border-white/10">
                    <div>
                       <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Connected Banks</h4>
                       <p className="text-[8px] text-blue-200/40 font-bold uppercase mt-0.5 tracking-widest">Payment Sources</p>
                    </div>
                    <button onClick={()=>setShowAddBank(true)} className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all shadow-sm"><Plus size={14}/></button>
                 </div>
                 
                 <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar relative z-10 pr-1">
                    {bankAccounts.length === 0 ? (
                       <div className="flex flex-col items-center justify-center text-center opacity-20 py-20">
                          <CreditCard size={32} className="text-white mb-2" />
                          <p className="text-[9px] text-white font-bold uppercase italic">No accounts linked</p>
                       </div>
                    ) : (
                     bankAccounts.map(bank => (
                       <div 
                         key={bank._id}
                         onClick={()=>setSelectedBankId(bank._id)}
                         className={`p-4 rounded-xl border transition-standard cursor-pointer relative ${
                           selectedBankId === bank._id ? 'bg-white border-white shadow-md' : 'bg-white/5 border-white/5 hover:bg-white/10'
                         }`}
                       >
                          <div className="flex justify-between items-center mb-4">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedBankId === bank._id ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/40'}`}>
                                <Building2 size={16} />
                             </div>
                             <button onClick={(e)=>{e.stopPropagation();}} className={`${selectedBankId === bank._id ? 'text-slate-300 hover:text-rose-500' : 'text-white/20 hover:text-rose-400'} transition-standard`}>
                                <Trash2 size={14} />
                             </button>
                          </div>
                          
                          <div className="space-y-1">
                             <p className={`text-[13px] font-bold truncate ${selectedBankId === bank._id ? 'text-slate-800' : 'text-white'}`}>{bank.bankName}</p>
                             <p className={`text-[9px] font-bold uppercase tracking-wider ${selectedBankId === bank._id ? 'text-slate-400' : 'text-white/30'}`}>**** {bank.accountNumber?.slice(-4)}</p>
                          </div>
                          
                          <div className={`mt-3 pt-3 border-t ${selectedBankId === bank._id ? 'border-slate-100' : 'border-white/5'}`}>
                             <div className="flex justify-between items-center">
                                <p className={`text-[9px] font-bold uppercase text-slate-400 ${selectedBankId === bank._id ? 'text-slate-400' : 'text-white/20'}`}>Balance</p>
                                <p className={`text-[15px] font-bold tracking-tight ${selectedBankId === bank._id ? 'text-blue-600' : 'text-white'}`}>₹{(bank.balance || 0).toLocaleString()}</p>
                             </div>
                          </div>
                       </div>
                     ))
                    )}
                 </div>
              </div>
              
               {selectedBankId && bankAccounts.find(b=>b._id===selectedBankId) ? (
                  <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-3 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                           <CheckCircle2 size={16} />
                        </div>
                        <div className="text-left">
                           <p className="text-[10px] text-slate-800 font-black uppercase tracking-widest">{bankAccounts.find(b=>b._id===selectedBankId).bankName}</p>
                           <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Active Source • **** {bankAccounts.find(b=>b._id===selectedBankId).accountNumber?.slice(-4)}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[12px] font-black text-blue-600">₹{(bankAccounts.find(b=>b._id===selectedBankId).balance || 0).toLocaleString()}</p>
                     </div>
                  </div>
               ) : (
                  <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-3 flex flex-col items-center justify-center text-center">
                     <div className="w-8 h-8 rounded bg-orange-50 text-orange-500 flex items-center justify-center mb-1">
                        <AlertCircle size={14} />
                     </div>
                     <p className="text-[9px] text-slate-800 font-black uppercase tracking-widest">Select Source</p>
                     <p className="text-[8px] text-slate-400 font-bold px-2">Choose an account to pay.</p>
                  </div>
               )}
           </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {showAddExpense && (
        <Modal title="Add Expense" onClose={()=>setShowAddExpense(false)}>
           <div className="space-y-6">
              <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                    <CustomSelector 
                        value={newExpense.category}
                        options={[
                           {id:'Rent', name:'Rent'},
                           {id:'Electricity', name:'Electricity'},
                           {id:'Stationary', name:'Stationary'},
                           {id:'Salary', name:'Salary'},
                           {id:'Other', name:'Other'}
                        ]}
                        onChange={v=>setNewExpense({...newExpense, category:v})}
                        isLarge
                    />
                 </div>
                 <div className="flex-1"><Input label="Expense Date" value={newExpense.expenseDate} onChange={v=>setNewExpense({...newExpense, expenseDate:v})} type="date" /></div>
              </div>
               <div className="flex gap-4">
                  <div className="flex-1">
                     <Input label="Amount" value={newExpense.amount} onChange={v=>setNewExpense({...newExpense, amount:v})} placeholder="₹" type="number" />
                  </div>
                  <div className="flex-1">
                     <Input label="Approved By" value={newExpense.approvedBy} onChange={v=>setNewExpense({...newExpense, approvedBy:v})} placeholder="Person Name" />
                  </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                 <textarea className="w-full bg-[#F8FAFC] p-4 rounded-2xl outline-none font-bold text-[13px] h-24 resize-none border border-transparent focus:border-blue-500/10" placeholder="Enter details..." value={newExpense.description} onChange={e=>setNewExpense({...newExpense, description:e.target.value})} />
              </div>
              <button onClick={handleAddExpense} className="w-full py-4 bg-[#0B2D5C] text-white rounded-[1.8rem] font-black text-[12px] uppercase shadow-2xl hover:bg-[#1a3a6c] active:scale-95 transition-all italic">Save Expense</button>
           </div>
        </Modal>
      )}

      {showAddAllowance && (
        <Modal title="Add Allowance" onClose={()=>setShowAddAllowance(false)}>
           <div className="space-y-5">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase px-1">Select Employee</label>
                 <CustomSelector 
                    value={newAllowance.employeeId}
                    options={employees.map(e => ({ id: e._id, name: e.user?.name }))}
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
                     <Input label="Amount" value={newAllowance.amount} onChange={v=>setNewAllowance({...newAllowance, amount:v})} placeholder="₹" type="number" />
                  </div>
                  <div className="flex-1">
                     <Input label="Approved By" value={newAllowance.approvedBy} onChange={v=>setNewAllowance({...newAllowance, approvedBy:v})} placeholder="Person Name" />
                  </div>
               </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                 <textarea className="w-full bg-[#F8FAFC] p-4 rounded-2xl outline-none font-bold text-[13px] h-24 resize-none border border-transparent focus:border-blue-500/10" placeholder="Enter allowance details..." value={newAllowance.description} onChange={e=>setNewAllowance({...newAllowance, description:e.target.value})} />
              </div>
              <button 
                onClick={handleAddAllowance} 
                className="w-full py-4 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[12px] uppercase shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all tracking-widest italic"
              >
                 Confirm Allowance
              </button>
           </div>
        </Modal>
      )}

      {showAddBank && (
        <Modal title="Add Bank Account" onClose={()=>setShowAddBank(false)}>
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Input label="Bank Name" value={newBank.bankName} onChange={v=>setNewBank({...newBank, bankName:v})} placeholder="e.g. HDFC Bank" /></div>
              <div className="col-span-2"><Input label="A/C Holder Name" value={newBank.accountName} onChange={v=>setNewBank({...newBank, accountName:v})} placeholder="Business Ledger" /></div>
              <Input label="Account Number" value={newBank.accountNumber} onChange={v=>setNewBank({...newBank, accountNumber:v})} placeholder="XXXXXXXXXX" />
              <Input label="IFSC Code" value={newBank.ifsc} onChange={v=>setNewBank({...newBank, ifsc:v})} placeholder="HDFC000123" />
              <Input label="Initial Balance (₹)" value={newBank.balance} onChange={v=>setNewBank({...newBank, balance:v})} placeholder="₹" type="number" />
              <Input label="Branch" value={newBank.branch} onChange={v=>setNewBank({...newBank, branch:v})} placeholder="Main Office" />
              <button onClick={handleAddBank} className="col-span-2 py-4 bg-[#0B2D5C] text-white rounded-[1.8rem] font-black text-[12px] uppercase mt-4 shadow-xl active:scale-95 transition-all">Add Account</button>
           </div>
        </Modal>
      )}



      {showPayAllowanceModal && (
        <Modal title="Process Allowance Payment" onClose={() => setShowPayAllowanceModal(false)}>
          <div className="space-y-4">
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