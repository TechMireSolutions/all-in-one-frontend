// Dynamic form builder. Edits one RegistrationForm + its sections + fields.
// Reorder via up/down buttons (no drag-and-drop dep required), live preview.
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Save, ArrowUp, ArrowDown, Trash2, Eye, ChevronLeft } from "lucide-react";
import FieldRenderer from "./FieldRenderer";

const API = import.meta.env.VITE_API_BASE_URL;

const FIELD_TYPES = [
  "text", "textarea", "number", "email", "phone", "cnic",
  "date", "datetime", "select", "multiselect", "radio", "checkbox",
  "file", "url", "boolean", "section_repeater",
];

const slugifyKey = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
const newId = () => "tmp_" + Math.random().toString(36).slice(2, 10);

const blankForm = () => ({
  title: "", slug: "", description: "", category: "Event", status: "Draft",
  capacity: "", link_contact: true, require_cnic: true, require_payment: false, fee_amount: "",
  sections: [], fields: [],
});

const FormBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [model, setModel] = useState(blankForm());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({});

  useEffect(() => {
    if (isNew) return;
    axios.get(`${API}registration/forms/${id}`)
      .then((r) => {
        const d = r.data;
        setModel({
          ...blankForm(),
          ...d,
          sections: (d.sections || []).map((s) => ({ ...s, temp_id: s.id })),
          fields: (d.fields || []).map((f) => ({ ...f, temp_id: f.id })),
        });
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (k, v) => setModel((m) => ({ ...m, [k]: v }));

  const addSection = () => set("sections", [...model.sections, { temp_id: newId(), title: "New section", description: "", order_index: model.sections.length }]);
  const updateSection = (idx, key, val) => set("sections", model.sections.map((s, i) => i === idx ? { ...s, [key]: val } : s));
  const removeSection = (idx) => {
    const sec = model.sections[idx];
    set("sections", model.sections.filter((_, i) => i !== idx));
    set("fields", model.fields.filter((f) => f.sectionId !== sec.temp_id && f.sectionId !== sec.id));
  };
  const moveSection = (idx, dir) => {
    const next = [...model.sections];
    const tgt = idx + dir;
    if (tgt < 0 || tgt >= next.length) return;
    [next[idx], next[tgt]] = [next[tgt], next[idx]];
    set("sections", next.map((s, i) => ({ ...s, order_index: i })));
  };

  const addField = (sectionId = null) => set("fields", [...model.fields, {
    temp_id: newId(), sectionId,
    field_key: `field_${model.fields.length + 1}`, label: "New field", field_type: "text",
    is_required: false, is_unique: false, order_index: model.fields.length,
    options: [], validation: null, default_value: "", help_text: "", mapped_contact_field: "", conditional_logic: null,
  }]);
  const updateField = (idx, key, val) => set("fields", model.fields.map((f, i) => i === idx ? { ...f, [key]: val } : f));
  const removeField = (idx) => set("fields", model.fields.filter((_, i) => i !== idx));
  const moveField = (idx, dir) => {
    const next = [...model.fields];
    const tgt = idx + dir;
    if (tgt < 0 || tgt >= next.length) return;
    [next[idx], next[tgt]] = [next[tgt], next[idx]];
    set("fields", next.map((f, i) => ({ ...f, order_index: i })));
  };

  const save = async () => {
    if (!model.title?.trim()) { alert("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...model,
        capacity: model.capacity === "" ? null : Number(model.capacity),
        fee_amount: model.fee_amount === "" ? null : Number(model.fee_amount),
        sections: model.sections.map((s) => ({ temp_id: s.temp_id || s.id, title: s.title, description: s.description, order_index: s.order_index })),
        fields:   model.fields.map((f) => ({
          ...f,
          sectionId: f.sectionId || null,
          field_key: f.field_key?.trim(),
        })),
      };
      const res = isNew
        ? await axios.post(`${API}registration/forms`, payload)
        : await axios.put(`${API}registration/forms/${id}`, payload);
      navigate(`/registration/forms/${res.data.id}/edit`);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/registration/forms")} className="text-gray-500 hover:text-gray-700"><ChevronLeft size={20} /></button>
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? "New form" : `Edit: ${model.title}`}</h1>
        <button onClick={save} disabled={saving} className="ml-auto px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg inline-flex items-center gap-2 shadow-md">
          <Save size={14} /> {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Builder side */}
        <div className="space-y-4">
          {/* Form-level settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Form settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Field label="Title *"><input className={inputCls} value={model.title} onChange={(e) => set("title", e.target.value)} /></Field>
              <Field label="Slug"><input className={inputCls} value={model.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from title" /></Field>
              <Field label="Description"><textarea rows={2} className={inputCls} value={model.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
              <Field label="Category">
                <select className={inputCls} value={model.category} onChange={(e) => set("category", e.target.value)}>
                  <option>Event</option><option>Course</option><option>Program</option><option>Workshop</option><option>Camp</option><option>Other</option>
                </select>
              </Field>
              <Field label="Status">
                <select className={inputCls} value={model.status} onChange={(e) => set("status", e.target.value)}>
                  <option>Draft</option><option>Open</option><option>Closed</option><option>Archived</option>
                </select>
              </Field>
              <Field label="Capacity (blank = ∞)"><input type="number" className={inputCls} value={model.capacity ?? ""} onChange={(e) => set("capacity", e.target.value)} /></Field>
              <Field label="Opens at"><input type="datetime-local" className={inputCls} value={model.opens_at ? String(model.opens_at).slice(0, 16) : ""} onChange={(e) => set("opens_at", e.target.value)} /></Field>
              <Field label="Closes at"><input type="datetime-local" className={inputCls} value={model.closes_at ? String(model.closes_at).slice(0, 16) : ""} onChange={(e) => set("closes_at", e.target.value)} /></Field>
              <Field label="Fee amount (PKR)"><input type="number" className={inputCls} value={model.fee_amount ?? ""} onChange={(e) => set("fee_amount", e.target.value)} /></Field>
              <div className="md:col-span-2 flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!model.link_contact} onChange={(e) => set("link_contact", e.target.checked)} /> Link/Create Contact by CNIC</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!model.require_cnic} onChange={(e) => set("require_cnic", e.target.checked)} /> Require CNIC</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!model.require_payment} onChange={(e) => set("require_payment", e.target.checked)} /> Require payment</label>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Sections</h2>
              <button onClick={addSection} className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1"><Plus size={12} /> Add section</button>
            </div>
            {model.sections.length === 0 && <p className="text-xs text-gray-400">No sections — fields below are ungrouped.</p>}
            {model.sections.map((s, i) => (
              <div key={s.temp_id || s.id} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <input className={inputCls + " flex-1"} value={s.title} onChange={(e) => updateSection(i, "title", e.target.value)} placeholder="Section title" />
                  <button onClick={() => moveSection(i, -1)} className="p-1 text-gray-500 hover:text-gray-800"><ArrowUp size={14} /></button>
                  <button onClick={() => moveSection(i, +1)} className="p-1 text-gray-500 hover:text-gray-800"><ArrowDown size={14} /></button>
                  <button onClick={() => removeSection(i)} className="p-1 text-rose-500 hover:text-rose-700"><Trash2 size={14} /></button>
                </div>
                <input className={inputCls} value={s.description || ""} onChange={(e) => updateSection(i, "description", e.target.value)} placeholder="Section description (optional)" />
              </div>
            ))}
          </div>

          {/* Fields */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Fields</h2>
              <button onClick={() => addField()} className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1"><Plus size={12} /> Add field</button>
            </div>
            {model.fields.length === 0 && <p className="text-xs text-gray-400">No fields yet.</p>}
            {model.fields.map((f, i) => (
              <div key={f.temp_id || f.id} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <Field label="Label *"><input className={inputCls} value={f.label} onChange={(e) => updateField(i, "label", e.target.value)} /></Field>
                  <Field label="Key *">
                    <input className={inputCls} value={f.field_key}
                      onChange={(e) => updateField(i, "field_key", slugifyKey(e.target.value))}
                      onBlur={(e) => updateField(i, "field_key", slugifyKey(e.target.value))} />
                  </Field>
                  <Field label="Type">
                    <select className={inputCls} value={f.field_type} onChange={(e) => updateField(i, "field_type", e.target.value)}>
                      {FIELD_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Section">
                    <select className={inputCls} value={f.sectionId || ""} onChange={(e) => updateField(i, "sectionId", e.target.value || null)}>
                      <option value="">— Ungrouped —</option>
                      {model.sections.map((s) => <option key={s.temp_id || s.id} value={s.temp_id || s.id}>{s.title}</option>)}
                    </select>
                  </Field>
                  <Field label="Help text"><input className={inputCls} value={f.help_text || ""} onChange={(e) => updateField(i, "help_text", e.target.value)} /></Field>
                  <Field label="Map to Contact field"><input className={inputCls} value={f.mapped_contact_field || ""} placeholder="e.g. first_name, last_name, cnic, dob, gender" onChange={(e) => updateField(i, "mapped_contact_field", e.target.value)} /></Field>
                  {["select", "multiselect", "radio", "checkbox"].includes(f.field_type) && (
                    <Field label="Options (comma-separated)">
                      <input className={inputCls}
                        value={(f.options || []).map((o) => typeof o === "object" ? o.label : o).join(", ")}
                        onChange={(e) => updateField(i, "options", e.target.value.split(",").map((s) => s.trim()).filter(Boolean).map((v) => ({ value: v, label: v })))} />
                    </Field>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-1 text-xs"><input type="checkbox" checked={!!f.is_required} onChange={(e) => updateField(i, "is_required", e.target.checked)} /> Required</label>
                  <label className="inline-flex items-center gap-1 text-xs"><input type="checkbox" checked={!!f.is_unique} onChange={(e) => updateField(i, "is_unique", e.target.checked)} /> Unique</label>
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => moveField(i, -1)} className="p-1 text-gray-500 hover:text-gray-800"><ArrowUp size={14} /></button>
                    <button onClick={() => moveField(i, +1)} className="p-1 text-gray-500 hover:text-gray-800"><ArrowDown size={14} /></button>
                    <button onClick={() => removeField(i)} className="p-1 text-rose-500 hover:text-rose-700"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview side */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 lg:sticky lg:top-4 self-start">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} className="text-emerald-600" />
            <h2 className="font-semibold text-gray-800">Live preview</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">{model.description || "Form description appears here."}</p>
          {model.sections.length === 0 && model.fields.length === 0 && (
            <p className="text-xs text-gray-400">Add sections and fields to see the preview.</p>
          )}
          {model.sections.map((s) => (
            <div key={s.temp_id || s.id} className="mb-4">
              <h3 className="font-semibold text-emerald-700 text-sm mb-1">{s.title}</h3>
              {s.description && <p className="text-xs text-gray-500 mb-2">{s.description}</p>}
              <div className="space-y-3">
                {model.fields.filter((f) => f.sectionId === (s.temp_id || s.id)).map((f) => (
                  <PreviewField key={f.temp_id || f.id} field={f} value={preview[f.field_key]} onChange={(v) => setPreview((p) => ({ ...p, [f.field_key]: v }))} />
                ))}
              </div>
            </div>
          ))}
          <div className="space-y-3">
            {model.fields.filter((f) => !f.sectionId).map((f) => (
              <PreviewField key={f.temp_id || f.id} field={f} value={preview[f.field_key]} onChange={(v) => setPreview((p) => ({ ...p, [f.field_key]: v }))} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none";
const Field = ({ label, children }) => (
  <div>
    <label className="block text-[11px] uppercase tracking-wider text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);

const PreviewField = ({ field, value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {field.label} {field.is_required && <span className="text-rose-500">*</span>}
    </label>
    <FieldRenderer field={field} value={value} onChange={onChange} />
    {field.help_text && <p className="text-[11px] text-gray-500 mt-0.5">{field.help_text}</p>}
  </div>
);

export default FormBuilder;
