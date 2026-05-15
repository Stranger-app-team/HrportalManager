import React, { useState, useEffect, useRef } from "react";
import {
  Briefcase, MapPin, Users, Clock, Bell,
  Search, RefreshCw, Plus, X, ChevronDown, Trash2, Eye,
  ArrowLeft, GraduationCap, UserCheck, ChevronRight, Edit as FiEdit
} from "lucide-react";
import Modal from "../components/Shared/Modal";
import ConfirmModal from "../components/Shared/ConfirmModal";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../config/api";

const BASE = API_BASE_URL;

// ✅ FIXED URLs
const API_BASE = `${BASE}/jobs`;
const API_CREATE = `${BASE}/jobs`;

const authHeaders = () => {
  const token = localStorage.getItem("token") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getManagerInitials = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined") return "M";
    const manager = JSON.parse(raw);
    const source  = manager?.username || manager?.name || manager?.email || "";
    if (!source) return "M";
    const cleaned = source.includes("@") ? source.split("@")[0] : source;
    const parts   = cleaned.split(/[.\s_-]/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return cleaned.slice(0, 2).toUpperCase();
  } catch { return "M"; }
};

const TYPE_BADGE = {
  "Full-time": "bg-blue-100 text-blue-600",
  "Part-time": "bg-purple-100 text-purple-600",
  Internship:  "bg-green-100 text-green-600",
  Contract:    "bg-orange-100 text-orange-600",
};

const FILTER_TYPES = ["All", "full-time", "part-time", "internship", "contract"];

// ─── HEADER CONFIGS ───────────────────────────────────────────────────────────
const TYPE_HEADER = {
  "full-time": {
    grad: "linear-gradient(135deg,#2F4A73,#2F4A73,#2F4A73)",
    light: "#E6EEF8",
    accent: "#2F4A73"
  },
  "part-time": {
    grad: "linear-gradient(135deg,#2F4A73,#2F4A73,#2F4A73)",
    light: "#E6EEF8",
    accent: "#2F4A73"
  },
  "internship": {
    grad: "linear-gradient(135deg,#2F4A73,#2F4A73,#2F4A73)",
    light: "#E6EEF8",
    accent: "#2F4A73"
  },
  "contract": {
    grad: "linear-gradient(135deg,#2F4A73,#2F4A73,#2F4A73)",
    light: "#E6EEF8",
    accent: "#2F4A73"
  },
};
const defaultHeader = { grad: "linear-gradient(135deg,#1e3a5f,#2a5298,#3b6fd4)", light: "#dbeafe", accent: "#1e3a5f" };

const EMPTY_JOB = {
  title: "",
  department: "",
  location: "",
  employmentType: "full-time",
  experienceLevel: "",
  experienceRequired: "",
  openings: 1,
  qualification: "",
  description: "",
  responsibilities: "",
  skillsRequired: "",
  applicationDeadline: "",
  status: "open"
};

/* ─── Field wrapper ─────────────────────────────────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition placeholder:text-gray-400";

/* ─── Skeleton Card ─────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 animate-pulse">
      <div className="h-4 w-20 bg-slate-100 rounded-full mb-3" />
      <div className="h-4 w-full bg-slate-100 rounded mb-2" />
      <div className="h-3 w-1/2 bg-slate-100 rounded mb-3" />
      <div className="flex gap-3 mb-4">
        <div className="h-3 w-14 bg-slate-100 rounded" />
        <div className="h-3 w-14 bg-slate-100 rounded" />
      </div>
      <div className="h-8 w-full bg-slate-100 rounded-lg" />
    </div>
  );
}

/* ─── Job Card ──────────────────────────────────────────────────────────────── */
function JobCard({ job, onDelete, onView, userRole }) {
  const [deleting,      setDeleting]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const TYPE_STYLE = {
    "full-time":  { border: "border-blue-200",   title: "text-blue-700",   badge: "bg-blue-50 text-blue-700 border-blue-200"   },
    "part-time":  { border: "border-purple-200", title: "text-purple-700", badge: "bg-purple-50 text-purple-700 border-purple-200" },
    "internship": { border: "border-emerald-200",title: "text-emerald-700",badge: "bg-emerald-50 text-emerald-700 border-emerald-200"},
    "contract":   { border: "border-orange-200", title: "text-orange-700", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  };
  const style = TYPE_STYLE[job.employmentType] || { border: "border-gray-200", title: "text-gray-700", badge: "bg-gray-50 text-gray-600 border-gray-200" };

  const normalize = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === "string") return val.split(/,|\n|;/).map(s => s.trim()).filter(Boolean);
    return [];
  };

  const skills = normalize(job.skillsRequired);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(job._id || job.id, job.title);
  };

  return (
    <div className={`relative bg-white rounded-xl border ${style.border} hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]`}>
      <div className="p-4 flex flex-col gap-2 flex-1">

        {/* Delete button top-right - Only for HR */}
        {userRole === "hr" && (
          <div className="absolute top-3 right-3">
            <button onClick={handleDelete}
              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-400 transition"
              title="Delete Job Post"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}

        {/* Job Title */}
        <h3 className={`text-[15px] font-bold leading-snug pr-6 mb-1 ${style.title}`}>
          {job.title}
        </h3>

        {/* Experience */}
        {job.experienceLevel && (
          <p className="text-[12.5px] text-gray-700">
            <span className="font-bold">Experience:</span> {job.experienceLevel}
          </p>
        )}

        {/* Skills */}
        <p className="text-[12.5px] text-gray-700 leading-relaxed">
          <span className="font-bold">Skills:</span>{" "}
          {skills.length > 0
            ? <span className="text-gray-600">{skills.join(", ")}</span>
            : <span className="text-gray-400 italic">Not specified</span>
          }
        </p>

        {/* Location */}
        {job.location && (
          <p className="text-[12.5px] text-gray-700">
            <span className="font-bold">Location:</span> {job.location}
          </p>
        )}

        {/* Openings */}
        {job.openings && (
          <p className="text-[12.5px] text-gray-700">
            <span className="font-bold">Openings:</span> {job.openings}
          </p>
        )}

        {/* Posted date */}
        {job.createdAt && (
          <p className="text-[12.5px] text-gray-700">
            <span className="font-bold">Posted:</span>{" "}
            {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        )}

        {/* Employment type badge */}
        <div className="mt-1">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border w-fit inline-block capitalize ${style.badge}`}>
            {job.employmentType}
          </span>
        </div>

        {/* View Details button */}
        <button
          onClick={(e) => { e.stopPropagation(); onView(job); }}
          className="mt-auto w-full py-2 flex items-center justify-center gap-1.5 text-[12px] font-bold text-white bg-[#1e3a5f] rounded-lg hover:bg-[#16304f] active:scale-[0.98] transition-all">
          <Eye size={12} /> View Details
        </button>

      </div>
    </div>
  );
}

/* ─── Job Modal (Create/Edit) ────────────────────────────────────────────────── */
function JobModal({ onClose, onSuccess, editData = null }) {
  const isEdit = !!editData;
  const [newJob, setNewJob] = useState(editData ? {
    ...editData,
    applicationDeadline: editData.applicationDeadline ? editData.applicationDeadline.split('T')[0] : "",
    skillsRequired: Array.isArray(editData.skillsRequired) ? editData.skillsRequired.join(', ') : editData.skillsRequired || ""
  } : EMPTY_JOB);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab,  setActiveTab]  = useState("basic");
  const set = (key) => (e) => setNewJob((prev) => ({ ...prev, [key]: e.target.value }));

  const tabs = [
    { id: "basic",       label: "Basic Info"  },
    { id: "description", label: "Job Details" },
    { id: "eligibility", label: "Requirements" },
  ];
  const tabOrder = tabs.map(t => t.id);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab !== "eligibility") {
      const currentIndex = tabOrder.indexOf(activeTab);
      if (currentIndex < tabOrder.length - 1) {
        setActiveTab(tabOrder[currentIndex + 1]);
      }
      return;
    }

    setSubmitting(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const payload = {
        ...newJob,
        openings: Number(newJob.openings) || 1,
        skillsRequired: newJob.skillsRequired ? (typeof newJob.skillsRequired === 'string' ? newJob.skillsRequired.split(',').map(s => s.trim()).filter(Boolean) : newJob.skillsRequired) : [],
        companyId: user.companyId?._id || user.companyId || user._id,
        enterpriseId: user.enterpriseId?._id || user.enterpriseId || user._id, 
        applicationDeadline: newJob.applicationDeadline ? new Date(newJob.applicationDeadline).toISOString() : undefined,
      };

      const url = isEdit ? `${API_BASE}/${editData._id}` : API_CREATE;
      const method = isEdit ? "PUT" : "POST";

      const res  = await fetch(url, { 
        method, 
        headers: authHeaders(), 
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      if (res.ok && (data.success || data._id)) {
        onSuccess(isEdit ? data.data || data : null); 
        onClose(); 
      } else {
        alert(`Failed to ${isEdit ? 'update' : 'create'} job: ` + (data.message || data.error || "Unknown error"));
      }
    } catch (err) { 
      alert("Error: " + err.message); 
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <Modal title={isEdit ? "Edit Job Requirement" : "Create Job Post"} onClose={onClose} maxWidth="max-w-2xl">
        <div className="flex border-b border-slate-100 bg-slate-50/50 rounded-2xl mb-6 overflow-hidden">
          {tabs.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-blue-600 bg-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

            {activeTab === "basic" && <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Job Title" required>
                  <input type="text" placeholder="e.g. Frontend Developer" value={newJob.title}
                    onChange={set("title")} required className={inputCls} />
                </Field>
                <Field label="Department">
                  <input type="text" placeholder="e.g. Engineering" value={newJob.department}
                    onChange={set("department")} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Location">
                  <input type="text" placeholder="e.g. Pune / Remote" value={newJob.location}
                    onChange={set("location")} className={inputCls} />
                </Field>
                <Field label="Employment Type">
                  <div className="relative">
                    <select value={newJob.employmentType} onChange={set("employmentType")}
                      className={inputCls + " appearance-none pr-7 cursor-pointer"}>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="internship">Internship</option>
                      <option value="contract">Contract</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Openings" required>
                  <input type="number" placeholder="e.g. 3" min="1" value={newJob.openings}
                    onChange={set("openings")} required className={inputCls} />
                </Field>
                <Field label="Status">
                  <div className="relative">
                    <select value={newJob.status} onChange={set("status")}
                      className={inputCls + " appearance-none pr-7 cursor-pointer"}>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Field>
              </div>
            </>}

            {activeTab === "description" && <>
              <Field label="Description">
                <textarea rows={3} placeholder="Describe the role in detail…" value={newJob.description}
                  onChange={set("description")} className={inputCls + " resize-none"} />
              </Field>
              <Field label="Responsibilities">
                <textarea rows={3} placeholder="e.g. Build REST APIs, Write unit tests…"
                  value={newJob.responsibilities} onChange={set("responsibilities")}
                  className={inputCls + " resize-none"} />
              </Field>
              <Field label="Skills Required (comma separated)">
                <textarea rows={2} placeholder="e.g. React, Node.js, PostgreSQL" value={newJob.skillsRequired}
                  onChange={set("skillsRequired")} className={inputCls + " resize-none"} />
              </Field>
            </>}

            {activeTab === "eligibility" && <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Qualification">
                  <input type="text" placeholder="e.g. B.Tech / MCA" value={newJob.qualification}
                    onChange={set("qualification")} className={inputCls} />
                </Field>
                <Field label="Experience Level">
                  <input type="text" placeholder="e.g. Mid-Level" value={newJob.experienceLevel}
                    onChange={set("experienceLevel")} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <Field label="Years of Experience">
                  <input type="text" placeholder="e.g. 2-3 Years" value={newJob.experienceRequired}
                    onChange={set("experienceRequired")} className={inputCls} />
                </Field>
                <Field label="Application Deadline">
                  <input type="date" value={newJob.applicationDeadline}
                    onChange={set("applicationDeadline")} className={inputCls} />
                </Field>
              </div>
            </>}

          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
            <div className="flex gap-1.5">
              {tabOrder.map(id => (
                <div key={id} onClick={() => setActiveTab(id)}
                  className={`w-2 h-2 rounded-full cursor-pointer transition ${
                    activeTab === id ? "bg-[#1e3a5f]" : "bg-gray-200 hover:bg-gray-300"
                  }`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition">
                Cancel
              </button>
              {activeTab !== "eligibility" ? (
                <button type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentIndex = tabOrder.indexOf(activeTab);
                    if (currentIndex < tabOrder.length - 1) setActiveTab(tabOrder[currentIndex + 1]);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#1e3a5f] rounded-lg hover:bg-[#16304f] transition">
                  Next →
                </button>
              ) : (
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                  {submitting
                    ? <><RefreshCw size={12} className="animate-spin" /> {isEdit ? 'Updating…' : 'Creating…'}</>
                    : <><Plus size={12} /> {isEdit ? 'Update Requirement' : 'Create Job'}</>}
                </button>
              )}
            </div>
          </div>
        </form>
    </Modal>
  );
}

/* ─── Job Detail Page ───────────────────────────────────────────────────────── */
function JobDetailPage({ job, onBack, onEdit, userRole }) {
  const hdr = TYPE_HEADER[job.employmentType] || defaultHeader;

  const normalize = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    return val.split(/,|\n/).map(s => s.trim()).filter(Boolean);
  };

  const skills = normalize(job.skillsRequired || "");
  const responsibilities = normalize(job.responsibilities || job.rolesResponsibilities || "");

  const Row = ({ label, value }) => value ? (
    <div className="flex py-2 border-b border-gray-50 last:border-0 text-[13px]">
      <span className="w-40 shrink-0 font-bold text-gray-800">{label}</span>
      <span className="text-gray-500">:&nbsp;&nbsp;{value}</span>
    </div>
  ) : null;

  const SectionTitle = ({ title }) => (
    <div className="flex items-center gap-2 mt-6 mb-3">
      <div className="w-[3px] h-4 rounded-full" style={{ background: hdr.accent }} />
      <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: hdr.accent }}>{title}</p>
    </div>
  );

  return (
    <div className="min-h-full bg-[#f4f7fb] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center gap-2 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-[#1e3a5f] transition">
          <ArrowLeft size={14} /> Job Requirements
        </button>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="text-[11px] font-semibold text-[#1e3a5f] truncate max-w-[200px]">{job.title}</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <div className="bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">

          {/* Colored Header */}
          <div style={{ background: hdr.grad }} className="relative px-8 py-8 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1.5">
              <h1 className="text-2xl font-black text-white">{job.title}</h1>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white uppercase tracking-wider">
                {job.employmentType}
              </span>
            </div>
            <p className="text-[13px] font-medium text-white/70">
              {[job.companyId?.companyName, job.department, job.location].filter(Boolean).join(" · ")}
            </p>

            {/* Edit Button - Only for HR */}
            {userRole === "hr" && (
              <button 
                onClick={() => onEdit(job)}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all shadow-sm"
                title="Edit JD"
              >
                <FiEdit size={16} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <SectionTitle title="Position Overview" />
            <div className="flex flex-col gap-0.5">
               <Row label="Company" value={job.companyId?.companyName} />
               <Row label="Department" value={job.department} />
               <Row label="Location" value={job.location} />
               <Row label="Experience" value={job.experienceLevel || job.experienceRequired} />
               <Row label="Openings" value={job.openings ? `${job.openings} position${parseInt(job.openings) !== 1 ? "s" : ""}` : null} />
            </div>

            {(job.description || job.jobSummary) && <>
              <SectionTitle title="About the Role" />
              <p className="text-[13px] text-gray-600 leading-relaxed font-medium">{job.description || job.jobSummary}</p>
            </>}

            {responsibilities.length > 0 && <>
              <SectionTitle title="Roles & Responsibilities" />
              <ul className="space-y-2">
                {responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-gray-600 font-medium">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-blue-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </>}

            {skills.length > 0 && <>
              <SectionTitle title="Skills Required" />
              <div className="flex flex-wrap gap-2 mt-1">
                {skills.map((s, i) => (
                  <span key={i} className="text-[11px] px-3 py-1.5 rounded-md font-bold transition-all hover:scale-105"
                    style={{ background: "#E6EEF8", color: "#2F4A73" }}>
                    {s}
                  </span>
                ))}
              </div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function EmployeeJobListings() {
  const navigate = useNavigate();

  const [jobs,            setJobs]            = useState([]);
  const [filtered,        setFiltered]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [search,          setSearch]          = useState("");
  const [activeType,      setActiveType]      = useState("All");
  const [showModal,       setShowModal]       = useState(false);
  const [selectedCard,    setSelectedCard]    = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [selectedJob,     setSelectedJob]     = useState(null); // ✅ inside component
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [jobTitleToDelete, setJobTitleToDelete] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editJobData, setEditJobData] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.userType?.toLowerCase();

  const dropdownRef = useRef(null);

  const initials    = getManagerInitials();
  const managerName = (() => {
    try { const m = JSON.parse(localStorage.getItem("loggedInUser") || "{}"); return m?.username || m?.name || "Manager"; }
    catch { return "Manager"; }
  })();

  const handleLogout = () => {
    setShowLogoutPopup(true);
    setTimeout(() => { localStorage.removeItem("token"); localStorage.removeItem("loggedInUser"); navigate("/"); }, 1500);
  };

  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setSelectedCard(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchJobs = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(API_BASE, { headers: authHeaders() });
      const text = await res.text();
      if (text.trim().startsWith("<")) { setError("Cannot reach backend. Make sure server is running."); setLoading(false); return; }
      const data       = JSON.parse(text);
      const list       = data.success ? data.data : Array.isArray(data) ? data : [];
      const normalized = list.map(j => ({ ...j, _id: j._id || j.id }));
      setJobs(normalized); setFiltered(normalized);
    } catch { setError("Failed to load jobs. Check your backend."); }
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    let result = jobs;
    if (activeType !== "All") result = result.filter(j => j.employmentType === activeType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.department?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, activeType, jobs]);

  const countByType     = (type) => type === "All" ? jobs.length : jobs.filter(j => j.employmentType === type).length;
  
  const handleDeleteJob = (id, title) => {
    setJobToDelete(id);
    setJobTitleToDelete(title);
    setShowDeleteModal(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    setDeleting(true);
    try {
      const res  = await fetch(`${API_BASE}/${jobToDelete}`, { 
        method: "DELETE", 
        headers: authHeaders() 
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(false);
        setJobToDelete(null);
        fetchJobs();
      } else {
        alert("Failed to delete: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full bg-gray-50 font-['Plus_Jakarta_Sans',sans-serif]">

      <div className="flex-1 flex flex-col overflow-hidden">



        {/* ── Main content — switches between grid and detail ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {selectedJob ? (
            /* ══ DETAIL VIEW ══ */
            <JobDetailPage 
              job={selectedJob} 
              onBack={() => setSelectedJob(null)} 
              onEdit={(j) => { setEditJobData(j); setShowEditModal(true); }}
              userRole={userRole}
            />
          ) : (
            /* ══ GRID VIEW ══ */
          <div className="p-4 sm:p-6 h-fit font-['Plus_Jakarta_Sans',sans-serif]">

              {/* Search + refresh */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input type="text" placeholder="Filter jobs..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-[11px] font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-300" />
                </div>
                <button onClick={fetchJobs}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-standard tracking-widest">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {/* Filter pills + create button */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {FILTER_TYPES.map(type => {
                    const active = activeType === type;
                    return (
                      <button key={type} onClick={() => setActiveType(type)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-standard uppercase tracking-tighter ${
                          active 
                            ? "bg-slate-800 text-white border-slate-800 shadow-sm" 
                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                        }`}>
                        {type}
                       
                      </button>
                    );
                  })}
                </div>
                {/* ✅ Only HR can see create button */}
                {userRole === "hr" && (
                  <button onClick={() => setShowModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-[#1e3a5f] rounded-lg hover:bg-[#16304f] transition">
                    <Plus size={14} /> Create Job
                  </button>
                )}
              </div>

              {/* Result count */}
              {!loading && !error && (
                <p className="text-xs text-gray-400 mb-4">
                  Showing <span className="font-semibold text-gray-600">{filtered.length}</span>
                  {activeType !== "All" && <> of <span className="font-semibold text-gray-600">{jobs.length}</span></>} positions
                  {activeType !== "All" && <span className="ml-1">({activeType})</span>}
                </p>
              )}

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex justify-between items-center">
                  <span>⚠ {error}</span>
                  <button onClick={fetchJobs} className="font-semibold hover:underline">Retry</button>
                </div>
              )}

              {/* Skeleton */}
              {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
                </div>
              )}

              {/* Job cards grid */}
              {!loading && !error && filtered.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filtered.map(job => (
                    <JobCard
                      key={job._id || job.id}
                      job={job}
                      onDelete={handleDeleteJob}
                      onView={j => setSelectedJob(j)}   // ✅ opens detail page
                      userRole={userRole}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <Briefcase size={28} className="text-gray-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    {activeType === "All" ? "No openings available" : `No ${activeType} jobs found`}
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    {activeType === "All" ? "Check back soon" : `No ${activeType} positions at the moment`}
                  </p>
                  {activeType !== "All" && (
                    <button onClick={() => setActiveType("All")}
                      className="px-4 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                      View all jobs
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showModal && (
        <JobModal onClose={() => setShowModal(false)} onSuccess={() => fetchJobs()} />
      )}

      {showEditModal && (
        <JobModal 
          onClose={() => setShowEditModal(false)} 
          editData={editJobData} 
          onSuccess={(updated) => {
            fetchJobs();
            if (updated && selectedJob) setSelectedJob(updated);
          }} 
        />
      )}

      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl px-6 py-4 text-center shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">Logged Out</h3>
            <p className="text-sm text-gray-500">You have been successfully logged out.</p>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteJob}
        loading={deleting}
        title="Delete Job Post"
        message={`Are you sure you want to delete the job posting for "${jobTitleToDelete}"? This action will remove it from the job board.`}
      />
    </div>
  );
}