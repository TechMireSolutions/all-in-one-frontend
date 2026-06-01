// Admin list of registration forms.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, FileText, Copy, Send, Trash2, ExternalLink, Search } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const STATUS_BADGE = {
  Draft:    "bg-gray-100 text-gray-700",
  Open:     "bg-emerald-100 text-emerald-700",
  Closed:   "bg-amber-100 text-amber-700",
  Archived: "bg-rose-100 text-rose-700",
};

const Forms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    axios.get(`${API}registration/forms`)
      .then((r) => setForms(r.data || []))
      .catch(() => setForms([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = forms.filter((f) => {
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (f.title || "").toLowerCase().includes(s) || (f.slug || "").toLowerCase().includes(s);
  });

  const publish = async (id) => {
    if (!confirm("Publish this form so the public URL is live?")) return;
    await axios.post(`${API}registration/forms/${id}/publish`);
    load();
  };

  const clone = async (id) => {
    const r = await axios.post(`${API}registration/forms/${id}/clone`);
    navigate(`/registration/forms/${r.data.id}/edit`);
  };

  const remove = async (id) => {
    if (!confirm("Delete this form? All sections, fields, and submissions are cascaded and will be lost.")) return;
    await axios.delete(`${API}registration/forms/${id}`);
    load();
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Registration Forms</h1>
            <p className="text-sm text-gray-500">Build dynamic forms; submissions live as their child rows.</p>
          </div>
        </div>
        <Link to="/registration/forms/new" className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg shadow-md">
          <Plus size={14} /> New form
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or slug…"
            className="w-full pl-8 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 bg-white rounded-lg px-2 py-2 text-sm">
          <option value="all">All status</option>
          <option>Draft</option><option>Open</option><option>Closed</option><option>Archived</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No forms yet. Click <strong>New form</strong> to start.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{f.title}</p>
                  <p className="text-xs text-gray-500 font-mono">/{f.slug}</p>
                </div>
                <span className={`text-[11px] uppercase font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[f.status] || "bg-gray-100"}`}>{f.status}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 min-h-[2em]">{f.description || "—"}</p>
              <div className="flex items-center flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                <Link to={`/registration/forms/${f.id}/edit`} className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200">Edit</Link>
                <Link to={`/registration/forms/${f.id}/submissions`} className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200">Submissions</Link>
                {f.status !== "Open" && (
                  <button onClick={() => publish(f.id)} className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 inline-flex items-center gap-1">
                    <Send size={11} /> Publish
                  </button>
                )}
                {f.status === "Open" && (
                  <a href={`/register/${f.slug}`} target="_blank" rel="noreferrer" className="px-2 py-1 text-xs rounded bg-sky-100 text-sky-700 hover:bg-sky-200 inline-flex items-center gap-1">
                    <ExternalLink size={11} /> Open public
                  </a>
                )}
                <button onClick={() => clone(f.id)} className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 inline-flex items-center gap-1">
                  <Copy size={11} /> Clone
                </button>
                <button onClick={() => remove(f.id)} className="ml-auto text-rose-600 hover:text-rose-800 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Forms;
