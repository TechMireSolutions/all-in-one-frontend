import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, Search, Edit2, Trash2, X,
  Code2, User, Layers, FolderKanban, BookOpen,
  CheckCircle, AlertCircle, Loader2,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const EMPTY_FORM = {
  ojt_id: "", full_name: "", email: "", cnic: "",
  contact_number: "", gender: "Male", dob: "", joining_date: "",
  level: "ojt level 1", department: "", institute: "", degree: "",
  project_name: "", project_description: "", project_technologies: [],
  project_start_date: "", project_end_date: "",
  supervisor: "", status: "Active", description: "",
};

const LevelBadge = ({ level }) => {
  const colors = {
    "ojt level 1": "bg-blue-100 text-blue-700",
    "ojt level 2": "bg-green-100 text-green-700",
    "ojt level 3": "bg-yellow-100 text-yellow-700",
    "ojt level 4": "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[level] || "bg-gray-100 text-gray-600"}`}>
      {level}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    Active: "bg-green-100 text-green-700",
    Completed: "bg-blue-100 text-blue-700",
    Terminated: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

const Toast = ({ message, type, onClose }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}
      >
        {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        {message}
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
      </motion.div>
    )}
  </AnimatePresence>
);

const OJTManagement = () => {
  const [ojts, setOjts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [techInput, setTechInput] = useState("");
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOjts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}ojt`);
      setOjts(res.data.ojts || []);
    } catch {
      showToast("Failed to load OJT trainees", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOjts(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setTechInput(""); setShowModal(true); };
  const openEdit = (o) => {
    setForm({
      ...o,
      project_technologies: o.project_technologies || [],
      dob: o.dob?.slice(0, 10) || "",
      joining_date: o.joining_date?.slice(0, 10) || "",
      project_start_date: o.project_start_date?.slice(0, 10) || "",
      project_end_date: o.project_end_date?.slice(0, 10) || "",
    });
    setEditingId(o.id);
    setTechInput("");
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(EMPTY_FORM); };

  const addTech = () => {
    const val = techInput.trim();
    if (!val || form.project_technologies.includes(val)) return;
    setForm(f => ({ ...f, project_technologies: [...f.project_technologies, val] }));
    setTechInput("");
  };
  const removeTech = (t) => setForm(f => ({ ...f, project_technologies: f.project_technologies.filter(x => x !== t) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await axios.put(`${API}ojt/${editingId}`, form);
        showToast("OJT trainee updated successfully");
      } else {
        await axios.post(`${API}ojt`, form);
        showToast("OJT trainee added successfully");
      }
      closeModal();
      fetchOjts();
    } catch (err) {
      showToast(err.response?.data?.message || "Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}ojt/${id}`);
      showToast("OJT trainee deleted successfully");
      setDeleteConfirm(null);
      fetchOjts();
    } catch {
      showToast("Failed to delete OJT trainee", "error");
    }
  };

  const filtered = ojts.filter(o =>
    o.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.ojt_id?.toLowerCase().includes(search.toLowerCase()) ||
    o.project_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Briefcase size={22} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">OJT Trainee Management</h1>
            <p className="text-sm text-gray-500">{ojts.length} trainee{ojts.length !== 1 ? "s" : ""} registered</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-md shadow-orange-200"
        >
          <Plus size={16} /> Add OJT Trainee
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Search trainees or projects..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={32} className="animate-spin text-orange-400" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["ID", "Name", "Level", "Department", "Project", "Technologies", "Supervisor", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">No OJT trainees found</td></tr>
                ) : filtered.map(o => (
                  <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.ojt_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{o.full_name}</td>
                    <td className="px-4 py-3"><LevelBadge level={o.level} /></td>
                    <td className="px-4 py-3 text-gray-500">{o.department || "—"}</td>
                    <td className="px-4 py-3">
                      {o.project_name ? (
                        <div>
                          <p className="font-medium text-gray-700 text-xs">{o.project_name}</p>
                          {o.project_description && (
                            <p className="text-gray-400 text-xs truncate max-w-[140px]">{o.project_description}</p>
                          )}
                          {o.project_start_date && o.project_end_date && (
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{o.project_start_date} to {o.project_end_date}</p>
                          )}
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(o.project_technologies || []).slice(0, 2).map(t => (
                          <span key={t} className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                        {(o.project_technologies || []).length > 2 && (
                          <span className="text-xs text-gray-400">+{o.project_technologies.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{o.supervisor || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(o)} className="text-blue-500 hover:text-blue-700 transition"><Edit2 size={15} /></button>
                        <button onClick={() => setDeleteConfirm(o)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Briefcase size={20} className="text-orange-500" />
                  {editingId ? "Edit OJT Trainee" : "Add OJT Trainee"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">OJT ID *</label>
                    <input required value={form.ojt_id} onChange={e => setForm(f => ({ ...f, ojt_id: e.target.value }))}
                      placeholder="e.g. OJT-001" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                    <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Full name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                    <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@example.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CNIC *</label>
                    <input required value={form.cnic} onChange={e => setForm(f => ({ ...f, cnic: e.target.value }))}
                      placeholder="XXXXX-XXXXXXX-X" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contact Number</label>
                    <input value={form.contact_number} onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))}
                      placeholder="03XX-XXXXXXX" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Gender *</label>
                    <select required value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                    <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                </div>

                {/* Row 4 — OJT Specific */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Joining Date *</label>
                    <input required type="date" value={form.joining_date} onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Skill Level *</label>
                    <select required value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                      <option value="ojt level 1">ojt level 1</option>
                      <option value="ojt level 2">ojt level 2</option>
                      <option value="ojt level 3">ojt level 3</option>
                      <option value="ojt level 4">ojt level 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>

                {/* Row 5 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                    <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      placeholder="e.g. Development" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Institute</label>
                    <input value={form.institute} onChange={e => setForm(f => ({ ...f, institute: e.target.value }))}
                      placeholder="University / College" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Supervisor</label>
                    <input value={form.supervisor} onChange={e => setForm(f => ({ ...f, supervisor: e.target.value }))}
                      placeholder="Supervisor name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                </div>

                {/* Project Section */}
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1">
                    <FolderKanban size={13} className="text-orange-500" /> Project Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Project Name</label>
                      <input value={form.project_name} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))}
                        placeholder="Project name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Technologies Used</label>
                      <div className="flex gap-2">
                        <input value={techInput} onChange={e => setTechInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                          placeholder="e.g. React, Node..."
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
                        <button type="button" onClick={addTech}
                          className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-600 transition">
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.project_technologies.map(t => (
                      <span key={t} className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full border border-purple-100">
                        <Code2 size={11} /> {t}
                        <button type="button" onClick={() => removeTech(t)} className="ml-1 text-purple-400 hover:text-purple-700"><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Project Description</label>
                    <textarea rows={2} value={form.project_description} onChange={e => setForm(f => ({ ...f, project_description: e.target.value }))}
                      placeholder="Brief description of the project..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none bg-white" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Project Start Date</label>
                      <input type="date" value={form.project_start_date} onChange={e => setForm(f => ({ ...f, project_start_date: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Project End Date</label>
                      <input type="date" value={form.project_end_date} onChange={e => setForm(f => ({ ...f, project_end_date: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Additional notes..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition disabled:opacity-60">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                    {editingId ? "Save Changes" : "Add Trainee"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Delete OJT Trainee</h3>
              <p className="text-sm text-gray-500 mb-5">
                Are you sure you want to delete <strong>{deleteConfirm.full_name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition border border-gray-200">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm.id)}
                  className="px-4 py-2 rounded-lg text-sm text-white bg-red-500 hover:bg-red-600 transition">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OJTManagement;
