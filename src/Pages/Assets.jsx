import { useState, useEffect, useRef } from "react";
import { 
  FiMonitor, 
  FiServer, 
  FiSearch, 
  FiPlus, 
  FiDownload, 
  FiUserPlus, 
  FiRefreshCw, 
  FiTrash2, 
  FiEdit2, 
  FiCheckCircle, 
  FiClock, 
  FiActivity,
  FiBox,
  FiFilter,
  FiMoreVertical,
  FiAlertCircle,
  FiLayers,
  FiTool
} from "react-icons/fi";
import { API_BASE_URL } from "../config/api";
import Modal from "../components/Shared/Modal";
import ConfirmModal from "../components/Shared/ConfirmModal";
import CustomSelector from "../components/Shared/CustomSelector";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    summary: { totalAssetTypes: 0, totalUnits: 0, totalAssigned: 0, totalAvailable: 0 },
    byStatus: [],
    byType: [],
    byCondition: []
  });
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Unit Modals
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showUpdateUnitModal, setShowUpdateUnitModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitUpdateForm, setUnitUpdateForm] = useState({ status: '', condition: '', serialNumber: '', notes: '' });

  // Forms
  const [assetForm, setAssetForm] = useState({
    assetName: '', assetType: '', assetId: '', serialNumber: '',
    count: 1, condition: '', purchaseDate: '', warrantyExpiry: '', notes: '',
    specifications: []
  });
  const [assignForm, setAssignForm] = useState({ userId: '', unitId: '', assignedDate: new Date().toISOString().split('T')[0] });
  const [returnForm, setReturnForm] = useState({ userId: '', unitId: '', condition: 'good', notes: '' });

  useEffect(() => {
    fetchAssets();
    fetchStats();
    fetchCompanies();
    fetchEmployees();
  }, [filterCompany, filterStatus]);

  const fetchAssets = async () => {
    console.log("Fetching assets with filters:", { filterCompany, filterStatus });
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/assets?`;
      if (filterCompany !== "all") url += `companyId=${filterCompany}&`;
      if (filterStatus !== "all") url += `status=${filterStatus}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      console.log("Assets fetched successfully:", data);
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Fetch assets error:", err); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    console.log("Fetching asset stats...");
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/assets/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      console.log("Asset stats fetched:", data);
      if (data.success) setStats(data.data);
    } catch (err) { console.error("Fetch stats error:", err); }
  };

  const fetchCompanies = async () => {
    console.log("Fetching companies for filter...");
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/company`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      console.log("Companies fetched:", data);
      setCompanies(data.company || []);
    } catch (err) { console.error("Fetch companies error:", err); }
  };

  const fetchEmployees = async () => {
    console.log("Fetching employees for assignment...");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/employee`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      console.log("Employees fetched:", data);
      setEmployees(data || []);
    } catch (err) { console.error("Fetch employees error:", err); }
  };

  const handleExport = async () => {
    console.log("Initiating assets export to Excel with filters:", { filterCompany, filterStatus });
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/assets/export?`;
      if (filterCompany !== "all") url += `companyId=${filterCompany}&`;
      if (filterStatus !== "all") url += `status=${filterStatus}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Export failed");
      }

      const blob = await response.blob();
      console.log("Export file blob generated");
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Assets_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) { 
      console.error("Export error:", err);
      alert(`Export failed: ${err.message}`); 
    }
  };

  const submitAsset = async (e) => {
    e.preventDefault();
    console.log(editingAsset ? "Updating asset..." : "Registering new asset...", assetForm);
    try {
      const token = localStorage.getItem('token');
      const specs = {};
      assetForm.specifications.forEach(row => {
        if (row.key.trim()) specs[row.key.trim()] = row.value;
      });

      const url = editingAsset ? `${API_BASE_URL}/assets/${editingAsset._id}` : `${API_BASE_URL}/assets`;
      const method = editingAsset ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...assetForm, specifications: specs, companyId: filterCompany !== "all" ? filterCompany : localStorage.getItem("selectedCompanyId") })
      });

      const responseData = await res.json();
      console.log("Asset submission response:", responseData);

      if (res.ok) {
        setShowAssetModal(false);
        resetAssetForm();
        fetchAssets();
        fetchStats();
      }
    } catch (err) { console.error("Submit asset error:", err); }
  };

  const handleDelete = (id) => {
    setAssetToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    setDeleting(true);
    console.log("Deleting asset ID:", assetToDelete);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/assets/${assetToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log("Delete response:", data);
      if (res.ok) { 
        setShowDeleteModal(false);
        setAssetToDelete(null);
        fetchAssets(); 
        fetchStats(); 
      }
    } catch (err) { console.error("Delete asset error:", err); }
    finally { setDeleting(false); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    console.log(`Assigning asset ${selectedAsset._id} to user ${assignForm.userId}`);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/assets/${selectedAsset._id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(assignForm)
      });
      const data = await res.json();
      console.log("Assignment response:", data);
      if (res.ok) {
        setShowAssignModal(false);
        fetchAssets();
        fetchStats();
        setAssignForm({ userId: '', unitId: '', assignedDate: new Date().toISOString().split('T')[0] });
      } else {
        alert(data.message || "Assignment failed");
      }
    } catch (err) { console.error("Assign asset error:", err); }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    console.log(`Processing return for asset ${selectedAsset._id} from user ${returnForm.userId}`);
    try {
       const token = localStorage.getItem('token');
       const res = await fetch(`${API_BASE_URL}/assets/${selectedAsset._id}/return`, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
         body: JSON.stringify(returnForm)
       });
       const data = await res.json();
       console.log("Return response:", data);
       if (res.ok) {
         setShowReturnModal(false);
         fetchAssets();
         fetchStats();
         setReturnForm({ userId: '', unitId: '', condition: 'good', notes: '' });
       } else {
         alert(data.message || "Return failed");
       }
    } catch (err) { console.error("Return asset error:", err); }
  };

  const fetchHistory = async (assetId) => {
    console.log("Fetching lifeline (history + tickets) for asset ID:", assetId);
    try {
      setFetchingHistory(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/assets/${assetId}/lifeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log("Lifeline data fetched:", data);
      setHistoryData(Array.isArray(data) ? data : []);
      setShowHistoryModal(true);
    } catch (err) { console.error("Fetch history error:", err); }
    finally { setFetchingHistory(false); }
  };

  const openUnitsModal = (asset) => {
    setSelectedAsset(asset);
    setShowUnitsModal(true);
  };

  const openAssignModalForUnit = (unit) => {
     setAssignForm({ userId: '', unitId: unit.unitId, assignedDate: new Date().toISOString().split('T')[0] });
     setShowUnitsModal(false);
     setShowAssignModal(true);
  };

  const openReturnModalForUnit = (unit) => {
     setReturnForm({ userId: unit.assignedTo?.user?._id || unit.assignedTo?.user || '', unitId: unit.unitId, condition: 'good', notes: '' });
     setShowUnitsModal(false);
     setShowReturnModal(true);
  };

  const openUpdateUnitModal = (unit) => {
     setSelectedUnit(unit);
     setUnitUpdateForm({
        status: unit.status || 'available',
        condition: unit.condition || 'new',
        serialNumber: unit.serialNumber || '',
        notes: unit.notes || ''
     });
     setShowUnitsModal(false);
     setShowUpdateUnitModal(true);
  };

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/assets/${selectedAsset._id}/units/${selectedUnit.unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(unitUpdateForm)
      });
      if (res.ok) {
        setShowUpdateUnitModal(false);
        fetchAssets();
        fetchStats();
        // Re-open units modal with updated asset? 
        // Best approach is a fresh fetch, but we can just close it for now.
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update unit");
      }
    } catch (err) { console.error("Update unit error:", err); }
  };

  const resetAssetForm = () => {
    setAssetForm({
      assetName: '', assetType: '', assetId: '', serialNumber: '',
      count: 1, condition: '', purchaseDate: '', warrantyExpiry: '', notes: '',
      specifications: []
    });
    setEditingAsset(null);
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setAssetForm({
      assetName: asset.assetName,
      assetType: asset.assetType,
      assetId: asset.assetId,
      serialNumber: asset.serialNumber || '',
      count: asset.count || 1,
      condition: asset.condition || '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      notes: asset.notes || '',
      specifications: asset.specifications ? Object.entries(asset.specifications).map(([key, value]) => ({ key, value })) : []
    });
    setShowAssetModal(true);
  };

  const filteredAssets = assets.filter(a => 
    a.assetName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.assetId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 overflow-hidden">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {[
          { label: "Total Units", value: stats.summary.totalUnits, color: "blue", icon: <FiBox /> },
          { label: "Currently Assigned", value: stats.summary.totalAssigned, color: "emerald", icon: <FiUserPlus /> },
          { label: "Available Stock", value: stats.summary.totalAvailable, color: "violet", icon: <FiCheckCircle /> },
          { label: "Total Types", value: stats.summary.totalAssetTypes, color: "orange", icon: <FiActivity /> },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-3 rounded-md border border-slate-100 shadow-sm transition-all hover:shadow-md flex items-center justify-between">
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{s.label}</p>
               <p className="text-lg font-black text-[#0B2D5C]">{s.value}</p>
            </div>
            <div className={`w-8 h-8 bg-${s.color}-500/10 text-${s.color}-600 rounded flex items-center justify-center shrink-0`}>
               {s.icon}
            </div>
          </div>
        ))}
      </div>



      {/* Filter & Action Bar */}
      <div className="bg-white border border-slate-100 rounded-md p-2 mb-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-sm relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input 
              type="text" 
              placeholder="Search assets..."
              className="w-full bg-slate-50 border border-transparent py-1.5 pl-9 pr-3 rounded text-[11px] font-bold outline-none focus:bg-white focus:border-blue-500/20 transition-all text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
             <CustomSelector 
               icon={<FiBox size={13}/>}
               value={filterCompany}
               options={[{id: 'all', name: 'All Companies'}, ...companies.map(c=>({id: c._id, name: c.companyName}))]}
               onChange={setFilterCompany}
               minWidth="130px"
               placeholder="All Companies"
             />
             <select 
               value={filterStatus}
               onChange={e=>setFilterStatus(e.target.value)}
               className="bg-slate-50 border border-slate-200 py-1.5 px-3 rounded font-bold text-[10px] outline-none text-slate-600 focus:bg-white cursor-pointer transition-all"
             >
               <option value="all">All Statuses</option>
               <option value="available">Available</option>
               <option value="partially-assigned">Partially Assigned</option>
               <option value="fully-assigned">Fully Assigned</option>
               <option value="damaged">Damaged</option>
               <option value="maintenance">Maintenance</option>
               <option value="retired">Retired</option>
             </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-md text-[10px] font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <FiDownload size={13} /> EXPORT
          </button>
          <button 
            onClick={() => { resetAssetForm(); setShowAssetModal(true); }}
            className="flex items-center gap-1.5 bg-[#0B2D5C] text-white px-4 py-1.5 rounded-md text-[10px] font-black shadow-sm hover:bg-[#1a3a6c] transition-all active:scale-95"
          >
            <FiPlus size={13} /> REGISTER
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-5 py-3">Asset Details</th>
                <th className="px-5 py-3">Specifications</th>
                <th className="px-5 py-3 text-center">Stock Info</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset._id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${asset.condition === 'new' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {asset.assetType === 'Laptop' ? <FiMonitor size={16}/> : <FiServer size={16}/>}
                      </div>
                      <div>
                        <p className="font-bold text-[#0B2D5C] text-[12px]">{asset.assetName}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{asset.assetId} &bull; {asset.condition}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="max-w-[200px]">
                       <p className="text-[10px] font-bold text-slate-600 truncate">
                         {asset.specifications ? Object.entries(asset.specifications).map(([k,v])=>`${v}`).join(' / ') : '—'}
                       </p>
                       <p className="text-[8px] text-slate-400 font-bold italic">{asset.serialNumber || 'No SN'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div>
                      <p className="text-[12px] font-bold text-slate-700">{asset.units?.filter(u => u.status === 'assigned').length || 0} / {asset.count}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Assigned</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {(() => {
                      const assigned = asset.units?.filter(u => u.status === 'assigned').length || 0;
                      const total = asset.count || 0;
                      let status = (asset.status || 'available').toLowerCase();
                      
                      // Derive status based on counts if not a special manual status
                      if (!['damaged', 'maintenance', 'retired'].includes(status)) {
                        if (assigned === 0) status = 'available';
                        else if (assigned >= total) status = 'fully-assigned';
                        else status = 'partially-assigned';
                      }

                      const isAvailable = status === 'available';
                      const isAssigned = status.includes('assigned');
                      
                      return (
                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-current
                          ${isAvailable ? 'text-emerald-500 bg-emerald-50/50' : 
                            isAssigned ? 'text-blue-500 bg-blue-50/50' : 'text-orange-500 bg-orange-50/50'}`}>
                          {status.replace(/-/g, ' ')}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1.5 text-slate-400">
                       <button onClick={()=>fetchHistory(asset._id)} className="p-1.5 hover:bg-slate-100 hover:text-slate-600 rounded transition-all" title="View History"><FiClock size={13}/></button>
                       <button onClick={()=>openUnitsModal(asset)} className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-all" title="Manage Units"><FiLayers size={13}/></button>
                       <button onClick={()=>openEditModal(asset)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded transition-all" title="Edit Properties"><FiEdit2 size={13}/></button>
                       
                       {/* Assign only if stock available AND status allows assignment */}
                       {(asset.units?.filter(u => u.status === 'assigned').length || 0) < (asset.count || 0) && 
                        !['damaged', 'maintenance', 'retired'].includes(asset.status) && (
                         <button onClick={()=>{setSelectedAsset(asset); setShowAssignModal(true);}} className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 rounded transition-all" title="Assign Rapidly"><FiUserPlus size={13}/></button>
                       )}

                       {/* Return only if currently assigned to someone */}
                       {(asset.units?.filter(u => u.status === 'assigned').length || 0) > 0 && (
                         <button onClick={()=>{setSelectedAsset(asset); setShowReturnModal(true);}} className="p-1.5 hover:bg-orange-50 hover:text-orange-600 rounded transition-all" title="Return Rapidly"><FiRefreshCw size={13}/></button>
                       )}

                       <button onClick={()=>handleDelete(asset._id)} className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded transition-all" title="Delete Master Asset"><FiTrash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && !loading && (
                <tr>
                   <td colSpan="5" className="py-20 text-center">
                      <FiAlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest italic">No matching assets found</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}

      {/* REGISTER / EDIT ASSET MODAL */}
      {showAssetModal && (
        <Modal 
          title={editingAsset ? "Edit Asset" : "Register Asset"} 
          onClose={() => setShowAssetModal(false)}
          maxWidth="max-w-2xl"
        >
           <form onSubmit={submitAsset} className="space-y-5 max-h-[85vh] overflow-y-auto pr-3 custom-scrollbar-thin">
              <div className="space-y-5">
                <Input label="Equipment Name" value={assetForm.assetName} onChange={v=>setAssetForm({...assetForm, assetName:v})} placeholder="Enter Equipment Name" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <Input label="Asset Type" value={assetForm.assetType} onChange={v=>setAssetForm({...assetForm, assetType:v})} placeholder="Enter Asset Type" />
                   <Input label="Asset ID" value={assetForm.assetId} onChange={v=>setAssetForm({...assetForm, assetId:v})} placeholder="Enter Asset ID" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <Input label="Serial Number" value={assetForm.serialNumber} onChange={v=>setAssetForm({...assetForm, serialNumber:v})} placeholder="Enter Serial Number" />
                   <Input label="Total Units" type="number" value={assetForm.count} onChange={v=>setAssetForm({...assetForm, count: parseInt(v) || 1})} placeholder="Enter Total Units" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <Input label="Purchase Date" type="date" value={assetForm.purchaseDate} onChange={v=>setAssetForm({...assetForm, purchaseDate:v})} />
                   <div className="space-y-1.5 text-left">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Condition</label>
                       <select 
                         className="w-full bg-[#F8FAFC] p-3 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-indigo-500/20 transition-all text-slate-700" 
                         value={assetForm.condition} 
                         onChange={e=>setAssetForm({...assetForm, condition:e.target.value})}
                       >
                          <option value="">Select Condition</option>
                          <option value="new">New</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                          <option value="refurbished">Refurbished</option>
                       </select>
                    </div>
                </div>

                {/* DYNAMIC SPECIFICATIONS SECTION */}
                <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 space-y-4">
                   <div className="flex items-center justify-between px-1">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specifications</h4>
                      <button 
                        type="button"
                        onClick={() => setAssetForm(prev => ({...prev, specifications: [...prev.specifications, { key: '', value: '' }]}))}
                        className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shadow-sm active:scale-95"
                      >
                         <FiPlus size={14} />
                      </button>
                   </div>

                   {assetForm.specifications.length === 0 ? (
                     <p className="text-[10px] text-slate-300 font-bold italic text-center py-2">Click + to add specifications</p>
                   ) : (
                     <div className="space-y-3">
                        {assetForm.specifications.map((spec, i) => (
                           <div key={i} className="flex gap-3 items-end group animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="flex-1">
                                 <input 
                                   placeholder="Feature 1" 
                                   value={spec.key} 
                                   onChange={e => {
                                      const newSpecs = [...assetForm.specifications];
                                      newSpecs[i].key = e.target.value;
                                      setAssetForm(prev => ({...prev, specifications: newSpecs}));
                                   }}
                                   className="w-full bg-white border border-slate-200 p-2 rounded text-[11px] font-bold outline-none focus:border-blue-500/20"
                                 />
                              </div>
                              <div className="flex-1">
                                 <input 
                                   placeholder="Description" 
                                   value={spec.value} 
                                   onChange={e => {
                                      const newSpecs = [...assetForm.specifications];
                                      newSpecs[i].value = e.target.value;
                                      setAssetForm(prev => ({...prev, specifications: newSpecs}));
                                   }}
                                   className="w-full bg-white border border-slate-200 p-2 rounded text-[11px] font-bold outline-none focus:border-blue-500/20"
                                 />
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                   const newSpecs = assetForm.specifications.filter((_, idx) => idx !== i);
                                   setAssetForm(prev => ({...prev, specifications: newSpecs}));
                                }}
                                className="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-300 hover:text-rose-500 hover:border-rose-100 flex items-center justify-center transition"
                              >
                                 <FiTrash2 size={12} />
                              </button>
                           </div>
                        ))}
                     </div>
                   )}
                </div>

                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-400 font-bold uppercase tracking-widest px-1">Remarks</label>
                   <textarea 
                     className="w-full bg-[#F8FAFC] p-4 rounded-md text-[12px] font-bold outline-none min-h-[140px] border border-transparent focus:bg-white focus:border-blue-500/20 transition-all text-slate-700" 
                     value={assetForm.notes} 
                     onChange={e=>setAssetForm({...assetForm, notes: e.target.value})} 
                     placeholder="Enter Remarks..."
                   />
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 bg-[#0B2D5C] text-white rounded-md font-black text-[11px] uppercase shadow-lg hover:bg-[#1a3a6c] active:scale-95 transition-all mt-4">
                {editingAsset ? "Save Changes" : "Initialize Asset"}
              </button>
           </form>
        </Modal>
      )}

      {/* ASSIGN ASSET MODAL */}
      {showAssignModal && selectedAsset && (
        <Modal title="Assign Asset" onClose={() => setShowAssignModal(false)} maxWidth="max-w-md">
           <form onSubmit={handleAssign} className="space-y-6">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                 <div>
                    <p className="text-[13px] font-black text-emerald-600">{selectedAsset.assetName}</p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{selectedAsset.assetId}</p>
                 </div>
                 <span className="text-[10px] font-black text-emerald-600 bg-white px-2 py-1 rounded-lg">
                    {selectedAsset.units?.filter(u => u.status === 'available').length || 0} Units Left
                 </span>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase px-1">Select Unit (Optional)</label>
                    <select className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none border border-transparent focus:bg-white focus:border-emerald-500/20 text-slate-700" value={assignForm.unitId} onChange={e=>setAssignForm({...assignForm, unitId:e.target.value})}>
                        <option value="">Auto-assign any available unit</option>
                        {selectedAsset.units?.filter(u => u.status === 'available').map(u => (
                           <option key={u.unitId} value={u.unitId}>{u.unitId} {u.serialNumber ? `(${u.serialNumber})` : ''}</option>
                        ))}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase px-1">Select Employee</label>
                    <CustomSelector 
                      value={assignForm.userId}
                      options={employees.map(e => ({ id: e.user?._id || e.user, name: `${e.user?.name || "Employee"} (${e.employeeId})` }))}
                      onChange={id => setAssignForm({...assignForm, userId: id})}
                      isLarge
                      placeholder="Search employee..."
                    />
                 </div>
                 <Input label="Assignment Date" type="date" value={assignForm.assignedDate} onChange={v=>setAssignForm({...assignForm, assignedDate:v})} />
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-md font-black text-[11px] shadow-lg active:scale-95 transition-all uppercase italic">
                Confirm Assignment
              </button>
           </form>
        </Modal>
      )}

      {/* RETURN ASSET MODAL */}
      {showReturnModal && selectedAsset && (
        <Modal title="Process Asset Return" onClose={() => setShowReturnModal(false)} maxWidth="max-w-md">
           <form onSubmit={handleReturn} className="space-y-6">
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase px-1">Select User returning this asset</label>
                    <select className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none text-slate-700" value={returnForm.userId} onChange={e=>setReturnForm({...returnForm, userId:e.target.value})}>
                        <option value="">Select returning employee...</option>
                        {[...new Map(selectedAsset.units?.filter(u=>u.assignedTo?.user).map(u => [u.assignedTo.user._id || u.assignedTo.user, u.assignedTo.user])).values()].map(u => (
                          <option key={u._id || u} value={u._id || u}>{u.name || "Employee"}</option>
                        ))}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase px-1">Select Unit to Return</label>
                    <select className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none text-slate-700" value={returnForm.unitId} onChange={e=>setReturnForm({...returnForm, unitId:e.target.value})}>
                        <option value="">Auto-select unit based on user</option>
                        {selectedAsset.units?.filter(u => u.status === 'assigned' && (!returnForm.userId || u.assignedTo?.user?._id === returnForm.userId || u.assignedTo?.user === returnForm.userId)).map(u => (
                           <option key={u.unitId} value={u.unitId}>{u.unitId} - {u.assignedTo?.user?.name || 'Employee'}</option>
                        ))}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase px-1">Condition upon return</label>
                    <select className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none text-slate-700" value={returnForm.condition} onChange={e=>setReturnForm({...returnForm, condition:e.target.value})}>
                       <option value="good">Good / Functional</option>
                       <option value="fair">Fair / Used</option>
                       <option value="poor">Poor / Wear & Tear</option>
                       <option value="damaged">Damaged / Repair Needed</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase px-1">Return Notes</label>
                   <textarea className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-[13px] font-bold outline-none min-h-[80px]" value={returnForm.notes} onChange={e=>setReturnForm({...returnForm, notes: e.target.value})} placeholder="Any issues found?"/>
                </div>
              </div>
              <button disabled={!returnForm.userId} type="submit" className="w-full py-4 bg-orange-600 text-white rounded-md font-black text-[11px] shadow-lg active:scale-95 transition-all uppercase italic disabled:opacity-50">
                Log Return & Sync Inventory
              </button>
           </form>
        </Modal>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <Modal title="Asset LifeLine" onClose={() => setShowHistoryModal(false)} maxWidth="max-w-lg">
           <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar-thin space-y-6 py-4">
              {historyData.length === 0 ? (
                <div className="py-12 text-center">
                   <FiClock size={30} className="mx-auto text-slate-200 mb-3" />
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No history recorded yet</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                   {historyData.map((item, idx) => {
                     const isTicket = item.type === 'ticket';
                     let icon = <FiClock size={10} />;
                     let bgColor = 'bg-slate-400';
                     let badgeColor = 'bg-slate-50 text-slate-500';

                     if (isTicket) {
                       icon = <FiAlertCircle size={10} />;
                       bgColor = 'bg-blue-500';
                       badgeColor = 'bg-blue-50 text-blue-600';
                     } else {
                       switch (item.action) {
                         case 'ASSIGNED': icon = <FiUserPlus size={10} />; bgColor = 'bg-emerald-500'; break;
                         case 'RETURNED': icon = <FiRefreshCw size={10} />; bgColor = 'bg-orange-500'; break;
                         case 'CREATED': icon = <FiPlus size={10} />; bgColor = 'bg-indigo-500'; break;
                         case 'UPDATED': icon = <FiEdit2 size={10} />; bgColor = 'bg-amber-500'; break;
                       }
                     }

                     return (
                       <div key={idx} className="relative">
                          <div className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white ${bgColor}`}>
                             {icon}
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                             <div className="flex justify-between items-start mb-3">
                                <div>
                                   <p className="text-[11px] font-black text-[#0B2D5C] uppercase tracking-tight">
                                     {isTicket ? `Support: ${item.details?.title}` : item.action.replace(/_/g, ' ')}
                                   </p>
                                   <p className="text-[9px] text-slate-400 font-bold">
                                     {new Date(item.createdAt).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                                   </p>
                                </div>
                                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${badgeColor}`}>
                                  {isTicket ? item.details?.status || 'Ticket' : item.type}
                                </span>
                             </div>

                             {isTicket ? (
                               <div className="space-y-2">
                                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">{item.details?.description}</p>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Priority: {item.details?.priority}</span>
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Category: {item.details?.category}</span>
                                  </div>
                               </div>
                             ) : (
                               <div className="space-y-3">
                                 {/* Render Detailed Info Based on Action */}
                                 {item.action === 'ASSIGNED' && (
                                   <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                                      <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1 tracking-wider">Assigned To</p>
                                      <p className="text-[12px] font-black text-emerald-900">{item.details?.assignedTo?.name}</p>
                                      <p className="text-[10px] text-emerald-600 font-medium">{item.details?.assignedTo?.email}</p>
                                   </div>
                                 )}

                                 {item.action === 'RETURNED' && (
                                   <div className="bg-orange-50/50 p-2 rounded-xl border border-orange-100/50">
                                      <p className="text-[10px] font-bold text-orange-700 uppercase mb-1 tracking-wider">Returned By</p>
                                      <div className="flex justify-between items-end">
                                         <div>
                                            <p className="text-[12px] font-black text-orange-900">{item.details?.returnedBy?.name}</p>
                                            <p className="text-[10px] text-orange-600 font-medium">Condition: <span className="uppercase">{item.details?.conditionAtReturn}</span></p>
                                         </div>
                                         <p className="text-[9px] text-orange-400 font-bold italic">on {new Date(item.details?.returnDate).toLocaleDateString()}</p>
                                      </div>
                                   </div>
                                 )}

                                 {item.action === 'UPDATED' && (
                                   <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100/50">
                                      <p className="text-[10px] font-bold text-amber-700 uppercase mb-1 tracking-wider">Parameters Updated</p>
                                      <div className="grid grid-cols-2 gap-2 mt-1">
                                         <div className="text-[10px]"><span className="text-amber-500 font-bold">Qty:</span> <span className="font-black text-slate-700">{item.details?.count}</span></div>
                                         <div className="text-[10px]"><span className="text-amber-500 font-bold">Condition:</span> <span className="font-black text-slate-700 uppercase">{item.details?.condition}</span></div>
                                         <div className="text-[10px] col-span-2 truncate"><span className="text-amber-500 font-bold">Model:</span> <span className="font-black text-slate-700">{item.details?.specifications?.model || 'N/A'}</span></div>
                                      </div>
                                   </div>
                                 )}

                                 {item.action === 'CREATED' && (
                                   <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                                      <p className="text-[10px] font-bold text-indigo-700 uppercase mb-1 tracking-wider">Initial Registration</p>
                                      <div className="flex justify-between text-[11px]">
                                         <span className="font-bold text-indigo-900">ID: {item.details?.assetId}</span>
                                         <span className="font-bold text-indigo-900">Units: {item.details?.count}</span>
                                      </div>
                                   </div>
                                 )}

                                 {item.details?.notes && (
                                   <p className="text-[10px] text-slate-500 font-medium italic translate-y-0.5">"{item.details.notes}"</p>
                                 )}

                                 <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-1">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                                      {item.performedBy?.name?.charAt(0)}
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 italic">By {item.performedBy?.name || 'System'}</p>
                                 </div>
                               </div>
                             )}
                          </div>
                       </div>
                     );
                   })}
                </div>
              )}
           </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Asset"
        message="Are you sure you want to delete this hardware asset? This will permanently remove its history and inventory records."
      />

      {/* UNITS MANAGEMENT MODAL */}
      {showUnitsModal && selectedAsset && (
        <Modal title={`Manage Units: ${selectedAsset.assetName}`} onClose={() => setShowUnitsModal(false)} maxWidth="max-w-4xl">
            <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar-thin space-y-4">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                     <p className="text-[14px] font-black text-[#0B2D5C]">{selectedAsset.assetName}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedAsset.assetId}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[14px] font-black text-[#0B2D5C]">{selectedAsset.count} Total Units</p>
                     <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{selectedAsset.units?.filter(u => u.status === 'available').length || 0} Available</p>
                  </div>
               </div>

               <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                     <thead className="bg-[#F8FAFC]">
                        <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                           <th className="px-4 py-3">Unit ID / SN</th>
                           <th className="px-4 py-3">Status</th>
                           <th className="px-4 py-3">Condition</th>
                           <th className="px-4 py-3">Assigned To</th>
                           <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                     </thead>
                     <tbody>
                        {selectedAsset.units?.map((unit, idx) => (
                           <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                              <td className="px-4 py-3">
                                 <p className="text-[11px] font-bold text-slate-700">{unit.unitId}</p>
                                 <p className="text-[9px] text-slate-400 font-bold">{unit.serialNumber || 'No SN'}</p>
                              </td>
                              <td className="px-4 py-3">
                                 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-current
                                    ${unit.status === 'available' ? 'text-emerald-500 bg-emerald-50' : 
                                      unit.status === 'assigned' ? 'text-blue-500 bg-blue-50' : 
                                      unit.status === 'damaged' ? 'text-rose-500 bg-rose-50' :
                                      'text-orange-500 bg-orange-50'}`}>
                                    {unit.status}
                                 </span>
                              </td>
                              <td className="px-4 py-3 text-[10px] font-bold text-slate-600 uppercase">
                                 {unit.condition}
                              </td>
                              <td className="px-4 py-3">
                                 {unit.assignedTo?.user ? (
                                    <div>
                                       <p className="text-[10px] font-bold text-slate-700">{unit.assignedTo.user.name || 'Assigned'}</p>
                                       <p className="text-[8px] text-slate-400 font-bold">{new Date(unit.assignedTo.assignedDate).toLocaleDateString()}</p>
                                    </div>
                                 ) : <span className="text-[10px] text-slate-400 font-bold italic">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                 <div className="flex items-center justify-center gap-2">
                                    {unit.status === 'available' && !unit.assignedTo?.user && (
                                       <button onClick={()=>{ openAssignModalForUnit(unit); }} className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-100 transition-all uppercase">Assign</button>
                                    )}
                                    {unit.assignedTo?.user && (
                                       <button onClick={()=>{ openReturnModalForUnit(unit); }} className="text-[9px] font-black bg-orange-50 text-orange-600 px-2 py-1 rounded hover:bg-orange-100 transition-all uppercase">Return</button>
                                    )}
                                    <button onClick={()=>{ openUpdateUnitModal(unit); }} className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-all flex items-center gap-1 uppercase" title="Update Status / Maintenance"><FiTool size={10} /> Update</button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
        </Modal>
      )}

      {/* UPDATE UNIT MODAL */}
      {showUpdateUnitModal && selectedUnit && selectedAsset && (
         <Modal title={`Update Unit: ${selectedUnit.unitId}`} onClose={() => setShowUpdateUnitModal(false)} maxWidth="max-w-md">
            <form onSubmit={handleUpdateUnit} className="space-y-5">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Status</label>
                     <select className="w-full bg-[#F8FAFC] p-3 rounded-md outline-none font-bold text-[12px] text-slate-700" value={unitUpdateForm.status} onChange={e=>setUnitUpdateForm({...unitUpdateForm, status: e.target.value})}>
                        {!selectedUnit?.assignedTo?.user && <option value="available">Available</option>}
                        {selectedUnit?.assignedTo?.user && <option value="assigned" disabled>Assigned (Return Asset First)</option>}
                        <option value="damaged">Damaged</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                     </select>
                  </div>
                  <div className="space-y-1.5 text-left">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Condition</label>
                     <select className="w-full bg-[#F8FAFC] p-3 rounded-md outline-none font-bold text-[12px] text-slate-700" value={unitUpdateForm.condition} onChange={e=>setUnitUpdateForm({...unitUpdateForm, condition: e.target.value})}>
                        <option value="new">New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                        <option value="refurbished">Refurbished</option>
                     </select>
                  </div>
               </div>
               <Input label="Serial Number" value={unitUpdateForm.serialNumber} onChange={v=>setUnitUpdateForm({...unitUpdateForm, serialNumber:v})} placeholder="Update Serial Number" />
               <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Notes</label>
                  <textarea className="w-full bg-[#F8FAFC] p-3 rounded-md outline-none font-bold text-[12px] min-h-[80px] text-slate-700" value={unitUpdateForm.notes} onChange={e=>setUnitUpdateForm({...unitUpdateForm, notes: e.target.value})} placeholder="Maintenance notes or reason..."/>
               </div>
               <button type="submit" className="w-full py-3.5 bg-[#0B2D5C] text-white rounded-md font-black text-[11px] uppercase shadow-lg hover:bg-[#1a3a6c] active:scale-95 transition-all">
                  Update Unit Details
               </button>
            </form>
         </Modal>
      )}

    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1.5 text-left">
       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
       <input 
         type={type}
         placeholder={placeholder}
         value={value}
         onChange={e => onChange(e.target.value)}
         className="w-full bg-[#F8FAFC] p-3 rounded-md outline-none font-bold text-[12px] border border-transparent focus:bg-white focus:border-indigo-500/20 transition-all text-slate-700"
       />
    </div>
  );
}
