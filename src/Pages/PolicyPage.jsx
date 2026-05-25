import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../Store/authStore";
import {
  FileText, Search, Plus, Edit2, Trash2, Loader2,
  ChevronDown, ChevronUp, ShieldCheck, BookOpen,
  AlertCircle, CheckCircle, X, Scale, Upload,
  Paperclip, Download, File, Eye
} from "lucide-react";

const API      = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = API.replace("/api/", ""); // e.g. http://localhost:5000

const EMPTY_FORM = { title: "", content: "", category: "Revised Course Enrollment Annextures new 2026" };

// ── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
          ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
      >
        {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        {message}
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
      </motion.div>
    )}
  </AnimatePresence>
);

// ── File Drop Zone ───────────────────────────────────────────────────────────
const FileDropZone = ({ file, setFile, existingFileUrl, onRemoveExisting }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 border border-orange-300 bg-orange-50 rounded-lg text-sm">
        <File size={16} className="text-orange-500 flex-shrink-0" />
        <span className="text-orange-700 font-medium truncate flex-1">{file.name}</span>
        <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 transition">
          <X size={14} />
        </button>
      </div>
    );
  }

  if (existingFileUrl) {
    const filename = existingFileUrl.split("/").pop();
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 border border-blue-200 bg-blue-50 rounded-lg text-sm">
        <Paperclip size={16} className="text-blue-500 flex-shrink-0" />
        <span className="text-blue-700 font-medium truncate flex-1">{filename}</span>
        <a
          href={`${BASE_URL}${existingFileUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 transition"
          title="View file"
        >
          <Download size={14} />
        </a>
        <button
          type="button"
          onClick={onRemoveExisting}
          className="text-gray-400 hover:text-red-500 transition"
          title="Remove file"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-all duration-200
        ${dragging ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/50"}`}
    >
      <Upload size={22} className={dragging ? "text-orange-400" : "text-gray-400"} />
      <p className="text-sm text-gray-500">
        <span className="font-medium text-orange-500">Click to upload</span> or drag & drop
      </p>
      <p className="text-xs text-gray-400">PDF, DOC, DOCX, TXT, JPG, PNG — max 10 MB</p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        onChange={handleChange}
      />
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PolicyPage = () => {
  const { role, user } = useAuthStore();
  const activeRole = role?.toLowerCase();
  const isAdminOrHr = activeRole === "superadmin" || activeRole === "hr";

  const [policies, setPolicies]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [search, setSearch]               = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedId, setExpandedId]       = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [uploadFile, setUploadFile]       = useState(null);
  const [removeFile, setRemoveFile]       = useState(false);
  const [existingFileUrl, setExistingFileUrl] = useState(null);
  const [toast, setToast]                 = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewFile, setPreviewFile]     = useState(null); // { url: "...", title: "..." }

  const [customCategories, setCustomCategories] = useState([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const getCategoriesList = (includeAll = false) => {
    const defaultCats = [
      "Revised Course Enrollment Annextures new 2026",
      "Harassment Policy",
      "HR & ADMIN Job Description",
    ];
    const policyCats = policies.map((p) => p.category).filter(Boolean);
    const unique = [...new Set([...defaultCats, ...policyCats, ...customCategories])];
    return includeAll ? ["All", ...unique] : unique;
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!getCategoriesList().includes(trimmed)) {
      setCustomCategories((prev) => [...prev, trimmed]);
    }
    setForm((f) => ({ ...f, category: trimmed }));
    setShowNewCategoryInput(false);
    setNewCategoryName("");
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}policies`);
      setPolicies(res.data.policies || []);
    } catch {
      showToast("Failed to load policies", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolicies(); }, []);

  const openAdd = () => {
    if (!isAdminOrHr) return;
    setForm(EMPTY_FORM);
    setEditingId(null);
    setUploadFile(null);
    setRemoveFile(false);
    setExistingFileUrl(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    if (!isAdminOrHr) return;
    setForm({ title: p.title, content: p.content, category: p.category });
    setEditingId(p.id);
    setUploadFile(null);
    setRemoveFile(false);
    setExistingFileUrl(p.fileUrl || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setUploadFile(null);
    setRemoveFile(false);
    setExistingFileUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdminOrHr) return;

    if (!form.content && !uploadFile && !existingFileUrl) {
      showToast("Add policy content or upload a file.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("content", form.content);
      fd.append("category", form.category);
      fd.append("createdBy", `${user?.full_name || user?.name || "HR Administrator"} (${role})`);
      if (uploadFile) fd.append("policyFile", uploadFile);
      if (removeFile)  fd.append("removeFile", "true");

      if (editingId) {
        await axios.put(`${API}policies/${editingId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Policy updated successfully!");
      } else {
        await axios.post(`${API}policies`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Policy created successfully!");
      }
      fetchPolicies();
      closeModal();
    } catch {
      showToast("Failed to save policy", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdminOrHr || !deleteConfirm) return;
    try {
      await axios.delete(`${API}policies/${deleteConfirm.id}`);
      showToast("Policy deleted successfully!");
      fetchPolicies();
      setDeleteConfirm(null);
    } catch {
      showToast("Failed to delete policy", "error");
    }
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const filtered = policies.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scale className="text-orange-500" size={24} />
            Company Policies
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Access Techmire Solutions official guidelines, benefits, codes of conduct, and policies.
          </p>
        </div>

        {isAdminOrHr && (
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200"
          >
            <Plus size={18} />
            Create Policy
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none max-w-full">
          {getCategoriesList(true).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200
                ${selectedCategory === cat
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/10"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px] flex-shrink-0">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
        </div>
      </div>

      {/* Policies List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={36} className="animate-spin text-orange-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BookOpen className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="text-lg font-medium text-gray-700">No Policies Found</h3>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((p) => {
            const isExpanded = expandedId === p.id;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(p.id)}
                  className="p-4 md:p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="bg-orange-50 p-2.5 rounded-xl text-orange-500 flex-shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100 mb-1">
                        {p.category}
                      </span>
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base truncate">{p.title}</h3>
                      {p.fileUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 mt-0.5">
                          <Paperclip size={10} /> Has attachment
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Edit / Delete — superadmin & hr only */}
                    {isAdminOrHr && (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition"
                          title="Edit Policy"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                          title="Delete Policy"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expandable Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden border-t border-gray-50 bg-gray-50/40"
                    >
                      <div className="p-4 md:p-6 space-y-4">
                        {p.content && (
                          <div className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">
                            {p.content}
                          </div>
                        )}

                        {/* Attachment actions */}
                        {p.fileUrl && (
                          <div className="flex flex-wrap gap-3 items-center">
                            <button
                              onClick={() => setPreviewFile({ url: `${BASE_URL}${p.fileUrl}`, title: p.title })}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-xl transition-all border border-emerald-100 cursor-pointer shadow-sm"
                            >
                              <Eye size={15} />
                              View Attachment
                            </button>
                            <a
                              href={`${BASE_URL}${p.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-xl transition-all border border-blue-100 shadow-sm"
                            >
                              <Download size={15} />
                              Download Attachment
                            </a>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-[11px] text-gray-400 font-medium">
                          <span>Created By: {p.createdBy || "Admin"}</span>
                          <span>Last Updated: {new Date(p.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] overflow-y-auto z-10 relative"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="text-orange-500" size={18} />
                  {editingId ? "Edit Policy" : "Create New Policy"}
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Policy Title *</label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Annual Leave Policy"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  {showNewCategoryInput ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Enter new category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3.5 py-2 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryInput(false)}
                        className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        {getCategoriesList().map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { setShowNewCategoryInput(true); setNewCategoryName(""); }}
                        className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg border border-orange-200 transition"
                        title="Add new category"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Policy Content */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Policy Content</label>
                  <textarea
                    rows={5}
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="Write detailed policy rules, regulations, guidelines..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Paperclip size={12} /> Attachment (optional)
                  </label>
                  <FileDropZone
                    file={uploadFile}
                    setFile={setUploadFile}
                    existingFileUrl={existingFileUrl}
                    onRemoveExisting={() => { setExistingFileUrl(null); setRemoveFile(true); }}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition flex items-center gap-2 shadow-lg shadow-orange-500/10 disabled:opacity-50"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {editingId ? "Save Changes" : "Publish Policy"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm z-10 text-center relative"
            >
              <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Delete Policy?</h3>
              <p className="text-gray-500 text-sm mt-2">
                Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition shadow-lg shadow-red-500/15"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attachment Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewFile(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col z-10 relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 truncate">
                  <FileText className="text-orange-500" size={18} />
                  <span>Preview: {previewFile.title}</span>
                </h3>
                <div className="flex items-center gap-3">
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition"
                  >
                    <Download size={13} />
                    Download
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body / Viewer */}
              <div className="flex-1 bg-gray-100/50 p-4 flex items-center justify-center overflow-auto">
                {previewFile.url.toLowerCase().includes(".pdf") ? (
                  <iframe
                    src={`${previewFile.url}#toolbar=1`}
                    className="w-full h-full border-0 rounded-lg bg-white shadow-sm"
                    title={previewFile.title}
                  />
                ) : /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(previewFile.url.toLowerCase()) ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  // Fallback for document types like docx, xlsx, or unidentified files
                  <div className="text-center p-8 bg-white rounded-xl shadow-sm max-w-md border border-gray-100">
                    <File size={48} className="mx-auto text-gray-400 mb-3" />
                    <h4 className="font-bold text-gray-800 mb-1">Preview not available</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      This file format cannot be viewed inline. You can download it directly to view it.
                    </p>
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition"
                    >
                      <Download size={13} />
                      Download File
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PolicyPage;
