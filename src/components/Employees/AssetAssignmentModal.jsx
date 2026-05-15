import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import { FiX, FiBox, FiRotateCcw, FiPlus, FiInfo, FiCheckCircle, FiClock, FiCalendar, FiArrowLeft } from "react-icons/fi";
import { API_BASE_URL } from "../../config/api";

const AssetAssignmentModal = ({ isOpen, onClose, employee, onRefresh }) => {
  const [activeTab, setActiveTab] = useState("assign"); // "assign", "return", or "history"
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Assign Tab State
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split("T")[0]);

  // Return Tab State
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnCondition, setReturnCondition] = useState("good");

  // History Tab State
  const [userHistory, setUserHistory] = useState([]);

  const companyId = employee?.user?.companyId?._id || employee?.user?.companyId || employee?.companyId?._id || employee?.companyId;
  const userId = employee?.user?._id || employee?.user;

  useEffect(() => {
    if (isOpen && employee) {
      if (activeTab === "assign") {
        fetchAvailableAssets();
      } else if (activeTab === "return") {
        fetchAssignedAssets();
      } else if (activeTab === "history") {
        fetchUserHistory();
      }
    }
  }, [isOpen, activeTab, employee]);

  const fetchUserHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/assets/user/${userId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUserHistory(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user history:", error);
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Fetch all assets for this company
      const response = await fetch(`${API_BASE_URL}/assets?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Filter assets that have at least one available unit
      const assetsWithAvailableUnits = data.filter(asset => 
        asset.units.some(unit => unit.status === "available")
      );
      
      setAvailableAssets(assetsWithAvailableUnits);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching available assets:", error);
      setLoading(false);
    }
  };

  const fetchAssignedAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Fetch assets assigned to this specific user
      const response = await fetch(`${API_BASE_URL}/assets?assignedToUser=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAssignedAssets(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching assigned assets:", error);
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedAsset || !selectedUnit) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/assets/${selectedAsset._id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          unitId: selectedUnit,
          assignedDate: assignedDate
        })
      });

      const result = await response.json();
      if (response.ok) {
        alert("Asset assigned successfully!");
        setSelectedAsset(null);
        setSelectedUnit("");
        fetchAvailableAssets();
        if (onRefresh) onRefresh();
      } else {
        alert(result.message || "Failed to assign asset");
      }
    } catch (error) {
      console.error("Error assigning asset:", error);
      alert("An error occurred during assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (assetId, unitId) => {
    if (!window.confirm("Are you sure you want to return this asset?")) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          unitId: unitId,
          condition: returnCondition,
          notes: returnNotes
        })
      });

      const result = await response.json();
      if (result.success || response.ok) {
        alert("Asset returned successfully!");
        setReturnNotes("");
        fetchAssignedAssets();
        if (onRefresh) onRefresh();
      } else {
        alert(result.message || "Failed to return asset");
      }
    } catch (error) {
      console.error("Error returning asset:", error);
      alert("An error occurred during return");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <FiBox size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 leading-none">Asset Management</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                {employee?.user?.name || `${employee?.firstName} ${employee?.lastName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setActiveTab("history")}
              title="View History"
              className={`p-2 rounded-full transition-colors ${activeTab === 'history' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-400'}`}
            >
              <FiClock size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("assign")}
            className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-widest transition-all ${
              activeTab === "assign" 
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            Assign New
          </button>
          <button
            onClick={() => setActiveTab("return")}
            className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-widest transition-all ${
              activeTab === "return" 
                ? "text-rose-600 border-b-2 border-rose-600 bg-rose-50/30" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            Return Asset
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-slate-50/30">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading data...</p>
            </div>
          ) : activeTab === "history" ? (
             <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                   <button onClick={() => setActiveTab("assign")} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                      <FiArrowLeft size={12}/> Back to Assign
                   </button>
                </div>
                {userHistory.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm font-bold text-slate-400">No history found</p>
                  </div>
                ) : (
                  userHistory.map((item, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <h4 className="text-xs font-black text-slate-800">{item.assetId?.assetName}</h4>
                             <p className="text-[9px] font-bold text-slate-400 uppercase">{item.assetId?.assetId} | Unit: {item.details?.unitId}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            item.action === 'ASSIGNED' ? 'bg-emerald-100 text-emerald-600' : 
                            item.action === 'RETURNED' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.action}
                          </span>
                       </div>
                       <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                          <div className="flex items-center gap-1">
                             <FiCalendar size={12} className="text-slate-300" />
                             <span>{moment(item.createdAt).format('DD/MM/YYYY')}</span>
                          </div>
                          {item.details?.conditionAtReturn && (
                             <div className="flex items-center gap-1">
                                <span className="text-slate-300">Condition:</span>
                                <span className="capitalize text-slate-700">{item.details.conditionAtReturn}</span>
                             </div>
                          )}
                       </div>
                       {item.details?.notes && (
                          <p className="mt-2 text-[10px] text-slate-400 italic bg-slate-50 p-1.5 rounded">"{item.details.notes}"</p>
                       )}
                    </div>
                  ))
                )}
             </div>
          ) : activeTab === "assign" ? (
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Asset</label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700 transition-all"
                  value={selectedAsset?._id || ""}
                  onChange={(e) => {
                    const asset = availableAssets.find(a => a._id === e.target.value);
                    setSelectedAsset(asset);
                    setSelectedUnit("");
                  }}
                  required
                >
                  <option value="">Choose an asset...</option>
                  {availableAssets.map(asset => (
                    <option key={asset._id} value={asset._id}>
                      {asset.assetName} ({asset.assetType})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAsset && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Unit ID</label>
                  <select
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700 transition-all"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    required
                  >
                    <option value="">Choose a unit...</option>
                    {selectedAsset.units
                      .filter(u => u.status === "available")
                      .map(unit => (
                        <option key={unit.unitId} value={unit.unitId}>
                          {unit.unitId} {unit.serialNumber ? `- SN: ${unit.serialNumber}` : ""}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assignment Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700 transition-all"
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || !selectedAsset || !selectedUnit}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FiPlus size={18} />
                      Assign Asset
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {assignedAssets.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-200">
                    <FiBox size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">No assets assigned</p>
                    <p className="text-[11px] text-slate-400 mt-1">This employee doesn't have any assets currently.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {assignedAssets.map(asset => {
                      // Find the unit assigned to this user
                      const myUnit = asset.units.find(u => u.assignedTo?.user?._id === userId || u.assignedTo?.user === userId);
                      
                      return (
                        <div key={`${asset._id}-${myUnit?.unitId}`} className="group p-4 bg-white border border-slate-200 rounded-xl hover:border-rose-200 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-sm font-black text-slate-800">{asset.assetName}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Unit: <span className="text-blue-600">{myUnit?.unitId}</span>
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-wider">
                              Assigned
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mb-4">
                            <FiInfo size={12} className="text-slate-400" />
                            <span>Assigned on {new Date(myUnit?.assignedTo?.assignedDate).toLocaleDateString()}</span>
                          </div>

                          <button
                            onClick={() => handleReturn(asset._id, myUnit?.unitId)}
                            disabled={submitting}
                            className="w-full bg-white border border-rose-200 hover:bg-rose-600 hover:text-white text-rose-600 py-2 rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2"
                          >
                            <FiRotateCcw size={14} />
                            Return Asset
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Return Settings</h5>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Condition</label>
                        <select
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                          value={returnCondition}
                          onChange={(e) => setReturnCondition(e.target.value)}
                        >
                          <option value="good">Good</option>
                          <option value="damaged">Damaged</option>
                          <option value="poor">Poor</option>
                          <option value="refurbished">Refurbished</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Notes</label>
                      <textarea
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 h-16 resize-none focus:ring-1 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                        placeholder="Any comments on return..."
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
           <FiCheckCircle size={12} className="text-emerald-500" />
           <p className="text-[10px] font-bold text-slate-400">All changes are logged in asset history</p>
        </div>
      </div>
    </div>
  );
};

export default AssetAssignmentModal;
