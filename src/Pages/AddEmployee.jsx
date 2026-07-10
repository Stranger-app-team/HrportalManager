import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { X, Camera, Upload, ChevronDown, Eye, EyeOff, Save, Info, Briefcase, MapPin, Lock, CreditCard, Paperclip, Monitor, Laptop, Plus } from 'lucide-react';
import CreateDepartmentModal from '../components/Shared/CreateDepartmentModal';
import EmployeeDocuments from '../components/Employees/EmployeeDocuments';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ─── Shared UI Components ───
const inputCls = "w-full h-10 border border-gray-200 rounded-xl px-4 text-sm text-gray-700 bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300";
const selectCls = "w-full h-10 border border-gray-200 rounded-xl px-4 pr-10 text-sm text-gray-700 bg-white appearance-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none cursor-pointer transition-all";

const F = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}{required && <span className="text-rose-500 ml-1">*</span>}</label>
    {children}
  </div>
);

const SecHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-4 mb-6">
    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
      <Icon size={20} />
    </div>
    <div>
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h2>
      <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
    </div>
  </div>
);

export default function AddEmployee() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  // Data Lists
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '',
    email: '', contactNumber: '+91', gender: '', dateOfBirth: '',
    employeeId: '', designation: '', department: '',
    reportingManager: [], employmentType: 'Full Time', dateOfJoining: '',
    workLocation: 'Office', companyId: '', addressLine: '', city: '',
    pincode: '', officeEmail: '',
    temporaryPassword: '', roleLevel: 'Employee', basicSalary: '',
    salaryDate: new Date().toISOString().split('T')[0],
    accountNumber: '', bankName: '', ifscCode: '',
    attendanceRequired: true,
    shiftStartTime: '09:00',
    shiftEndTime: '18:00',
    eligibleForAttendanceBonus: true,
    eligibleForPaidLeaveBonus: true
  });

  const [selectedAssets, setSelectedAssets] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [localDocuments, setLocalDocuments] = useState([]);

  const location = useLocation();

  // ─── Initial Fetch ───
  useEffect(() => {
    const init = async () => {
      await fetchCompanies();
      const params = new URLSearchParams(location.search);
      const companyId = params.get('companyId');
      if (companyId) {
        handleCompanyChange({ target: { value: companyId } });
      }
    };
    init();
  }, [location.search]);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/company`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.company) setCompanies(data.company);
    } catch (err) { console.error(err); }
  };

  // ─── Chained Data Fetching ───
  const handleCompanyChange = async (e) => {
    const companyId = e.target.value;
    setFormData(prev => ({ ...prev, companyId, department: '', reportingManager: [] }));
    setDepartments([]);
    setManagers([]);
    setAvailableAssets([]);
    setSelectedAssets([]);

    if (!companyId) return;

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch Departments
    await fetchDepartments(companyId);

    // Fetch Assets
    try {
      const aRes = await fetch(`${API_BASE_URL}/assets?companyId=${companyId}`, { headers });
      const aData = await aRes.json();
      console.log("FETCHED ASSETS FOR COMPANY:", aData);
      const assetsList = Array.isArray(aData) ? aData : (aData.assets || aData.data || []);
      setAvailableAssets(assetsList);
    } catch (err) { console.error(err); }

    // Fetch Managers/HRs (potential reporting managers)
    try {
      console.log("Fetching managers for company selection:", companyId);
      const mRes = await fetch(`${API_BASE_URL}/user?companyId=${companyId}`, { headers });
      const mData = await mRes.json();
      console.log("MANAGER API RAW DATA:", mData);
      
      const allUsers = mData.users || [];
      const potentialManagers = allUsers.filter(u => String(u.userType).toLowerCase() === 'manager');
      
      setManagers(potentialManagers);
    } catch (err) { console.error("Manager Fetch Error:", err); }
  };

  const fetchDepartments = async (companyId) => {
    if (!companyId) return;
    try {
      const token = localStorage.getItem("token");
      const dRes = await fetch(`${API_BASE_URL}/department/company?companyId=${companyId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const dData = await dRes.json();
      setDepartments(dData.department || []);
    } catch (err) { console.error(err); }
  };

  const handleDeptCreated = async (newDept) => {
    await fetchDepartments(formData.companyId);
    if (newDept && newDept._id) {
      setFormData(prev => ({ ...prev, department: newDept._id }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManagerToggle = (managerId) => {
    setFormData(prev => {
      const current = prev.reportingManager || [];
      const updated = current.includes(managerId)
        ? current.filter(id => id !== managerId)
        : [...current, managerId];
      return { ...prev, reportingManager: updated };
    });
  };

  const toggleAsset = (assetId) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const fData = new FormData();

      console.log("--- ADD EMPLOYEE FORM DATA ---", formData);

      const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();
      
      // ── Always-required fields ──
      fData.append("name", fullName);
      fData.append("email", formData.officeEmail);
      fData.append("password", formData.temporaryPassword);
      fData.append("userType", formData.roleLevel.toLowerCase());
      fData.append("companyId", formData.companyId);
      fData.append("attendanceRequired", formData.attendanceRequired);
      fData.append("shiftStartTime", formData.shiftStartTime);
      fData.append("shiftEndTime", formData.shiftEndTime);
      fData.append("eligibleForAttendanceBonus", formData.eligibleForAttendanceBonus);
      fData.append("eligibleForPaidLeaveBonus", formData.eligibleForPaidLeaveBonus);

      // ── Optional plain-string fields (safe to append even if empty) ──
      fData.append("personalEmail", formData.email);
      fData.append("employeeId", formData.employeeId);
      fData.append("designation", formData.designation);
      fData.append("phone", formData.contactNumber);
      fData.append("workLocation", formData.workLocation);
      fData.append("employmentType", formData.employmentType);

      // ── ObjectId fields: only append when a real value is selected ──
      // Sending an empty string "" for an ObjectId crashes MongoDB on production
      if (formData.department)       fData.append("department", formData.department);
      if (formData.reportingManager && formData.reportingManager.length > 0) {
        fData.append("managers", JSON.stringify(formData.reportingManager));
      }

      // ── Enum field: only append when a real value is selected ──
      if (formData.gender) fData.append("gender", formData.gender);

      // ── Date fields: only append when filled ──
      if (formData.dateOfJoining) fData.append("joiningDate", formData.dateOfJoining);
      if (formData.dateOfBirth)   fData.append("dob", formData.dateOfBirth);

      // ── Number field: only append when filled ──
      if (formData.basicSalary) fData.append("salary", formData.basicSalary);
      if (formData.salaryDate) fData.append("salaryDate", formData.salaryDate);

      fData.append("assets", JSON.stringify(selectedAssets));

      fData.append("location", JSON.stringify({
        addressLine: formData.addressLine,
        city: formData.city,
        pincode: formData.pincode
      }));

      fData.append("bankDetails", JSON.stringify({
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        ifsc: formData.ifscCode
      }));

      if (profilePhoto) fData.append("profilePhoto", profilePhoto);
      
      // Append local documents correctly
      localDocuments.forEach(doc => {
         if (doc.file) {
            fData.append(doc.documentType, doc.file);
         }
      });

      console.log("--- FINAL PAYLOAD BEING SENT TO /employee ---", Object.fromEntries(fData.entries()));

      const res = await fetch(`${API_BASE_URL}/employee`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fData
      });

      if (res.ok) {
        alert("Employee Added Successfully ✅");
        navigate("/dashboard/employees");
      } else {
        const err = await res.json();
        alert(err.message || "Submission failed");
      }
    } catch (err) { alert("Server error connection failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-screen bg-[#F8FAFC] font-[Plus Jakarta Sans] flex flex-col overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-3 p-4 sm:px-8 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
            <X size={16} className="text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-200 self-center mx-1" />
          <button 
             onClick={handleSubmit}
             disabled={loading}
             className="flex items-center justify-center gap-2 bg-[#0B2D5C] text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a3a6c] transition-all shadow-md disabled:opacity-50"
          >
            <Save size={16} /> <span>{loading ? "Processing..." : "Save Employee"}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 no-scrollbar">
        <div className="w-full space-y-8">
          {/* TOP LEVEL GRID (Profile + Identity) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             {/* Section 1: Profile Photo */}
             <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40 flex flex-col items-center">
                <SecHeader icon={Camera} title="Profile" subtitle="Upload photo" />
                <div className="relative group cursor-pointer mt-4">
                   <div className="w-32 h-32 rounded-[40px] border-4 border-dashed border-gray-100 flex items-center justify-center bg-gray-50 group-hover:border-blue-200 transition-all overflow-hidden shadow-inner">
                      {profilePhoto ? (
                        <img src={URL.createObjectURL(profilePhoto)} className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="text-gray-300" size={32} />
                      )}
                   </div>
                   <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-700 transition-transform hover:scale-110">
                      <Camera size={18} />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])} />
                   </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-6 font-medium">JPEG, PNG • Max 5MB</p>
             </div>

             {/* Section 2: Personal Info */}
             <div className="lg:col-span-3 bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40">
                <SecHeader icon={Info} title="Personal Details" subtitle="Full name and contact" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <F label="First Name" required><input name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputCls} placeholder="John" /></F>
                   <F label="Middle Name"><input name="middleName" value={formData.middleName} onChange={handleInputChange} className={inputCls} placeholder="Quincy" /></F>
                   <F label="Last Name" required><input name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputCls} placeholder="Doe" /></F>
                   
                   <F label="Email Address"><input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputCls} placeholder="john@example.com" /></F>
                   <F label="Join Contact">
                      <div className="flex items-center w-full border border-gray-200 rounded-xl h-10 bg-white px-4 focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500 transition-all shadow-sm">
                         <span className="text-sm font-bold text-gray-400 mr-2">+91</span>
                         <input 
                            type="tel" 
                            name="contactNumber" 
                            value={formData.contactNumber.replace("+91", "")} 
                            onChange={(e) => setFormData(prev => ({...prev, contactNumber: "+91" + e.target.value.replace(/\D/g,"").slice(0,10)}))}
                            className="w-full text-sm text-gray-700 bg-transparent outline-none placeholder:text-gray-300"
                            placeholder="99XXXXXXXX" 
                         />
                      </div>
                   </F>
                   <F label="Gender">
                      <div className="relative">
                         <select name="gender" value={formData.gender} onChange={handleInputChange} className={selectCls}>
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                         </select>
                         <ChevronDown className="absolute right-4 top-3 text-gray-300 pointer-events-none" size={16} />
                      </div>
                   </F>
                   <F label="Date of Birth"><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={inputCls} /></F>
                </div>
             </div>
          </div>

          {/* WORK INFO SECTION */}
          <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40">
             <SecHeader icon={Briefcase} title="Organization Structure" subtitle="Placement and role" />
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <F label="Company" required>
                   <div className="relative">
                      <select name="companyId" value={formData.companyId} onChange={handleCompanyChange} className={selectCls}>
                         <option value="">Select Company</option>
                         {companies.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-3 text-gray-300 pointer-events-none" size={16} />
                   </div>
                </F>

                 <F label="Department">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select name="department" value={formData.department} onChange={handleInputChange} className={selectCls} disabled={!formData.companyId}>
                            <option value="">Select Dept</option>
                            {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-3 text-gray-300 pointer-events-none" size={16} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDeptModal(true)}
                        disabled={!formData.companyId}
                        className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-blue-100 shadow-sm"
                        title="Add New Department"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                 </F>

                <F label="Designation"><input name="designation" value={formData.designation} onChange={handleInputChange} className={inputCls} placeholder="e.g. Senior Manager" /></F>
                
                 <F label="Reporting Managers">
                    <div className="relative group">
                       <div className={`w-full min-h-[40px] border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 bg-white focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500 transition-all ${!formData.companyId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className="flex flex-wrap gap-1.5">
                             {formData.reportingManager.length === 0 ? (
                                <span className="text-gray-300">Select Managers</span>
                             ) : (
                                formData.reportingManager.map(id => {
                                   const m = managers.find(man => man._id === id);
                                   return (
                                      <span key={id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-blue-100">
                                         {m?.name || id}
                                         <X size={10} className="cursor-pointer hover:text-blue-900" onClick={(e) => { e.stopPropagation(); handleManagerToggle(id); }} />
                                      </span>
                                   );
                                })
                             )}
                          </div>
                       </div>
                       
                       {formData.companyId && (
                          <div className="absolute top-full left-0 w-full pt-1 z-50 hidden group-hover:block">
                             <div className="bg-white border border-gray-100 rounded-xl shadow-xl py-2 max-h-48 overflow-y-auto no-scrollbar">
                                {managers.length === 0 ? (
                                   <p className="px-4 py-2 text-[10px] text-gray-400 italic">No managers found</p>
                                ) : (
                                   managers.map(m => (
                                      <div 
                                         key={m._id} 
                                         onClick={() => handleManagerToggle(m._id)}
                                         className="px-4 py-1.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                                      >
                                         <span className={`text-[11px] font-bold ${formData.reportingManager.includes(m._id) ? 'text-blue-600' : 'text-gray-600'}`}>
                                            {m.name}
                                         </span>
                                         {formData.reportingManager.includes(m._id) && <Plus size={12} className="text-blue-600 rotate-45" />}
                                      </div>
                                   ))
                                )}
                             </div>
                          </div>
                       )}
                    </div>
                 </F>

                <F label="Employment Type">
                   <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className={selectCls}>
                      <option value="Full Time">Full Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Permanent">Permanent</option>
                   </select>
                </F>
                <F label="Work Location">
                   <select name="workLocation" value={formData.workLocation} onChange={handleInputChange} className={selectCls}>
                      <option value="Office">Office</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                   </select>
                </F>
                <F label="Joining Date"><input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleInputChange} className={inputCls} /></F>
                <div className="flex flex-col gap-1.5 md:col-span-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shift Timing (Start - End)</label>
                  <div className="flex gap-2">
                    <input type="time" name="shiftStartTime" value={formData.shiftStartTime} onChange={handleInputChange} className={inputCls} />
                    <input type="time" name="shiftEndTime" value={formData.shiftEndTime} onChange={handleInputChange} className={inputCls} />
                  </div>
                </div>
                {/* <F label="Employee ID" required><input name="employeeId" value={formData.employeeId} onChange={handleInputChange} className={inputCls} placeholder="EMP-XXXX" /></F> */}
             </div>
          </div>

          {/* ASSETS SECTION */}
          <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40">
             <SecHeader icon={Monitor} title="Assets Inventory" subtitle="Equipment assignment" />
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {availableAssets.length === 0 ? (
                  <p className="text-xs text-gray-400 col-span-4 italic">No available assets found for this company.</p>
                ) : (
                  availableAssets.map(asset => (
                    <button
                      key={asset._id}
                      type="button"
                      onClick={() => toggleAsset(asset._id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3
                        ${selectedAssets.includes(asset._id) 
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10' 
                          : 'border-gray-100 bg-gray-50 hover:border-blue-200'}`}
                    >
                      <div className={`p-2 rounded-xl ${selectedAssets.includes(asset._id) ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}>
                        <Laptop size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{asset.assetName}</p>
                        <p className="text-[10px] text-gray-400">{asset.assetId}</p>
                      </div>
                    </button>
                  ))
                )}
             </div>
          </div>

          {/* REMAINING SECTIONS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Address */}
             <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40">
                <SecHeader icon={MapPin} title="Full Address" subtitle="Location presence" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2"><F label="Address Line"><input name="addressLine" value={formData.addressLine} onChange={handleInputChange} className={inputCls} placeholder="Street, Building name..." /></F></div>
                   <F label="City"><input name="city" value={formData.city} onChange={handleInputChange} className={inputCls} /></F>
                   <F label="Pincode"><input name="pincode" value={formData.pincode} onChange={handleInputChange} className={inputCls} /></F>
                </div>
             </div>

             {/* Portal Access */}
             <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40">
                <SecHeader icon={Lock} title="Portal Access" subtitle="Login credentials" />
                <div className="space-y-6">
                   <F label="Office Email" required><input name="officeEmail" value={formData.officeEmail} onChange={handleInputChange} className={inputCls} placeholder="work.email@company.com" /></F>
                   <div className="grid grid-cols-2 gap-4">
                      <F label="Temp Password" required>
                         <div className="relative">
                            <input type={showPassword ? "text" : "password"} name="temporaryPassword" value={formData.temporaryPassword} onChange={handleInputChange} className={inputCls} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-gray-300">
                               {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                         </div>
                      </F>
                      <F label="System Role">
                         <select name="roleLevel" value={formData.roleLevel} onChange={handleInputChange} className={selectCls}>
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                            <option value="HR">HR</option>
                         </select>
                      </F>
                      <div className="flex items-center mt-6">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                               type="checkbox" 
                               checked={formData.attendanceRequired}
                               onChange={(e) => setFormData(prev => ({...prev, attendanceRequired: e.target.checked}))}
                               className="w-4 h-4 cursor-pointer accent-blue-600 rounded border-slate-300 shadow-sm"
                            />
                            <span className="text-[11px] font-bold text-slate-600">Attendance Required</span>
                         </label>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* BANKING SECTION */}
          <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40">
             <SecHeader icon={CreditCard} title="Payroll & Banking" subtitle="Salary disbursement" />
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <F label="Basic Salary (₹)"><input name="basicSalary" value={formData.basicSalary} onChange={handleInputChange} className={inputCls} placeholder="0.00" /></F>
                <F label="Salary Date"><input type="date" name="salaryDate" value={formData.salaryDate} onChange={handleInputChange} className={inputCls} /></F>
                <F label="A/C Number"><input name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className={inputCls} /></F>
                <F label="Bank Name"><input name="bankName" value={formData.bankName} onChange={handleInputChange} className={inputCls} placeholder="e.g. HDFC Bank" /></F>
                <F label="IFSC Code"><input name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} className={inputCls} /></F>
                <div className="flex flex-col gap-3 justify-center md:col-span-3">
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                         type="checkbox" 
                         checked={formData.eligibleForAttendanceBonus}
                         onChange={(e) => setFormData(prev => ({...prev, eligibleForAttendanceBonus: e.target.checked}))}
                         className="w-4 h-4 cursor-pointer accent-blue-600 rounded border-slate-300 shadow-sm"
                      />
                      <span className="text-[11px] font-bold text-slate-600">Eligible for Attendance Bonus</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                         type="checkbox" 
                         checked={formData.eligibleForPaidLeaveBonus}
                         onChange={(e) => setFormData(prev => ({...prev, eligibleForPaidLeaveBonus: e.target.checked}))}
                         className="w-4 h-4 cursor-pointer accent-blue-600 rounded border-slate-300 shadow-sm"
                      />
                      <span className="text-[11px] font-bold text-slate-600">Eligible for Paid Leave Bonus</span>
                   </label>
                </div>
             </div>
          </div>

          {/* DOCUMENTS SECTION */}
          <EmployeeDocuments 
            employeeId={null} 
            documents={[]} 
            onRefresh={() => {}} 
            isHr={true} 
            mode="add" 
            localDocuments={localDocuments} 
            setLocalDocuments={setLocalDocuments} 
          />
        </div>
      </div>

      {/* ── MODALS ── */}
      <CreateDepartmentModal 
        isOpen={showDeptModal} 
        onClose={() => setShowDeptModal(false)} 
        companyId={formData.companyId}
        onSuccess={handleDeptCreated}
      />
    </div>
  );
}