import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { useParams, useNavigate } from "react-router-dom";
import { X, ChevronDown, Eye, EyeOff, Info, Briefcase, MapPin, Lock, CreditCard, Paperclip, Monitor, Laptop, CheckCircle, Smartphone, Speaker, Keyboard, Mouse, Upload, Calendar, Clock, User } from "lucide-react";
import { getFullUrl } from '../utils/urlHelper';
import AttendanceHistoryModal from "../components/Employees/AttendanceHistoryModal";
import EmployeeDocuments from "../components/Employees/EmployeeDocuments";
import EmployeeWarnings from "../components/Employees/EmployeeWarnings";
import IssueWarningModal from "../components/Employees/IssueWarningModal";
import { ChevronRight, AlertTriangle } from "lucide-react";

const SecHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm shrink-0">
      <Icon size={14} />
    </div>
    <div>
      <h2 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider leading-none">{title}</h2>
      <p className="text-[9px] text-gray-400 font-medium mt-0.5">{subtitle}</p>
    </div>
  </div>
);

const F = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full h-8 border border-gray-100 rounded-lg px-3 text-xs text-gray-700 bg-gray-50 flex items-center";

const DataBox = ({ label, value }) => (
  <F label={label}>
    <div className={inputCls}>
      <span className="text-xs text-gray-700 font-medium truncate">{value || "—"}</span>
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
  const [showIssueWarningModal, setShowIssueWarningModal] = useState(false);
  const [refreshWarnings, setRefreshWarnings] = useState(0);

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
        <div className="w-full px-4 h-11 flex items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIssueWarningModal(true)}
              className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-100 transition-all"
            >
              <AlertTriangle size={13} /> Action
            </button>
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-all"
            >
              <Calendar size={13} /> Attendance
            </button>
            {!isManager && (
              <button
                onClick={() => navigate(`/dashboard/edit-employee/${employeeId}`)}
                className="flex items-center gap-1.5 bg-[#0B2D5C] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-[#0B2D5C]/20 hover:bg-[#1a3a6c] transition-all"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-3 no-scrollbar">
        <div className="w-full space-y-4">

          {/* TOP SECTION: Photo + Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Profile Photo */}
            <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
              <SecHeader icon={CheckCircle} title="Verification" subtitle="Status: Active" />
              <div className="relative mt-1">
                <div className="w-20 h-20 rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center">
                  <img src={imageUrl} className="w-full h-full object-cover" alt="Profile" />
                </div>
              </div>
              <div className="text-center mt-3 w-full">
                <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">{employee.user?.name}</h3>
                <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                  <Briefcase size={10} /> {employee.designation}
                </p>
                <div className="mt-2.5 bg-gray-50 p-2 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-gray-400 font-bold uppercase text-[8px] tracking-widest mb-1">Reporting Manager</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                      <User size={10} className="text-blue-600" />
                    </div>
                    <p className="text-[10px] text-gray-700 font-bold leading-tight">
                      {employee.managers?.length > 0 ? employee.managers.map(m => m.name).join(", ") : (employee.manager?.name || "Direct to Company")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <SecHeader icon={Info} title="Personal Detail" subtitle="Identity and contact" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <SecHeader icon={Briefcase} title="Organization Structure" subtitle="Placement and role" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <DataBox label="Company" value={getCompanyName(employee.user?.companyId)} />
              <DataBox label="Department" value={typeof employee.department === "string" ? employee.department : (employee.department?.departmentName || employee.department?.name || "General")} />
              <DataBox label="Designation" value={employee.designation} />
              <DataBox label="Reporting Manager" value={employee.managers?.length > 0 ? employee.managers.map(m => m.name).join(", ") : (employee.manager?.name || "Direct to Company")} />
              <DataBox label="Employment Type" value={employee.employmentType || "Full Time"} />
              <DataBox label="Work Location" value={employee.workLocation || "Office"} />
              <DataBox label="Employee ID" value={employee.employeeId} />
              <DataBox label="Current Status" value={employee.status} />
              <DataBox label="Shift Timing" value={`${employee.shiftStartTime || "09:00"} - ${employee.shiftEndTime || "18:00"}`} />
            </div>
          </div>

          {/* ASSETS SECTION */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <SecHeader icon={Monitor} title="Assets Inventory" subtitle="Equipment assignment" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {!employee.assets || employee.assets.length === 0 ? (
                <p className="text-xs text-gray-400 col-span-5 italic">No assets assigned to this employee.</p>
              ) : (
                employee.assets.map(asset => (
                  <div key={asset._id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-sm flex items-center justify-center shrink-0">
                      {getAssetIcon(asset.assetType)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-800 truncate">{asset.assetName}</p>
                      <p className="text-[9px] text-gray-400 truncate">{asset.assetId}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* REMAINING SECTIONS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Address */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <SecHeader icon={MapPin} title="Full Address" subtitle="Location presence" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><DataBox label="Address Line" value={employee.location?.addressLine} /></div>
                <DataBox label="City" value={employee.location?.city} />
                <DataBox label="Pincode" value={employee.location?.pincode} />
              </div>
            </div>

            {/* Portal Access */}
            {!isManager && (
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <SecHeader icon={Lock} title="Portal Access" subtitle="Login credentials" />
                <div className="space-y-4">
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
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <SecHeader icon={CreditCard} title="Payroll & Banking" subtitle="Salary disbursement" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <F label="Monthly Salary (₹)">
                  <div className={`${inputCls} justify-between pr-2`}>
                    <span className="text-xs text-gray-700 font-medium truncate">
                      {employee.salary ? (showSalary ? `₹${employee.salary.toLocaleString()}` : "••••••") : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSalary(!showSalary)}
                      className="text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center shrink-0"
                    >
                      {showSalary ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </F>
                <DataBox label="A/C Number" value={employee.bankDetails?.accountNumber} />
                <DataBox label="Bank Name" value={employee.bankDetails?.bankName} />
                <DataBox label="IFSC Code" value={employee.bankDetails?.ifsc} />
                <div className="flex items-center gap-5 md:col-span-4 mt-1">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={employee.eligibleForAttendanceBonus !== false}
                      readOnly
                      className="w-3.5 h-3.5 accent-blue-600 rounded border-slate-300 shadow-sm opacity-80 cursor-not-allowed"
                    />
                    <span className="text-[10px] font-bold text-slate-600">Eligible For Attendance Bonus</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={employee.eligibleForPaidLeaveBonus !== false}
                      readOnly
                      className="w-3.5 h-3.5 accent-blue-600 rounded border-slate-300 shadow-sm opacity-80 cursor-not-allowed"
                    />
                    <span className="text-[10px] font-bold text-slate-600">Eligible For Paid Leave Bonus</span>
                  </label>
                </div>
              </div>

              {/* Salary History List */}
              {employee.salaryHistory && employee.salaryHistory.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={12} className="text-blue-500" />
                    <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Salary Revision History</h3>
                  </div>
                  <div className="space-y-2">
                    {[...employee.salaryHistory].reverse().map((record, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 group hover:border-blue-100 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Previous</span>
                            <span className="text-xs font-bold text-gray-500">₹{record.previousSalary?.toLocaleString() || 0}</span>
                          </div>
                          <div className="w-3 h-px bg-slate-200" />
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">New</span>
                            <span className="text-xs font-bold text-blue-600">₹{record.newSalary?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                        <div className="flex-1 px-4">
                          <p className="text-[10px] font-medium text-gray-600 line-clamp-1 italic">"{record.remark || 'No remark provided'}"</p>
                          <p className="text-[8px] text-gray-400 mt-0.5">Changed on {new Date(record.changedAt).toLocaleDateString()} by {record.changedBy?.name || 'Admin'}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase">
                          {((record.newSalary - record.previousSalary) / (record.previousSalary || 1) * 100).toFixed(1)}% {record.newSalary > record.previousSalary ? '↑' : '↓'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS + WARNINGS — no gap between them */}
          <div className="space-y-0">
            <EmployeeDocuments
              employeeId={employeeId}
              documents={employee.documents || []}
              onRefresh={fetchInitialData}
              isHr={false}
              mode="readOnly"
            />
            <EmployeeWarnings
              employeeId={employee._id}
              refreshTrigger={refreshWarnings}
            />
          </div>
        </div>
      </div>

      {/* ATTENDANCE HISTORY MODAL */}
      <AttendanceHistoryModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        userId={employee?.user?._id}
      />

      {showIssueWarningModal && (
        <IssueWarningModal
          employeeId={employee._id}
          onClose={() => setShowIssueWarningModal(false)}
          onSuccess={() => setRefreshWarnings(prev => prev + 1)}
        />
      )}
    </div>
  );
}