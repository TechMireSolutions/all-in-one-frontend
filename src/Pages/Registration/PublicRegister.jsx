// Public dynamic registration page — fetches /public/forms/:slug,
// renders fields, evaluates conditional_logic client-side, submits multipart.
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Send, Loader2 } from "lucide-react";
import FieldRenderer from "./FieldRenderer";

const API = import.meta.env.VITE_API_BASE_URL;

const evalCondition = (field, answers) => {
  const cl = field.conditional_logic;
  if (!cl?.show_if?.field_key) return true;
  const { field_key, op, value } = cl.show_if;
  const other = answers[field_key];
  switch (op) {
    case "=": case "==": case "equals":  return String(other) === String(value);
    case "!=": case "not_equals":         return String(other) !== String(value);
    case "includes":                       return Array.isArray(other) && other.includes(value);
    case "exists":                         return other !== undefined && other !== null && other !== "";
    default:                               return true;
  }
};

const PublicRegister = () => {
  const { slug } = useParams();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    axios.get(`${API}registration/public/forms/${slug}`)
      .then((r) => {
        setForm(r.data);
        const defaults = {};
        (r.data.fields || []).forEach((f) => { if (f.default_value != null) defaults[f.field_key] = f.default_value; });
        setAnswers(defaults);
      })
      .catch((e) => setError(e?.response?.data?.message || "Form not available"));
  }, [slug]);

  const visibleFields = (form?.fields || []).filter((f) => evalCondition(f, answers));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      const json = {};
      visibleFields.forEach((f) => {
        if (f.field_type === "file" && answers[f.field_key] instanceof File) {
          fd.append(`file__${f.field_key}`, answers[f.field_key]);
        } else if (answers[f.field_key] !== undefined) {
          json[f.field_key] = answers[f.field_key];
        }
      });
      fd.append("answers", JSON.stringify(json));
      const r = await axios.post(`${API}registration/public/forms/${slug}/submit`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDone(r.data);
    } catch (e2) {
      alert(e2.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <div className="p-10 text-center text-rose-600">{error}</div>;
  if (!form) return <div className="p-10 text-center text-gray-500"><Loader2 className="animate-spin inline" size={20} /> Loading form…</div>;

  if (done) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <CheckCircle2 size={56} className="mx-auto text-emerald-500 mb-3" />
        <h1 className="text-2xl font-bold mb-1">Registration submitted!</h1>
        <p className="text-gray-600 text-sm">Your reference number is</p>
        <p className="font-mono font-bold text-lg text-emerald-700 mt-1">{done.registration_number}</p>
        <p className="text-xs text-gray-500 mt-3">Keep this number — you'll need it for any follow-up.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-2xl mx-auto p-6">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
        {form.description && <p className="text-sm text-gray-600 mt-2">{form.description}</p>}
      </motion.div>

      {(form.sections || []).map((s) => (
        <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h2 className="font-semibold text-emerald-700 mb-1">{s.title}</h2>
          {s.description && <p className="text-xs text-gray-500 mb-3">{s.description}</p>}
          <div className="space-y-3">
            {visibleFields.filter((f) => f.sectionId === s.id).map((f) => (
              <FieldRow key={f.id} field={f} value={answers[f.field_key]}
                onChange={(v) => setAnswers((a) => ({ ...a, [f.field_key]: v }))} />
            ))}
          </div>
        </div>
      ))}

      {visibleFields.filter((f) => !f.sectionId).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 space-y-3">
          {visibleFields.filter((f) => !f.sectionId).map((f) => (
            <FieldRow key={f.id} field={f} value={answers[f.field_key]}
              onChange={(v) => setAnswers((a) => ({ ...a, [f.field_key]: v }))} />
          ))}
        </div>
      )}

      <button type="submit" disabled={submitting}
        className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 shadow-md">
        {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
        {submitting ? "Submitting…" : "Submit registration"}
      </button>
    </form>
  );
};

const FieldRow = ({ field, value, onChange }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1">
      {field.label} {field.is_required && <span className="text-rose-500">*</span>}
    </label>
    <FieldRenderer field={field} value={value} onChange={onChange} />
    {field.help_text && <p className="text-[11px] text-gray-500 mt-0.5">{field.help_text}</p>}
  </div>
);

export default PublicRegister;
