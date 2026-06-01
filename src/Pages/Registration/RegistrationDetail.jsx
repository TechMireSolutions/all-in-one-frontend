// Single submission detail. Tabs: Answers / Roles / Student / OJT / Status history / Payment.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ClipboardList, Users, GraduationCap, Briefcase, History, Wallet, Plus, Trash2, UserCheck } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

// "students" / "ojts" / "employees" tabs are only shown when the registration
// actually has rows in those child tables — driven by the loaded `reg`.
const baseTabs = [
  { k: "answers",   label: "Answers",        i: ClipboardList, always: true },
  { k: "roles",     label: "Roles",          i: Users,         always: true },
  { k: "students",  label: "Student",        i: GraduationCap, child: "students" },
  { k: "ojts",      label: "OJT",            i: Briefcase,     child: "ojts" },
  { k: "employees", label: "Employee",       i: UserCheck,     child: "employees" },
  { k: "logs",      label: "Status history", i: History,       always: true },
  { k: "payment",   label: "Payment",        i: Wallet,        always: true },
];

const RegistrationDetail = () => {
  const { id } = useParams();
  const [reg, setReg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("answers");

  const load = () => {
    setLoading(true);
    setError(null);
    axios.get(`${API}registration/registrations/${id}`)
      .then((r) => {
        setReg(r.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load registration:", err);
        setError(err.response?.data?.message || err.message || "Failed to load registration details");
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [id]);

  const setStatus = async (to_status) => {
    const note = prompt(`Note for "${to_status}" (optional):`) || "";
    try {
      await axios.patch(`${API}registration/registrations/${id}/status`, { to_status, note });
      load();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error) return <div className="p-8 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl m-4">Error: {error}</div>;
  if (!reg) return <div className="p-8 text-gray-500">No registration data found.</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/registration/forms/${reg.formId}/submissions`} className="text-gray-500 hover:text-gray-700"><ChevronLeft size={20} /></Link>
        <div className="flex-1">
          <p className="font-mono text-sm text-emerald-700">{reg.registration_number}</p>
          <h1 className="text-2xl font-bold text-gray-900">{reg.contact ? `${reg.contact.first_name} ${reg.contact.last_name}` : reg.form?.title}</h1>
          <p className="text-xs text-gray-500">{reg.form?.title} · submitted {new Date(reg.submitted_at).toLocaleString()}</p>
        </div>
        <div className="flex gap-1">
          {["Approved", "Rejected", "Waitlisted"].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">{s}</button>
          ))}
        </div>
      </div>

      <div className="border-b border-gray-200 flex flex-wrap gap-1 text-sm mb-5">
        {baseTabs.filter((t) => t.always || (reg[t.child] || []).length > 0).map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`relative px-3 py-2 flex items-center gap-1.5 ${tab === t.k ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-800"}`}>
            <t.i size={14} /> {t.label}
            {tab === t.k && <motion.span layoutId="dtab" className="absolute left-0 right-0 -bottom-px h-0.5 bg-emerald-500" />}
          </button>
        ))}
      </div>

      {tab === "answers"  && <AnswersPanel  reg={reg} />}
      {tab === "roles"    && <RolesPanel    reg={reg} reload={load} />}
      {tab === "students"  && <ChildPanel rows={reg.students  || []} kind="student"  reload={load} />}
      {tab === "ojts"      && <ChildPanel rows={reg.ojts      || []} kind="ojt"      reload={load} />}
      {tab === "employees" && <EmployeePanel rows={reg.employees || []} reload={load} />}
      {tab === "logs"     && <LogsPanel     reg={reg} />}
      {tab === "payment"  && <PaymentPanel  reg={reg} reload={load} />}
    </div>
  );
};

const AnswersPanel = ({ reg }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-gray-700 text-[11px] uppercase tracking-wider">
        <tr>
          <th className="px-4 py-2 text-left">Field</th>
          <th className="px-4 py-2 text-left">Value</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {reg.answers.map((a) => {
          let v = a.value_text;
          if (a.value_number !== null && v === null) v = a.value_number;
          if (a.value_boolean !== null && v === null) v = a.value_boolean ? "Yes" : "No";
          if (a.value_date && !v) v = new Date(a.value_date).toLocaleDateString();
          if (a.value_json && !v) v = JSON.stringify(a.value_json);
          if (a.file_url && !v) v = <a href={a.file_url} className="text-emerald-600 underline" target="_blank" rel="noreferrer">View file</a>;
          return (
            <tr key={a.id}>
              <td className="px-4 py-2 font-mono text-xs text-gray-500">{a.field_key}</td>
              <td className="px-4 py-2 text-gray-800">{v ?? "—"}</td>
            </tr>
          );
        })}
        {reg.answers.length === 0 && <tr><td colSpan={2} className="text-center py-6 text-gray-500 text-sm">No answers recorded.</td></tr>}
      </tbody>
    </table>
  </div>
);

const RolesPanel = ({ reg, reload }) => {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ role_name: "Participant", is_primary: false });

  const add = async () => {
    await axios.post(`${API}registration/registrations/${reg.id}/roles`, draft);
    setAdding(false); setDraft({ role_name: "Participant", is_primary: false }); reload();
  };
  const remove = async (rid) => {
    if (!confirm("Remove this role? Student/OJT children will be archived.")) return;
    await axios.delete(`${API}registration/registrations/${reg.id}/roles/${rid}`);
    reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Roles in this registration</h3>
        <button onClick={() => setAdding(true)} className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1"><Plus size={12} /> Add role</button>
      </div>
      {adding && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-2 flex flex-wrap items-center gap-2">
          <select value={draft.role_name} onChange={(e) => setDraft((d) => ({ ...d, role_name: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
            {["Participant","Student","OJT","Employee","Instructor","Volunteer","Organizer","Speaker","Mentor","Attendee","Staff","Other"].map((r) => <option key={r}>{r}</option>)}
          </select>
          <label className="inline-flex items-center gap-1 text-xs"><input type="checkbox" checked={!!draft.is_primary} onChange={(e) => setDraft((d) => ({ ...d, is_primary: e.target.checked }))} /> Primary</label>
          <button onClick={add} className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded">Save</button>
          <button onClick={() => setAdding(false)} className="text-xs text-gray-500">Cancel</button>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {reg.roles.map((r) => (
          <div key={r.id} className="px-3 py-2 flex items-center gap-2 text-sm">
            <span className="font-medium">{r.role_name}</span>
            {r.role_label && <span className="text-xs text-gray-500">({r.role_label})</span>}
            {r.is_primary && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">PRIMARY</span>}
            <button onClick={() => remove(r.id)} className="ml-auto text-rose-500 hover:text-rose-700"><Trash2 size={14} /></button>
          </div>
        ))}
        {reg.roles.length === 0 && <p className="text-center py-6 text-gray-500 text-sm">No roles assigned.</p>}
      </div>
    </div>
  );
};

const ChildPanel = ({ rows, kind, reload }) => (
  <div className="space-y-3">
    {rows.length === 0 && <p className="text-sm text-gray-500">No {kind === "student" ? "Student" : "OJT"} record. Assign the "{kind === "student" ? "Student" : "OJT"}" role on the Roles tab to auto-create one.</p>}
    {rows.map((r) => (
      <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="font-mono text-sm text-emerald-700">{r.student_number || r.ojt_number}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs">
          {Object.entries(r).filter(([k]) => !["id","createdAt","updatedAt","registrationId","contactId"].includes(k)).map(([k, v]) => (
            <div key={k}>
              <p className="text-gray-500 text-[10px] uppercase">{k}</p>
              <p className="text-gray-800">{v == null ? "—" : String(v)}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Employee panel — extended fields with confirm/terminate quick-actions.
const EmployeePanel = ({ rows, reload }) => {
  const confirm = async (id) => {
    const date = prompt("Confirmation date (YYYY-MM-DD, blank = today):") || "";
    await axios.post(`${API}registration/employees/${id}/confirm`, date ? { confirmation_date: date } : {});
    reload();
  };
  const terminate = async (id) => {
    const reason = prompt("Termination reason (optional):") || "";
    if (!window.confirm("Terminate this employee?")) return;
    await axios.post(`${API}registration/employees/${id}/terminate`, { reason });
    reload();
  };
  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-sm text-gray-500">No Employee record. Assign the "Employee" (or "Staff") role on the Roles tab to auto-create one.</p>}
      {rows.map((r) => (
        <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-mono text-sm text-emerald-700">{r.employee_id}</p>
              <p className="text-xs text-gray-500">{r.designation} · {r.department || "—"}</p>
            </div>
            <div className="flex gap-2">
              {r.is_probation && (
                <button onClick={() => confirm(r.id)} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded">
                  Confirm
                </button>
              )}
              {!["Terminated", "Resigned", "Retired"].includes(r.status) && (
                <button onClick={() => terminate(r.id)} className="px-2 py-1 text-xs bg-rose-100 text-rose-700 hover:bg-rose-200 rounded">
                  Terminate
                </button>
              )}
              <span className="text-[11px] uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{r.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(r).filter(([k]) => !["id", "createdAt", "updatedAt", "registrationId", "contactId", "salary_gross"].includes(k)).map(([k, v]) => (
              <div key={k}>
                <p className="text-gray-500 text-[10px] uppercase">{k}</p>
                <p className="text-gray-800 break-all">{v == null ? "—" : String(v)}</p>
              </div>
            ))}
            <div>
              <p className="text-gray-500 text-[10px] uppercase">salary_gross (virtual)</p>
              <p className="text-gray-800 font-semibold">{r.salary_gross != null ? r.salary_gross : "—"}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const LogsPanel = ({ reg }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-gray-700 text-[11px] uppercase tracking-wider">
        <tr><th className="px-3 py-2 text-left">When</th><th className="px-3 py-2 text-left">From</th><th className="px-3 py-2 text-left">To</th><th className="px-3 py-2 text-left">Note</th></tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {(reg.statusLogs || []).sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at)).map((l) => (
          <tr key={l.id}>
            <td className="px-3 py-2 text-xs text-gray-500">{new Date(l.changed_at).toLocaleString()}</td>
            <td className="px-3 py-2 text-xs">{l.from_status || "—"}</td>
            <td className="px-3 py-2 text-xs font-semibold">{l.to_status}</td>
            <td className="px-3 py-2 text-xs text-gray-600">{l.note || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PaymentPanel = ({ reg, reload }) => {
  const [status, setStatus] = useState(reg.payment_status);
  const [ref, setRef] = useState(reg.payment_ref || "");
  const save = async () => {
    await axios.post(`${API}registration/registrations/${reg.id}/payment`, { payment_status: status, payment_ref: ref });
    reload();
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-md">
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs uppercase text-gray-600 mb-1">Payment status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2">
            <option>N/A</option><option>Pending</option><option>Paid</option><option>Refunded</option><option>Failed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-600 mb-1">Payment reference</label>
          <input value={ref} onChange={(e) => setRef(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Transaction ID, receipt #, etc." />
        </div>
        <button onClick={save} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded">Save payment</button>
      </div>
    </div>
  );
};

export default RegistrationDetail;
