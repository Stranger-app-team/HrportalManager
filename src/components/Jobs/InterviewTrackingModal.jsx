import React, { useEffect, useState, useRef } from "react";
import { X, Plus, Calendar, Clock, CheckCircle, MessageSquare, User, Search, ChevronDown, Check, Edit2 } from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export default function InterviewTrackingModal({ applicant, onClose, onApplicationReject, onInterviewApprove }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  
  // New Round Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [interviewer, setInterviewer] = useState(""); // Stores User ID
  const [dateTime, setDateTime] = useState("");
  const [feedback, setFeedback] = useState("");

  // Final Decision Form
  const [finalFeedback, setFinalFeedback] = useState("");

  // Edit Round State
  const [editingRoundId, setEditingRoundId] = useState(null);
  const [editingFeedback, setEditingFeedback] = useState("");
  const [editingInterviewer, setEditingInterviewer] = useState("");
  const [editingDateTime, setEditingDateTime] = useState("");

  // Custom Dropdown State (Add Round)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchInterviewer, setSearchInterviewer] = useState("");
  const dropdownRef = useRef(null);

  // Custom Dropdown State (Edit Round)
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
  const [searchEditInterviewer, setSearchEditInterviewer] = useState("");
  const editDropdownRef = useRef(null);

  useEffect(() => {
    fetchInterviewRecord();
    fetchEmployees();
  }, [applicant]);

  // Handle outside click for custom dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target)) {
        setIsEditDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchInterviewRecord = async () => {
    setLoading(true);
    try {
      const recordId = applicant.interviewRecord?._id || applicant.interviewRecord;
      if (!recordId) throw new Error("No Interview Record found");
      
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/interview-records/${recordId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setRecord(data.data);
        if (data.data.rounds) {
           setRoundNumber(data.data.rounds.length + 1);
        }
        setFinalFeedback(data.data.hrManagerFeedback || "");
      }
    } catch (err) {
      console.error("Error fetching interview record:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/employee`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
         setEmployees(data);
      } else if (data.data && Array.isArray(data.data)) {
         setEmployees(data.data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const handleAddRound = async (e) => {
    e.preventDefault();
    if (!interviewer || !dateTime) return alert("Please select an interviewer and date.");
    
    try {
      const recordId = record._id;
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/interview-records/${recordId}/add-round`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
           roundNumber,
           interviewer,
           dateTime,
           feedback
        })
      });
      const data = await res.json();
      if (data.success) {
         fetchInterviewRecord();
         setShowAddForm(false);
         setFeedback("");
         setInterviewer("");
         setSearchInterviewer("");
         setDateTime("");
      } else {
         alert(data.message || "Failed to add round");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRound = async (roundId) => {
    try {
      const recordId = record._id;
      const token = localStorage.getItem("token") || "";
      
      const updatedRounds = record.rounds.map(r => 
         r._id === roundId 
          ? { ...r, feedback: editingFeedback, interviewer: editingInterviewer, dateTime: editingDateTime } 
          : r
      );

      const res = await fetch(`${API_BASE_URL}/interview-records/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ rounds: updatedRounds })
      });
      const data = await res.json();
      if (data.success) {
         setEditingRoundId(null);
         setEditingFeedback("");
         setEditingInterviewer("");
         setEditingDateTime("");
         fetchInterviewRecord();
      } else {
         alert(data.message || "Failed to update round");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      const recordId = record._id;
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/interview-records/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, hrManagerFeedback: finalFeedback })
      });
      const data = await res.json();
      if (data.success) {
         fetchInterviewRecord();
         if (status === 'Rejected' && onApplicationReject) {
            onApplicationReject();
         }
         if (status === 'Selected' && onInterviewApprove) {
            onInterviewApprove();
         }
      } else {
         alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const validEmployees = employees.filter(emp => emp && emp.user && emp.user._id);
  
  // For Add Form
  const filteredEmployees = validEmployees.filter(emp => 
    emp.user.name?.toLowerCase().includes(searchInterviewer.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(searchInterviewer.toLowerCase()) ||
    emp.user.userType?.toLowerCase().includes(searchInterviewer.toLowerCase())
  );
  const selectedEmployee = validEmployees.find(emp => emp.user._id === interviewer);

  // For Edit Form
  const filteredEditEmployees = validEmployees.filter(emp => 
    emp.user.name?.toLowerCase().includes(searchEditInterviewer.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(searchEditInterviewer.toLowerCase()) ||
    emp.user.userType?.toLowerCase().includes(searchEditInterviewer.toLowerCase())
  );
  const selectedEditEmployee = validEmployees.find(emp => emp.user._id === editingInterviewer);

  const startEditing = (round) => {
     setEditingRoundId(round._id);
     setEditingFeedback(round.feedback || "");
     setEditingInterviewer(typeof round.interviewer === 'object' && round.interviewer?._id ? round.interviewer._id : round.interviewer);
     // Format date for datetime-local input (YYYY-MM-DDThh:mm)
     let dt = "";
     if (round.dateTime) {
        try { dt = new Date(round.dateTime).toISOString().slice(0, 16); } catch(e) {}
     }
     setEditingDateTime(dt);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center">
         <div className="bg-white p-8 rounded-xl w-full max-w-md animate-pulse shadow-2xl">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-100 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
         </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
       <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col font-['Inter',sans-serif] overflow-hidden">
          
          {/* Header */}
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
             <div>
                <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Interview Pipeline</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">Applicant:</span>
                  <span className="text-sm font-medium text-gray-800">{applicant.candidateName}</span>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                   record.status === 'Selected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                   record.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                   record.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                   'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                   {record.status}
                </span>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors">
                   <X className="w-5 h-5" />
                </button>
             </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#fafafa]">
             
             {/* Timeline Section */}
             <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Interview Timeline
                   </h3>
                   {/* Schedule Round button hidden for Managers */}
                </div>

                <div className="relative">
                   {/* Vertical Line */}
                   {record.rounds && record.rounds.length > 0 && (
                      <div className="absolute left-6 top-3 bottom-3 w-px bg-gray-200"></div>
                   )}

                   <div className="space-y-6">
                      {record.rounds && record.rounds.length > 0 ? record.rounds.map((round, idx) => {
                         const interviewerEmp = employees.find(e => e.user?._id === round.interviewer || (round.interviewer && e.user?._id === round.interviewer._id));
                         const interviewerName = interviewerEmp ? interviewerEmp.user.name : (typeof round.interviewer === 'object' && round.interviewer?.name ? round.interviewer.name : 'Unknown Interviewer');
                         const isEditing = editingRoundId === round._id;

                         return (
                         <div key={idx} className="relative pl-16">
                            <div className="absolute left-[19px] top-4 w-2.5 h-2.5 bg-gray-900 rounded-full ring-4 ring-[#fafafa]"></div>
                            <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm group">
                               <div className="flex justify-between items-start mb-3">
                                  <h4 className="text-sm font-semibold text-gray-900">Round {round.roundNumber}</h4>
                                  {!isEditing && (
                                    <div className="flex items-center gap-2">
                                       <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                                          <Calendar className="w-3.5 h-3.5" />
                                          {new Date(round.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                       </div>
                                       {/* Edit Round button hidden for Managers */}
                                    </div>
                                  )}
                               </div>

                               {!isEditing ? (
                                 <>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium mb-3">
                                       <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                          <User className="w-3.5 h-3.5 text-gray-500" />
                                       </div>
                                       <span>{interviewerName}</span>
                                    </div>
                                    <div className="mt-3">
                                       {round.feedback ? (
                                          <div className="text-sm text-gray-600 bg-gray-50/80 p-3.5 rounded-lg border border-gray-100 leading-relaxed">
                                             <MessageSquare className="w-4 h-4 inline-block mr-2 text-gray-400 -mt-0.5" />
                                             {round.feedback}
                                          </div>
                                       ) : (
                                          <div className="text-sm text-gray-400 italic">No feedback provided yet.</div>
                                       )}
                                    </div>
                                 </>
                               ) : (
                                 <div className="mt-4 bg-gray-50 p-5 rounded-lg border border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                       {/* Custom Edit Dropdown */}
                                       <div ref={editDropdownRef} className="relative">
                                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Interviewer</label>
                                          <div 
                                             className="w-full px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-sm focus:outline-none transition-colors cursor-pointer flex justify-between items-center shadow-sm"
                                             onClick={() => setIsEditDropdownOpen(!isEditDropdownOpen)}
                                          >
                                             <span className={selectedEditEmployee ? "text-gray-900 font-medium" : "text-gray-500"}>
                                                {selectedEditEmployee ? selectedEditEmployee.user.name : "Select an interviewer..."}
                                             </span>
                                             <ChevronDown className="w-4 h-4 text-gray-400" />
                                          </div>

                                          {isEditDropdownOpen && (
                                             <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
                                                <div className="p-2 border-b border-gray-100">
                                                   <div className="relative">
                                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                      <input 
                                                         type="text" 
                                                         placeholder="Search..." 
                                                         value={searchEditInterviewer}
                                                         onChange={e => setSearchEditInterviewer(e.target.value)}
                                                         className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                                                         autoFocus
                                                      />
                                                   </div>
                                                </div>
                                                <ul className="max-h-48 overflow-y-auto p-1">
                                                   {filteredEditEmployees.length > 0 ? filteredEditEmployees.map(emp => (
                                                      <li 
                                                         key={emp.user._id} 
                                                         onClick={() => {
                                                            setEditingInterviewer(emp.user._id);
                                                            setIsEditDropdownOpen(false);
                                                            setSearchEditInterviewer("");
                                                         }}
                                                         className="px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer flex items-center justify-between group"
                                                      >
                                                         <div>
                                                            <p className="text-sm font-medium text-gray-900 group-hover:text-black">{emp.user.name}</p>
                                                            <p className="text-xs text-gray-500">{emp.designation || emp.user.userType}</p>
                                                         </div>
                                                         {editingInterviewer === emp.user._id && <Check className="w-4 h-4 text-black" />}
                                                      </li>
                                                   )) : (
                                                      <li className="px-3 py-4 text-sm text-gray-500 text-center">No employees found.</li>
                                                   )}
                                                </ul>
                                             </div>
                                          )}
                                       </div>

                                       <div>
                                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Date & Time</label>
                                          <input 
                                             type="datetime-local" 
                                             value={editingDateTime} 
                                             onChange={e => setEditingDateTime(e.target.value)} 
                                             className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-shadow shadow-sm" 
                                          />
                                       </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                       <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Feedback / Notes</label>
                                       <textarea 
                                          value={editingFeedback} 
                                          onChange={(e) => setEditingFeedback(e.target.value)} 
                                          rows="2" 
                                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 resize-none shadow-sm"
                                       ></textarea>
                                    </div>

                                    <div className="flex justify-end gap-2 border-t border-gray-200 pt-3 mt-2">
                                       <button onClick={() => setEditingRoundId(null)} className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-sm">Cancel</button>
                                       <button onClick={() => handleUpdateRound(round._id)} className="px-4 py-1.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors shadow-sm">Save Changes</button>
                                    </div>
                                 </div>
                               )}
                            </div>
                         </div>
                      )}) : (
                         <div className="text-sm text-gray-500 italic bg-white p-6 rounded-xl border border-gray-100 text-center shadow-sm">
                            No interview rounds have been scheduled yet.
                         </div>
                      )}
                   </div>

                   {/* Add Round Form */}
                   {showAddForm && (
                      <div className="relative mt-8">
                         {record.rounds && record.rounds.length > 0 && (
                            <div className="absolute left-6 -top-8 w-px h-16 bg-gray-200"></div>
                         )}
                         <div className={record.rounds && record.rounds.length > 0 ? "pl-16 relative" : ""}>
                            {record.rounds && record.rounds.length > 0 && (
                               <div className="absolute left-[19px] top-6 w-2.5 h-2.5 bg-gray-300 rounded-full ring-4 ring-[#fafafa]"></div>
                            )}
                            
                            <form onSubmit={handleAddRound} className="bg-white border border-gray-200 p-6 rounded-xl shadow-md">
                               <h4 className="text-base font-semibold text-gray-900 mb-5">Schedule Round {roundNumber}</h4>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                  {/* Custom Searchable Dropdown */}
                                  <div ref={dropdownRef} className="relative">
                                     <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Interviewer</label>
                                     <div 
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-sm focus:outline-none transition-colors cursor-pointer flex justify-between items-center shadow-sm"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                     >
                                        <span className={selectedEmployee ? "text-gray-900 font-medium" : "text-gray-500"}>
                                           {selectedEmployee ? selectedEmployee.user.name : "Select an interviewer..."}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                     </div>

                                     {isDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
                                           <div className="p-2 border-b border-gray-100">
                                              <div className="relative">
                                                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                 <input 
                                                    type="text" 
                                                    placeholder="Search name, role..." 
                                                    value={searchInterviewer}
                                                    onChange={e => setSearchInterviewer(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                                                    autoFocus
                                                 />
                                              </div>
                                           </div>
                                           <ul className="max-h-56 overflow-y-auto p-1">
                                              {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                                                 <li 
                                                    key={emp.user._id} 
                                                    onClick={() => {
                                                       setInterviewer(emp.user._id);
                                                       setIsDropdownOpen(false);
                                                       setSearchInterviewer("");
                                                    }}
                                                    className="px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer flex items-center justify-between group"
                                                 >
                                                    <div>
                                                       <p className="text-sm font-medium text-gray-900 group-hover:text-black">{emp.user.name}</p>
                                                       <p className="text-xs text-gray-500">{emp.designation || emp.user.userType}</p>
                                                    </div>
                                                    {interviewer === emp.user._id && <Check className="w-4 h-4 text-black" />}
                                                 </li>
                                              )) : (
                                                 <li className="px-3 py-4 text-sm text-gray-500 text-center">No employees found.</li>
                                              )}
                                           </ul>
                                        </div>
                                     )}
                                  </div>
                                  
                                  <div>
                                     <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Date & Time</label>
                                     <input 
                                        type="datetime-local" 
                                        required 
                                        value={dateTime} 
                                        onChange={e => setDateTime(e.target.value)} 
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-shadow shadow-sm" 
                                     />
                                  </div>
                               </div>
                               
                               <div className="mb-6">
                                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Internal Notes / Feedback (Optional)</label>
                                  <textarea 
                                     value={feedback} 
                                     onChange={e => setFeedback(e.target.value)} 
                                     rows="2" 
                                     placeholder="Add any specific focus areas for this round..."
                                     className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 resize-none transition-shadow shadow-sm"
                                  ></textarea>
                               </div>
                               
                               <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                                  <button 
                                     type="button" 
                                     onClick={() => setShowAddForm(false)} 
                                     className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                                  >
                                     Cancel
                                  </button>
                                  <button 
                                     type="submit" 
                                     className="px-5 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
                                  >
                                     Save Round
                                  </button>
                               </div>
                            </form>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>

          {/* Footer / Final Decision */}
          {record.hrManagerFeedback && (
             <div className="p-8 border-t border-gray-200 bg-gray-50">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Final HR Assessment</label>
                <div className="text-sm text-gray-700 leading-relaxed bg-white p-4 rounded-lg border border-gray-200">
                   {record.hrManagerFeedback}
                </div>
             </div>
          )}
       </div>

       {/* Reject Confirmation Modal */}
       {showRejectConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col font-['Inter',sans-serif] animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                   <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-red-500" />
                   </div>
                   <h3 className="text-[18px] font-black text-gray-800 mb-2">Reject Candidate?</h3>
                   <p className="text-[13px] text-gray-500">
                      Are you sure you want to reject <strong>{applicant.candidateName}</strong>? This action will mark their interview as failed and application as rejected.
                   </p>
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 rounded-b-2xl">
                   <button 
                      onClick={() => setShowRejectConfirm(false)} 
                      className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition"
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={() => {
                         setShowRejectConfirm(false);
                         handleUpdateStatus('Rejected');
                      }} 
                      className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[13px] font-bold hover:bg-red-700 transition shadow-sm"
                   >
                      Yes, Reject
                   </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
