import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiMoreVertical, FiEdit, FiTrash2, FiSearch, FiMonitor, FiMapPin, FiMail, FiPlusSquare, FiX } from 'react-icons/fi';
import Modal from '../components/Shared/Modal';
import ConfirmModal from '../components/Shared/ConfirmModal';
import { getFullUrl } from '../utils/urlHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    email: '',
    ownerName: '',
    website: '',
    address: '',
    status: 'active',
    panId: '',
    gstId: ''
  });
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ departmentName: '' });
  const [actionLoading, setActionLoading] = useState(false);

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
      if (data.company) {
        setCompanies(data.company);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (company) => {
    setSelectedCompany(company);
    setEditFormData({
      companyName: company.companyName || '',
      email: company.email || '',
      ownerName: company.ownerName || '',
      website: company.website || '',
      address: company.address || '',
      status: company.status || 'active',
      panId: company.panId || '',
      gstId: company.gstId || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (company) => {
    setSelectedCompany(company);
    setShowDeleteModal(true);
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/company/${selectedCompany._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchCompanies();
      } else {
        const data = await res.json();
        alert(data.message || 'Error updating company');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCompany = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/company/${selectedCompany._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDeleteModal(false);
        fetchCompanies();
      } else {
        const data = await res.json();
        alert(data.message || 'Error deleting company');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDeptClick = (company) => {
    setSelectedCompany(company);
    setDeptForm({ departmentName: '' });
    setShowAddDeptModal(true);
  };

  const submitAddDept = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/department`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          departmentName: deptForm.departmentName,
          companyId: selectedCompany._id
        })
      });
      if (res.ok) {
        setShowAddDeptModal(false);
        alert('Department added successfully! ✅');
      } else {
        const data = await res.json();
        alert(data.message || 'Error adding department');
      }
    } catch (err) {
      console.error('Add department error:', err);
      alert('Failed to add department');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 overflow-hidden">

      <div className="bg-white border border-slate-200 rounded-md p-2 mb-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input 
            type="text" 
            placeholder="Search organizations..."
            className="w-full bg-slate-50 border border-transparent py-1.5 pl-9 pr-3 rounded text-[11px] font-bold outline-none focus:bg-white focus:border-blue-500/20 transition-all text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          onClick={() => navigate('/dashboard/add-company')}
          className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded shadow-sm hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest flex items-center gap-2"
        >
          <FiPlus size={14} /> REGISTER NEW
        </button>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm border-b border-slate-200">
              <tr className="text-slate-500">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Admin & Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Communication</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="4" className="px-6 py-4"><div className="h-10 bg-gray-100 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-sm">No companies found</td>
                </tr>
              ) : (
                filteredCompanies.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group/item"
                        onClick={() => navigate(`/dashboard/companies/${c._id}`)}
                      >
                        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[12px] group-hover/item:bg-blue-600 group-hover/item:text-white transition-standard overflow-hidden shrink-0">
                          {c.logo ? (
                            <img src={getFullUrl(c.logo, API_BASE_URL)} alt="" className="w-full h-full object-contain" />
                          ) : (
                            c.companyName[0]
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-[13px] tracking-tight group-hover/item:text-blue-600">{c.companyName}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                            <FiMapPin size={10} /> {c.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-[12px] font-bold text-slate-600">{c.ownerName || 'N/A'}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold mt-1 uppercase tracking-wider border ${
                        c.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                          <FiMail size={10} className="text-slate-300" /> {c.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                          <FiMonitor size={10} className="text-slate-300" /> {c.website || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleAddDeptClick(c)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-standard"
                          title="Add Department"
                        >
                          <FiPlusSquare size={14} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(c)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-standard"
                          title="Edit Company"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(c)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-standard"
                          title="Delete Company"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Company Modal */}
      {showEditModal && (
        <Modal title="Edit Organization" onClose={() => setShowEditModal(false)} maxWidth="max-w-3xl">
          <form onSubmit={handleUpdateCompany} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Company Name</label>
                <input 
                  className="w-full bg-slate-50 p-2.5 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-slate-700"
                  value={editFormData.companyName}
                  onChange={e => setEditFormData({...editFormData, companyName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Official Email</label>
                <input 
                  className="w-full bg-slate-50 p-2.5 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-slate-700"
                  type="email"
                  value={editFormData.email}
                  onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Owner Name</label>
                <input 
                  className="w-full bg-slate-50 p-2.5 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-slate-700"
                  value={editFormData.ownerName}
                  onChange={e => setEditFormData({...editFormData, ownerName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Website</label>
                <input 
                  className="w-full bg-slate-50 p-2.5 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-slate-700"
                  value={editFormData.website}
                  onChange={e => setEditFormData({...editFormData, website: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">PAN ID</label>
                <input 
                  className="w-full bg-slate-50 p-2.5 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-slate-700"
                  value={editFormData.panId}
                  onChange={e => setEditFormData({...editFormData, panId: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">GST ID</label>
                <input 
                  className="w-full bg-slate-50 p-2.5 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-slate-700"
                  value={editFormData.gstId}
                  onChange={e => setEditFormData({...editFormData, gstId: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
                <select 
                  className="w-full bg-slate-50 p-2.5 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-slate-700"
                  value={editFormData.status}
                  onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Address</label>
              <textarea 
                className="w-full bg-slate-50 p-3 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-slate-700 min-h-[80px] resize-none"
                value={editFormData.address}
                onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-md font-black text-[11px] uppercase hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-md font-black text-[11px] uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <Modal title="Add Department" onClose={() => setShowAddDeptModal(false)}>
          <form onSubmit={submitAddDept} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Organization</label>
              <input 
                className="w-full bg-slate-100 p-2.5 rounded-md outline-none font-bold text-[12px] text-slate-500 cursor-not-allowed border border-transparent"
                value={selectedCompany?.companyName}
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Department Name</label>
              <input 
                className="w-full bg-slate-50 p-2.5 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-slate-700"
                value={deptForm.departmentName}
                onChange={e => setDeptForm({ departmentName: e.target.value })}
                placeholder="e.g. Sales, Marketing, Engineering..."
                required
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-md font-black text-[11px] uppercase hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-md font-black text-[11px] uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Create Department'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Company Confirmation Modal */}
      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCompany}
        loading={actionLoading}
        title="Delete Organization"
        message={`Are you sure you want to delete ${selectedCompany?.companyName}? This will permanently remove the organization and all associated data.`}
      />
    </div>
  );
}
