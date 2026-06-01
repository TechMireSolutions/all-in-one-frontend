// Single source of truth for rendering a registration field by type.
// Used both by the live preview in FormBuilder and the public page.
import React from "react";

const baseInput = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none";

const FieldRenderer = ({ field, value, onChange }) => {
  const opts = Array.isArray(field.options) ? field.options : [];
  const norm = (v) => (typeof v === "object" && v ? v.value : v);
  const lbl  = (v) => (typeof v === "object" && v ? v.label : v);

  switch (field.field_type) {
    case "text":
    case "email":
    case "phone":
    case "cnic":
    case "url":
      return <input type={field.field_type === "email" ? "email" : "text"}
        value={value || ""} placeholder={field.help_text || ""}
        onChange={(e) => onChange(e.target.value)} className={baseInput} />;
    case "number":
      return <input type="number" value={value ?? ""}
        onChange={(e) => onChange(e.target.value)} className={baseInput} />;
    case "textarea":
      return <textarea rows={4} value={value || ""}
        onChange={(e) => onChange(e.target.value)} className={baseInput} placeholder={field.help_text || ""} />;
    case "date":
      return <input type="date" value={value || ""}
        onChange={(e) => onChange(e.target.value)} className={baseInput} />;
    case "datetime":
      return <input type="datetime-local" value={value || ""}
        onChange={(e) => onChange(e.target.value)} className={baseInput} />;
    case "select":
      return (
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={baseInput}>
          <option value="">— Select —</option>
          {opts.map((o, i) => <option key={i} value={norm(o)}>{lbl(o)}</option>)}
        </select>
      );
    case "multiselect":
      return (
        <select multiple value={Array.isArray(value) ? value : []}
          onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
          className={baseInput} size={Math.min(opts.length || 3, 6)}>
          {opts.map((o, i) => <option key={i} value={norm(o)}>{lbl(o)}</option>)}
        </select>
      );
    case "radio":
      return (
        <div className="space-y-1">
          {opts.map((o, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <input type="radio" name={field.field_key} value={norm(o)}
                checked={String(value) === String(norm(o))}
                onChange={(e) => onChange(e.target.value)} />
              {lbl(o)}
            </label>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <div className="space-y-1">
          {opts.map((o, i) => {
            const arr = Array.isArray(value) ? value : [];
            const checked = arr.includes(norm(o));
            return (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={checked}
                  onChange={(e) => {
                    const next = new Set(arr);
                    if (e.target.checked) next.add(norm(o)); else next.delete(norm(o));
                    onChange([...next]);
                  }} />
                {lbl(o)}
              </label>
            );
          })}
        </div>
      );
    case "boolean":
      return (
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          {field.help_text || "Yes"}
        </label>
      );
    case "file":
      return <input type="file"
        onChange={(e) => onChange(e.target.files[0] || null)}
        className="block w-full text-sm" />;
    case "section_repeater":
      return <textarea rows={3} value={typeof value === "string" ? value : JSON.stringify(value || [])}
        onChange={(e) => onChange(e.target.value)} className={baseInput}
        placeholder='JSON array of sub-answers' />;
    default:
      return <input value={value || ""} onChange={(e) => onChange(e.target.value)} className={baseInput} />;
  }
};

export default FieldRenderer;
