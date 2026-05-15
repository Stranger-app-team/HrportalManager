import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiLayers } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const F = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{label}{required && <span className="text-rose-500 ml-1">*</span>}</label>
    {children}
  </div>
);

const inputCls = "w-full h-10 bg-white border border-gray-200 rounded-xl px-4 text-sm text-gray-700 outline-none focus:border-[#0B2D5C] focus:ring-4 focus:ring-[#0B2D5C]/5 transition-all placeholder:text-gray-300";

export default function AddDepartment() {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedCompanyId = new URLSearchParams(location.search).get('companyId');

  const [formData, setFormData] = useState({
    departmentName: '',
    companyId: preSelectedCompanyId || ''
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/company`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.company) setCompanies(data.company);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/department`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Department added successfully! ✅');
        navigate('/dashboard/departments');
      } else {
        const data = await res.json();
        alert(data.message || 'Error adding department ❌');
      }
    } catch (err) { alert('Failed to connect to server'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-[Plus Jakarta Sans]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-3 p-4 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
            <FiArrowLeft size={16} className="text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-200 self-center mx-1" />
          <button 
            form="add-dept-form"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-[#0B2D5C] text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a3a6c] transition-all shadow-md disabled:opacity-50"
          >
            <FiSave size={14} /> <span>{loading ? 'Saving...' : 'Save Department'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <form id="add-dept-form" onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#0B2D5C]/5 flex items-center justify-center text-[#0B2D5C]">
              <FiLayers size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B2D5C]">Department Details</h2>
              <p className="text-xs text-gray-400">Create a new functional unit</p>
            </div>
          </div>

          <F label="Organization / Company" required>
            <select 
              value={formData.companyId}
              onChange={(e) => setFormData({...formData, companyId: e.target.value})}
              className="w-full h-11 bg-gray-50 border-none rounded-xl px-4 text-sm text-gray-700 outline-none focus:ring-4 focus:ring-[#0B2D5C]/5"
              required
            >
              <option value="">Select Company</option>
              {companies.map(c => (
                <option key={c._id} value={c._id}>{c.companyName}</option>
              ))}
            </select>
          </F>

          <F label="Department Name" required>
            <input 
              value={formData.departmentName}
              onChange={(e) => setFormData({...formData, departmentName: e.target.value})}
              placeholder="e.g. Human Resources, Engineering"
              className={inputCls}
              required
            />
          </F>
        </form>
      </div>
    </div>
  );
}
