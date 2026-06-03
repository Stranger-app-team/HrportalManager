import React, { useEffect, useState } from "react";
import { X, Download, Mail, Phone, Calendar, Briefcase, Award, CheckCircle, MapPin, CreditCard, Clock, Link as LinkIcon, FileText, Globe } from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { useNavigate } from "react-router-dom";
import InterviewTrackingModal from "./InterviewTrackingModal";

export default function ApplicantDetailsPanel({ applicant, onClose, onStatusChange }) {
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showHireConfirm, setShowHireConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleStatusUpdate = async (status) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/job-applications/${applicant._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
         onStatusChange(status);
      } else {
         onStatusChange(status);
      }
    } catch {
      onStatusChange(status);
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleShortlist = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/job-applications/${applicant._id}/shortlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ appliedPosition: applicant.job?.title || 'Position' })
      });
      const data = await res.json();
      if (data.success) {
         onStatusChange('hold', { interviewRecord: data.data.interviewRecord });
      } else {
         alert(data.message || "Failed to shortlist");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white z-50 shadow-2xl flex flex-col font-['Plus_Jakarta_Sans',sans-serif] animate-[slideIn_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
             <h2 className="text-[16px] font-bold text-gray-800">Application Details</h2>
             {applicant.status === 'applied' || !applicant.status ? (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wide">Applied</span>
             ) : applicant.status === 'hired' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">Hired</span>
             ) : applicant.status === 'rejected' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold uppercase tracking-wide">Rejected</span>
             ) : applicant.status === 'hold' && applicant.interviewRecord?.status === 'Selected' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">Approved</span>
             ) : applicant.status === 'hold' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold uppercase tracking-wide">Shortlisted</span>
             ) : null}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
           {/* Profile Header */}
           <div className="px-6 py-8 border-b border-gray-100 flex flex-col items-center text-center relative">
             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg mb-4 ring-4 ring-white">
                {getInitials(applicant.candidateName)}
             </div>
             <h3 className="text-xl font-black text-gray-800">{applicant.candidateName}</h3>
             <p className="text-sm text-gray-500 font-medium mt-1">{applicant.totalExperience || "Entry Level"}</p>
             
             <div className="mt-4 flex gap-3">
                <a href={`mailto:${applicant.candidateEmail}`} className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm">
                  <Mail className="w-4 h-4" />
                </a>
                <a href={`tel:${applicant.candidatePhone}`} className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition shadow-sm">
                  <Phone className="w-4 h-4" />
                </a>
                {applicant.resumeUrl && applicant.resumeUrl !== '#' && (
                  <a href={applicant.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition shadow-sm" title="Download Resume">
                    <Download className="w-4 h-4" />
                  </a>
                )}
             </div>
           </div>

           <div className="px-6 py-6 space-y-6">
             {/* Contact Info */}
             <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Contact Information</h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                   <div className="flex items-center gap-3 text-[13px] font-medium text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" /> {applicant.candidateEmail}
                   </div>
                   <div className="flex items-center gap-3 text-[13px] font-medium text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" /> {applicant.candidatePhone || "N/A"}
                   </div>
                   <div className="flex items-center gap-3 text-[13px] font-medium text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" /> Applied on {new Date(applicant.createdAt).toLocaleDateString()}
                   </div>
                </div>
             </div>

             {/* Application Details */}
             <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Details & Requirements</h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                   <div className="flex items-center gap-3 text-[13px] font-medium text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" /> {applicant.currentLocation || "Location not specified"}
                   </div>
                   <div className="flex justify-between items-center text-[13px] font-medium text-gray-700 pt-1">
                      <div className="flex items-center gap-3">
                         <CreditCard className="w-4 h-4 text-gray-400" /> Current CTC: {applicant.currentCTC || "N/A"}
                      </div>
                      <span className="text-gray-400">|</span>
                      <div className="flex items-center gap-2">
                         Expected CTC: <span className="font-bold text-gray-800">{applicant.expectedCTC || "N/A"}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 text-[13px] font-medium text-gray-700 pt-1">
                      <Clock className="w-4 h-4 text-gray-400" /> Notice Period: {applicant.noticePeriod || "N/A"}
                   </div>
                </div>
             </div>

             {/* Links */}
             {(applicant.linkedinUrl || applicant.portfolioUrl) && (
               <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">External Links</h4>
                  <div className="flex gap-3">
                     {applicant.linkedinUrl && (
                        <a href={applicant.linkedinUrl.startsWith("http") ? applicant.linkedinUrl : `https://${applicant.linkedinUrl}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 rounded-lg text-[12px] font-bold border border-blue-100 hover:bg-blue-100 transition">
                           <LinkIcon className="w-3.5 h-3.5" /> LinkedIn Profile
                        </a>
                     )}
                     {applicant.portfolioUrl && (
                        <a href={applicant.portfolioUrl.startsWith("http") ? applicant.portfolioUrl : `https://${applicant.portfolioUrl}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-50 text-gray-700 rounded-lg text-[12px] font-bold border border-gray-200 hover:bg-gray-100 transition">
                           <Globe className="w-3.5 h-3.5" /> Portfolio Site
                        </a>
                     )}
                  </div>
               </div>
             )}

             {/* Cover Letter */}
             {applicant.coverLetter && (
                <div>
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Cover Letter / Summary</h4>
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-[13px] text-gray-600 leading-relaxed italic max-h-40 overflow-y-auto">
                      "{applicant.coverLetter}"
                   </div>
                </div>
             )}
           </div>
        </div>

        {/* Footer / Actions */}
        <div className="p-6 border-t border-gray-100 bg-white">
           <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Actions</h4>
            <div className="flex flex-wrap gap-3">
               {/* View Only for Manager */}
               {applicant.status === 'hired' && (
                 <div className="flex w-full gap-3">
                    <button 
                      onClick={() => setShowInterviewModal(true)}
                      className="flex-1 py-2.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[13px] font-bold hover:bg-purple-200 transition shadow-sm"
                    >
                      View Interviews
                    </button>
                    <div className="flex-[2] py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[13px] font-bold text-center flex items-center justify-center gap-2">
                       <CheckCircle className="w-4 h-4" /> Candidate Hired
                    </div>
                 </div>
               )}
               {applicant.status === 'rejected' && (
                 <div className="flex w-full gap-3">
                    {applicant.interviewRecord && (
                       <button 
                         onClick={() => setShowInterviewModal(true)}
                         className="flex-1 py-2.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[13px] font-bold hover:bg-purple-200 transition shadow-sm"
                       >
                         View Interviews
                       </button>
                    )}
                    <div className="flex-[2] py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[13px] font-bold text-center flex items-center justify-center gap-2">
                       <X className="w-4 h-4" /> Application Rejected
                    </div>
                 </div>
               )}
               {(applicant.status === 'applied' || applicant.status === 'hold' || !applicant.status) && (
                 <div className="flex w-full gap-3">
                    {applicant.interviewRecord && (
                       <button 
                         onClick={() => setShowInterviewModal(true)}
                         className="flex-1 py-2.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[13px] font-bold hover:bg-purple-200 transition shadow-sm"
                       >
                         View Interviews
                       </button>
                    )}
                 </div>
               )}
            </div>
        </div>
      </div>
      
      {showInterviewModal && (
         <InterviewTrackingModal 
            applicant={applicant} 
            onClose={() => setShowInterviewModal(false)} 
            onApplicationReject={() => handleStatusUpdate('rejected')}
            onInterviewApprove={() => {
               if (applicant.interviewRecord) {
                  onStatusChange('hold', { 
                     interviewRecord: { 
                        ...(typeof applicant.interviewRecord === 'object' ? applicant.interviewRecord : { _id: applicant.interviewRecord }), 
                        status: 'Selected' 
                     }
                  });
               }
            }}
         />
      )}

      {/* Hire Confirmation Modal */}
        {showHireConfirm && (
           <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl font-['Plus_Jakarta_Sans',sans-serif]">
                 <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                 </div>
                 <h3 className="text-[18px] font-black text-gray-900 mb-2">Proceed with Hiring?</h3>
                 <p className="text-[13px] text-gray-500 mb-6 font-medium">
                    You are about to hire <span className="font-bold text-gray-800">{applicant.candidateName}</span>. You will be redirected to the Add Employee page to securely complete their onboarding.
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setShowHireConfirm(false)}
                       className="flex-1 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-[13px] font-bold hover:bg-gray-100 transition"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={() => navigate(`/dashboard/add-employee?importCandidateId=${applicant._id}`)}
                       className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-[13px] font-bold hover:bg-emerald-700 transition"
                    >
                       Continue to Onboard
                    </button>
                 </div>
              </div>
           </div>
        )}

      {showRejectConfirm && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col font-['Plus_Jakarta_Sans',sans-serif] animate-in zoom-in-95 duration-200">
               <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <X className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-[18px] font-black text-gray-800 mb-2">Reject Application?</h3>
                  <p className="text-[13px] text-gray-500">
                     Are you sure you want to reject <strong>{applicant.candidateName}</strong>? This action will notify the applicant and mark their status as rejected.
                  </p>
               </div>
               <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 rounded-b-2xl">
                  <button 
                     onClick={() => setShowRejectConfirm(false)} 
                     disabled={updating}
                     className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={() => {
                        setShowRejectConfirm(false);
                        handleStatusUpdate('rejected');
                     }} 
                     disabled={updating}
                     className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[13px] font-bold hover:bg-red-700 transition shadow-sm"
                  >
                     {updating ? "Rejecting..." : "Yes, Reject"}
                  </button>
               </div>
            </div>
         </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-\\[slideIn_0\\.3s_ease-out\\] {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
