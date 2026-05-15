import React, { useState } from 'react';
import Modal from './Modal';
import { FiSave, FiLayers } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const F = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{label}{required && <span className="text-rose-500 ml-1">*</span>}</label>
    {children}
  </div>
);

const inputCls = "w-full h-10 bg-white border border-gray-200 rounded-xl px-4 text-sm text-gray-700 outline-none focus:border-[#0B2D5C] focus:ring-4 focus:ring-[#0B2D5C]/5 transition-all placeholder:text-gray-300";

export default function CreateDepartmentModal({ isOpen, onClose, companyId, onSuccess }) {
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!departmentName.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/department`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          departmentName,
          companyId
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        // The API returns { department: { ... } } or similar. Adjust based on AddDepartment.jsx observation.
        // In AddDepartment.jsx, it doesn't return anything specific, just res.ok.
        // Let's assume it returns the created department.
        setDepartmentName('');
        onSuccess && onSuccess(data.department || data);
        onClose();
      } else {
        const data = await res.json();
        alert(data.message || 'Error adding department ❌');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create New Department" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0B2D5C]/5 flex items-center justify-center text-[#0B2D5C]">
            <FiLayers size={24} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0B2D5C]">Department Details</h2>
            <p className="text-[10px] text-gray-400">Create a new functional unit for the selected company</p>
          </div>
        </div>

        <F label="Department Name" required>
          <input 
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            placeholder="e.g. Human Resources, Engineering"
            className={inputCls}
            required
            autoFocus
          />
        </F>

        <div className="flex justify-end pt-2">
          <button 
            type="submit"
            disabled={loading || !departmentName.trim()}
            className="flex items-center justify-center gap-2 bg-[#0B2D5C] text-white px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a3a6c] transition-all shadow-md disabled:opacity-50"
          >
            <FiSave size={14} /> <span>{loading ? 'Saving...' : 'Save Department'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
