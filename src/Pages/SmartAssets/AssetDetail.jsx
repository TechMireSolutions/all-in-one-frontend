import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';
import { ArrowLeft, Cpu, Database, Monitor, Send, Sparkles, Loader2, User, Shield, Info, Download, Edit, Trash2, ShieldCheck, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [response, setResponse] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const [showEditAssignModal, setShowEditAssignModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editEmployeeName, setEditEmployeeName] = useState('');
  const [editShift, setEditShift] = useState('Full-time');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await api.get(`/api/assets/${id}/`);
        setAsset(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

  const handleDownload = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/smart-assets/asset/${asset.id}`)}`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR-${asset.serial_number}.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [shift, setShift] = useState('Full-time');

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      await api.post('/api/assignments/', {
        asset: asset.id,
        employee_name: employeeName,
        shift: shift
      });
      
      const res = await api.get(`/api/assets/${id}/`);
      setAsset(res.data);
      
      setShowAssignModal(false);
      setEmployeeName('');
      alert(`Asset successfully assigned to ${employeeName} (${shift})`);
    } catch (err) {
      console.error(err);
      alert("Failed to assign asset. Please check server connection.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSupportRequest = async (e) => {
    e.preventDefault();
    if (!query) return;

    setChatLoading(true);
    setResponse('');
    try {
      const res = await api.post(`/api/assets/${id}/support/`, { query });
      setResponse(res.data.response);
    } catch (err) {
      console.error(err);
      setResponse("Network bottleneck: Failed to communicate with AI core. Please check server connection.");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-orange-500" size={64} />
      <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">Deciphering Asset Data</p>
    </div>
  );

  if (!asset) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6 border border-red-200">
        <Info size={40} />
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-2">Entity Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-sm">The requested asset identifier does not exist in our system ledger.</p>
      <button onClick={() => navigate('/smart-assets/dashboard')} className="bg-orange-500 hover:bg-orange-600 cursor-pointer px-8 py-3 rounded-xl font-bold text-white transition-colors shadow-lg shadow-orange-500/20">Return to Dashboard</button>
    </div>
  );

  const handleDelete = async () => {
    if (window.confirm(`Are you certain you wish to PERMANENTLY DE-INITIALIZE ${asset.name}? This action is irreversible.`)) {
      try {
        await api.delete(`/api/assets/${id}/`);
        alert("Asset identity purged from system ledger.");
        navigate('/smart-assets/dashboard');
      } catch (err) {
        console.error(err);
        alert("De-initialization failed. Target might be locked or network unstable.");
      }
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Remove this asset assignment?')) {
      try {
        await api.delete(`/api/assignments/${assignmentId}/`);
        const res = await api.get(`/api/assets/${id}/`);
        setAsset(res.data);
        alert('Assignment removed successfully.');
      } catch (err) {
        console.error("Assignment delete failed", err);
        alert('Failed to delete assignment.');
      }
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setEditEmployeeName(assignment.employee_name);
    setEditShift(assignment.shift);
    setShowEditAssignModal(true);
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put(`/api/assignments/${editingAssignment.id}/`, {
        asset: asset.id,
        employee_name: editEmployeeName,
        shift: editShift,
        assignment_date: editingAssignment.assignment_date,
        return_date: editingAssignment.return_date
      });
      
      const res = await api.get(`/api/assets/${id}/`);
      setAsset(res.data);
      
      setShowEditAssignModal(false);
      alert('Assignment updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to update assignment.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <button 
              onClick={() => navigate('/smart-assets/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-orange-500 mb-6 transition-all group font-bold text-sm uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              Back to Fleet
            </button>
            <div className="flex items-center gap-4 mb-2">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${asset.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                {asset.status}
              </span>
              <span className="text-gray-400 text-xs font-bold font-mono tracking-tighter">UID: {asset.serial_number}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-none tracking-tight">{asset.name}</h1>
            <p className="text-gray-500 text-xl md:text-2xl mt-2 font-medium">{asset.asset_model}</p>
          </div>
          
          <div className="flex flex-wrap gap-3 relative z-50">
             <button 
                onClick={handleDownload}
                title="Download QR Code"
                className="p-4 rounded-2xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all shadow-sm cursor-pointer"
             >
                <Download size={20} />
             </button>
             <button 
                onClick={() => navigate(`/smart-assets/edit-asset/${id}`)}
                className="px-6 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold flex items-center gap-3 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
             >
                <Edit size={20} /> Edit Parameters
             </button>
             <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="px-6 py-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-bold flex items-center gap-3 hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer"
             >
                <Trash2 size={20} /> Purge Record
             </button>
             <button 
                onClick={() => setShowAssignModal(true)}
                disabled={asset.status === 'Assigned'}
                className="px-8 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center gap-3 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
             >
                <Shield size={20} /> Assign Shift
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Hardware Specs & Assignment Status */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-200 rounded-3xl p-8 relative group shadow-sm"
            >
              <div className="relative z-10">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/smart-assets/asset/${asset.id}`)}`} 
                  alt="Asset QR" 
                  className="w-full aspect-square rounded-2xl mb-8 border border-gray-200 shadow-inner opacity-90 p-4 bg-white"
                />
                
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <div className="w-1 h-1 bg-orange-500 rounded-full"></div> Deployment Record
                </h3>
                
                <div className="space-y-4">
                   {['Morning', 'Evening', 'Full-time'].map((s) => {
                     const assignment = asset.assignments?.find(a => a.shift === s);
                     if (s === 'Full-time' && !assignment && asset.assignments?.length > 0) return null;
                     if ((s === 'Morning' || s === 'Evening') && asset.assignments?.some(a => a.shift === 'Full-time')) return null;

                     return (
                       <div key={s} className={`p-4 rounded-2xl border transition-all ${assignment ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                          <div className="flex justify-between items-start mb-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{s} Shift</span>
                             {assignment ? <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div> : <div className="w-2 h-2 bg-gray-300 rounded-full"></div>}
                          </div>
                          {assignment ? (
                            <div>
                               <p className="text-sm font-bold text-gray-900 mb-1">{assignment.employee_name}</p>
                               <p className="text-[10px] text-gray-400 font-medium mb-3">Duty assigned on {new Date(assignment.assignment_date).toLocaleDateString()}</p>
                               <div className="flex gap-2 relative z-50 mt-4">
                                 <button 
                                   onClick={() => handleEditAssignment(assignment)}
                                   className="flex-1 text-[10px] font-black bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg py-2 flex items-center justify-center gap-1 transition-all cursor-pointer"
                                 >
                                   <Edit size={12} /> Edit
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assignment.id); }}
                                   className="flex-1 text-[10px] font-black bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg py-2 flex items-center justify-center gap-1 transition-all cursor-pointer"
                                 >
                                   <Trash2 size={12} /> Delete
                                 </button>
                               </div>
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-gray-400">Unassigned</p>
                          )}
                       </div>
                     );
                   })}
                </div>
              </div>
            </motion.div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">System Health Analysis</h3>
               <div className="space-y-6">
                  {[
                    { label: 'Performance', score: asset.cpu?.includes('i9') || asset.cpu?.includes('M2') ? 95 : asset.cpu?.includes('i7') ? 85 : 70, color: 'bg-orange-500' },
                    { label: 'Portability', score: asset.asset_model?.includes('MacBook') || asset.asset_model?.includes('XPS') ? 90 : 60, color: 'bg-emerald-500' },
                    { label: 'Reliability', score: 98, color: 'bg-blue-500' }
                  ].map((stat, idx) => (
                    <div key={idx} className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                          <span>{stat.label}</span>
                          <span className="text-gray-900">{stat.score}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.score}%` }}
                            transition={{ duration: 1, delay: 0.5 + (idx * 0.2) }}
                            className={`h-full ${stat.color} rounded-full`}
                          ></motion.div>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="mt-8 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <p className="text-xs font-bold text-emerald-700">Active Protection Enabled</p>
               </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Inventory Metadata</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acquired</span>
                     <span className="text-xs font-bold text-gray-700">{asset.purchase_date || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial State</span>
                     <span className={`text-xs font-black uppercase tracking-widest ${asset.condition === 'New' ? 'text-emerald-600' : 'text-amber-600'}`}>{asset.condition}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OS Environment</span>
                     <span className="text-xs font-bold text-gray-700">{asset.os || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processor Unit</span>
                     <span className="text-xs font-bold text-gray-700">{asset.cpu || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">RAM Capacity</span>
                     <span className="text-xs font-bold text-gray-700">{asset.ram || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">External Hardware</span>
                     <span className="text-xs font-bold text-gray-700">{asset.external_storage || 'None'}</span>
                  </div>
                  {asset.external_storage_size && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ext. Capacity</span>
                       <span className="text-xs font-bold text-gray-700">{asset.external_storage_size}</span>
                    </div>
                  )}
               </div>
               {asset.additional_notes && (
                 <div className="mt-6">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Technician Notes</span>
                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200">{asset.additional_notes}</p>
                 </div>
               )}
            </div>
          </div>

          {/* AI Intelligence Panel */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[700px]"
            >
              <div className="bg-gray-50 p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center border border-orange-200">
                    <Sparkles className="text-orange-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Gemini Intelligence Core</h3>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span> Secure Connection Active
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-grow p-8 overflow-y-auto space-y-6">
                <div className="flex gap-4 items-start max-w-[85%]">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div className="bg-gray-100 p-5 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm">
                    <p className="text-sm leading-relaxed text-gray-700">
                      Welcome, User. I am the Gemini Intelligence Unit assigned to Fleet Management. 
                      I have full telemetry for the <span className="text-orange-600 font-bold">{asset.asset_model}</span>. 
                      Please state your technical inquiry or troubleshoot requirement.
                    </p>
                  </div>
                </div>
                
                <AnimatePresence>
                  {response && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 items-start flex-row-reverse"
                    >
                      <div className="w-8 h-8 bg-orange-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="bg-orange-500 text-white p-6 rounded-2xl rounded-tr-none shadow-md max-w-[85%]">
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">{response}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {chatLoading && (
                  <div className="flex items-center gap-3 text-orange-500 text-xs font-black uppercase tracking-widest py-4">
                    <Loader2 size={16} className="animate-spin" /> Synthesizing Solution...
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <form onSubmit={handleSupportRequest} className="relative group">
                  <div className="relative flex items-center bg-white rounded-2xl border border-gray-200 px-4 shadow-inner">
                    <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Input diagnostic query..."
                      className="flex-grow bg-transparent py-5 pl-2 pr-12 focus:outline-none text-sm font-medium text-gray-800"
                      disabled={chatLoading}
                    />
                    <button 
                      type="submit"
                      disabled={chatLoading || !query}
                      className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all disabled:opacity-30 shadow-lg shadow-orange-500/20 cursor-pointer"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Simple Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            onClick={() => setShowAssignModal(false)}
            className="absolute inset-0 bg-black/60"
          ></div>
          
          <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-3xl relative z-[10000] shadow-2xl">
            <h2 className="text-2xl font-black text-gray-900 mb-4">ASSIGN ASSET</h2>
            
            <form onSubmit={handleAssign} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee Name</label>
                <input 
                  type="text" 
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 focus:outline-none focus:border-orange-500 text-gray-800"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Shift</label>
                <select 
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 focus:outline-none focus:border-orange-500 text-gray-800 appearance-none cursor-pointer"
                >
                  <option value="Morning">Morning (9 AM - 1 PM)</option>
                  <option value="Evening">Evening (2 PM - 6 PM)</option>
                  <option value="Full-time">Full-time (All Day)</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-grow py-4 rounded-xl bg-gray-100 text-gray-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={assignLoading}
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl cursor-pointer"
                >
                  {assignLoading ? "Processing..." : "CONFIRM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditAssignModal && editingAssignment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            onClick={() => setShowEditAssignModal(false)}
            className="absolute inset-0 bg-black/60"
          ></div>
          
          <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-3xl relative z-[10000] shadow-2xl">
            <h2 className="text-2xl font-black text-gray-900 mb-4">EDIT ASSIGNMENT</h2>
            
            <form onSubmit={handleUpdateAssignment} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee Name</label>
                <input 
                  type="text" 
                  value={editEmployeeName}
                  onChange={(e) => setEditEmployeeName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 focus:outline-none focus:border-orange-500 text-gray-800"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Shift</label>
                <select 
                  value={editShift}
                  onChange={(e) => setEditShift(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 focus:outline-none focus:border-orange-500 text-gray-800 appearance-none cursor-pointer"
                >
                  <option value="Morning">Morning (9 AM - 1 PM)</option>
                  <option value="Evening">Evening (2 PM - 6 PM)</option>
                  <option value="Full-time">Full-time (All Day)</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowEditAssignModal(false)}
                  className="flex-grow py-4 rounded-xl bg-gray-100 text-gray-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={editLoading}
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl cursor-pointer"
                >
                  {editLoading ? "Updating..." : "UPDATE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetail;
