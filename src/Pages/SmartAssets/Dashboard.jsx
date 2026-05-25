import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { Search, Laptop, Monitor, Tablet, HardDrive, Cpu, Loader2, Filter, LayoutGrid, Plus, Shield, Activity, Sparkles, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ramFilter, setRamFilter] = useState('All');
  const [cpuFilter, setCpuFilter] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await api.get('/api/assets/');
        setAssets(res.data);
      } catch (err) {
        console.error("Failed to fetch assets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const handleDeleteAsset = async (e, assetId, assetName) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${assetName}? This action cannot be undone.`)) {
      setDeleting(assetId);
      try {
        await api.delete(`/api/assets/${assetId}/`);
        setAssets(assets.filter(a => a.id !== assetId));
      } catch (err) {
        console.error("Delete failed", err);
        alert('Failed to delete asset.');
      } finally {
        setDeleting(null);
      }
    }
  };

  const filteredAssets = assets.filter(asset => {
    const name = asset.name || '';
    const model = asset.asset_model || '';
    const serial = asset.serial_number || '';
    const ram = asset.ram || '';
    const cpu = asset.cpu || '';

    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         serial.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
    const matchesRAM = ramFilter === 'All' || ram.toLowerCase().includes(ramFilter.toLowerCase());
    const matchesCPU = cpuFilter === 'All' || cpu.toLowerCase().includes(cpuFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesRAM && matchesCPU;
  });

  const getIcon = (model) => {
    if (!model) return <HardDrive size={20} />;
    const m = model.toLowerCase();
    if (m.includes('macbook') || m.includes('laptop') || m.includes('dell') || m.includes('thinkpad')) return <Laptop size={20} />;
    if (m.includes('monitor') || m.includes('screen')) return <Monitor size={20} />;
    if (m.includes('tablet') || m.includes('ipad')) return <Tablet size={20} />;
    return <HardDrive size={20} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 pt-12 pb-8 px-6 md:px-12 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <LayoutGrid className="text-orange-500 animate-pulse" /> Inventory <span className="text-orange-500">Hub</span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search assets, models, serials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-80 bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-sm text-gray-800"
                />
              </div>
              <button 
                onClick={() => navigate('/smart-assets/add-asset')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 transition-all text-white text-sm font-black shadow-xl shadow-orange-500/20 whitespace-nowrap cursor-pointer"
              >
                <Plus size={18} /> Add New Asset
              </button>
              
              <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                {['All', 'Available', 'Assigned'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${statusFilter === f ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border transition-all text-sm font-bold cursor-pointer ${showAdvancedFilters ? 'bg-orange-500/20 border-orange-500/50 text-orange-600' : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-800'}`}
              >
                <Filter size={18} /> Specs
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-6 pt-6 border-t border-gray-200"
              >
                <div className="flex flex-wrap gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">RAM Capacity</label>
                    <select 
                      value={ramFilter}
                      onChange={(e) => setRamFilter(e.target.value)}
                      className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-700 focus:border-orange-500 outline-none"
                    >
                      <option value="All">All RAM</option>
                      <option value="8GB">8GB</option>
                      <option value="16GB">16GB</option>
                      <option value="32GB">32GB</option>
                      <option value="64GB">64GB</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Processor Type</label>
                    <select 
                      value={cpuFilter}
                      onChange={(e) => setCpuFilter(e.target.value)}
                      className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-700 focus:border-orange-500 outline-none"
                    >
                      <option value="All">All CPUs</option>
                      <option value="i5">Core i5</option>
                      <option value="i7">Core i7</option>
                      <option value="i9">Core i9</option>
                      <option value="M1">Apple M1</option>
                      <option value="M2">Apple M2</option>
                      <option value="M3">Apple M3</option>
                      <option value="Ryzen">AMD Ryzen</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => { setRamFilter('All'); setCpuFilter('All'); setStatusFilter('All'); setSearchTerm(''); }}
                    className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-600 transition-colors mb-2 ml-auto cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Inventory', value: assets.length, icon: LayoutGrid, color: 'text-gray-800' },
            { label: 'Available Units', value: assets.filter(a => a.status === 'Available').length, icon: Shield, color: 'text-emerald-500' },
            { label: 'Active Duty', value: assets.filter(a => a.status === 'Assigned').length, icon: Activity, color: 'text-orange-500' },
            { label: 'System Health', value: '98.2%', icon: Sparkles, color: 'text-blue-500' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm flex flex-col gap-1 hover:border-orange-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={18} className={stat.color} />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global</span>
              </div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-orange-500" size={48} />
            <p className="text-gray-500 font-medium animate-pulse">Syncing with Central Database...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-lg hover:border-orange-500/25 transition-all duration-300 group relative overflow-hidden flex flex-col min-h-[340px]"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      onClick={() => navigate(`/smart-assets/asset/${asset.id}`)}
                      className="p-3 bg-gray-100 rounded-2xl text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-inner cursor-pointer"
                    >
                      {getIcon(asset.asset_model)}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${asset.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                      {asset.status}
                    </span>
                  </div>

                  {/* QR Mini Preview */}
                  <div className="absolute top-20 right-6 w-16 h-16 opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 pointer-events-none z-0">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/smart-assets/asset/${asset.id}`)}`} 
                      alt="QR" 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  
                  <div 
                    onClick={() => navigate(`/smart-assets/asset/${asset.id}`)}
                    className="mb-6 relative z-10 cursor-pointer flex-grow"
                  >
                    <h3 className="font-bold text-xl text-gray-900 mb-1 leading-tight group-hover:text-orange-500 transition-colors">{asset.name}</h3>
                    <p className="text-gray-500 text-sm font-medium tracking-tight">{asset.asset_model}</p>
                  </div>
                  
                  <div 
                    onClick={() => navigate(`/smart-assets/asset/${asset.id}`)}
                    className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 relative z-10 mb-6 cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Processor</span>
                      <div className="flex items-center text-xs text-gray-700 font-bold"><Cpu size={12} className="mr-1.5 text-orange-500/50" /> {asset.cpu?.split(' ')?.[0] || 'N/A'}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Memory</span>
                      <div className="flex items-center text-xs text-gray-700 font-bold"><HardDrive size={12} className="mr-1.5 text-orange-500/50" /> {asset.ram || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 relative z-50 mt-auto">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/smart-assets/edit-asset/${asset.id}`);
                      }}
                      className="flex-grow text-[10px] font-black bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg py-2.5 flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="Edit Asset"
                    >
                      <Edit size={12} /> Edit
                    </button>
                    <button 
                      onClick={(e) => handleDeleteAsset(e, asset.id, asset.name)}
                      disabled={deleting === asset.id}
                      className="flex-grow text-[10px] font-black bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg py-2.5 flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                      title="Delete Asset"
                    >
                      <Trash2 size={12} /> {deleting === asset.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {filteredAssets.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-40 bg-white rounded-[3rem] border border-dashed border-gray-300 shadow-sm"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-500 mb-2">Zero Matches Found</h3>
            <p className="text-gray-400 text-sm">We couldn't find any assets matching "{searchTerm}"</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
