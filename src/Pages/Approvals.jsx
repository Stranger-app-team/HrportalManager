import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
   FiCheck,
   FiX,
   FiClock,
   FiCalendar,
   FiSearch,
   FiFilter,
   FiInfo,
   FiChevronRight,
   FiAlertCircle,
   FiCheckCircle,
   FiChevronDown,
   FiActivity
} from 'react-icons/fi';
import {
   Building,
   CalendarDays,
   CheckCircle2,
   Clock,
   XCircle,
   FileText,
   Users,
   BarChart3
} from "lucide-react";
import { API_BASE_URL } from '../config/api';
import { getFullUrl } from '../utils/urlHelper';

export default function LeaveApproval() {
   const [leaves, setLeaves] = useState([]);
   const [companies, setCompanies] = useState([]);
   const [loading, setLoading] = useState(true);
   const [actionLoading, setActionLoading] = useState(null);

   const [filters, setFilters] = useState({
      companyId: localStorage.getItem("selectedCompanyId") || "",
      status: "",
      search: "",
      startDate: "",
      endDate: ""
   });

   const [stats, setStats] = useState({
      pending: 0,
      approved: 0,
      rejected: 0,
      ratio: 0
   });

   const filteredLeaves = leaves.filter(l => {
      const matchesSearch = l.name?.toLowerCase().includes(filters.search.toLowerCase());
      
      const leaveStart = new Date(l.startDate).setHours(0, 0, 0, 0);
      const leaveEnd = new Date(l.endDate).setHours(23, 59, 59, 999);
      
      const filterStart = filters.startDate ? new Date(filters.startDate).setHours(0, 0, 0, 0) : null;
      const filterEnd = filters.endDate ? new Date(filters.endDate).setHours(23, 59, 59, 999) : null;
      
      const matchesStart = !filterStart || leaveEnd >= filterStart;
      const matchesEnd = !filterEnd || leaveStart <= filterEnd;
      
      return matchesSearch && matchesStart && matchesEnd;
   });

   useEffect(() => {
      fetchInitial();
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
         // We removed the auto-selection of the first company so "All Companies" ("") remains the default
      } catch (err) { console.error(err); }
   };

   const fetchLeaves = useCallback(async () => {
      if (filters.companyId === null || filters.companyId === undefined) return;
      setLoading(true);
      try {
         const token = localStorage.getItem("token");
         const res = await fetch(`${API_BASE_URL}/leave/all?status=${filters.status}`, {
            headers: { Authorization: `Bearer ${token}` }
         });
         const result = await res.json();
         console.log(result)
         if (result.success) {
            const data = result.data || [];
            const companyFiltered = data.filter(l => {
               const leaveCompanyId = l.companyId?._id ? String(l.companyId._id) : String(l.companyId);
               return (!filters.companyId || filters.companyId === 'all' || leaveCompanyId === String(filters.companyId)) &&
                  l.status?.toLowerCase() !== 'cancelled';
            });

            // Sort: Pending -> Approved -> Rejected, and then by most recent first
            const sorted = [...companyFiltered].sort((a, b) => {
               const statusOrder = { pending: 1, approved: 2, rejected: 3 };
               const aOrder = statusOrder[a.status?.toLowerCase()] || 4;
               const bOrder = statusOrder[b.status?.toLowerCase()] || 4;

               if (aOrder !== bOrder) return aOrder - bOrder;

               // Within same status, show most recent first
               return new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate);
            });

            setLeaves(sorted);

            const s = companyFiltered.reduce((acc, curr) => {
               acc[curr.status] = (acc[curr.status] || 0) + 1;
               return acc;
            }, { pending: 0, approved: 0, rejected: 0 });

            const total = companyFiltered.length;
            s.ratio = total > 0 ? Math.round((s.approved / total) * 100) : 0;
            setStats(s);
         }
      } catch (err) { console.error(err); }
      setLoading(false);
   }, [filters.companyId, filters.status]);

   useEffect(() => {
      fetchLeaves();
   }, [fetchLeaves]);

   const handleStatusUpdate = async (leaveId, status) => {
      setActionLoading(leaveId);
      try {
         const token = localStorage.getItem("token");
         const res = await fetch(`${API_BASE_URL}/leave/update/${leaveId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status })
         });
         if (res.ok) fetchLeaves();
         else {
            const data = await res.json();
            alert(data.message || "Update failed");
         }
      } catch (err) { console.error(err); }
      setActionLoading(null);
   };

   return (
      <div className="w-full h-full flex flex-col p-2 sm:p-3 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">

         {/* ── STATS ROW ── */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
               { label: "Waiting Approval", value: stats.pending, icon: Clock, color: "blue", sub: "TO CHECK" },
               { label: "Leaves Approved", value: stats.approved, icon: CheckCircle2, color: "emerald", sub: "ACCEPTED" },
               { label: "Leaves Rejected", value: stats.rejected, icon: XCircle, color: "rose", sub: "DECLINED" },
               { label: "Success Rate", value: `${stats.ratio}%`, icon: BarChart3, color: "indigo", sub: "PERCENT" }
            ].map((s, idx) => (
               <div key={idx} className="bg-white border border-slate-200 shadow-sm rounded-md p-3.5 flex items-center gap-3 transition-standard hover:shadow-md">
                  <div className={`w-10 h-10 rounded bg-${s.color}-50 text-${s.color}-500 flex items-center justify-center`}>
                     <s.icon size={18} />
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{s.label}</p>
                     <div className="flex items-baseline gap-1 mt-0.5">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{s.value}</h2>
                        <span className="text-[8px] text-slate-300 font-bold uppercase">{s.sub}</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {/* ── LEDGER ── */}
         <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-md shadow-sm relative overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/20">
               <div className="flex items-center gap-2">
                  <h3 className="text-[12px] font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                     Leave Records
                  </h3>
                  <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     {filteredLeaves.length}
                  </div>
               </div>

               <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                  <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded h-8 items-center">
                     <CustomSelector
                        icon={<Building size={11} />}
                        value={filters.companyId}
                        options={[{ id: "", name: "All Companies" }, ...companies.map(c => ({ id: c._id, name: c.companyName }))]}
                        onChange={(id) => setFilters({ ...filters, companyId: id })}
                        minWidth="110px"
                     />
                     <div className="w-px h-3 bg-slate-200 self-center mx-1" />
                     <CustomSelector
                        icon={<FiFilter size={11} />}
                        value={filters.status}
                        options={[
                           { id: "", name: "All" },
                           { id: "pending", name: "Pending" },
                           { id: "approved", name: "Approved" },
                           { id: "rejected", name: "Rejected" }
                        ]}
                        onChange={(s) => setFilters({ ...filters, status: s })}
                        minWidth="80px"
                     />
                  </div>

                  <div className="flex items-center bg-slate-50 border border-slate-200 p-0.5 rounded h-8">
                     <div className="flex items-center px-1.5 gap-1 text-slate-400">
                        <FiCalendar size={11} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">From:</span>
                     </div>
                     <input 
                       type="date" 
                       className="bg-transparent text-[10px] font-bold text-slate-600 outline-none cursor-pointer pr-1 h-7 py-0"
                       value={filters.startDate}
                       onChange={e => setFilters({...filters, startDate: e.target.value})}
                     />
                     <div className="w-px h-3 bg-slate-200 self-center mx-1" />
                     <div className="flex items-center px-1.5 gap-1 text-slate-400">
                        <FiCalendar size={11} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">To:</span>
                     </div>
                     <input 
                       type="date" 
                       className="bg-transparent text-[10px] font-bold text-slate-600 outline-none cursor-pointer pr-1 h-7 py-0"
                       value={filters.endDate}
                       onChange={e => setFilters({...filters, endDate: e.target.value})}
                     />
                     {(filters.startDate || filters.endDate) && (
                        <>
                           <div className="w-px h-3 bg-slate-200 self-center mx-1" />
                           <button 
                              onClick={() => setFilters({...filters, startDate: "", endDate: ""})}
                              className="p-1 hover:text-rose-500 text-slate-400 transition-colors"
                              title="Clear date filter"
                           >
                              <FiX size={10} />
                           </button>
                        </>
                     )}
                  </div>

                  <div className="relative group max-w-xs flex-1">
                     <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={13} />
                     <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 h-8 bg-slate-50 border border-slate-200 rounded text-[11px] outline-none font-bold focus:bg-white focus:border-blue-500/20 transition-all text-slate-600"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                     />
                  </div>
               </div>
            </div>
            <div className="flex-1 overflow-x-auto no-scrollbar min-h-0">
               <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-bold">
                     {filteredLeaves.map((leave) => (
                        <tr key={leave._id} className="hover:bg-slate-50 transition-standard group">
                           <td className="px-6 py-2.5">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[11px] overflow-hidden shrink-0">
                                    {leave.employee?.profilePhoto ? (
                                      <img src={getFullUrl(leave.employee.profilePhoto, API_BASE_URL)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      leave.name?.charAt(0)
                                    )}
                                 </div>
                                 <div>
                                    <p className="text-[12px] font-bold text-slate-700 tracking-tight">{leave.name}</p>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">ID: {leave.employeeId?.slice(-6)}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-2.5">
                              <p className="text-[10px] font-bold text-slate-600">
                                 {new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                 <FiChevronRight className="inline mx-1 text-slate-300" size={10} />
                                 {new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </p>
                              <p className="text-[8px] text-blue-500 font-black uppercase tracking-widest mt-0.5">
                                 {leave.totalDays} Total Days
                              </p>
                           </td>
                           <td className="px-6 py-2.5 max-w-xs">
                              <p className="text-[11px] text-slate-500 font-medium italic line-clamp-1 group-hover:line-clamp-none transition-all cursor-default">
                                 {leave.leaveReason}
                              </p>
                           </td>
                           <td className="px-6 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${leave.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    leave.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                       'bg-blue-50 text-blue-600 border-blue-100'
                                 }`}>
                                 {leave.status}
                              </span>
                           </td>
                           <td className="px-6 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 {leave.status === 'pending' ? (
                                    <>
                                       <button
                                          onClick={() => handleStatusUpdate(leave._id, 'approved')}
                                          className="p-1.5 bg-emerald-50 text-emerald-500 rounded hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                                       >
                                          <FiCheck size={14} />
                                       </button>
                                       <button
                                          onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                                          className="p-1.5 bg-rose-50 text-rose-500 rounded hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                                       >
                                          <FiX size={14} />
                                       </button>
                                    </>
                                 ) : (
                                    <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
                                       {new Date(leave.approvalDate || leave.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </div>
                                 )}
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Approved</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-rose-500" /> Rejected</div>
                  <div className="flex items-center gap-1.5 text-blue-500"><FiActivity size={12} /> Live Syncing</div>
               </div>
            </div>
         </div>


      </div>
   );
}


function CustomSelector({ icon, value, options, onChange, minWidth = "auto" }) {
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
            className={`w-full flex items-center justify-between gap-3 px-3.5 h-7 rounded transition-all duration-300 hover:bg-slate-50`}
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
            <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-slate-100 rounded-md shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200">
               <div className="max-h-60 overflow-y-auto custom-scrollbar-thin">
                  {options.map(opt => (
                     <button
                        key={opt.id}
                        onClick={() => { onChange(opt.id); setIsOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between
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