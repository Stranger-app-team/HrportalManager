import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import Modal from "../Shared/Modal";
import { API_BASE_URL } from "../../config/api";
import { FiAlertCircle, FiCheck, FiX, FiCalendar, FiFileText } from "react-icons/fi";

export default function EmployeeStatusModal({ isOpen, onClose, employee, onRefresh }) {
  if (!isOpen || !employee) return null;

  const currentStatus = String(employee.status).toLowerCase();
  
  // States
  const [selectedAction, setSelectedAction] = useState("");
  const [noticeStartDate, setNoticeStartDate] = useState("");
  const [lastWorkingDate, setLastWorkingDate] = useState("");
  const [reason, setReason] = useState("");
  const [isImmediateExit, setIsImmediateExit] = useState(false);
  
  // Pre-fill existing dates for update actions
  useEffect(() => {
    if (selectedAction === "resigned" && employee) {
      const start = employee.noticeStartDate ? employee.noticeStartDate.split('T')[0] : "";
      const end = employee.lastWorkingDate ? employee.lastWorkingDate.split('T')[0] : "";
      
      setNoticeStartDate(start);
      setLastWorkingDate(end);

      // Auto-detect if it's a mutual/custom exit
      if (start && end) {
        const diff = moment(end).diff(moment(start), 'days');
        if (![30, 45, 60, 90].includes(diff)) {
          setIsImmediateExit(true);
        }
      }
    }
  }, [selectedAction, employee]);
  
  // Checklist states
  const [exitInterviewDone, setExitInterviewDone] = useState(false);
  const [assetsReturned, setAssetsReturned] = useState(false);
  const [fullAndFinalSettled, setFullAndFinalSettled] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetState = () => {
    setSelectedAction("");
    setNoticeStartDate("");
    setLastWorkingDate("");
    setReason("");
    setExitInterviewDone(false);
    setAssetsReturned(false);
    setFullAndFinalSettled(false);
    setError("");
    setIsImmediateExit(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getAvailableActions = () => {
    switch (currentStatus) {
      case "active":
        return [
          { value: "resigned", label: "Resigned", desc: "Employee is leaving with notice" },
          { value: "terminated", label: "Terminated", desc: "Immediate dismissal" },
          { value: "inactive", label: "Mark Inactive", desc: "Direct deactivation" }
        ];
      case "resigned":
        return [
          { value: "complete_exit", label: "Complete Exit Process", desc: "Verify checklist and seal account" },
          { value: "resigned", label: "Update Notice Dates", desc: "Modify notice start or last working day" },
          { value: "withdraw", label: "Withdraw Resignation", desc: "Revert back to active" },
          { value: "terminated", label: "Terminated", desc: "Immediate dismissal during notice" }
        ];
      case "terminated":
        return [
          { value: "complete_exit", label: "Complete Exit Process", desc: "Verify checklist and seal account" },
          { value: "active", label: "Cancel Termination", desc: "Revert employee back to Active status" }
        ];
      case "notice_complete":
        return [
          { value: "complete_exit", label: "Complete Exit Process", desc: "Verify checklist and seal account" },
          { value: "resigned", label: "Update Notice Dates", desc: "Extend stay or modify dates" },
          { value: "active", label: "Cancel Resignation", desc: "Revert employee back to Active status" }
        ];
      case "inactive":
        return [
          { value: "active", label: "Reactivate Employee", desc: "Restore access and mark as Active" }
        ];
      default:
        return [];
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      let url = "";
      let method = "PATCH";
      let body = {};

      if (selectedAction === "withdraw") {
        url = `${API_BASE_URL}/employee/${employee.employeeId}/withdraw-resignation`;
        body = { reason };
      } else if (selectedAction === "complete_exit") {
        url = `${API_BASE_URL}/employee/${employee.employeeId}/complete-exit`;
        body = {
          exitInterviewDone,
          assetsReturned,
          fullAndFinalSettled,
          notes: reason
        };
      } else {
        // update status to resigned/terminated/inactive
        url = `${API_BASE_URL}/employee/${employee.employeeId}/status`;
        body = {
          newStatus: selectedAction,
          reason
        };
        if (selectedAction === "resigned") {
          if (!noticeStartDate || !lastWorkingDate) throw new Error("Please select the dates");
          body.noticeStartDate = isImmediateExit ? (noticeStartDate || moment().tz('Asia/Kolkata').format('YYYY-MM-DD')) : noticeStartDate;
          body.lastWorkingDate = lastWorkingDate;
        } else if (["terminated", "inactive"].includes(selectedAction)) {
          if (!lastWorkingDate) throw new Error("Please select the last working date");
          body.lastWorkingDate = lastWorkingDate;
        }
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Operation failed");

      onRefresh();
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const actions = getAvailableActions();

  return (
    <Modal title={`Manage Status: ${employee.user?.name || employee.firstName}`} onClose={handleClose} maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Current Status Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Status</p>
            <p className="text-sm font-bold text-slate-700 capitalize">{currentStatus.replace('_', ' ')}</p>
          </div>
          {employee.lastWorkingDate && ["resigned", "notice_complete", "terminated"].includes(currentStatus) && (
            <div className="text-right">
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Last Working Day</p>
              <p className="text-sm font-bold text-slate-700">{moment(employee.lastWorkingDate).format('DD/MM/YYYY')}</p>
            </div>
          )}
        </div>
        
        {employee.withdrawalRequested && currentStatus === "resigned" && (
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
             <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
               <FiAlertCircle size={12} /> Withdrawal Requested by Employee
             </p>
             <p className="text-xs text-slate-700 italic bg-white/50 p-2 rounded border border-rose-100/50 mt-1">
               "{employee.withdrawalRequestReason || 'No reason provided'}"
             </p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-xs font-medium flex items-center gap-2 border border-rose-100">
            <FiAlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Action Selection */}
        {!selectedAction ? (
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
              Select Action
            </label>
            <div className="grid gap-2">
              {actions.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No actions available for this status.</p>
              ) : (
                actions.map((act) => (
                  <div
                    key={act.value}
                    onClick={() => setSelectedAction(act.value)}
                    className="border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
                  >
                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">{act.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{act.desc}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Form Details */
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
              <button onClick={() => setSelectedAction("")} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">
                ← Back
              </button>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {actions.find(a => a.value === selectedAction)?.label}
              </span>
            </div>

            {selectedAction === "resigned" && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                {/* Mutual Exit Checkbox */}
                <div 
                  className="bg-amber-50 p-3 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-all"
                  onClick={() => {
                    const nextValue = !isImmediateExit;
                    setIsImmediateExit(nextValue);
                    // Clear dates when toggling modes as requested
                    setNoticeStartDate("");
                    setLastWorkingDate("");
                  }}
                >
                   <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isImmediateExit ? 'bg-amber-500 border-amber-500 text-white' : 'border-amber-300 bg-white group-hover:border-amber-400'}`}>
                        {isImmediateExit && <FiCheck size={10} />}
                      </div>
                      <span className="text-xs font-bold text-amber-900 select-none uppercase tracking-tight">Mutual Exit (Waive Notice Period)</span>
                   </div>
                   <p className="text-[10px] text-amber-700 mt-1">Waives the standard notice duration. You can set any Last Working Day by mutual agreement.</p>
                </div>

                {!isImmediateExit ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 px-1">Notice Start</label>
                        <div className="relative">
                          <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            type="date" 
                            value={noticeStartDate || moment().tz('Asia/Kolkata').add(1, 'day').format('YYYY-MM-DD')} 
                            onChange={e => {
                              const newStart = e.target.value;
                              setNoticeStartDate(newStart);
                              
                              // Recalculate LWD if a standard duration is selected
                              const diff = moment(lastWorkingDate).diff(moment(noticeStartDate), 'days');
                              if ([30, 45, 60, 90].includes(diff)) {
                                setLastWorkingDate(moment(newStart).add(diff, 'days').format('YYYY-MM-DD'));
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-700"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 px-1">Notice Duration</label>
                        <select 
                          value={(() => {
                            if (!noticeStartDate || !lastWorkingDate) return "";
                            const diff = moment(lastWorkingDate).diff(moment(noticeStartDate || moment().tz('Asia/Kolkata').add(1, 'day').format('YYYY-MM-DD')), 'days');
                            return [30, 45, 60, 90].includes(diff) ? String(diff) : (lastWorkingDate ? "custom" : "");
                          })()}
                          onChange={(e) => {
                            const days = e.target.value;
                            const start = noticeStartDate || moment().tz('Asia/Kolkata').add(1, 'day').format('YYYY-MM-DD');
                            if (!noticeStartDate) setNoticeStartDate(start);
                            
                            if (days !== "custom" && days !== "") {
                              const calculatedLwd = moment(start).add(parseInt(days), 'days').format('YYYY-MM-DD');
                              setLastWorkingDate(calculatedLwd);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-700"
                        >
                          <option value="">Select Duration</option>
                          <option value="30">30 Days</option>
                          <option value="45">45 Days</option>
                          <option value="60">60 Days</option>
                          <option value="90">90 Days</option>
                          <option value="custom">Custom Range</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 px-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Last Working Day</label>
                        {lastWorkingDate && (
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 animate-in fade-in zoom-in duration-300">
                            {moment(lastWorkingDate).diff(moment(noticeStartDate || moment().tz('Asia/Kolkata').add(1, 'day').format('YYYY-MM-DD')), 'days')} Days Notice
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          type="date" 
                          value={lastWorkingDate} 
                          onChange={e => setLastWorkingDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-700"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 px-1">* Notice period starts from {moment(noticeStartDate || moment().tz('Asia/Kolkata').add(1, 'day')).format('DD MMM')}.</p>
                    </div>
                  </>
                ) : (
                  /* MUTUAL EXIT VIEW: Show only LWD */
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 px-1">Agreed Last Working Day</label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="date" 
                        value={lastWorkingDate} 
                        onChange={e => {
                           setLastWorkingDate(e.target.value);
                           if (!noticeStartDate) {
                              setNoticeStartDate(moment().tz('Asia/Kolkata').format('YYYY-MM-DD'));
                           }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-amber-500 transition-all text-slate-700"
                      />
                    </div>
                    <p className="text-[10px] text-amber-600 mt-1 px-1 font-medium">Employee will remain active until this date.</p>
                  </div>
                )}
              </div>
            )}

            {["terminated", "inactive"].includes(selectedAction) && (
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 px-1">Effective Date (LWD)</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="date" 
                    value={lastWorkingDate} 
                    onChange={e => setLastWorkingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-rose-500 transition-all text-slate-700"
                  />
                </div>
              </div>
            )}

            {selectedAction === "complete_exit" && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Clearance Checklist</p>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${exitInterviewDone ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                    {exitInterviewDone && <FiCheck size={10} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 select-none">Exit Interview Completed</span>
                  <input type="checkbox" className="hidden" checked={exitInterviewDone} onChange={e => setExitInterviewDone(e.target.checked)} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${assetsReturned ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                    {assetsReturned && <FiCheck size={10} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 select-none">All Assets Returned</span>
                  <input type="checkbox" className="hidden" checked={assetsReturned} onChange={e => setAssetsReturned(e.target.checked)} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${fullAndFinalSettled ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                    {fullAndFinalSettled && <FiCheck size={10} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 select-none">Full & Final Settled (F&F)</span>
                  <input type="checkbox" className="hidden" checked={fullAndFinalSettled} onChange={e => setFullAndFinalSettled(e.target.checked)} />
                </label>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 px-1">
                {selectedAction === "complete_exit" ? "Exit Notes" : "Reason / Remarks"}
              </label>
              <div className="relative">
                <FiFileText className="absolute left-3 top-3 text-slate-400" size={14} />
                <textarea 
                  value={reason} 
                  onChange={e => setReason(e.target.value)}
                  placeholder="Add details here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-700 min-h-[80px] resize-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {loading ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
