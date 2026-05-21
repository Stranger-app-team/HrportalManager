import React, { useState, useEffect, useCallback } from 'react';
import {
  FiFileText, FiEye, FiCheck, FiX, FiClock,
  FiSend, FiRefreshCw, FiSearch, FiAlertCircle, FiDownload
} from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';
import { getFullUrl } from '../utils/urlHelper';

const STATUS_META = {
  pending_manager_approval: { label: 'Pending Approval', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: FiClock },
  approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: FiCheck },
  rejected: { label: 'Rejected', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: FiX },
  final_email_sent: { label: 'Sent to Employee', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: FiSend },
};

export default function OfferLetters() {
  const [activeTab, setActiveTab] = useState('pending');
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLetters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/offer-letters`, auth);
      const data = await res.json();
      setLetters(data.offerLetters || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLetters(); }, [fetchLetters]);

  // ── APPROVE ─────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    if (!window.confirm('Approve this offer letter? A PDF will be generated.')) return;
    setActionLoading(id + '_approve');
    try {
      const res = await fetch(`${API_BASE_URL}/offer-letters/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { showToast('Offer letter approved! PDF generated.'); fetchLetters(); }
      else showToast(data.message || 'Failed to approve', 'error');
    } catch (e) { showToast('Network error', 'error'); }
    setActionLoading(null);
  };

  // ── REJECT ──────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal + '_reject');
    try {
      const res = await fetch(`${API_BASE_URL}/offer-letters/${rejectModal}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ managerResponseNote: rejectNote }),
      });
      const data = await res.json();
      if (res.ok) { showToast('Offer letter rejected.'); setRejectModal(null); setRejectNote(''); fetchLetters(); }
      else showToast(data.message || 'Failed to reject', 'error');
    } catch (e) { showToast('Network error', 'error'); }
    setActionLoading(null);
  };

  // ── DOWNLOAD ─────────────────────────────────────────────────────────────
  const handleDownload = async (id) => {
    setActionLoading(id + '_dl');
    try {
      const res = await fetch(`${API_BASE_URL}/offer-letters/download/${id}`, auth);
      if (!res.ok) { showToast('PDF not available', 'error'); setActionLoading(null); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `offer-letter-${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { showToast('Download failed', 'error'); }
    setActionLoading(null);
  };

  const pendingLetters = letters.filter(l => l.status === 'pending_manager_approval');
  const historyLetters = letters.filter(l => l.status !== 'pending_manager_approval');

  const visibleLetters = (activeTab === 'pending' ? pendingLetters : historyLetters).filter(l => {
    const q = search.toLowerCase();
    return l.employeeName?.toLowerCase().includes(q) || l.role?.toLowerCase().includes(q);
  });

  return (
    <div className="w-full h-full flex flex-col p-1 sm:p-2 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] bg-[#F1F5F9]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-2.5 rounded-lg shadow-lg text-sm font-bold flex items-center gap-2 transition-all
          ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? <FiAlertCircle size={14} /> : <FiCheck size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* ── Toolbar ── */}
        <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-50 p-0.5 rounded-md border border-slate-100">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all
                  ${activeTab === 'pending' ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <FiClock size={12} className={activeTab === 'pending' ? 'text-amber-500' : ''} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'pending' ? 'text-slate-800' : 'text-slate-400'}`}>
                  Pending
                </span>
                {pendingLetters.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 text-[8px] font-black flex items-center justify-center">
                    {pendingLetters.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all
                  ${activeTab === 'history' ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <FiFileText size={12} className={activeTab === 'history' ? 'text-blue-600' : ''} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'history' ? 'text-slate-800' : 'text-slate-400'}`}>
                  History
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <h3 className="text-[11px] font-black text-slate-800 tracking-tight uppercase shrink-0">Offer Letters</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-7 pr-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] outline-none font-bold text-slate-600 w-32"
              />
            </div>
            <button
              onClick={fetchLetters}
              disabled={loading}
              className="p-1.5 bg-slate-50 border border-slate-100 rounded text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all"
            >
              <FiRefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-auto no-scrollbar">
          {loading ? (
            <div className="p-10 text-center text-slate-300 font-bold uppercase tracking-widest animate-pulse text-[11px]">Loading...</div>
          ) : visibleLetters.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <FiFileText size={36} className="text-slate-200" />
              <p className="text-slate-300 font-bold uppercase tracking-widest text-[11px]">
                {activeTab === 'pending' ? 'No pending offer letters' : 'No history yet'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/4">Employee</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/6">Role</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/6">Details</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-1/6">Status</th>
                  <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {visibleLetters.map(letter => {
                  const sm = STATUS_META[letter.status] || STATUS_META.pending_manager_approval;
                  const Icon = sm.icon;
                  const isPending = letter.status === 'pending_manager_approval';
                  return (
                    <tr key={letter._id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center font-black text-[11px] border border-blue-100 shrink-0 overflow-hidden">
                            {letter.employee?.profilePhoto ? (
                              <img src={getFullUrl(letter.employee.profilePhoto, API_BASE_URL)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              letter.employeeName?.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{letter.employeeName}</p>
                            <p className="text-[9px] text-slate-400 truncate">{letter.employeeEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-bold text-slate-700 truncate">{letter.role}</p>
                        {letter.salary && <p className="text-[9px] text-slate-400">₹{letter.salary?.toLocaleString()}/mo</p>}
                      </td>
                      <td className="px-4 py-3">
                        {letter.startDate && (
                          <p className="text-[9px] font-bold text-slate-500">Start: {letter.startDate}</p>
                        )}
                        <p className="text-[9px] text-slate-400">
                          Issued: {letter.issueDate ? new Date(letter.issueDate).toLocaleDateString() : '—'}
                        </p>
                        {letter.managerResponseNote && letter.status !== 'pending_manager_approval' && (
                          <p className="text-[8px] text-slate-400 mt-0.5 truncate" title={letter.managerResponseNote}>
                            Note: {letter.managerResponseNote}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${sm.color}`}>
                          <Icon size={9} />
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview */}
                          <button
                            onClick={() => setPreview(letter)}
                            className="p-1.5 rounded bg-slate-50 border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all"
                            title="Preview letter"
                          >
                            <FiEye size={12} />
                          </button>

                          {/* Download PDF (approved/sent) */}
                          {['approved', 'final_email_sent'].includes(letter.status) && (
                            <button
                              onClick={() => handleDownload(letter._id)}
                              disabled={actionLoading === letter._id + '_dl'}
                              className="p-1.5 rounded bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all disabled:opacity-50"
                              title="Download PDF"
                            >
                              {actionLoading === letter._id + '_dl'
                                ? <FiRefreshCw size={12} className="animate-spin" />
                                : <FiDownload size={12} />}
                            </button>
                          )}

                          {/* Approve / Reject (only for pending) */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(letter._id)}
                                disabled={actionLoading === letter._id + '_approve'}
                                className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-1 disabled:opacity-50"
                              >
                                {actionLoading === letter._id + '_approve'
                                  ? <FiRefreshCw size={10} className="animate-spin" />
                                  : <FiCheck size={10} />}
                                Approve
                              </button>
                              <button
                                onClick={() => { setRejectModal(letter._id); setRejectNote(''); }}
                                className="px-2.5 py-1 rounded bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest hover:bg-rose-100 border border-rose-100 transition-all flex items-center gap-1"
                              >
                                <FiX size={10} />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Preview Modal ── */}
      {preview && (
        <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Letter Preview</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{preview.employeeName} · {preview.role}</p>
              </div>
              <div className="flex items-center gap-2">
                {['approved', 'final_email_sent'].includes(preview.status) && (
                  <button
                    onClick={() => { handleDownload(preview._id); setPreview(null); }}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-indigo-100 border border-indigo-100 transition-all"
                  >
                    <FiDownload size={11} /> Download PDF
                  </button>
                )}
                {preview.status === 'pending_manager_approval' && (
                  <button
                    onClick={() => { setPreview(null); handleApprove(preview._id); }}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-emerald-700 transition-all"
                  >
                    <FiCheck size={11} /> Approve
                  </button>
                )}
                <button
                  onClick={() => setPreview(null)}
                  className="p-1.5 rounded bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 transition-all"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 bg-slate-50">
              <iframe
                srcDoc={preview.htmlContent}
                className="w-full h-full min-h-[500px] border-none rounded-lg bg-white shadow-sm"
                title="Offer Letter Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Reject Offer Letter</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Provide a reason (visible to HR)</p>
            </div>
            <div className="p-5">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Rejection Note</label>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                rows={4}
                placeholder="Explain why this offer letter is being rejected..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 outline-none focus:border-rose-400 transition-colors resize-none"
              />
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleReject}
                  disabled={!!actionLoading}
                  className="px-4 py-2 bg-rose-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <FiRefreshCw size={12} className="animate-spin" /> : <FiX size={12} />}
                  Confirm Reject
                </button>
                <button
                  onClick={() => { setRejectModal(null); setRejectNote(''); }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
