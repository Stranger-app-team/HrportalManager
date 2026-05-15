import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiSave, FiX } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Reusable Field Component
const F = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{label}{required && <span className="text-rose-500 ml-1">*</span>}</label>
    {children}
  </div>
);

const inputCls = "w-full h-10 bg-white border border-gray-200 rounded-xl px-4 text-sm text-gray-700 outline-none focus:border-[#0B2D5C] focus:ring-4 focus:ring-[#0B2D5C]/5 transition-all placeholder:text-gray-300";

export default function AddCompany() {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    ownerName: '',
    website: '',
    address: '',
    status: 'active',
    panId: '',
    gstId: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/company/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Company added successfully! ✅');
        navigate('/dashboard/companies');
      } else {
        alert(data.message || 'Error adding company ❌');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-[Plus Jakarta Sans]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-3 p-4 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
            <FiX size={16} className="text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-200 self-center mx-1" />
          <button 
             onClick={handleSubmit}
             disabled={loading}
             className="flex items-center justify-center gap-2 bg-[#0B2D5C] text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a3a6c] transition-all shadow-md disabled:opacity-50"
          >
            <FiSave size={16} /> <span>{loading ? "Processing..." : "Save Org"}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <form id="add-company-form" onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-[#0B2D5C] rounded-full" />
              <h2 className="text-sm font-bold text-[#0B2D5C] uppercase tracking-wider">General Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <F label="Company Name" required>
                <input 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleInputChange} 
                  className={inputCls} 
                  placeholder="e.g. Acme Corp" 
                  required 
                />
              </F>
              <F label="Official Email" required>
                <input 
                  name="email" 
                  type="email"
                  value={formData.email} 
                  onChange={handleInputChange} 
                  className={inputCls} 
                  placeholder="contact@company.com" 
                  required 
                />
              </F>
              <F label="Owner Name" required>
                <input 
                  name="ownerName" 
                  value={formData.ownerName} 
                  onChange={handleInputChange} 
                  className={inputCls} 
                  placeholder="CEO / Director Name" 
                  required 
                />
              </F>
              <F label="Website">
                <input 
                  name="website" 
                  value={formData.website} 
                  onChange={handleInputChange} 
                  className={inputCls} 
                  placeholder="https://company.com" 
                />
              </F>
            </div>
          </div>

          {/* Legal & Compliance */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-[#0B2D5C] rounded-full" />
              <h2 className="text-sm font-bold text-[#0B2D5C] uppercase tracking-wider">Legal & Compliance</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <F label="PAN ID" required>
                <input 
                  name="panId" 
                  value={formData.panId} 
                  onChange={handleInputChange} 
                  className={inputCls} 
                  placeholder="10-digit PAN number"
                  required 
                />
              </F>
              <F label="GST ID" required>
                <input 
                  name="gstId" 
                  value={formData.gstId} 
                  onChange={handleInputChange} 
                  className={inputCls} 
                  placeholder="15-digit GSTIN"
                  required 
                />
              </F>
              <F label="Status" required>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange} 
                  className="w-full h-10 bg-white border border-gray-200 rounded-xl px-4 text-sm text-gray-700 outline-none focus:border-[#0B2D5C] focus:ring-4 focus:ring-[#0B2D5C]/5"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </F>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-[#0B2D5C] rounded-full" />
              <h2 className="text-sm font-bold text-[#0B2D5C] uppercase tracking-wider">Address Details</h2>
            </div>
            <F label="Permanent Address" required>
              <textarea 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange} 
                className="w-full h-24 bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 outline-none focus:border-[#0B2D5C] focus:ring-4 focus:ring-[#0B2D5C]/5 resize-none transition-all placeholder:text-gray-300" 
                placeholder="Full street address, city, state, pincode"
                required 
              />
            </F>
          </div>
        </form>
      </div>
    </div>
  );
}
