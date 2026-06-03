import React, { useState, useEffect } from "react";
import { Search, Download, Eye, Clock, CheckCircle, User, Briefcase, Mail, Phone, Calendar, ChevronRight, X } from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import ApplicantDetailsPanel from "./ApplicantDetailsPanel";

export default function JobApplicants({ job }) {
  const jobId = job?._id || job?.id;
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/job-applications/job/${jobId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      const data = await res.json();
      console.log("Job Applicants API Response:", data);
      if (data.success && data.data && Array.isArray(data.data.applications)) {
         setApplicants(data.data.applications);
      } else {
         setError(data.message || "Failed to load applicants");
         setApplicants([]);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch applicants");
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_MAP = {
    'applied': 'Pending',
    'hold': 'Shortlisted/Interviewing',
    'hired': 'Hired',
    'rejected': 'Rejected'
  };

  const STATUS_PRIORITY = { 'applied': 1, 'hold': 2, 'hired': 3, 'rejected': 4 };

  const safeApplicants = Array.isArray(applicants) ? applicants : [];
  
  let filtered = safeApplicants.filter(a => {
    const matchesSearch = a.candidateName?.toLowerCase().includes(search.toLowerCase()) || 
                          a.candidateEmail?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  filtered = filtered.sort((a, b) => {
    const pA = STATUS_PRIORITY[a.status] || 99;
    const pB = STATUS_PRIORITY[b.status] || 99;
    if (pA !== pB) return pA - pB;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const STATUS_STYLES = {
    'applied': 'bg-orange-50 text-orange-600 border-orange-200',
    'hold': 'bg-purple-50 text-purple-600 border-purple-200',
    'hired': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'rejected': 'bg-red-50 text-red-600 border-red-200',
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const calculateMatchScore = (applicantSkills) => {
    const normalize = (skillList) => {
        if (!skillList) return [];
        if (Array.isArray(skillList)) return skillList.map(s => s.toLowerCase().trim());
        if (typeof skillList === 'string') return skillList.split(/,|\n/).map(s => s.toLowerCase().trim()).filter(Boolean);
        return [];
    };

    const required = normalize(job.skillsRequired);
    const provided = normalize(applicantSkills);

    if (required.length === 0) return 100; // No skills required = 100% match
    if (provided.length === 0) return 0;   // Skills required but none provided = 0% match

    let matched = 0;
    required.forEach(reqSkill => {
      // Check if candidate has a skill that closely matches the required skill
      if (provided.some(provSkill => provSkill.includes(reqSkill) || reqSkill.includes(provSkill))) {
        matched++;
      }
    });

    return Math.min(Math.round((matched / required.length) * 100), 100);
  };

  return (
    <div className="flex flex-col h-full font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
         <div>
            <h3 className="text-[15px] font-bold text-gray-800">Applicants ({applicants.length})</h3>
         </div>
         <div className="flex items-center gap-3 w-full sm:w-auto">
           <div className="relative w-full sm:w-56">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
             <input 
                type="text" 
                placeholder="Search candidates..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
             />
           </div>
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
           >
             <option value="All">All Status</option>
             <option value="applied">Pending</option>
             <option value="hold">Shortlisted/Interviewing</option>
             <option value="hired">Hired</option>
             <option value="rejected">Rejected</option>
           </select>
         </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
           {[1,2,3,4].map(i => (
             <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 h-32" />
           ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
             <User className="w-8 h-8 text-gray-300" />
           </div>
           <h4 className="text-gray-700 font-bold mb-1">No applicants found</h4>
           <p className="text-sm text-gray-400">Try adjusting your search or check back later.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-[13px]">
               <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                 <tr>
                   <th className="px-5 py-4">Candidate</th>
                   <th className="px-5 py-4">Contact</th>
                   <th className="px-5 py-4">Applied Date</th>
                   <th className="px-5 py-4">Status</th>
                   <th className="px-5 py-4">Resume</th>
                   <th className="px-5 py-4 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {filtered.map(applicant => (
                   <tr 
                     key={applicant._id} 
                     className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                     onClick={() => setSelectedApplicant(applicant)}
                   >
                     <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                              {getInitials(applicant.candidateName)}
                           </div>
                           <div>
                              <p className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                {applicant.candidateName}
                              </p>
                               <p className="text-[11px] text-gray-500 font-medium">{applicant.totalExperience || 'Entry Level'}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600 font-medium mb-1">
                           <Mail className="w-3 h-3 text-gray-400" /> {applicant.candidateEmail}
                        </div>
                        {applicant.candidatePhone && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                             <Phone className="w-3 h-3 text-gray-400" /> {applicant.candidatePhone}
                          </div>
                        )}
                     </td>
                     <td className="px-5 py-4 text-gray-600 font-medium">
                        {new Date(applicant.createdAt).toLocaleDateString()}
                     </td>
                     <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${STATUS_STYLES[applicant.status] || STATUS_STYLES['applied']}`}>
                          {STATUS_MAP[applicant.status] || applicant.status}
                        </span>
                     </td>
                     <td className="px-5 py-4">
                        {applicant.resumeUrl && applicant.resumeUrl !== '#' ? (
                           <a href={applicant.resumeUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-[11px] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg w-max transition-colors">
                              <Download className="w-3.5 h-3.5" /> Resume
                           </a>
                        ) : (
                           <span className="text-gray-400 text-[11px] italic">No Resume</span>
                        )}
                     </td>
                     <td className="px-5 py-4 text-right">
                        <button className="text-blue-600 font-bold text-[11px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 ml-auto">
                           Review <ChevronRight className="w-3 h-3" />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {selectedApplicant && (
        <ApplicantDetailsPanel 
           applicant={selectedApplicant} 
           onClose={() => setSelectedApplicant(null)} 
           onStatusChange={(newStatus, additionalData = {}) => {
              setApplicants(prev => prev.map(a => a._id === selectedApplicant._id ? { ...a, status: newStatus, ...additionalData } : a));
              setSelectedApplicant({ ...selectedApplicant, status: newStatus, ...additionalData });
           }}
        />
      )}
    </div>
  );
}
