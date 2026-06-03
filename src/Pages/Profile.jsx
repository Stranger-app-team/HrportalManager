import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { useParams, useNavigate } from "react-router-dom";
import { X, ChevronDown, Eye, EyeOff, Info, Briefcase, MapPin, Lock, CreditCard, Paperclip, Monitor, Laptop, CheckCircle, Smartphone, Speaker, Keyboard, Mouse, Upload, Calendar, Clock, User } from "lucide-react";
import { getFullUrl } from '../utils/urlHelper';
import AttendanceHistoryModal from "../components/Employees/AttendanceHistoryModal";
import EmployeeDocuments from "../components/Employees/EmployeeDocuments";

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

const F = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full h-10 border border-gray-100 rounded-xl px-4 text-sm text-gray-700 bg-gray-50/30 flex items-center";

const DataBox = ({ label, value }) => (
  <F label={label}>
    <div className={inputCls}>
      <span className="text-sm text-gray-700 font-medium truncate">{value || "—"}</span>
    </div>
  </F>
);

export default function Profile() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isManager = loggedInUser.userType === 'manager';
  const [employee, setEmployee] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [showSalary, setShowSalary] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Companies
      const cRes = await fetch(`${API_BASE_URL}/company`, { headers });
      const cData = await cRes.json();
      setCompanies(cData.company || []);

      // Fetch Employee
      const response = await fetch(`${API_BASE_URL}/employee/${employeeId}`, { headers });
      if (!response.ok) throw new Error("Failed to fetch employee");
      const result = await response.json();
      console.log("Employee Profile Response:", result);
      setEmployee(result); 
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };



  useEffect(() => {
    if (employeeId) fetchInitialData();
  }, [employeeId]);

  const getCompanyName = (id) => {
    const comp = companies.find(c => c._id === id);
    return comp ? comp.companyName : "N/A";
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 font-bold animate-pulse">
        Fetching Employee Profile...
      </div>
    );
  }

  const imageUrl = employee.profilePhoto
    ? getFullUrl(employee.profilePhoto, API_BASE_URL)
    : `https://ui-avatars.com/api/?name=${employee.user?.name || "Employee"}&background=0B2D5C&color=ffffff`;

  const getAssetIcon = (type) => {
    switch (String(type).toLowerCase()) {
      case 'laptop': return <Laptop size={16} />;
      case 'mobile': case 'smartphone': return <Smartphone size={16} />;
      case 'monitor': return <Monitor size={16} />;
      case 'headset': return <Speaker size={16} />;
      case 'keyboard': return <Keyboard size={16} />;
      case 'mouse': return <Mouse size={16} />;
      default: return <Monitor size={16} />;
    }
  };

  return (
    <div className="h-screen bg-[#F8FAFC] font-[Plus Jakarta Sans] flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0 z-20">
        <div className="w-full px-4 h-14 flex items-center justify-end gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAttendanceModal(true)}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100 hover:bg-emerald-100 transition-all"
            >
              <Calendar size={16} /> Attendance
            </button>
            {!isManager && (
            <button 
              onClick={() => navigate(`/dashboard/edit-employee/${employeeId}`)}
              className="flex items-center gap-2 bg-[#0B2D5C] text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#0B2D5C]/10 hover:bg-[#1a3a6c] transition-all"
            >
              Edit Profile
            </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 no-scrollbar">
        <div className="w-full space-y-8">
          
          {/* TOP SECTION: Photo + Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             {/* Profile Photo */}
             <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40 flex flex-col items-center">
                <SecHeader icon={CheckCircle} title="Verification" subtitle="Status: Active" />
                <div className="relative mt-4">
                   <div className="w-32 h-32 rounded-[40px] border-4 border-gray-50 overflow-hidden shadow-inner bg-gray-50 flex items-center justify-center">
                      <img src={imageUrl} className="w-full h-full object-cover" alt="Profile" />
                   </div>
                </div>
                <div className="text-center mt-6 w-full">
                   <h3 className="text-base font-extrabold text-gray-900 tracking-tight">{employee.user?.name}</h3>
                   <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1 flex items-center justify-center gap-1.5">
                      <Briefcase size={12} /> {employee.designation}
                   </p>
                   <div className="mt-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100/80 shadow-sm">
                      <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mb-1">Reporting Manager</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                          <User size={12} className="text-blue-600" />
                        </div>
                        <p className="text-[11px] text-gray-700 font-bold">
                          {employee.managers?.length > 0 ? employee.managers.map(m => m.name).join(", ") : (employee.manager?.name || "Direct to Company")}
                        </p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Personal Info */}
             <div className="lg:col-span-3 bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40">
                <SecHeader icon={Info} title="Personal Detail" subtitle="Identity and contact" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <DataBox label="Full Name" value={employee.user?.name} />
                   <DataBox label="Personal Email" value={employee.personalEmail} />
                   <DataBox label="Contact Number" value={employee.phone} />
                   <DataBox label="Gender" value={employee.gender} />
                   <DataBox label="Date of Birth" value={employee.dob ? employee.dob.split("T")[0] : ""} />
                   <DataBox label="Joining Date" value={employee.joiningDate ? employee.joiningDate.split("T")[0] : ""} />
                </div>
             </div>
          </div>

          {/* WORK INFO SECTION */}
          <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40">
             <SecHeader icon={Briefcase} title="Organization Structure" subtitle="Placement and role" />
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DataBox label="Company" value={getCompanyName(employee.user?.companyId)} />
                <DataBox label="Department" value={typeof employee.department === "string" ? employee.department : (employee.department?.departmentName || employee.department?.name || "General")} />
                <DataBox label="Designation" value={employee.designation} />
                <DataBox label="Reporting Manager" value={employee.managers?.length > 0 ? employee.managers.map(m => m.name).join(", ") : (employee.manager?.name || "Direct to Company")} />
                <DataBox label="Employment Type" value={employee.employmentType || "Full Time"} />
                <DataBox label="Work Location" value={employee.workLocation || "Office"} />
                <DataBox label="Employee ID" value={employee.employeeId} />
                <DataBox label="Current Status" value={employee.status} />
             </div>
          </div>

          {/* ASSETS SECTION */}
          <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-lg shadow-slate-200/40">
             <SecHeader icon={Monitor} title="Assets Inventory" subtitle="Equipment assignment" />
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {!employee.assets || employee.assets.length === 0 ? (
                  <p className="text-xs text-gray-400 col-span-4 italic">No assets assigned to this employee.</p>
                ) : (
                  employee.assets.map(asset => (
                    <div key={asset._id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                        {getAssetIcon(asset.assetType)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{asset.assetName}</p>
                        <p className="text-[10px] text-gray-400">{asset.assetId}</p>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* REMAINING SECTIONS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Address */}
             <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                <SecHeader icon={MapPin} title="Full Address" subtitle="Location presence" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2"><DataBox label="Address Line" value={employee.location?.addressLine} /></div>
                   <DataBox label="City" value={employee.location?.city} />
                   <DataBox label="Pincode" value={employee.location?.pincode} />
                </div>
             </div>

             {/* Portal Access */}
             {!isManager && (
             <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                <SecHeader icon={Lock} title="Portal Access" subtitle="Login credentials" />
                <div className="space-y-6">
                   <DataBox label="Office Email" value={employee.user?.email} />
                   <div className="grid grid-cols-2 gap-4">
                      <DataBox label="System Role" value={employee.user?.userType} />
                      <DataBox label="Account Status" value={employee.user?.status || "Active"} />
                   </div>
                </div>
             </div>
             )}
          </div>

          {/* BANKING SECTION */}
          {!isManager && (
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
             <SecHeader icon={CreditCard} title="Payroll & Banking" subtitle="Salary disbursement" />
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <F label="Monthly Salary (₹)">
                  <div className={`${inputCls} justify-between pr-4`}>
                    <span className="text-sm text-gray-700 font-medium truncate">
                      {employee.salary ? (showSalary ? `₹${employee.salary.toLocaleString()}` : "••••••") : "—"}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowSalary(!showSalary)} 
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showSalary ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </F>
                <DataBox label="A/C Number" value={employee.bankDetails?.accountNumber} />
                <DataBox label="Bank Name" value={employee.bankDetails?.bankName} />
                <DataBox label="IFSC Code" value={employee.bankDetails?.ifsc} />
             </div>

             {/* Salary History List */}
             {employee.salaryHistory && employee.salaryHistory.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Info size={14} className="text-blue-500" />
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Salary Revision History</h3>
                  </div>
                  <div className="space-y-3">
                    {[...employee.salaryHistory].reverse().map((record, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Previous</span>
                            <span className="text-sm font-bold text-gray-500">₹{record.previousSalary?.toLocaleString() || 0}</span>
                          </div>
                          <div className="w-4 h-px bg-slate-200" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">New</span>
                            <span className="text-sm font-bold text-blue-600">₹{record.newSalary?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                        <div className="flex-1 px-8">
                          <p className="text-[11px] font-medium text-gray-600 line-clamp-1 italic">"{record.remark || 'No remark provided'}"</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">Changed on {new Date(record.changedAt).toLocaleDateString()} by {record.changedBy?.name || 'Admin'}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[9px] font-bold uppercase">
                          {((record.newSalary - record.previousSalary) / (record.previousSalary || 1) * 100).toFixed(1)}% {record.newSalary > record.previousSalary ? '↑' : '↓'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
          )}

          {/* DOCUMENTS SECTION */}
          <EmployeeDocuments 
            employeeId={employeeId} 
            documents={employee.documents || []} 
            onRefresh={fetchInitialData} 
            isHr={false} 
            mode="readOnly" 
          />
        </div>
      </div>

      {/* ATTENDANCE HISTORY MODAL */}
      <AttendanceHistoryModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        userId={employee?.user?._id}
      />
    </div>
  );
}