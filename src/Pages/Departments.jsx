import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiLayers, FiSearch, FiTruck, FiBriefcase } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/department/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.department) setDepartments(data.department);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = departments.filter(d => 
    d.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.companyId?.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 bg-[#F8FAFC] min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/dashboard/add-department')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
        >
          <FiPlus size={14} /> Add New
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text" 
              placeholder="Filter departments..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] outline-none font-bold focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {loading ? (
             Array(8).fill(0).map((_, i) => <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-xl" />)
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest">No departments found</div>
          ) : (
            filtered.map((d) => (
              <div key={d._id} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-standard group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-standard">
                    <FiLayers size={16} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-[13px] tracking-tight truncate">{d.departmentName}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                   <FiBriefcase size={10} /> {d.companyId?.companyName || 'Corporate'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
