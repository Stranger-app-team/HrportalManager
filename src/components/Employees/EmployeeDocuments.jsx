import React, { useState } from 'react';
import { Paperclip, Plus, Upload, X, Eye, Trash2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { getFullUrl } from '../../utils/urlHelper';

const PREDEFINED_DOCS = {
  Given: ['Aadhar Card', 'PAN Card', 'Resume', '10th Marksheet', '12th Marksheet', 'Degree Certificate', 'Relieving Letter', 'Other'],
  Taken: ['Offer Letter', 'Appointment Letter', 'ID Card', 'Experience Letter', 'Other']
};

export default function EmployeeDocuments({ employeeId, documents, onRefresh, isHr, mode = "edit", localDocuments = [], setLocalDocuments = null }) {
  const [activeTab, setActiveTab] = useState('Given');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [category, setCategory] = useState('Given');
  const [documentType, setDocumentType] = useState('Aadhar Card');
  const [documentName, setDocumentName] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const docsToDisplay = mode === 'add' 
    ? localDocuments.filter(doc => doc.category === activeTab)
    : (documents || []).filter(doc => doc.category === activeTab);

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    setDocumentType(PREDEFINED_DOCS[newCategory][0]);
    setDocumentName('');
  };

  const handleDocumentTypeChange = (e) => {
    setDocumentType(e.target.value);
    setDocumentName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    if (documentType === 'Other' && !documentName.trim()) {
      alert("Please enter a document name.");
      return;
    }

    if (mode === 'add') {
      // Local state for AddEmployee
      const newDoc = {
        _id: Math.random().toString(36).substring(7),
        category,
        documentType: documentType === 'Other' ? documentName : documentType,
        documentName: documentType === 'Other' ? documentName : '',
        proofFile: file,
        proofUrl: URL.createObjectURL(file), // temporary URL for preview
        uploadedAt: new Date().toISOString()
      };
      if (setLocalDocuments) {
        setLocalDocuments([...localDocuments, newDoc]);
      }
      setIsModalOpen(false);
      setFile(null);
      setDocumentName('');
      return;
    }

    // Direct API upload for EditEmployee
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('category', category);
      formData.append('documentType', documentType);
      if (documentType === 'Other') {
        formData.append('documentName', documentName);
      }
      formData.append('proofFile', file);

      const res = await fetch(`${API_BASE_URL}/employee/${employeeId}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFile(null);
        setDocumentName('');
        onRefresh && onRefresh();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to upload document");
      }
    } catch (err) {
      console.error(err);
      alert("Server error during upload");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    if (mode === 'add') {
      if (setLocalDocuments) {
        setLocalDocuments(localDocuments.filter(d => d._id !== docId));
      }
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/employee/${employeeId}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        onRefresh && onRefresh();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete document");
      }
    } catch (err) {
      console.error(err);
      alert("Server error during deletion");
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <Paperclip size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Documents</h2>
            <p className="text-[10px] text-gray-400 font-medium">Manage uploaded attachments</p>
          </div>
        </div>
        {isHr && mode !== 'readOnly' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#0B2D5C] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[#1a3a6c] transition-all"
          >
            <Plus size={16} /> Add Document
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-6">
        <button
          onClick={() => setActiveTab('Given')}
          className={`flex-1 sm:flex-none px-6 py-3 text-sm font-bold tracking-wide transition-all border-b-2 ${activeTab === 'Given' ? 'border-[#0B2D5C] text-[#0B2D5C]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Documents Given
        </button>
        <button
          onClick={() => setActiveTab('Taken')}
          className={`flex-1 sm:flex-none px-6 py-3 text-sm font-bold tracking-wide transition-all border-b-2 ${activeTab === 'Taken' ? 'border-[#0B2D5C] text-[#0B2D5C]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Documents Taken
        </button>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {docsToDisplay.length === 0 ? (
          <div className="col-span-full py-8 text-center text-gray-400 flex flex-col items-center gap-2">
            <AlertCircle size={32} className="text-gray-300" />
            <p className="text-sm font-medium">No documents found in this category.</p>
          </div>
        ) : (
          docsToDisplay.map(doc => (
            <div key={doc._id} className="p-5 rounded-[24px] border border-gray-100 bg-gray-50 flex flex-col gap-3 relative group hover:bg-white hover:shadow-lg transition-all">
              {isHr && mode !== 'readOnly' && (
                <button 
                  onClick={() => handleDelete(doc._id)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Document"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 uppercase truncate">
                    {doc.documentType === 'Other' ? doc.documentName : doc.documentType}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium truncate">
                    Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {mode === 'readOnly' ? (
                <div className="mt-2 flex gap-2 w-full">
                  <a 
                    href={getFullUrl(doc.proofUrl, API_BASE_URL)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-[11px] font-bold hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={14} /> Preview
                  </a>
                  <a 
                    href={getFullUrl(doc.proofUrl, API_BASE_URL)} 
                    download
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              ) : (
                <a 
                  href={getFullUrl(doc.proofUrl, API_BASE_URL)} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="mt-2 flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Eye size={14} /> Preview
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-800 tracking-tight text-lg">Upload New Document</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all text-slate-400">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                <select 
                  value={category} 
                  onChange={handleCategoryChange} 
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm font-medium text-gray-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="Given">Document Given</option>
                  <option value="Taken">Document Taken</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Document Type</label>
                <select 
                  value={documentType} 
                  onChange={handleDocumentTypeChange} 
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm font-medium text-gray-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                >
                  {PREDEFINED_DOCS[category].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {documentType === 'Other' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Document Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={documentName} 
                    onChange={e => setDocumentName(e.target.value)} 
                    placeholder="e.g. 10th Marksheet"
                    className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm font-medium text-gray-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload Proof <span className="text-rose-500">*</span></label>
                <label className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                  <Upload size={20} className={file ? 'text-emerald-500' : 'text-gray-400'} />
                  <span className="text-xs font-bold text-gray-600 truncate max-w-full px-2">
                    {file ? file.name : "Click to select a file (PDF/Image)"}
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={e => setFile(e.target.files[0])} 
                    accept="image/jpeg,image/png,application/pdf"
                  />
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#0B2D5C] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#0B2D5C]/20 hover:bg-[#1a3a6c] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
