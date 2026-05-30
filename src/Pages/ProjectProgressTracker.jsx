import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  Document, Page, Text, View, StyleSheet, pdf,
} from "@react-pdf/renderer";
import {
  Plus, Pencil, Trash2, X, ExternalLink, ChevronUp, ChevronDown, AlertTriangle,
  Download, Upload, FileSpreadsheet, FileText, ChevronDown as Chevron,
} from "lucide-react";
import { useAuthStore } from "../Store/authStore";
import { PROJECT_TRACKER_EDIT_KEY } from "../Constants/pages";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";
const API = `${API_BASE}project-tracker`;

const STATUS_COLORS = {
  "Completed":   "bg-green-100 text-green-700 border border-green-300",
  "In Progress": "bg-blue-100 text-blue-700 border border-blue-300",
  "Not Started": "bg-gray-100 text-gray-600 border border-gray-300",
  "On Hold":     "bg-yellow-100 text-yellow-700 border border-yellow-300",
  "Incomplete":  "bg-red-100 text-red-700 border border-red-300",
};

const EMPTY_FORM = {
  project_name: "",
  website_link: "",
  ojt_name: "",
  framework: "",
  lead_name: "",
  project_given_date: "",
  start_date: "",
  end_date: "",
  deadline: "",
  status: "Not Started",
};

// Returns "YYYY-MM-DD" if input is a valid date, else null. Filters out "", null, "Invalid date".
const cleanDate = (val) => {
  if (!val) return null;
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val; // already ISO date
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
};

// Returns true if deadline has arrived or passed (today >= deadline)
const isDeadlinePassed = (deadline) => {
  const d = cleanDate(deadline);
  if (!d) return false;
  const today = new Date().toISOString().split("T")[0];
  return d <= today;
};

// ── PDF Document for export ────────────────────────────────────────────────
const pdfStyles = StyleSheet.create({
  page: { padding: 24, fontSize: 8, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontWeight: "bold", color: "#ea580c" },
  sub: { fontSize: 9, marginBottom: 12, color: "#666" },
  table: { display: "flex", flexDirection: "column", border: "1px solid #ddd" },
  thead: { flexDirection: "row", backgroundColor: "#ea580c" },
  th: { padding: 4, color: "#fff", fontWeight: "bold", borderRight: "1px solid #fff" },
  tr: { flexDirection: "row", borderTop: "1px solid #eee" },
  td: { padding: 4, color: "#333", borderRight: "1px solid #eee" },
  trOverdue: { flexDirection: "row", borderTop: "1px solid #eee", backgroundColor: "#fee2e2" },
});
// Column widths (% based, must add to 100)
const COLS = [
  { key: "project_name", label: "Project", w: 14 },
  { key: "website_link", label: "Website", w: 10 },
  { key: "ojt_name", label: "OJT", w: 11 },
  { key: "framework", label: "Framework", w: 11 },
  { key: "lead_name", label: "Lead", w: 12 },
  { key: "project_given_date", label: "Given", w: 8 },
  { key: "start_date", label: "Start", w: 8 },
  { key: "end_date", label: "End", w: 8 },
  { key: "deadline", label: "Deadline", w: 8 },
  { key: "status", label: "Status", w: 10 },
];
const ProjectsPdfDoc = ({ projects }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <Text style={pdfStyles.title}>Project Progress Tracker</Text>
      <Text style={pdfStyles.sub}>
        {projects.length} project(s) — exported {new Date().toLocaleString()}
      </Text>
      <View style={pdfStyles.table}>
        <View style={pdfStyles.thead}>
          {COLS.map((c) => (
            <Text key={c.key} style={{ ...pdfStyles.th, width: `${c.w}%` }}>{c.label}</Text>
          ))}
        </View>
        {projects.map((p, i) => (
          <View key={p.id || i} style={p.status === "Incomplete" ? pdfStyles.trOverdue : pdfStyles.tr}>
            {COLS.map((c) => (
              <Text key={c.key} style={{ ...pdfStyles.td, width: `${c.w}%` }}>
                {p[c.key] || "—"}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default function ProjectProgressTracker() {
  const { role, user } = useAuthStore();
  const isSuperAdmin = role?.toLowerCase() === "superadmin";

  // Determine access level
  const canEdit = isSuperAdmin || (
    Array.isArray(user?.allowedPages)
      ? user.allowedPages.includes(PROJECT_TRACKER_EDIT_KEY)
      : true
  );

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  // Export/Import menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const excelInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Sanitize date fields and compute correct status
  const sanitizeProject = (p) => ({
    ...p,
    project_given_date: cleanDate(p.project_given_date),
    start_date: cleanDate(p.start_date),
    end_date: cleanDate(p.end_date),
    deadline: cleanDate(p.deadline),
  });

  // Priority: end_date → Completed | deadline passed → Incomplete | else keep
  const computeAutoStatus = (p) => {
    if (cleanDate(p.end_date)) return "Completed";
    if (isDeadlinePassed(p.deadline)) return "Incomplete";
    if (p.status === "Completed") return "In Progress"; // stale Completed without end_date
    return p.status;
  };

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get(API);
      const list = (data.projects || []).map(sanitizeProject);

      // Auto-correct any project whose stored status / dates need cleanup
      const toUpdate = list.filter((p, i) => {
        const orig = data.projects[i];
        const correct = computeAutoStatus(p);
        return (
          correct !== orig.status ||
          p.end_date !== orig.end_date ||
          p.start_date !== orig.start_date ||
          p.deadline !== orig.deadline ||
          p.project_given_date !== orig.project_given_date
        );
      });
      await Promise.all(
        toUpdate.map((p) =>
          axios.put(`${API}/${p.id}`, { ...p, status: computeAutoStatus(p) })
        )
      );

      const updated = list.map((p) => ({ ...p, status: computeAutoStatus(p) }));
      setProjects(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
  const openEdit = (p) => {
    const endDate = cleanDate(p.end_date);
    const deadline = cleanDate(p.deadline);

    // Recompute status from sanitized dates
    let displayStatus = p.status || "Not Started";
    if (endDate) displayStatus = "Completed";
    else if (isDeadlinePassed(deadline)) displayStatus = "Incomplete";
    else if (displayStatus === "Completed") displayStatus = "In Progress";

    setForm({
      project_name: p.project_name || "",
      website_link: p.website_link || "",
      ojt_name: p.ojt_name || "",
      framework: p.framework || "",
      lead_name: p.lead_name || "",
      project_given_date: cleanDate(p.project_given_date) || "",
      start_date: cleanDate(p.start_date) || "",
      end_date: endDate || "",
      deadline: deadline || "",
      status: displayStatus,
    });
    setEditingId(p.id);
    setShowModal(true);
  };

  // When end_date is set → auto Completed; when cleared → revert to In Progress
  const handleEndDateChange = (val) => {
    setForm((f) => ({
      ...f,
      end_date: val,
      status: val ? "Completed" : (f.status === "Completed" ? "In Progress" : f.status),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.project_name.trim()) return;

    // Final auto-logic before save — end_date is sole source of truth for Completed
    let finalStatus = form.status;
    if (form.end_date) {
      finalStatus = "Completed";
    } else if (isDeadlinePassed(form.deadline)) {
      // No end_date but deadline passed → force Incomplete (overrides any manual "Completed")
      finalStatus = "Incomplete";
    } else if (finalStatus === "Completed") {
      // Manually set to Completed without end_date — invalid, revert
      finalStatus = "In Progress";
    }

    setSaving(true);
    try {
      // Sanitize all date fields — empty strings → null so backend doesn't store "Invalid Date"
      const payload = {
        ...form,
        project_given_date: cleanDate(form.project_given_date),
        start_date: cleanDate(form.start_date),
        end_date: cleanDate(form.end_date),
        deadline: cleanDate(form.deadline),
        status: finalStatus,
      };
      if (editingId) {
        await axios.put(`${API}/${editingId}`, payload);
      } else {
        await axios.post(API, payload);
      }
      setShowModal(false);
      fetchProjects();
    } catch {
      alert("Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchProjects();
    } catch {
      alert("Failed to delete.");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  // ── Export Excel ──────────────────────────────────────────────────────
  const handleExportExcel = () => {
    setMenuOpen(false);
    const rows = projects.map((p) => ({
      "Project Name": p.project_name || "",
      "Website Link": p.website_link || "",
      "OJT Name": p.ojt_name || "",
      "Framework": p.framework || "",
      "Lead Name": p.lead_name || "",
      "Project Given Date": cleanDate(p.project_given_date) || "",
      "Start Date": cleanDate(p.start_date) || "",
      "End Date": cleanDate(p.end_date) || "",
      "Deadline": cleanDate(p.deadline) || "",
      "Status": p.status || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 24 }, { wch: 30 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, `Project_Tracker_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ── Export PDF ────────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    setMenuOpen(false);
    try {
      const blob = await pdf(<ProjectsPdfDoc projects={projects} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Project_Tracker_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF.");
    }
  };

  // ── Import Excel ──────────────────────────────────────────────────────
  // Excel serial date → "YYYY-MM-DD"
  const excelDateToISO = (val) => {
    if (val == null || val === "") return null;
    if (typeof val === "number") {
      const d = XLSX.SSF.parse_date_code(val);
      if (!d) return null;
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
    return cleanDate(val);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so same file can be re-selected
    if (!file) return;
    setImporting(true);
    setImportMsg("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];

      // Read as 2D array so we can find the real header row (skipping title rows / merged cells)
      const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: false });
      const HEADER_KEYWORDS = ["project", "ojt", "framework", "lead", "deadline", "status", "start", "end", "given", "website"];
      const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      // Find row where most cells match header keywords
      let headerIdx = -1, bestHits = 0;
      for (let i = 0; i < Math.min(matrix.length, 15); i++) {
        const row = matrix[i] || [];
        const joined = row.map(norm).join(" ");
        const hits = HEADER_KEYWORDS.filter((kw) => joined.includes(kw)).length;
        if (hits > bestHits) { bestHits = hits; headerIdx = i; }
      }
      if (headerIdx < 0 || bestHits < 3) {
        setImportMsg(`No header row detected. Make sure your file has a row with "Project Name", "OJT Name", etc.`);
        setImporting(false);
        return;
      }

      // Build objects from header row downwards
      const headers = (matrix[headerIdx] || []).map((h) => String(h || "").trim());
      const rows = matrix.slice(headerIdx + 1).map((arr) => {
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[h] = arr[i] ?? ""; });
        return obj;
      }).filter((o) => Object.values(o).some((v) => String(v).trim()));

      // Lenient header matcher: normalize then substring/keyword match
      const mapRow = (r) => {
        const keys = Object.keys(r);
        const pickBy = (keywords) => {
          const list = Array.isArray(keywords) ? keywords : [keywords];
          for (const k of keys) {
            const n = norm(k);
            if (list.every((kw) => n.includes(norm(kw)))) return r[k];
          }
          return "";
        };
        return {
          project_name: pickBy(["project", "name"]) || pickBy("project"),
          website_link: pickBy("website") || pickBy(["project", "link"]) || pickBy("link") || pickBy("url"),
          ojt_name:     pickBy("ojt"),
          framework:    pickBy("framework") || pickBy("working"),
          lead_name:    pickBy(["lead", "name"]) || pickBy("lead"),
          project_given_date: excelDateToISO(pickBy(["given", "date"]) || pickBy("given")),
          start_date:   excelDateToISO(pickBy(["start", "date"]) || pickBy("start")),
          end_date:     excelDateToISO(pickBy(["end", "date"]) || pickBy("end")),
          deadline:     excelDateToISO(pickBy("deadline")),
          status:       pickBy("status") || "Not Started",
        };
      };
      const projectsPayload = rows.map(mapRow).filter((p) => p.project_name?.toString().trim());

      if (!projectsPayload.length) {
        const cols = rows.length ? Object.keys(rows[0]) : [];
        console.log("Excel headers found:", cols);
        setImportMsg(`No valid rows found. Detected columns: ${cols.join(", ") || "(none)"}. Ensure your file has a "Project Name" column.`);
        setImporting(false);
        return;
      }
      const { data } = await axios.post(`${API}/bulk-import`, { projects: projectsPayload });
      setImportMsg(`✅ Imported ${data.created} project(s). Skipped ${data.skipped}.`);
      fetchProjects();
    } catch (err) {
      console.error("Excel import error:", err);
      const detail = err?.response?.data?.message || err?.message || "Unknown error";
      setImportMsg(`❌ Failed to import Excel: ${detail}`);
    } finally {
      setImporting(false);
      setTimeout(() => setImportMsg(""), 7000);
    }
  };

  // ── Import PDF ────────────────────────────────────────────────────────
  const handleImportPdf = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    setImportMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data: parsed } = await axios.post(`${API}/parse-pdf`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const rows = parsed.rows || [];
      if (!rows.length) {
        setImportMsg("No rows could be extracted from this PDF.");
        setImporting(false);
        return;
      }
      const { data } = await axios.post(`${API}/bulk-import`, { projects: rows });
      setImportMsg(`✅ Imported ${data.created} project(s) from PDF. Skipped ${data.skipped}.`);
      fetchProjects();
    } catch (err) {
      console.error("PDF import error:", err);
      const detail = err?.response?.data?.message || err?.message || "Unknown error";
      setImportMsg(`❌ Failed to import PDF: ${detail}`);
    } finally {
      setImporting(false);
      setTimeout(() => setImportMsg(""), 7000);
    }
  };

  const filtered = projects
    .filter((p) =>
      p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.ojt_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.framework?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sortField] || "";
      const vb = b[sortField] || "";
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === "asc"
      ? <ChevronUp size={13} className="inline ml-0.5" />
      : <ChevronDown size={13} className="inline ml-0.5" />;
  };

  const thClass = "px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide cursor-pointer select-none whitespace-nowrap";

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Project Progress Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""} total
            {!canEdit && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded-full">
                View Only
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export/Import Dropdown — visible to everyone with view+; import only for editors */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
            >
              <Download size={15} /> Export / Import <Chevron size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                  <div className="px-3 py-2 text-[10px] uppercase tracking-wide text-gray-400 font-semibold border-b border-gray-50">Export</div>
                  <button onClick={handleExportExcel} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition">
                    <FileSpreadsheet size={15} className="text-green-600" />
                    Download Excel (.xlsx)
                  </button>
                  <button onClick={handleExportPdf} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition">
                    <FileText size={15} className="text-red-500" />
                    Download PDF
                  </button>
                  {canEdit && (
                    <>
                      <div className="px-3 py-2 text-[10px] uppercase tracking-wide text-gray-400 font-semibold border-t border-gray-50 border-b">Import</div>
                      <button onClick={() => { setMenuOpen(false); excelInputRef.current?.click(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition">
                        <Upload size={15} className="text-green-600" />
                        Upload Excel (.xlsx, .csv)
                      </button>
                      <button onClick={() => { setMenuOpen(false); pdfInputRef.current?.click(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition">
                        <Upload size={15} className="text-red-500" />
                        Upload PDF
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Hidden file inputs */}
          <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} className="hidden" />
          <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" onChange={handleImportPdf} className="hidden" />

          {canEdit && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow"
            >
              <Plus size={16} /> Add Project
            </button>
          )}
        </div>
      </div>

      {/* Import status banner */}
      {(importing || importMsg) && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm border ${
          importing
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : importMsg.startsWith("✅")
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {importing ? "Importing... please wait." : importMsg}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by project name, OJT, lead, framework..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-orange-500">
                <th className={thClass} onClick={() => handleSort("project_name")}>Project Name <SortIcon field="project_name" /></th>
                <th className={thClass}>Website</th>
                <th className={thClass} onClick={() => handleSort("ojt_name")}>OJT Name <SortIcon field="ojt_name" /></th>
                <th className={thClass} onClick={() => handleSort("framework")}>Framework <SortIcon field="framework" /></th>
                <th className={thClass} onClick={() => handleSort("lead_name")}>Lead Name <SortIcon field="lead_name" /></th>
                <th className={thClass} onClick={() => handleSort("project_given_date")}>Given Date <SortIcon field="project_given_date" /></th>
                <th className={thClass} onClick={() => handleSort("start_date")}>Start Date <SortIcon field="start_date" /></th>
                <th className={thClass} onClick={() => handleSort("end_date")}>End Date <SortIcon field="end_date" /></th>
                <th className={thClass} onClick={() => handleSort("deadline")}>Deadline <SortIcon field="deadline" /></th>
                <th className={thClass} onClick={() => handleSort("status")}>Status <SortIcon field="status" /></th>
                {canEdit && <th className={thClass}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canEdit ? 11 : 10} className="text-center py-16 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 11 : 10} className="text-center py-16">
                    <div className="text-gray-400 text-sm">No projects found.</div>
                    {canEdit && (
                      <button onClick={openAdd} className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-orange-600 transition">
                        Add First Project
                      </button>
                    )}
                  </td>
                </tr>
              ) : filtered.map((p, i) => {
                const isOverdue = p.status === "Incomplete";
                const isCompleted = p.status === "Completed";
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-100 transition ${
                      isOverdue
                        ? "bg-red-50 hover:bg-red-100"
                        : isCompleted
                        ? "bg-green-50/40 hover:bg-green-50"
                        : i % 2 === 0
                        ? "bg-white hover:bg-orange-50"
                        : "bg-gray-50/50 hover:bg-orange-50"
                    }`}
                  >
                    <td className="px-3 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isOverdue && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />}
                        {p.project_name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {p.website_link ? (
                        <a href={p.website_link} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline flex items-center gap-1 whitespace-nowrap">
                          Project Link <ExternalLink size={12} />
                        </a>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">{p.ojt_name || "—"}</td>
                    <td className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">{p.framework || "—"}</td>
                    <td className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">{p.lead_name || "—"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{cleanDate(p.project_given_date) || "—"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{cleanDate(p.start_date) || "—"}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{cleanDate(p.end_date) || "—"}</td>
                    <td className={`px-3 py-3 text-sm whitespace-nowrap font-medium ${isOverdue ? "text-red-600" : "text-gray-600"}`}>
                      {cleanDate(p.deadline) || "—"}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] || STATUS_COLORS["Not Started"]}`}>
                        {p.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-50">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 transition p-1 rounded-lg hover:bg-red-50">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && canEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? "Edit Project" : "Add New Project"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Project Name *</label>
                <input
                  required
                  type="text"
                  value={form.project_name}
                  onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. TAWAKKAL BACKEND"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Website Link</label>
                <input
                  type="url"
                  value={form.website_link}
                  onChange={(e) => setForm((f) => ({ ...f, website_link: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">OJT Name</label>
                <input
                  type="text"
                  value={form.ojt_name}
                  onChange={(e) => setForm((f) => ({ ...f, ojt_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. S M JAWWAD ABBAS RIZVI"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Framework / Working</label>
                <input
                  type="text"
                  value={form.framework}
                  onChange={(e) => setForm((f) => ({ ...f, framework: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. MERN STACK DEVELOPMENT"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Lead Name</label>
                <input
                  type="text"
                  value={form.lead_name}
                  onChange={(e) => setForm((f) => ({ ...f, lead_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="e.g. S.M HASSAN ABBAS NAQVI"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Project Given Date</label>
                <input
                  type="date"
                  value={form.project_given_date}
                  onChange={(e) => setForm((f) => ({ ...f, project_given_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  End Date
                  <span className="ml-1 text-green-600 font-normal">(sets status to Completed)</span>
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Deadline
                  <span className="ml-1 text-red-500 font-normal">(miss = Incomplete)</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>On Hold</option>
                  <option>Incomplete</option>
                </select>
                {form.end_date && (
                  <p className="text-xs text-green-600 mt-1">✓ End date set — will save as Completed</p>
                )}
                {!form.end_date && isDeadlinePassed(form.deadline) && form.status !== "Completed" && (
                  <p className="text-xs text-red-500 mt-1">⚠ Deadline passed — will save as Incomplete</p>
                )}
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Update" : "Add Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
