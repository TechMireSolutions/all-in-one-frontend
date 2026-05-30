import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { GRANTABLE_PAGES, PROJECT_TRACKER_VIEW_KEY, PROJECT_TRACKER_EDIT_KEY } from "../Constants/pages";
import { Shield, Search, Save, RotateCcw, BarChart2 } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const TYPE_LABEL = {
  hr: "HR",
  employee: "Employee",
  ojt: "OJT",
  student: "Student",
};

// Project Tracker access levels
const PT_NONE = "none";
const PT_VIEW = "view";
const PT_EDIT = "edit";

const getProjectTrackerAccess = (pages) => {
  if (!Array.isArray(pages)) return PT_NONE;
  if (pages.includes(PROJECT_TRACKER_EDIT_KEY)) return PT_EDIT;
  if (pages.includes(PROJECT_TRACKER_VIEW_KEY)) return PT_VIEW;
  return PT_NONE;
};

const applyProjectTrackerAccess = (pages, level) => {
  // Remove both keys first, then add the selected one
  const cleaned = (pages || []).filter(
    (k) => k !== PROJECT_TRACKER_EDIT_KEY && k !== PROJECT_TRACKER_VIEW_KEY
  );
  if (level === PT_VIEW) return [...cleaned, PROJECT_TRACKER_VIEW_KEY];
  if (level === PT_EDIT) return [...cleaned, PROJECT_TRACKER_EDIT_KEY];
  return cleaned;
};

const PermissionsPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}permissions/users`);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (typeFilter !== "all" && u.type !== typeFilter) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        (u.email || "").toLowerCase().includes(s) ||
        (u.full_name || "").toLowerCase().includes(s)
      );
    });
  }, [users, search, typeFilter]);

  const selected = users.find((u) => `${u.type}-${u.id}` === selectedId) || null;

  const selectUser = (u) => {
    const key = `${u.type}-${u.id}`;
    setSelectedId(key);
    setDraft(Array.isArray(u.allowed_pages) ? [...u.allowed_pages] : null);
    setSavedMsg("");
  };

  const togglePage = (pageKey) => {
    setDraft((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      const i = list.indexOf(pageKey);
      if (i === -1) list.push(pageKey);
      else list.splice(i, 1);
      return list;
    });
  };

  const ptAccess = getProjectTrackerAccess(draft);

  const setProjectTrackerAccess = (level) => {
    setDraft((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      return applyProjectTrackerAccess(base, level);
    });
  };

  const useDefault = () => setDraft(null);
  const selectAll = () => {
    const allKeys = GRANTABLE_PAGES.map((p) => p.key);
    setDraft(applyProjectTrackerAccess(allKeys, ptAccess));
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await axios.put(`${API}permissions/users/${selected.type}/${selected.id}`, {
        allowed_pages: draft,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.type === selected.type && u.id === selected.id
            ? { ...u, allowed_pages: draft }
            : u
        )
      );
      setSavedMsg("Permissions saved.");
    } catch (err) {
      console.error(err);
      setSavedMsg("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-orange-500" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Page Permissions</h1>
          <p className="text-sm text-gray-500">
            Grant access to individual sidebar pages per user (by email).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: user list */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[70vh]">
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or name…"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-orange-400"
              />
            </div>
            <div className="flex gap-1 text-xs">
              {["all", "hr", "employee", "ojt", "student"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2 py-1 rounded-md transition ${
                    typeFilter === t
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t === "all" ? "All" : TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No users found.</div>
            ) : (
              filtered.map((u) => {
                const key = `${u.type}-${u.id}`;
                const active = key === selectedId;
                const custom = Array.isArray(u.allowed_pages);
                return (
                  <button
                    key={key}
                    onClick={() => selectUser(u)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition ${
                      active ? "bg-orange-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {u.full_name || u.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {TYPE_LABEL[u.type]}
                        </span>
                        {custom && (
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: permission editor */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-[70vh] flex flex-col">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select a user to manage their page access.
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase">{TYPE_LABEL[selected.type]}</p>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selected.full_name || selected.email}
                  </h2>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={useDefault}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    title="Reset to default role access"
                  >
                    <RotateCcw size={12} /> Use default
                  </button>
                  <button
                    onClick={selectAll}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Select all
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {draft === null ? (
                  <div className="p-4 mb-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                    No custom permissions set — this user gets the default access for their role.
                    Tick any page below to start a custom whitelist.
                  </div>
                ) : null}

                {/* ── Project Progress Tracker special section ── */}
                <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/40">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 size={16} className="text-orange-500" />
                    <p className="text-sm font-semibold text-gray-800">Project Progress Tracker</p>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Special Access</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {[
                      { val: PT_NONE, label: "No Access", desc: "Hidden from sidebar", color: "border-gray-300 text-gray-600" },
                      { val: PT_VIEW, label: "View Only", desc: "Can see projects, cannot edit", color: "border-blue-400 text-blue-700 bg-blue-50" },
                      { val: PT_EDIT, label: "View + Edit", desc: "Can add, edit, and delete", color: "border-green-400 text-green-700 bg-green-50" },
                    ].map(({ val, label, desc, color }) => (
                      <label
                        key={val}
                        className={`flex-1 flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition ${
                          ptAccess === val ? color : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pt-access"
                          checked={ptAccess === val}
                          onChange={() => setProjectTrackerAccess(val)}
                          className="mt-0.5 accent-orange-500"
                        />
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── Regular pages ── */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Other Pages</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GRANTABLE_PAGES.map((p) => {
                      const list = Array.isArray(draft) ? draft : [];
                      const checked = list.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                            checked
                              ? "border-orange-300 bg-orange-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePage(p.key)}
                            className="accent-orange-500"
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-800">{p.label}</p>
                            <p className="text-[11px] text-gray-400 truncate">{p.key}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">{savedMsg}</span>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionsPage;
