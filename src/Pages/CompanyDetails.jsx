import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPlus,
  FiUsers,
  FiLayers,
  FiChevronRight,
  FiChevronDown,
  FiMail,
  FiMonitor,
  FiServer,
  FiUserPlus,
  FiShield,
  FiLock,
  FiActivity,
  FiEdit,
  FiTrash2,
  FiX,
  FiTarget,
  FiFileText,
  FiGrid
} from 'react-icons/fi';
import Modal from '../components/Shared/Modal';
import ConfirmModal from '../components/Shared/ConfirmModal';
import CustomSelector from '../components/Shared/CustomSelector';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CompanyDetails() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [managers, setManagers] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDept, setExpandedDept] = useState(null);

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showHRModal, setShowHRModal] = useState(false);
  const [showEditHRModal, setShowEditHRModal] = useState(false);
  const [showEditManagerModal, setShowEditManagerModal] = useState(false);
  const [showDeleteHRModal, setShowDeleteHRModal] = useState(false);
  const [showDeleteManagerModal, setShowDeleteManagerModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [showDeleteDeptModal, setShowDeleteDeptModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedHR, setSelectedHR] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [assetForm, setAssetForm] = useState({
    assetName: '',
    assetType: 'Laptop',
    assetId: '',
    serialNumber: '',
    count: 1,
    condition: 'new',
    purchaseDate: '',
    warrantyExpiry: '',
    notes: '',
    specifications: {
      processor: '',
      ram: '',
      storage: '',
      model: ''
    }
  });
  const [managerForm, setManagerForm] = useState({
    userId: '',
    name: '',
    email: '',
    password: '',
    departmentId: '',
    managedCompanies: [companyId],
    permissions: ['view_own_profile', 'view_team_members', 'view_projects']
  });
  const [hrForm, setHrForm] = useState({
    userId: '',
    name: '',
    email: '',
    password: '',
    hrCode: '',
    specialization: 'generalist',
    managedCompanies: [companyId],
    permissions: ['view_reports']
  });
  const [deptForm, setDeptForm] = useState({ departmentName: '' });
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    email: '',
    ownerName: '',
    website: '',
    address: '',
    status: 'active',
    panId: '',
    gstId: ''
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.userType?.toLowerCase();

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [compRes, deptRes, empRes, assetRes, companyUsersRes, managerRes, hrRes, allEmpRes] = await Promise.all([
        fetch(`${API_BASE_URL}/company/${companyId}`, { headers }),
        fetch(`${API_BASE_URL}/department/company?companyId=${companyId}`, { headers }),
        fetch(`${API_BASE_URL}/employee?companyId=${companyId}`, { headers }),
        fetch(`${API_BASE_URL}/assets?companyId=${companyId}`, { headers }),
        fetch(`${API_BASE_URL}/company/company-users/${companyId}`, { headers }),
        fetch(`${API_BASE_URL}/manager/all`, { headers }),
        fetch(`${API_BASE_URL}/hr/all`, { headers }),
        fetch(`${API_BASE_URL}/employee`, { headers })
      ]);

      const compData = await compRes.json();
      const deptData = await deptRes.json();
      const empData = await empRes.json();
      const assetData = assetRes.status === 200 ? await assetRes.json() : [];
      const companyUsersData = await companyUsersRes.json();
      const managerData = managerRes.status === 200 ? await managerRes.json() : { data: [] };
      const hrData = hrRes.status === 200 ? await hrRes.json() : { data: [] };
      const allEmpData = await allEmpRes.json();

      setCompany(compData.company);
      localStorage.setItem("selectedCompany", JSON.stringify(compData.company));
      window.dispatchEvent(new Event("companyChanged"));
      setDepartments(deptData.department || []);
      setEmployees(empData || []);
      setAssets(Array.isArray(assetData) ? assetData : []);
      setAllEmployees(allEmpData || []);

      // Filter managers from company users and enrich with profile data if available
      if (companyUsersData.users) {
        const managersFromUsers = companyUsersData.users.filter(u => u.userType === 'manager');
        const enrichedManagers = managersFromUsers.map(u => {
          // Use .toString() on both sides — Mongoose ObjectIds are objects, not strings
          const profile = managerData.data?.find(
            m => (m.user?._id || m.user)?.toString() === u._id?.toString()
          );
          if (profile) {
            // Has a full Manager profile: store its _id separately so delete always uses the right ID
            return { ...u, ...profile, userId: u._id, managerProfileId: profile._id };
          }
          // No Manager profile — user was assigned 'manager' role via Add Employee
          return { ...u, userId: u._id, managerProfileId: null };
        });
        console.log("Leadership data (Managers) enriched:", enrichedManagers);
        setManagers(enrichedManagers);
      }

      // Filter HRs from company users and enrich with profile data if available
      if (companyUsersData.users) {
        const hrsFromUsers = companyUsersData.users.filter(u => u.userType === 'hr');
        const enrichedHrs = hrsFromUsers.map(u => {
          const profile = hrData.data?.find(
            h => (h.userId?._id || h.userId)?.toString() === u._id?.toString()
          );
          if (profile) {
            // Has a full HR profile: store its _id separately so delete knows which endpoint to hit
            return { ...u, ...profile, userId: u, hrProfileId: profile._id };
          }
          // No HR profile — user was assigned 'hr' role via Add Employee
          // hrProfileId is null so delete handler can show the right message
          return { ...u, userId: u, hrProfileId: null };
        });
        console.log("HR data enriched:", enrichedHrs);
        setHrs(enrichedHrs);
      }

    } catch (err) {
      console.error('Error fetching company details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = () => {
    setCompanyForm({
      companyName: company.companyName || '',
      email: company.email || '',
      ownerName: company.ownerName || '',
      website: company.website || '',
      address: company.address || '',
      status: company.status || 'active',
      panId: company.panId || '',
      gstId: company.gstId || ''
    });
    setShowEditCompanyModal(true);
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/company/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(companyForm)
      });
      if (res.ok) {
        setShowEditCompanyModal(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleEditDept = (dept) => {
    setSelectedDept(dept);
    setDeptForm({ departmentName: dept.departmentName });
    setShowEditDeptModal(true);
  };

  const handleAddDept = () => {
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
          companyId: companyId
        })
      });
      if (res.ok) {
        setShowAddDeptModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Error adding department');
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleDeleteDeptClick = (dept) => {
    setSelectedDept(dept);
    setShowDeleteDeptModal(true);
  };

  const handleUpdateDept = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/department/${selectedDept._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(deptForm)
      });
      if (res.ok) {
        setShowEditDeptModal(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleDeleteDept = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/department/${selectedDept._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDeleteDeptModal(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const submitAsset = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      // Clean up empty specifications
      const specs = {};
      Object.entries(assetForm.specifications).forEach(([k, v]) => {
        if (v) specs[k] = v;
      });

      const payload = {
        ...assetForm,
        companyId,
        specifications: specs
      };

      const res = await fetch(`${API_BASE_URL}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAssetModal(false);
        setAssetForm({
          assetName: '',
          assetType: 'Laptop',
          assetId: '',
          serialNumber: '',
          count: 1,
          condition: 'new',
          purchaseDate: '',
          warrantyExpiry: '',
          notes: '',
          specifications: { processor: '', ram: '', storage: '', model: '' }
        });
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const registerManager = async (e) => {
    e.preventDefault();
    if (!managerForm.userId && !managerForm.name) {
      alert("Please select a user or enter details");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      let finalUserId = managerForm.userId;

      // If no userId but name/email provided, register new user
      if (!finalUserId) {
        const userRes = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: managerForm.name,
            email: managerForm.email,
            password: managerForm.password,
            userType: 'manager',
            enterpriseId: company.enterpriseId,
            companyId: companyId,
            status: 'active'
          })
        });

        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.message || "User registration failed");
        finalUserId = userData.user._id;
      }

      // Create Manager Profile
      const managerProfileRes = await fetch(`${API_BASE_URL}/manager`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user: finalUserId,
          department: managerForm.departmentId || null,
          managedCompanies: [companyId],
          permissions: managerForm.permissions
        })
      });

      if (managerProfileRes.ok) {
        alert("Manager Assigned Successfully!");
        setShowManagerModal(false);
        setManagerForm({ userId: '', name: '', email: '', password: '', departmentId: '', managedCompanies: [companyId], permissions: ['view_own_profile', 'view_team_members', 'view_projects'] });
        fetchData();
      } else {
        const err = await managerProfileRes.json();
        throw new Error(err.message || "Manager profile creation failed");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const registerHR = async (e) => {
    e.preventDefault();
    if (!hrForm.userId && !hrForm.name) {
      alert("Please select a user or enter details");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let finalUserId = hrForm.userId;

      if (!finalUserId) {
        const userRes = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: hrForm.name,
            email: hrForm.email,
            password: hrForm.password,
            userType: 'hr',
            enterpriseId: company.enterpriseId,
            companyId: companyId,
            status: 'active'
          })
        });

        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.message || "User registration failed");
        finalUserId = userData.user._id;
      }

      const hrProfileRes = await fetch(`${API_BASE_URL}/hr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: finalUserId,
          hrCode: hrForm.hrCode,
          specialization: hrForm.specialization,
          managedCompanies: [companyId],
          permissions: hrForm.permissions
        })
      });

      if (hrProfileRes.ok) {
        alert("HR Assigned Successfully!");
        setShowHRModal(false);
        setHrForm({ userId: '', name: '', email: '', password: '', hrCode: '', specialization: 'generalist', managedCompanies: [companyId], permissions: ['view_reports'] });
        fetchData();
      } else {
        const err = await hrProfileRes.json();
        throw new Error(err.message || "HR profile creation failed");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditHR = (hr) => {
    setSelectedHR(hr);
    setHrForm({
      userId: hr.userId?._id,
      name: hr.userId?.name,
      email: hr.userId?.email,
      hrCode: hr.hrCode || '',
      specialization: hr.specialization || 'generalist',
      permissions: hr.permissions || ['view_reports']
    });
    setShowEditHRModal(true);
  };

  const handleUpdateHR = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/hr/${selectedHR._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(hrForm)
      });
      if (res.ok) {
        setShowEditHRModal(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleDeleteHR = async () => {
    setActionLoading(true);
    try {
      // hrProfileId is set only when the HR has a dedicated HR profile document.
      // If null, they were added as an employee with userType='hr' — no HR profile exists to delete.
      if (!selectedHR.hrProfileId) {
        setShowDeleteHRModal(false);
        alert(`${selectedHR.userId?.name || 'This person'} does not have a separate HR profile. To remove their HR role, go to Edit Employee and change their System Role.`);
        return;
      }
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/hr/${selectedHR.hrProfileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDeleteHRModal(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete HR profile');
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleEditManager = (mgr) => {
    console.log("Editing Manager:", mgr);
    setSelectedManager(mgr);
    setManagerForm({
      userId: mgr._id || mgr.user?._id,
      name: mgr.name || mgr.user?.name || '',
      email: mgr.email || mgr.user?.email || '',
      departmentId: mgr.department?._id || mgr.department || '',
      permissions: mgr.permissions || ['view_own_profile', 'view_team_members', 'view_projects']
    });
    setShowEditManagerModal(true);
  };

  const handleUpdateManager = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Only send Manager model fields: 'department' (not 'departmentId') and permissions
      // Name/email live on User model — a separate update would be needed for those
      const payload = {
        department: managerForm.departmentId || null,
        permissions: managerForm.permissions
      };
      const res = await fetch(`${API_BASE_URL}/manager/${selectedManager._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowEditManagerModal(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update manager');
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleDeleteManager = async () => {
    setActionLoading(true);
    try {
      // managerProfileId is set only when the manager has a dedicated Manager profile document.
      // If null, they were added as an employee with userType='manager' — no Manager profile to delete.
      if (!selectedManager.managerProfileId) {
        setShowDeleteManagerModal(false);
        alert(`${selectedManager.name || selectedManager.user?.name || 'This person'} does not have a separate Manager profile. To remove their Manager role, go to Edit Employee and change their System Role.`);
        return;
      }
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/manager/${selectedManager.managerProfileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDeleteManagerModal(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete manager profile');
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-slate-400 font-medium p-10">Loading organization...</div>;
  if (!company) return <div className="h-full flex items-center justify-center text-rose-500 font-medium p-10">Organization not found.</div>;

  return (
    <div className="h-full flex flex-col p-5 bg-[#F8FAFC] overflow-hidden">
      {/* Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 shadow-sm mr-1" title="Go Back">
              <FiArrowLeft size={16} />
            </button>
            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-md ${company.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
              {company.status}
            </span>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                <FiTarget size={12} /> {company.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {company.email && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <FiMail size={12} /> {company.email}
              </span>
            )}
            {company.panId && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <FiFileText size={12} /> PAN: {company.panId}
              </span>
            )}
            {company.gstId && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <FiFileText size={12} /> GST: {company.gstId}
              </span>
            )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleEditCompany}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
            title="Edit Company Details"
          >
            <FiEdit size={16} />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button
            onClick={handleAddDept}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
          >
            <FiPlus size={14} className="text-emerald-500" /> Department
          </button>
          {userRole !== "manager" && (
            <button
              onClick={() => navigate(`/dashboard/add-employee?companyId=${companyId}`)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all shadow-sm"
            >
              <FiUserPlus size={14} className="text-blue-500" /> Employee
            </button>
          )}
          <button
            onClick={() => setShowManagerModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm"
          >
            <FiUserPlus size={14} /> Manager
          </button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-5">
        
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-5 h-full min-h-0">
          
          {/* Stats Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 shrink-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Company Staff</p>
              <p className="text-2xl font-black text-slate-800">{employees.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-100"></div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Departments</p>
              <p className="text-2xl font-black text-slate-800">{departments.length}</p>
            </div>
          </div>

          {/* Leadership Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 flex-1">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-t-xl">
              <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <FiShield className="text-indigo-500" /> Leadership
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">{managers.length} Managers</span>
            </div>
            <div className="p-3 overflow-y-auto custom-scrollbar flex-1 space-y-2 bg-white rounded-b-xl">
              {managers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
                  <FiUsers size={20} className="mb-2 opacity-50" />
                  <p className="text-xs font-medium">No managers assigned.</p>
                </div>
              ) : (
                <>
                  {/* Managers WITH a dedicated profile — show delete */}
                  {managers.filter(m => m.managerProfileId).map(m => (
                    <div key={m._id} className="group flex items-center justify-between p-2.5 bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-xs rounded-lg transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                          {m.name?.[0] || m.user?.name?.[0]}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-800 leading-tight">{m.name || m.user?.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {m.department?.departmentName || 'General Management'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedManager(m); setShowDeleteManagerModal(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md" title="Remove Manager Profile">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Managers WITHOUT a profile (role set via Add/Edit Employee) — no delete */}
                  {managers.filter(m => !m.managerProfileId).length > 0 && (
                    <>
                      {managers.filter(m => m.managerProfileId).length > 0 && (
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1 pt-1">Via Employee Role</p>
                      )}
                      {managers.filter(m => !m.managerProfileId).map(m => (
                        <div key={m._id} className="flex items-center justify-between p-2.5 bg-slate-50/60 border border-slate-100 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs uppercase">
                              {m.name?.[0] || m.user?.name?.[0]}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-slate-700 leading-tight">{m.name || m.user?.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Employee → Manager Role</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">No Profile</span>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* HR Management Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 flex-1">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-t-xl">
              <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <FiUsers className="text-purple-500" /> HR Management
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">{hrs.length} HRs</span>
            </div>
            <div className="p-3 overflow-y-auto custom-scrollbar flex-1 space-y-2 bg-white rounded-b-xl">
              {hrs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
                  <FiUsers size={20} className="mb-2 opacity-50" />
                  <p className="text-xs font-medium">No HR assigned.</p>
                </div>
              ) : (
                <>
                  {/* HRs WITH a dedicated profile — show delete */}
                  {hrs.filter(h => h.hrProfileId).map(h => (
                    <div key={h._id} className="group flex items-center justify-between p-2.5 bg-white border border-slate-100 hover:border-purple-100 hover:shadow-xs rounded-lg transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs uppercase">
                          {h.userId?.name?.[0] || 'H'}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-800 leading-tight">{h.userId?.name || 'HR Representative'}</p>
                          <p className="text-[10px] text-slate-500 font-medium">Company Wide</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedHR(h); setShowDeleteHRModal(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md" title="Remove HR Profile">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* HRs WITHOUT a profile (role set via Add/Edit Employee) — no delete */}
                  {hrs.filter(h => !h.hrProfileId).length > 0 && (
                    <>
                      {hrs.filter(h => h.hrProfileId).length > 0 && (
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-1 pt-1">Via Employee Role</p>
                      )}
                      {hrs.filter(h => !h.hrProfileId).map(h => (
                        <div key={h._id} className="flex items-center justify-between p-2.5 bg-slate-50/60 border border-slate-100 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs uppercase">
                              {h.userId?.name?.[0] || 'H'}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-slate-700 leading-tight">{h.userId?.name || 'HR Representative'}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Employee → HR Role</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">No Profile</span>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Assets Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 flex-1">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-t-xl">
              <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <FiMonitor className="text-emerald-500" /> Assets Inventory
              </h3>
              {userRole !== "manager" ? (
                <button onClick={() => setShowAssetModal(true)} className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-1 rounded-md transition-colors" title="Add Asset">
                  <FiPlus size={14} />
                </button>
              ) : <span className="text-[10px] font-semibold text-slate-400">{assets.length} Items</span>}
            </div>
            <div className="p-3 overflow-y-auto custom-scrollbar flex-1 space-y-2 bg-white rounded-b-xl">
              {userRole === "manager" ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
                  <FiLock size={20} className="mb-2 opacity-30" />
                  <p className="text-xs font-medium">Inventory view restricted.</p>
                </div>
              ) : assets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
                  <FiMonitor size={20} className="mb-2 opacity-50" />
                  <p className="text-xs font-medium">No assets registered.</p>
                </div>
              ) : (
                assets.map(asset => (
                  <div key={asset._id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${asset.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {asset.assetType === 'Laptop' ? <FiMonitor size={14} /> : <FiServer size={14} />}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 leading-tight">{asset.assetName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">ID: {asset.assetId}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${asset.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {asset.status === 'available' ? 'Available' : 'In Use'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FiLayers className="text-blue-500" /> Departments & Teams
            </h3>
            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
              {departments.length} Units
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-[#F8FAFC]">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start content-start">
              {departments.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                  <FiLayers size={32} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">No departments created yet.</p>
                </div>
              ) : (
                departments.map((dept) => {
                  const deptEmployees = employees.filter(emp =>
                    (typeof emp.department === 'string' ? emp.department : (emp.department?.departmentName || emp.department?.name || emp.departmentId)) === dept.departmentName
                  );
                  const isExpanded = expandedDept === dept._id;

                  return (
                    <div key={dept._id} className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-blue-300 shadow-md ring-2 ring-blue-50 xl:col-span-2' : 'border-slate-200 shadow-sm hover:border-blue-200'}`}>
                      
                      {/* Dept Header */}
                      <div 
                        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50/50 border-b border-slate-100' : ''}`}
                        onClick={() => setExpandedDept(isExpanded ? null : dept._id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                            <FiGrid size={16} />
                          </div>
                          <div>
                            <h4 className="text-[14px] font-bold text-slate-800 leading-tight">{dept.departmentName}</h4>
                            <p className="text-[11px] text-slate-500 font-medium">{deptEmployees.length} Members</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleEditDept(dept); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit">
                              <FiEdit size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteDeptClick(dept); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md" title="Delete">
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                          {/* Chevron */}
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all bg-slate-100 text-slate-400 ${isExpanded ? 'bg-blue-100 text-blue-600 rotate-180' : ''}`}>
                            <FiChevronDown size={14} />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="bg-slate-50 p-3">
                          {deptEmployees.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic text-center py-4 bg-white rounded-lg border border-slate-100">No employees assigned to this department.</p>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {deptEmployees.map(emp => (
                                <div key={emp._id} className="p-3 bg-white rounded-lg border border-slate-100 flex items-center justify-between group hover:border-blue-100 hover:shadow-xs transition-all">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600 uppercase">
                                      {emp.user?.name?.[0] || 'E'}
                                    </div>
                                    <div className="min-w-0 truncate">
                                      <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate">{emp.user?.name}</p>
                                      <p className="text-[10px] text-slate-500 font-medium truncate">{emp.designation}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => navigate(`/dashboard/profile/${emp.employeeId}`)}
                                    className="shrink-0 text-blue-600 text-[11px] font-semibold px-2.5 py-1.5 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    View
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              
              {/* Unassigned / General Staff */}
              {(() => {
                const unassignedEmployees = employees.filter(emp => !emp.department);
                if (unassignedEmployees.length === 0) return null;
                const isExpanded = expandedDept === 'unassigned';
                return (
                  <div key="unassigned" className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-slate-300 shadow-md ring-2 ring-slate-50 xl:col-span-2' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                    <div 
                      className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50/50 border-b border-slate-100' : ''}`}
                      onClick={() => setExpandedDept(isExpanded ? null : 'unassigned')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-slate-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                          <FiUsers size={16} />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-slate-800 leading-tight">General Organization</h4>
                          <p className="text-[11px] text-slate-500 font-medium">{unassignedEmployees.length} Members</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all bg-slate-100 text-slate-400 ${isExpanded ? 'bg-slate-200 text-slate-600 rotate-180' : ''}`}>
                          <FiChevronDown size={14} />
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="bg-slate-50 p-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                          {unassignedEmployees.map(emp => (
                            <div key={emp._id} className="p-3 bg-white rounded-lg border border-slate-100 flex items-center justify-between group hover:border-slate-200 hover:shadow-xs transition-all">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 shrink-0 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600 uppercase">
                                  {emp.user?.name?.[0] || 'U'}
                                </div>
                                <div className="min-w-0 truncate">
                                  <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate">{emp.user?.name}</p>
                                  <p className="text-[10px] text-slate-500 font-medium truncate">{emp.designation || emp.user?.userType || 'Employee'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => navigate(`/dashboard/profile/${emp.employeeId}`)}
                                className="shrink-0 text-slate-600 text-[11px] font-semibold px-2.5 py-1.5 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

      </div>

      {/* MODALS */}

      {/* REGISTER MANAGER MODAL */}
      {showManagerModal && (
        <Modal title="Assign Manager" onClose={() => setShowManagerModal(false)}>
          <form onSubmit={registerManager} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase px-1">Select Existing Employee (Optional)</label>
                  <CustomSelector 
                    value={managerForm.userId}
                    options={employees.map(e => ({ 
                      // .toString() ensures the id is always a plain string (not an ObjectId object)
                      id: e.user?._id?.toString() || e._id?.toString(), 
                      name: `${e.user?.name || ''} (${e.employeeId || 'No ID'})` 
                    }))}
                    onChange={id => {
                      // Compare as strings on both sides
                      const emp = employees.find(
                        e => (e.user?._id?.toString() || e._id?.toString()) === id
                      );
                      if (id) {
                        setManagerForm({
                          ...managerForm, 
                          userId: id, 
                          name: emp?.user?.name || '',
                          email: emp?.user?.email || emp?.personalEmail || ''
                        });
                      } else {
                        setManagerForm({
                          ...managerForm, 
                          userId: '', 
                          name: '',
                          email: ''
                        });
                      }
                    }}
                    isLarge
                    placeholder="Choose from company staff..."
                  />
                  <p className="text-[9px] text-gray-400 mt-1 pl-1 italic">Selecting an employee will promote them to Manager role.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={managerForm.name}
                    onChange={v => setManagerForm({ ...managerForm, name: v })}
                    placeholder="Enter full name"
                    readOnly={!!managerForm.userId}
                  />
                  <Input 
                    label="Business Email" 
                    value={managerForm.email} 
                    onChange={v => setManagerForm({ ...managerForm, email: v })} 
                    placeholder="email@company.com" 
                    type="email" 
                    readOnly={!!managerForm.userId}
                  />
                </div>

                {!managerForm.userId && (
                  <Input 
                    label="Temporary Password" 
                    value={managerForm.password} 
                    onChange={v => setManagerForm({ ...managerForm, password: v })} 
                    placeholder="********" 
                    type="password" 
                  />
                )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase px-1">Department Scope</label>
                <select
                  className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none border border-transparent focus:bg-white"
                  value={managerForm.departmentId}
                  onChange={e => setManagerForm({ ...managerForm, departmentId: e.target.value })}
                >
                  <option value="">Company Wide</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                </select>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-4">
                <FiLock size={20} className="text-indigo-600" />
                <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase">Standard Permissions</p>
                  <p className="text-[11px] text-indigo-400 font-medium">Team & Project Oversight Enabled</p>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-[900] text-[12px] uppercase shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed italic"
            >
              {actionLoading ? 'Initializing...' : 'Initialize Manager Profile'}
            </button>
          </form>
        </Modal>
      )}

      {/* ASSET MODAL */}
      {showAssetModal && (
        <Modal title="Register Asset" onClose={() => setShowAssetModal(false)}>
          <form onSubmit={submitAsset} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-4">
              <Input label="Equipment Name" value={assetForm.assetName} onChange={v => setAssetForm({ ...assetForm, assetName: v })} placeholder="MacBook Pro" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase px-1">Type</label>
                  <select className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none border border-transparent focus:bg-white" value={assetForm.assetType} onChange={e => setAssetForm({ ...assetForm, assetType: e.target.value })}>
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Keyboard">Keyboard</option>
                    <option value="Mouse">Mouse</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Input label="Asset ID (KONA-01)" value={assetForm.assetId} onChange={v => setAssetForm({ ...assetForm, assetId: v })} placeholder="Auto-generated if empty" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Serial Number" value={assetForm.serialNumber} onChange={v => setAssetForm({ ...assetForm, serialNumber: v })} placeholder="SN-123456" />
                <Input label="Total Units" type="number" value={assetForm.count} onChange={v => setAssetForm({ ...assetForm, count: parseInt(v) || 1 })} placeholder="1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase px-1">Condition</label>
                  <select className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none border border-transparent focus:bg-white" value={assetForm.condition} onChange={e => setAssetForm({ ...assetForm, condition: e.target.value })}>
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wider bg-blue-50 p-2 rounded-xl border border-blue-100 italic">
                    Stock will be marked as 'Available' upon registration.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Purchase Date" type="date" value={assetForm.purchaseDate} onChange={v => setAssetForm({ ...assetForm, purchaseDate: v })} />
                <Input label="Warranty Expiry" type="date" value={assetForm.warrantyExpiry} onChange={v => setAssetForm({ ...assetForm, warrantyExpiry: v })} />
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Detailed Specifications</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Model" value={assetForm.specifications.model} onChange={v => setAssetForm({ ...assetForm, specifications: { ...assetForm.specifications, model: v } })} placeholder="e.g. M2 Pro" />
                  <Input label="Processor" value={assetForm.specifications.processor} onChange={v => setAssetForm({ ...assetForm, specifications: { ...assetForm.specifications, processor: v } })} placeholder="e.g. Apple M2" />
                  <Input label="RAM" value={assetForm.specifications.ram} onChange={v => setAssetForm({ ...assetForm, specifications: { ...assetForm.specifications, ram: v } })} placeholder="e.g. 16GB" />
                  <Input label="Storage" value={assetForm.specifications.storage} onChange={v => setAssetForm({ ...assetForm, specifications: { ...assetForm.specifications, storage: v } })} placeholder="e.g. 512GB SSD" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase px-1">Additional Notes</label>
                <textarea
                  className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none border border-transparent focus:bg-white focus:border-blue-500/20 transition-all min-h-[80px]"
                  value={assetForm.notes}
                  onChange={e => setAssetForm({ ...assetForm, notes: e.target.value })}
                  placeholder="Any special remarks..."
                />
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-[#0B2D5C] text-white rounded-[2rem] font-black text-[12px] uppercase shadow-2xl hover:bg-[#1a3a6c] active:scale-95 transition-all mt-4 sticky bottom-0 z-10 italic">
              Initialize Asset Inventory
            </button>
          </form>
        </Modal>
      )}

      {/* REGISTER/EDIT HR MODAL */}
      {(showHRModal || showEditHRModal) && (
        <Modal title={showEditHRModal ? "Edit HR Profile" : "Register HR"} onClose={() => { setShowHRModal(false); setShowEditHRModal(false); }}>
          <form onSubmit={showEditHRModal ? handleUpdateHR : registerHR} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={hrForm.name}
                onChange={v => setHrForm({ ...hrForm, name: v })}
                placeholder="Enter full name"
              />
              <Input label="Business Email" value={hrForm.email} onChange={v => setHrForm({ ...hrForm, email: v })} placeholder="email@company.com" type="email" />
              {!showEditHRModal && <Input label="Temporary Password" value={hrForm.password} onChange={v => setHrForm({ ...hrForm, password: v })} placeholder="********" type="password" />}

              <div className="grid grid-cols-2 gap-4">
                <Input label="HR Code" value={hrForm.hrCode} onChange={v => setHrForm({ ...hrForm, hrCode: v })} placeholder="HR-001" />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase px-1">Specialization</label>
                  <select
                    className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none border border-transparent focus:bg-white"
                    value={hrForm.specialization}
                    onChange={e => setHrForm({ ...hrForm, specialization: e.target.value })}
                  >
                    <option value="generalist">Generalist</option>
                    <option value="recruitment">Recruitment</option>
                    <option value="payroll">Payroll</option>
                    <option value="operations">Operations</option>
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" disabled={actionLoading} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-[900] text-[12px] uppercase shadow-2xl hover:bg-blue-700 active:scale-95 transition-all italic">
              {actionLoading ? 'Processing...' : (showEditHRModal ? 'Update HR Profile' : 'Initialize HR Profile')}
            </button>
          </form>
        </Modal>
      )}

      {/* DELETE HR MODAL */}
      {/* DELETE HR MODAL */}
      <ConfirmModal
        isOpen={showDeleteHRModal}
        onClose={() => setShowDeleteHRModal(false)}
        onConfirm={handleDeleteHR}
        loading={actionLoading}
        title="Delete HR Profile"
        message={`Are you sure you want to delete HR ${selectedHR?.userId?.name || 'this HR'}? This will permanently remove their profile and access.`}
      />

      {/* EDIT MANAGER MODAL */}
      {showEditManagerModal && (
        <Modal title="Edit Manager Profile" onClose={() => setShowEditManagerModal(false)}>
          <form onSubmit={handleUpdateManager} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={managerForm.name}
                onChange={v => setManagerForm({ ...managerForm, name: v })}
                placeholder="Enter full name"
              />
              <Input label="Business Email" value={managerForm.email} onChange={v => setManagerForm({ ...managerForm, email: v })} placeholder="email@company.com" type="email" />

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase px-1">Department Scope</label>
                <select
                  className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none border border-transparent focus:bg-white"
                  value={managerForm.departmentId}
                  onChange={e => setManagerForm({ ...managerForm, departmentId: e.target.value })}
                >
                  <option value="">Company Wide</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={actionLoading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-[900] text-[12px] uppercase shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all italic">
              {actionLoading ? 'Updating...' : 'Update Manager Profile'}
            </button>
          </form>
        </Modal>
      )}

      {/* DELETE MANAGER MODAL */}
      <ConfirmModal
        isOpen={showDeleteManagerModal}
        onClose={() => setShowDeleteManagerModal(false)}
        onConfirm={handleDeleteManager}
        loading={actionLoading}
        title="Delete Manager Profile"
        message={`Are you sure you want to delete Manager ${selectedManager?.user?.name || 'this Manager'}? This will permanently remove their profile and access.`}
      />


      {/* EDIT COMPANY MODAL */}
      {showEditCompanyModal && (
        <Modal title="Edit Organization" onClose={() => setShowEditCompanyModal(false)} maxWidth="max-w-4xl">
          <form onSubmit={handleUpdateCompany} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Company Name" value={companyForm.companyName} onChange={v => setCompanyForm({ ...companyForm, companyName: v })} />
              <Input label="Official Email" type="email" value={companyForm.email} onChange={v => setCompanyForm({ ...companyForm, email: v })} />
              <Input label="Owner Name" value={companyForm.ownerName} onChange={v => setCompanyForm({ ...companyForm, ownerName: v })} />
              <Input label="Website" value={companyForm.website} onChange={v => setCompanyForm({ ...companyForm, website: v })} />
              <Input label="PAN ID" value={companyForm.panId} onChange={v => setCompanyForm({ ...companyForm, panId: v })} />
              <Input label="GST ID" value={companyForm.gstId} onChange={v => setCompanyForm({ ...companyForm, gstId: v })} />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status</label>
                <select className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none" value={companyForm.status} onChange={e => setCompanyForm({ ...companyForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Address</label>
              <textarea className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none h-24 resize-none" value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} />
            </div>
            <button type="submit" disabled={actionLoading} className="w-full py-4 bg-[#0B2D5C] text-white rounded-2xl font-black text-[12px] uppercase shadow-lg disabled:opacity-50 transition-all active:scale-95">
              {actionLoading ? 'Updating...' : 'Save Company Details'}
            </button>
          </form>
        </Modal>
      )}

      {/* ADD DEPARTMENT MODAL */}
      {showAddDeptModal && (
        <Modal title="Add New Department" onClose={() => setShowAddDeptModal(false)}>
          <form onSubmit={submitAddDept} className="space-y-6">
            <Input
              label="Department Name"
              value={deptForm.departmentName}
              onChange={v => setDeptForm({ departmentName: v })}
              placeholder="e.g. Engineering, Sales, HR"
            />
            <button type="submit" disabled={actionLoading} className="w-full py-4 bg-[#0B2D5C] text-white rounded-2xl font-black text-[12px] uppercase shadow-lg disabled:opacity-50 transition-all active:scale-95 italic">
              {actionLoading ? 'Initializing...' : 'Create Department'}
            </button>
          </form>
        </Modal>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {showEditDeptModal && (
        <Modal title="Edit Department" onClose={() => setShowEditDeptModal(false)}>
          <form onSubmit={handleUpdateDept} className="space-y-6">
            <Input
              label="Department Name"
              value={deptForm.departmentName}
              onChange={v => setDeptForm({ departmentName: v })}
              placeholder="e.g. Engineering"
            />
            <button type="submit" disabled={actionLoading} className="w-full py-4 bg-[#0B2D5C] text-white rounded-2xl font-black text-[12px] uppercase shadow-lg disabled:opacity-50 transition-all active:scale-95">
              {actionLoading ? 'Updating...' : 'Update Department'}
            </button>
          </form>
        </Modal>
      )}

      {/* DELETE DEPARTMENT MODAL */}
      <ConfirmModal
        isOpen={showDeleteDeptModal}
        onClose={() => setShowDeleteDeptModal(false)}
        onConfirm={handleDeleteDept}
        loading={actionLoading}
        title="Delete Department"
        message={`Are you sure you want to delete ${selectedDept?.departmentName}? This may affect employee records associated with this department.`}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}


function Input({ label, value, onChange, placeholder, type = "text", readOnly = false }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange(e.target.value)}
        className={`w-full p-4 rounded-2xl outline-none font-bold text-[13px] border border-transparent transition-all text-slate-700 ${
          readOnly ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-[#F8FAFC] focus:bg-white focus:border-indigo-500/20'
        }`}
      />
    </div>
  );
}
