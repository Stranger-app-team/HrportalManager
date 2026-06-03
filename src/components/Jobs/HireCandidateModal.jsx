import React, { useState } from "react";
import { X, CheckCircle, Briefcase, DollarSign, Calendar, Lock } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export default function HireCandidateModal({ applicant, onClose, onHireSuccess }) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    designation: applicant.job?.title || "",
    department: "",
    salary: "",
    joiningDate: "",
    employmentType: applicant.job?.employmentType || "full-time",
    newPassword: ""
  });

  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("token");
        const companyId = applicant.companyId || applicant.enterpriseId;
        const res = await fetch(`${API_BASE_URL}/department/company?companyId=${companyId}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await res.json();
        setDepartments(data.department || []);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepartments();
  }, [applicant]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleHire = async (e) => {
    e.preventDefault();
    if (!formData.designation || !formData.salary || !formData.joiningDate) {
       return alert("Please fill in required fields.");
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/job-applications/${applicant._id}/hire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
         onHireSuccess();
      } else {
         alert(data.message || "Failed to hire candidate");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred while hiring");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl">
               <div className="text-white">
                  <h2 className="text-[18px] font-black flex items-center gap-2">
                     <CheckCircle className="w-5 h-5" /> Hire Candidate
                  </h2>
                  <p className="text-[13px] font-medium opacity-90 mt-1">Configure employee profile for {applicant.candidateName}</p>
               </div>
               <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition">
                  <X className="w-5 h-5" />
               </button>
            </div>

            {/* Form */}
            <form onSubmit={handleHire} className="p-6 space-y-4">
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Designation</label>
                     <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" required name="designation" value={formData.designation} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Department</label>
                     <select name="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition">
                        <option value="">Select Department</option>
                        {departments.map(d => (
                           <option key={d._id} value={d._id}>{d.departmentName}</option>
                        ))}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Annual Salary</label>
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" required name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. 60000" className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Employment Type</label>
                     <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition">
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Joining Date</label>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="date" required name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1 flex justify-between">
                        Temporary Password <span className="text-gray-400 normal-case font-medium">(Optional)</span>
                     </label>
                     <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="Leaves auto-generated if blank" className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition" />
                     </div>
                  </div>
               </div>

               <div className="pt-4 flex gap-3 justify-end">
                  <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition">
                     Cancel
                  </button>
                  <button type="submit" disabled={loading} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[13px] font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-wait">
                     {loading ? "Processing..." : "Complete Hiring"}
                  </button>
               </div>
            </form>
         </div>
      </div>
    </>
  );
}
