// Submissions list for a form: filters by role (All/Participants/Students/OJTs),
// bulk status updates, CSV export.
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Search, ChevronLeft } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const ROLE_TABS = [
  { k: "all",      label: "All",          role: "" },
  { k: "Participant", label: "Participants", role: "Participant" },
  { k: "Student",  label: "Students",     role: "Student" },
  { k: "OJT",      label: "OJTs",         role: "OJT" },
  { k: "Employee", label: "Employees",    role: "Employee" },
];

const STATUS_PILL = {
  Submitted:   "bg-amber-100 text-amber-700",
  "Under Review":"bg-sky-100 text-sky-700",
  Approved:    "bg-emerald-100 text-emerald-700",
  Rejected:    "bg-rose-100 text-rose-700",
  Waitlisted:  "bg-purple-100 text-purple-700",
  Withdrawn:   "bg-gray-100 text-gray-700",
  Cancelled:   "bg-gray-100 text-gray-700",
};

const Registrations = () => {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [data, setData] = useState({ rows: [], total: 0 });
  const [tab, setTab] = useState("all");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    axios.get(`${API}registration/forms/${formId}`).then((r) => setForm(r.data));
  }, [formId]);

  const load = () => {
    const role = ROLE_TABS.find((t) => t.k === tab)?.role || "";
    const params = { role, status, search, page, pageSize: 25 };
    axios.get(`${API}registration/forms/${formId}/registrations`, { params })
      .then((r) => setData(r.data));
  };
  useEffect(load, [formId, tab, status, search, page]);

  const bulkSet = async (to_status) => {
    if (!selected.length) return alert("Select rows first");
    await axios.patch(`${API}registration/registrations/bulk-status`, { ids: selected, to_status });
    setSelected([]); load();
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/registration/forms" className="text-gray-500 hover:text-gray-700"><ChevronLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">{form?.title || "Registrations"}</h1>
        <a href={`${API}registration/forms/${formId}/export.csv`} className="ml-auto px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg inline-flex items-center gap-2">
          <Download size={14} /> Export CSV
        </a>
      </div>

      {/* Role tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        {ROLE_TABS.map((t) => (
          <button key={t.k} onClick={() => { setTab(t.k); setPage(1); }}
            className={`relative px-4 py-2 text-sm whitespace-nowrap ${tab === t.k ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-800"}`}>
            {t.label}
            {tab === t.k && <motion.span layoutId="rtab" className="absolute left-0 right-0 -bottom-px h-0.5 bg-emerald-500" />}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search reg # / contact…"
            className="w-full pl-8 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 bg-white rounded-lg px-2 py-2 text-sm">
          <option value="">All statuses</option>
          {Object.keys(STATUS_PILL).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {selected.length > 0 && (
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg flex items-center gap-2 mb-3 text-sm">
          <span>{selected.length} selected</span>
          <button onClick={() => bulkSet("Approved")}    className="ml-auto bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded text-xs">Approve</button>
          <button onClick={() => bulkSet("Rejected")}    className="bg-rose-500 hover:bg-rose-600 px-2 py-1 rounded text-xs">Reject</button>
          <button onClick={() => bulkSet("Waitlisted")}  className="bg-purple-500 hover:bg-purple-600 px-2 py-1 rounded text-xs">Waitlist</button>
          <button onClick={() => setSelected([])} className="text-gray-300 hover:text-white text-xs">Clear</button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left"><input type="checkbox"
                checked={selected.length === data.rows.length && data.rows.length > 0}
                onChange={() => setSelected(selected.length === data.rows.length ? [] : data.rows.map((r) => r.id))} /></th>
              <th className="px-3 py-2 text-left">Reg #</th>
              <th className="px-3 py-2 text-left">Contact</th>
              <th className="px-3 py-2 text-left">Roles</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Payment</th>
              <th className="px-3 py-2 text-left">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.rows.map((r) => (
              <tr key={r.id} className="hover:bg-emerald-50/30">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.includes(r.id)}
                    onChange={() => setSelected((s) => s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id])} />
                </td>
                <td className="px-3 py-2 font-mono">
                  <Link to={`/registration/registrations/${r.id}`} className="text-emerald-700 hover:underline">{r.registration_number}</Link>
                </td>
                <td className="px-3 py-2">{r.contact ? `${r.contact.first_name} ${r.contact.last_name}` : "—"}</td>
                <td className="px-3 py-2 text-xs">{(r.roles || []).map((x) => x.role_name).join(", ") || "—"}</td>
                <td className="px-3 py-2"><span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase ${STATUS_PILL[r.status] || "bg-gray-100"}`}>{r.status}</span></td>
                <td className="px-3 py-2 text-xs">{r.payment_status}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{new Date(r.submitted_at).toLocaleString()}</td>
              </tr>
            ))}
            {data.rows.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-gray-500 text-sm">No submissions match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm">
        <p className="text-gray-500">{data.total} total</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50">Prev</button>
          <span>Page {page}</span>
          <button onClick={() => setPage(page + 1)} disabled={page * 25 >= data.total}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default Registrations;
