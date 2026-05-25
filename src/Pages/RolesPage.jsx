import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Shield, Plus, Trash2, Search, Save, ChevronDown, ChevronRight, GraduationCap, Briefcase, X, UserPlus, Users } from "lucide-react";
import { GRANTABLE_PAGES } from "../Constants/pages";

const API = import.meta.env.VITE_API_BASE_URL;

const RolesPage = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newPages, setNewPages] = useState([]); // page keys ticked when creating a new role
  const [creating, setCreating] = useState(false);
  // Optional login credentials: when provided, an HR account is also created
  // and assigned to this role so the user can log in with these credentials.
  const [loginEmail, setLoginEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [openRoleId, setOpenRoleId] = useState(null); // which role's pages panel is open
  const [draftPages, setDraftPages] = useState({}); // roleId -> string[]
  const [savingId, setSavingId] = useState(null);
  const [quickType, setQuickType] = useState(null); // "student" | "ojt" | "hr" | null
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pendingAssign, setPendingAssign] = useState({}); // key -> custom_role_id

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, u] = await Promise.all([
        axios.get(`${API}roles`),
        axios.get(`${API}roles/users`),
      ]);
      setRoles(r.data.roles || []);
      setUsers(u.data.users || []);
      // Tell the sidebar to refresh its custom-roles dropdown.
      window.dispatchEvent(new CustomEvent("roles-updated"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const createRole = async () => {
    if (!name.trim()) return;
    // Validate optional login fields together: either both empty or both filled.
    if (loginEmail.trim() && !tempPassword.trim()) { alert("Password is required when login email is provided."); return; }
    if (tempPassword.trim() && !loginEmail.trim()) { alert("Login email is required when password is provided."); return; }
    if (tempPassword.trim() && tempPassword.length < 8) { alert("Temporary password must be at least 8 characters."); return; }

    setCreating(true);
    try {
      // 1) Create the role.
      const res = await axios.post(`${API}roles`, { name, description, allowed_pages: newPages });
      const roleId = res?.data?.role?.id;

      // 2) Optional: create an HR login account and assign this role to it.
      if (roleId && loginEmail.trim() && tempPassword.trim()) {
        try {
          const hrRes = await axios.post(`${API}auth/create-hr`, { email: loginEmail.trim(), password: tempPassword });
          const hrId = hrRes?.data?.hr?.id;
          if (!hrId) throw new Error("HR account ID not returned from server.");
          // Don't swallow the assign error — if this fails, the user would
          // log in as plain HR and see default HR pages (the exact bug we want to avoid).
          const assignRes = await axios.put(`${API}roles/assign/hr/${hrId}`, { custom_role_id: roleId });
          if (!assignRes?.data) throw new Error("Role assignment returned empty response.");
          alert(`Role "${name}" created with its own login.\n\nEmail: ${loginEmail}\nTemporary password: ${tempPassword}\n\nWhen this user signs in, they'll only see the pages assigned to "${name}" — not HR's default sidebar.\n\nShare these credentials and ask the user to change the password on first login.`);
        } catch (hrErr) {
          alert(`⚠️ Role created, but the login could not be linked to the role: ${hrErr.response?.data?.message || hrErr.message}\n\nThis means the user would log in as plain HR and see all HR pages. Please restart the backend and try again, or assign the role manually from the "Assign role to user" table below.`);
        }
      }

      setName(""); setDescription(""); setNewPages([]);
      setLoginEmail(""); setTempPassword("");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to create role");
    } finally {
      await loadAll();
      setCreating(false);
    }
  };

  const deleteRole = async (id) => {
    if (!confirm("Delete this role? Users assigned to it will be unassigned.")) return;
    try {
      await axios.delete(`${API}roles/${id}`);
      await loadAll();
    } catch {
      alert("Failed to delete role");
    }
  };

  const assignRole = async (u, custom_role_id) => {
    try {
      await axios.put(`${API}roles/assign/${u.type}/${u.id}`, { custom_role_id: custom_role_id || null });
      setUsers((prev) => prev.map((x) =>
        x.type === u.type && x.id === u.id ? { ...x, custom_role_id: custom_role_id || null } : x
      ));
      setPendingAssign((p) => ({ ...p, [`${u.type}-${u.id}`]: undefined }));
    } catch {
      alert("Failed to assign role");
    }
  };

  const counts = useMemo(() => {
    const c = { all: users.length, contact: 0, hr: 0, employee: 0, ojt: 0, student: 0 };
    users.forEach((u) => { if (c[u.type] !== undefined) c[u.type] += 1; });
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (typeFilter !== "all" && u.type !== typeFilter) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (u.email || "").toLowerCase().includes(s) || (u.full_name || "").toLowerCase().includes(s);
    });
  }, [users, search, typeFilter]);

  const roleNameById = useMemo(() => {
    const m = {};
    roles.forEach((r) => { m[r.id] = r.name; });
    return m;
  }, [roles]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
      </div>

      {/* Create role */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Add a new role</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Role name (e.g. Team Lead)"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <button
            onClick={createRole}
            disabled={creating || !name.trim()}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm rounded inline-flex items-center justify-center gap-2"
          >
            <Plus size={14} /> {creating ? "Adding…" : "Add role"}
          </button>
        </div>
        {/* Optional login credentials — for this ROLE (not HR) */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-emerald-800 uppercase mb-2">
            Role login (optional) — set sign-in credentials for users of this role
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Role email (e.g. lead@company.com)"
              className="border border-emerald-300 rounded px-3 py-2 text-sm bg-white"
            />
            <input
              type="text"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Temporary password (min 8 chars)"
              className="border border-emerald-300 rounded px-3 py-2 text-sm bg-white font-mono"
            />
          </div>
          <p className="text-[10px] text-emerald-700 mt-1">
            Leave both empty to create a role without sign-in. If filled, the user
            logs in with these credentials and sees only the pages ticked below — not HR's defaults.
          </p>
        </div>

        <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Pages this role can access</p>
        <PageCheckboxGrid
          selected={newPages}
          onToggle={(key) => setNewPages((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key])}
          onSelectAll={() => setNewPages(GRANTABLE_PAGES.map((p) => p.key))}
          onClear={() => setNewPages([])}
        />
      </div>

      {/* Existing roles list */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Existing roles</h2>
        {roles.length === 0 ? (
          <p className="text-xs text-gray-500">No roles yet — add your first one above.</p>
        ) : (
          <div className="space-y-2">
            {roles.map((r) => {
              const isOpen = openRoleId === r.id;
              const pages = draftPages[r.id] !== undefined ? draftPages[r.id] : (r.allowed_pages || []);
              const dirty = JSON.stringify(pages) !== JSON.stringify(r.allowed_pages || []);
              return (
                <div key={r.id} className="border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      onClick={() => {
                        setOpenRoleId(isOpen ? null : r.id);
                        setDraftPages((d) => ({ ...d, [r.id]: r.allowed_pages || [] }));
                      }}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="font-medium text-gray-800 text-sm">{r.name}</span>
                      {r.description && <span className="text-xs text-gray-500">— {r.description}</span>}
                      <span className="ml-2 text-[11px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        {(r.allowed_pages || []).length} page{(r.allowed_pages || []).length === 1 ? "" : "s"}
                      </span>
                    </button>
                    <button onClick={() => deleteRole(r.id)} className="text-gray-400 hover:text-red-600" title="Delete role">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                      <PageCheckboxGrid
                        selected={pages}
                        onToggle={(key) => setDraftPages((d) => {
                          const cur = d[r.id] !== undefined ? d[r.id] : (r.allowed_pages || []);
                          const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
                          return { ...d, [r.id]: next };
                        })}
                        onSelectAll={() => setDraftPages((d) => ({ ...d, [r.id]: GRANTABLE_PAGES.map((p) => p.key) }))}
                        onClear={() => setDraftPages((d) => ({ ...d, [r.id]: [] }))}
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          disabled={!dirty || savingId === r.id}
                          onClick={async () => {
                            setSavingId(r.id);
                            try {
                              await axios.put(`${API}roles/${r.id}`, { allowed_pages: pages });
                              await loadAll();
                            } catch { alert("Failed to save pages"); }
                            finally { setSavingId(null); }
                          }}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs rounded inline-flex items-center gap-1"
                        >
                          <Save size={12} /> {savingId === r.id ? "Saving…" : "Save pages"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick add */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Quick add a person with a role</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setQuickType("student")}
            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded inline-flex items-center gap-2"
          >
            <GraduationCap size={14} /> Add Student
          </button>
          <button
            onClick={() => setQuickType("ojt")}
            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded inline-flex items-center gap-2"
          >
            <Briefcase size={14} /> Add OJT Trainee
          </button>
          <button
            onClick={() => setQuickType("hr")}
            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded inline-flex items-center gap-2"
          >
            <Users size={14} /> Add HR
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded inline-flex items-center gap-2"
            title="Employee registration uses the full registration form"
          >
            <UserPlus size={14} /> Add Employee
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          Employee registration opens the full Registration page — pick a contact there to promote, then come back to assign a role.
        </p>
      </div>

      {quickType && (
        <QuickAddModal
          type={quickType}
          roles={roles}
          onClose={() => setQuickType(null)}
          onDone={() => { setQuickType(null); loadAll(); }}
        />
      )}

      {/* Assign to users */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h2 className="font-semibold text-gray-800">Assign role to user</h2>
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email"
                className="w-full pl-7 border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Type filter chips */}
        <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5">
          {[
            { k: "all",      label: "All" },
            { k: "contact",  label: "Contacts" },
            { k: "hr",       label: "HR" },
            { k: "employee", label: "Employees" },
            { k: "ojt",      label: "OJT" },
            { k: "student",  label: "Students" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTypeFilter(t.k)}
              className={`px-3 py-1 text-xs rounded-full border transition ${
                typeFilter === t.k
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label} <span className="opacity-75">({counts[t.k] ?? 0})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No users match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Current role</th>
                <th className="text-left px-4 py-2">Assign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => {
                const key = `${u.type}-${u.id}`;
                const draft = pendingAssign[key];
                const currentId = u.custom_role_id || "";
                const value = draft !== undefined ? draft : currentId;
                return (
                  <tr key={key}>
                    <td className="px-4 py-2">{u.full_name || "—"}</td>
                    <td className="px-4 py-2 text-gray-600">{u.email || <span className="text-gray-400">(no email)</span>}</td>
                    <td className="px-4 py-2 text-xs uppercase">
                      <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{u.type}</span>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {u.custom_role_id ? roleNameById[u.custom_role_id] || "(unknown)" : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={value}
                          onChange={(e) => setPendingAssign((p) => ({ ...p, [key]: e.target.value }))}
                          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                        >
                          <option value="">— None —</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => assignRole(u, value)}
                          disabled={String(value) === String(currentId)}
                          className="px-2 py-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs rounded inline-flex items-center gap-1"
                        >
                          <Save size={12} /> Save
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const QuickAddModal = ({ type, roles, onClose, onDone }) => {
  if (type === "hr") return <HrQuickAddModal roles={roles} onClose={onClose} onDone={onDone} />;
  const isStudent = type === "student";
  const idField = isStudent ? "student_id" : "ojt_id";
  const idLabel = isStudent ? "Student ID" : "OJT ID";
  const heading = isStudent ? "Add Student" : "Add OJT Trainee";

  const [form, setForm] = useState({
    [idField]: "",
    full_name: "",
    email: "",
    cnic: "",
    contact_number: "",
    gender: "Male",
    dob: "",
    joining_date: new Date().toISOString().slice(0, 10),
    level: "ojt level 1",
    custom_role_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    axios.get(`${API}contacts`).then((r) => setContacts(r.data.contacts || r.data || [])).catch(() => {});
    const endpoint = isStudent ? "students" : "ojt";
    const idKey    = isStudent ? "student_id" : "ojt_id";
    const prefix   = isStudent ? "STU" : "OJT";
    axios.get(`${API}${endpoint}`).then((r) => {
      const list = r.data.students || r.data.ojts || r.data || [];
      const used = list
        .map((x) => new RegExp(`^${prefix}-(\\d+)$`, "i").exec(x[idKey] || ""))
        .filter(Boolean)
        .map((m) => parseInt(m[1], 10));
      const next = (used.length ? Math.max(...used) : 0) + 1;
      setForm((f) => ({ ...f, [idField]: `${prefix}-${String(next).padStart(3, "0")}` }));
    }).catch(() => {});
    // eslint-disable-next-line
  }, []);

  const pickContact = (id) => {
    const c = contacts.find((x) => String(x.id) === String(id));
    if (!c) return;
    setForm((f) => ({
      ...f,
      full_name:      `${c.first_name || ""} ${c.last_name || ""}`.trim() || f.full_name,
      cnic:           c.cnic || f.cnic,
      gender:         c.gender || f.gender,
      dob:            c.dob ? new Date(c.dob).toISOString().slice(0, 10) : f.dob,
      email:          c.emails?.[0]?.email_address  || f.email,
      contact_number: c.phoneNumbers?.[0]?.phone_number || f.contact_number,
      joining_date:   c.office?.joining_date || f.joining_date,
    }));
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form[idField] || !form.full_name || !form.email || !form.cnic || !form.joining_date) {
      alert("Please fill ID, name, email, CNIC and joining date.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, custom_role_id: form.custom_role_id ? Number(form.custom_role_id) : null };
      if (isStudent) delete payload.level;
      const url = `${API}${isStudent ? "students" : "ojt"}`;
      await axios.post(url, payload);
      alert(`${isStudent ? "Student" : "OJT trainee"} added.`);
      onDone();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to add");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="font-bold text-gray-800">{heading}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <label className="text-[11px] font-semibold text-emerald-800 uppercase block mb-1">
              Pick from existing Contacts (auto-fills personal info)
            </label>
            <select
              onChange={(e) => pickContact(e.target.value)}
              className="w-full border border-emerald-300 rounded px-3 py-2 bg-white"
              defaultValue=""
            >
              <option value="">— Start blank or select a contact —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}{c.cnic ? ` · ${c.cnic}` : ""}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-emerald-700 mt-1">
              Don't see them? <a href="/contacts" className="underline">Add them in Contacts first</a>.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase block mb-1">
              {idLabel} * <span className="text-emerald-600 text-[10px] ml-1">auto-generated</span>
            </label>
            <input
              value={form[idField]}
              readOnly
              title="Auto-generated based on existing records"
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-gray-700 font-mono"
            />
          </div>
          <Field label="Full Name *" value={form.full_name} onChange={(v) => set("full_name", v)} />
          <Field label="Email *" value={form.email} onChange={(v) => set("email", v)} />
          <Field label="CNIC *" value={form.cnic} onChange={(v) => set("cnic", v)} placeholder="XXXXX-XXXXXXX-X" />
          <Field label="Contact Number" value={form.contact_number} onChange={(v) => set("contact_number", v)} />
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Gender *</label>
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 bg-white">
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <Field label="Date of Birth" type="date" value={form.dob} onChange={(v) => set("dob", v)} />
          <Field label="Joining Date *" type="date" value={form.joining_date} onChange={(v) => set("joining_date", v)} />
          {!isStudent && (
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Skill Level *</label>
              <select value={form.level} onChange={(e) => set("level", e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 bg-white">
                <option>ojt level 1</option><option>ojt level 2</option><option>ojt level 3</option><option>ojt level 4</option>
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Assign Role</label>
            <select value={form.custom_role_id} onChange={(e) => set("custom_role_id", e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 bg-white">
              <option value="">— None —</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">The role's allowed pages will apply to this person.</p>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm rounded">
            {submitting ? "Saving…" : heading}
          </button>
        </div>
      </div>
    </div>
  );
};

const HrQuickAddModal = ({ roles, onClose, onDone }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    axios.get(`${API}contacts`).then((r) => setContacts(r.data.contacts || r.data || [])).catch(() => {});
  }, []);

  const pickContact = (id) => {
    const c = contacts.find((x) => String(x.id) === String(id));
    if (c?.emails?.[0]?.email_address) setEmail(c.emails[0].email_address);
  };

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}auth/create-hr`, { email, password });
      const newId = res?.data?.hr?.id;
      if (newId && roleId) {
        try { await axios.put(`${API}roles/assign/hr/${newId}`, { custom_role_id: Number(roleId) }); } catch {}
      }
      alert("HR account created.");
      onDone();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to create HR");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="font-bold text-gray-800">Add HR</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <label className="text-[11px] font-semibold text-emerald-800 uppercase block mb-1">
              Pick from existing Contacts (auto-fills email)
            </label>
            <select
              onChange={(e) => pickContact(e.target.value)}
              className="w-full border border-emerald-300 rounded px-3 py-2 bg-white"
              defaultValue=""
            >
              <option value="">— Start blank or select a contact —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}{c.emails?.[0] ? ` · ${c.emails[0].email_address}` : ""}
                </option>
              ))}
            </select>
          </div>
          <Field label="Email *" value={email} onChange={setEmail} placeholder="hr@example.com" />
          <Field label="Password *" type="password" value={password} onChange={setPassword} placeholder="min 8 characters" />
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Assign Role</label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 bg-white">
              <option value="">— None —</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm rounded">
            {submitting ? "Creating…" : "Create HR"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", placeholder = "" }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 uppercase block mb-1">{label}</label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded px-3 py-2"
    />
  </div>
);

const PageCheckboxGrid = ({ selected, onToggle, onSelectAll, onClear }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <button onClick={onSelectAll} className="text-[11px] text-orange-600 hover:underline">Select all</button>
      <span className="text-gray-300">|</span>
      <button onClick={onClear} className="text-[11px] text-orange-600 hover:underline">Clear</button>
      <span className="ml-auto text-[11px] text-gray-500">{selected.length} selected</span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
      {GRANTABLE_PAGES.map((p) => {
        const checked = selected.includes(p.key);
        return (
          <label
            key={p.key}
            className={`flex items-center gap-2 px-3 py-2 border rounded cursor-pointer text-sm ${checked ? "border-orange-300 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}
          >
            <input type="checkbox" checked={checked} onChange={() => onToggle(p.key)} />
            <span className="flex-1">
              <span className="block text-gray-800">{p.label}</span>
              <span className="block text-[10px] text-gray-400">{p.key}</span>
            </span>
          </label>
        );
      })}
    </div>
  </div>
);

export default RolesPage;
