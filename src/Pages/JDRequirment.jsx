import React, { useState, useEffect, useRef } from "react";
import {
  Briefcase, MapPin, Users, Clock, Bell,
  Search, RefreshCw, Plus, X, ChevronDown, Trash2, Eye,
  ArrowLeft, GraduationCap, UserCheck, ChevronRight, Edit as FiEdit
} from "lucide-react";
import Modal from "../components/Shared/Modal";
import ConfirmModal from "../components/Shared/ConfirmModal";
import { useNavigate } from "react-router-dom";
import JobApplicants from "../components/Jobs/JobApplicants";

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
  companyId: "",
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

/* ─── Job Apply Modal ────────────────────────────────────────────────────────── */
function JobApplyModal({ job, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    currentLocation: "",
    currentCTC: "",
    expectedCTC: "",
    noticePeriod: "",
    totalExperience: "",
    linkedinUrl: "",
    portfolioUrl: "",
    coverLetter: "",
  });
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("jobId", job._id || job.id);
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (resume) data.append("resume", resume);

      const res = await fetch(`${API_BASE_URL}/job-applications/apply`, {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        onSuccess(result.data);
      } else {
        alert(result.message || "Failed to submit application");
      }
    } catch (err) {
      alert("Error submitting application: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Apply for ${job.title}`} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full Name" required>
              <input type="text" name="candidateName" value={formData.candidateName} onChange={handleChange} required className={inputCls} placeholder="John Doe" />
            </Field>
            <Field label="Email Address" required>
              <input type="email" name="candidateEmail" value={formData.candidateEmail} onChange={handleChange} required className={inputCls} placeholder="john@example.com" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone Number" required>
              <input type="tel" name="candidatePhone" value={formData.candidatePhone} onChange={handleChange} required className={inputCls} placeholder="9876543210" />
            </Field>
            <Field label="Total Experience" required>
              <input type="text" name="totalExperience" value={formData.totalExperience} onChange={handleChange} required className={inputCls} placeholder="e.g. 3 Years, Fresher" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Current Location" required>
              <input type="text" name="currentLocation" value={formData.currentLocation} onChange={handleChange} required className={inputCls} placeholder="e.g. Pune" />
            </Field>
            <Field label="Notice Period" required>
              <input type="text" name="noticePeriod" value={formData.noticePeriod} onChange={handleChange} required className={inputCls} placeholder="e.g. 30 Days, Immediate" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Current CTC" required>
              <input type="text" name="currentCTC" value={formData.currentCTC} onChange={handleChange} required className={inputCls} placeholder="e.g. 5 LPA" />
            </Field>
            <Field label="Expected CTC" required>
              <input type="text" name="expectedCTC" value={formData.expectedCTC} onChange={handleChange} required className={inputCls} placeholder="e.g. 8 LPA" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="LinkedIn Profile">
              <input type="text" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className={inputCls} placeholder="https://linkedin.com/in/johndoe" />
            </Field>
            <Field label="Portfolio Website">
              <input type="text" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleChange} className={inputCls} placeholder="https://johndoe.com" />
            </Field>
          </div>
          <Field label="Cover Letter">
            <textarea name="coverLetter" value={formData.coverLetter} onChange={handleChange} className={inputCls + " resize-none"} rows={3} placeholder="Brief summary about yourself..."></textarea>
          </Field>
          <Field label="Resume / CV" required>
            <input type="file" onChange={(e) => setResume(e.target.files[0])} required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition">Cancel</button>
          <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
            {submitting ? <><RefreshCw size={12} className="animate-spin" /> Submitting...</> : <><Plus size={12} /> Submit Application</>}
          </button>
        </div>
      </form>
    </Modal>
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

  const [applicantCount, setApplicantCount] = useState(0);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${API_BASE_URL}/job-applications/job/${job._id || job.id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
        });
        const data = await res.json();
        console.log("Job Card Applicants Count Response:", data);
        if (data.success && data.data) {
          setApplicantCount(data.data.count || (data.data.applications ? data.data.applications.length : 0));
        }
      } catch (err) {
        console.error("Failed to fetch applicant count", err);
      }
    };
    fetchApplicants();
  }, [job._id, job.id]);

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

        {/* Company Name */}
        {(job.companyId?.companyName || job.companyName) && (
          <p className="text-[12.5px] text-gray-700">
            <span className="font-bold">Company:</span> {job.companyId?.companyName || job.companyName}
          </p>
        )}

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

        {/* Buttons */}
        <div className="mt-auto flex gap-2 w-full pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onView(job, 'overview'); }}
            className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#1e3a5f] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 active:scale-[0.98] transition-all">
            <Eye size={12} /> Details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onView(job, 'applicants'); }}
            className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-[#1e3a5f] rounded-lg hover:bg-[#16304f] active:scale-[0.98] transition-all">
            <Users size={12} /> Applicants {applicantCount > 0 && `(${applicantCount})`}
          </button>
        </div>

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
    skillsRequired: Array.isArray(editData.skillsRequired) ? editData.skillsRequired.join(', ') : editData.skillsRequired || "",
    companyId: editData.companyId?._id || editData.companyId || ""
  } : EMPTY_JOB);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab,  setActiveTab]  = useState("basic");
  const [companies, setCompanies] = useState([]);
  
  const set = (key) => (e) => setNewJob((prev) => ({ ...prev, [key]: e.target.value }));

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/company`, { headers: authHeaders() });
        const data = await res.json();
        if (data.company) {
          setCompanies(data.company);
        } else if (data.success) {
          setCompanies(data.data || []);
        } else if (Array.isArray(data)) {
          setCompanies(data);
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      }
    };
    fetchCompanies();
  }, []);

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
        companyId: newJob.companyId || user.companyId?._id || user.companyId || user._id,
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
                <Field label="Company" required>
                  <div className="relative">
                    <select value={newJob.companyId} onChange={set("companyId")}
                      className={inputCls + " appearance-none pr-7 cursor-pointer"} required>
                      <option value="">Select Company</option>
                      {companies.map(c => (
                        <option key={c._id || c.id} value={c._id || c.id}>{c.companyName}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Department">
                  <input type="text" placeholder="e.g. Engineering" value={newJob.department}
                    onChange={set("department")} className={inputCls} />
                </Field>
                <Field label="Location">
                  <input type="text" placeholder="e.g. Pune / Remote" value={newJob.location}
                    onChange={set("location")} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
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

function JobDetailPage({ job, initialTab, onBack, onEdit, userRole }) {
  const hdr = TYPE_HEADER[job.employmentType] || defaultHeader;
  const [showApplicants, setShowApplicants] = useState(initialTab === 'applicants');
  const [showApplyModal, setShowApplyModal] = useState(false);

  const normalize = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    return val.split(/,|\n/).map(s => s.trim()).filter(Boolean);
  };

  const skills = normalize(job.skillsRequired || "");
  const responsibilities = normalize(job.responsibilities || job.rolesResponsibilities || "");

  const Row = ({ label, value, compact }) => value ? (
    <div className={`flex ${compact ? 'justify-between items-center py-2' : 'py-2'} border-b border-gray-50 last:border-0 ${compact ? 'text-[12px]' : 'text-[13px]'}`}>
      <span className={compact ? 'font-bold text-gray-500' : 'w-40 shrink-0 font-bold text-gray-800'}>{label}</span>
      <span className={compact ? 'font-semibold text-gray-800 text-right' : 'text-gray-500'}>{compact ? value : `:  ${value}`}</span>
    </div>
  ) : null;

  const SectionTitle = ({ title }) => (
    <div className="flex items-center gap-2 mt-6 mb-3">
      <div className="w-[3px] h-4 rounded-full" style={{ background: hdr.accent }} />
      <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: hdr.accent }}>{title}</p>
    </div>
  );

  return (
    <div className="min-h-full bg-[#f4f7fb] font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-[#1e3a5f] transition">
            <ArrowLeft size={14} /> Job Requirements
          </button>
          <ChevronRight size={12} className="text-gray-300" />
          <span className="text-[11px] font-semibold text-[#1e3a5f] truncate max-w-[200px]">{job.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {userRole === "hr" && (
            <button onClick={() => setShowApplyModal(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-[11px] font-bold transition shadow-sm">
              <Plus size={12} /> Add Applicant
            </button>
          )}
          {userRole === "hr" && (
            <button onClick={() => onEdit(job)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold transition">
              <FiEdit size={12} /> Edit Job
            </button>
          )}
        </div>
      </div>

      <div className={`mx-auto px-4 sm:px-6 pt-6 pb-12 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${showApplicants ? 'max-w-[1400px]' : 'max-w-4xl'}`}>
        
        <div className="flex flex-col xl:flex-row gap-6 items-start relative w-full">
          
          {/* Left Panel: Job Details */}
          <div className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden origin-left ${
             showApplicants ? 'w-full xl:w-[320px]' : 'w-full'
          }`}>
             
             {/* Header */}
             <div style={{ background: hdr.grad }} className={`relative transition-all duration-700 ${showApplicants ? 'px-6 py-8 text-center' : 'px-8 py-6 text-center sm:text-left'}`}>
               {!showApplicants ? (
                 <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1.5">
                      <h1 className="text-[20px] font-black text-white">{job.title}</h1>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white uppercase tracking-wider">
                        {job.employmentType}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-white/70">
                      {[job.companyId?.companyName, job.department, job.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div>
                     <button 
                       onClick={() => setShowApplicants(true)} 
                       className="group flex items-center gap-2 px-5 py-2.5 bg-white text-[#1e3a5f] rounded-xl text-xs font-bold hover:bg-gray-100 transition-all shadow-md hover:-translate-y-0.5"
                     >
                        <Users size={16} className="group-hover:scale-110 transition-transform" /> View Applicants
                     </button>
                  </div>
                 </div>
               ) : (
                 <div className="animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center text-white mx-auto mb-3">
                    <Briefcase size={24} />
                  </div>
                  <h1 className="text-[17px] font-black text-white leading-tight mb-1">{job.title}</h1>
                  <p className="text-[12px] font-medium text-white/70">
                    {job.department} • {job.location}
                  </p>
                  <div className="mt-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-white/20 text-white uppercase tracking-wider border border-white/10">
                      {job.employmentType}
                    </span>
                  </div>
                 </div>
               )}
             </div>

             {/* Content */}
             <div className={`transition-all duration-700 ${showApplicants ? 'p-5' : 'px-8 py-8'}`}>
                {showApplicants && (
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50 animate-in fade-in duration-500">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overview</span>
                     <button 
                       onClick={() => setShowApplicants(false)} 
                       className="text-gray-400 hover:text-gray-700 bg-gray-50 p-1.5 rounded-md transition hover:bg-gray-100"
                       title="Close Applicants View"
                     >
                       <X size={14} />
                     </button>
                  </div>
                )}
                
                {showApplicants ? (
                   /* COMPACT VIEW */
                   <div className="space-y-1 mb-2 animate-in fade-in duration-500">
                      <Row label="Company" value={job.companyId?.companyName || "N/A"} compact />
                      <Row label="Experience" value={job.experienceLevel || job.experienceRequired || "Not specified"} compact />
                      <Row label="Openings" value={job.openings ? `${job.openings} Position${job.openings > 1 ? 's' : ''}` : "N/A"} compact />
                      <Row label="Status" value={job.status || "Open"} compact />
                      
                      {(job.description || job.jobSummary) && (
                        <div className="mt-6 mb-5">
                          <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Details</h4>
                          <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-4">
                            {job.description || job.jobSummary}
                          </p>
                        </div>
                      )}
                      
                      {skills.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Skills</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {skills.slice(0, 6).map((s, i) => (
                              <span key={i} className="text-[10px] px-2 py-1 rounded bg-gray-50 text-gray-600 font-bold border border-gray-100">
                                {s}
                              </span>
                            ))}
                            {skills.length > 6 && (
                              <span className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-500 font-bold">
                                +{skills.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                   </div>
                ) : (
                   /* FULL VIEW */
                   <div className="animate-in fade-in duration-500">
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
                )}
             </div>
          </div>

          {/* Right Panel: Applicants */}
          <div className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden flex flex-col origin-right ${
             showApplicants ? 'flex-1 opacity-100 min-w-[500px]' : 'w-0 opacity-0 shrink-0'
          }`}>
             <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 min-h-[600px] h-full w-full">
                {showApplicants && <JobApplicants job={job} />}
             </div>
          </div>

        </div>
      </div>

      {showApplyModal && (
        <JobApplyModal 
          job={job} 
          onClose={() => setShowApplyModal(false)} 
          onSuccess={() => {
            setShowApplyModal(false);
            alert("Application submitted successfully!");
          }} 
        />
      )}
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
  const [activeCompany,   setActiveCompany]   = useState("");
  const [companies,       setCompanies]       = useState([]);
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

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/company`, { headers: authHeaders() });
        const data = await res.json();
        if (data.company) {
          setCompanies(data.company);
        } else if (data.success) {
          setCompanies(data.data || []);
        } else if (Array.isArray(data)) {
          setCompanies(data);
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      }
    };
    fetchCompanies();
    fetchJobs(); 
  }, []);

  useEffect(() => {
    let result = jobs;
    if (activeType !== "All") result = result.filter(j => j.employmentType === activeType);
    if (activeCompany) {
      result = result.filter(j => 
        j.companyId === activeCompany || 
        j.companyId?._id === activeCompany || 
        j.companyId?.id === activeCompany
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.department?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, activeType, activeCompany, jobs]);

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
              job={selectedJob.data} 
              initialTab={selectedJob.tab}
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
                <div className="relative flex-1 sm:max-w-xs">
                  <select 
                    value={activeCompany}
                    onChange={e => setActiveCompany(e.target.value)}
                    className="w-full pl-4 pr-9 py-2 text-[11px] font-bold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none text-slate-600"
                  >
                    <option value="">All Companies</option>
                    {companies.map(c => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.companyName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
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
                      onView={(j, tab) => setSelectedJob({ data: j, tab })}
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
            if (updated && selectedJob) setSelectedJob({ ...selectedJob, data: updated });
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