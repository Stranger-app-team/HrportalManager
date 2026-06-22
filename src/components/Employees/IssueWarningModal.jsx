import React, { useState } from "react";
import { API_BASE_URL } from "../../config/api";
import { FileText, X } from "lucide-react";

export default function IssueWarningModal({ employeeId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Warning",
    severityLevel: "Medium",
    document: null
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, document: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const data = new FormData();
      data.append("employeeId", employeeId);
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("type", formData.type);
      data.append("severityLevel", formData.severityLevel);
      if (formData.document) {
        data.append("document", formData.document);
      }

      const response = await fetch(`${API_BASE_URL}/warnings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      const result = await response.json();
      if (result.success) {
        alert("Action issued successfully.");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(result.message || "Failed to issue action.");
      }
    } catch (error) {
      console.error("Error submitting warning:", error);
      alert("Error issuing action.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Issue Disciplinary Action</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Type</label>
              <select 
                className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Alert">Alert</option>
                <option value="Warning">Warning</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Severity Level</label>
              <select 
                className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 bg-white"
                value={formData.severityLevel}
                onChange={(e) => setFormData({...formData, severityLevel: e.target.value})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Title</label>
            <input 
              required
              type="text" 
              placeholder="E.g. Code of Conduct Violation"
              className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm text-slate-700"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea 
              required
              rows="3"
              className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-700 resize-none"
              placeholder="Provide detailed context..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Supporting Document</label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center justify-center h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
                <FileText size={16} className="mr-2 text-slate-400" />
                Choose File
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
              {formData.document && <span className="text-xs text-slate-600 truncate flex-1">{formData.document.name}</span>}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-[#0B2D5C] text-white text-sm font-bold rounded-lg shadow-md hover:bg-[#153b75]">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
