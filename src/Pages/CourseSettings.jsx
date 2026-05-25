import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ChevronDown, ChevronRight, HelpCircle, Upload } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const splitDate = (iso) => {
  if (!iso) return { d: 1, m: 1, y: new Date().getFullYear() };
  const [y, m, d] = iso.split("-").map(Number);
  return { d: d || 1, m: m || 1, y: y || new Date().getFullYear() };
};
const joinDate = ({ d, m, y }) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-3"
      >
        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-100 text-orange-600">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        {title}
      </button>
      {open && <div className="pl-1 space-y-4">{children}</div>}
    </div>
  );
};

const Row = ({ label, required, hint, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2 md:gap-4 items-start">
    <label className="text-sm font-medium text-gray-700 pt-2 flex items-center gap-1">
      <span>{label}</span>
      {required && <span className="inline-flex w-4 h-4 rounded-full bg-red-500 text-white text-[10px] items-center justify-center">!</span>}
      {hint && <HelpCircle size={14} className="text-teal-600" title={hint} />}
    </label>
    <div className="min-w-0">{children}</div>
  </div>
);

const Input = (props) => (
  <input {...props} className={`w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${props.className || ""}`} />
);
const Select = ({ children, ...rest }) => (
  <select {...rest} className={`border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 ${rest.className || ""}`}>
    {children}
  </select>
);

const YesNo = ({ value, onChange }) => (
  <Select value={value ? "Yes" : "No"} onChange={(e) => onChange(e.target.value === "Yes")}>
    <option>Yes</option>
    <option>No</option>
  </Select>
);

const DatePicker = ({ value, onChange, disabled }) => {
  const { d, m, y } = splitDate(value);
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 5 + i);
  const set = (patch) => onChange(joinDate({ d, m, y, ...patch }));
  return (
    <div className={`flex flex-wrap gap-2 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <Select value={d} onChange={(e) => set({ d: +e.target.value })}>
        {Array.from({ length: 31 }, (_, i) => <option key={i+1}>{i + 1}</option>)}
      </Select>
      <Select value={MONTHS[m - 1]} onChange={(e) => set({ m: MONTHS.indexOf(e.target.value) + 1 })}>
        {MONTHS.map((mm) => <option key={mm}>{mm}</option>)}
      </Select>
      <Select value={y} onChange={(e) => set({ y: +e.target.value })}>
        {years.map((yy) => <option key={yy}>{yy}</option>)}
      </Select>
    </div>
  );
};

const defaultSettings = (course) => ({
  course,
  full_name: course || "",
  short_name: course ? course.toLowerCase().replace(/\s+/g, "-").slice(0, 24) : "",
  category: "",
  visibility: "Show",
  start_date: joinDate({ d: new Date().getDate(), m: new Date().getMonth() + 1, y: new Date().getFullYear() }),
  end_date: joinDate({ d: new Date().getDate(), m: new Date().getMonth() + 1, y: new Date().getFullYear() + 1 }),
  end_date_enabled: false,
  course_id_number: "",
  summary: "",
  image_url: "",
  format: "Custom sections",
  hidden_sections: "Hide completely",
  course_layout: "Show all sections on one page",
  force_language: "Do not force",
  num_announcements: 5,
  show_gradebook: true,
  show_activity_reports: false,
  show_activity_dates: true,
  max_upload_size: "Site upload limit (1 GB)",
  completion_enabled: true,
  show_completion_conditions: true,
  group_mode: "No groups",
  force_group_mode: false,
  default_grouping: "None",
  tags: [],
  course_duration: "",
});

const CourseSettings = () => {
  const { course } = useParams();
  const courseTitle = useMemo(() => decodeURIComponent(course || ""), [course]);
  const navigate = useNavigate();

  const [form, setForm] = useState(() => defaultSettings(courseTitle));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const update = (patch) => setForm((p) => ({ ...p, ...patch }));

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await axios.get(`${API}academy/course-settings`, { params: { course: courseTitle } });
        if (!cancel && res.data?.settings) {
          setForm({ ...defaultSettings(courseTitle), ...res.data.settings });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [courseTitle]);

  const handleImage = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axios.post(`${API}academy/course-settings/upload-image`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      update({ image_url: res.data.image_url });
    } catch (e) {
      alert("Image upload failed");
    }
  };

  const save = async (andDisplay = false) => {
    setSaving(true);
    try {
      await axios.put(`${API}academy/course-settings`, { ...form, course: courseTitle });
      if (andDisplay) {
        navigate(`/techmire-academy`);
      } else {
        navigate(-1);
      }
    } catch (e) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!(form.tags || []).includes(t)) update({ tags: [...(form.tags || []), t] });
    setTagInput("");
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="border-t-2 border-orange-500 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Edit course settings</h1>
          <button className="text-sm text-orange-600 hover:underline">Collapse all</button>
        </div>

        {/* General */}
        <Section title="General">
          <Row label="Course full name" required>
            <Input value={form.full_name} onChange={(e) => update({ full_name: e.target.value })} />
          </Row>
          <Row label="Course short name" required>
            <Input value={form.short_name} onChange={(e) => update({ short_name: e.target.value })} />
          </Row>
          <Row label="Course category" required>
            {form.category && (
              <div className="border-2 border-orange-300 rounded px-3 py-2 mb-2 text-sm text-gray-700 bg-white flex items-center justify-between">
                <span>{form.category}</span>
                <button
                  type="button"
                  onClick={() => update({ category: "" })}
                  className="text-gray-400 hover:text-gray-700"
                >×</button>
              </div>
            )}
            <Input
              placeholder="Search or enter a category"
              value={form.category}
              onChange={(e) => update({ category: e.target.value })}
            />
          </Row>
          <Row label="Course visibility">
            <Select value={form.visibility} onChange={(e) => update({ visibility: e.target.value })}>
              <option>Show</option>
              <option>Hide</option>
            </Select>
          </Row>
          <Row label="Course start date">
            <DatePicker value={form.start_date} onChange={(v) => update({ start_date: v })} />
          </Row>
          <Row label="Course end date">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.end_date_enabled}
                  onChange={(e) => update({ end_date_enabled: e.target.checked })}
                />
                Enable
              </label>
              <DatePicker
                value={form.end_date}
                onChange={(v) => update({ end_date: v })}
                disabled={!form.end_date_enabled}
              />
            </div>
          </Row>
          <Row label="Course ID number">
            <Input value={form.course_id_number} onChange={(e) => update({ course_id_number: e.target.value })} />
          </Row>
        </Section>

        {/* Description */}
        <Section title="Description">
          <Row label="Course summary">
            <textarea
              rows={8}
              value={form.summary}
              onChange={(e) => update({ summary: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </Row>
          <Row label="Course image">
            <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center bg-white">
              {form.image_url ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={form.image_url} alt="course" className="max-h-48 rounded" />
                  <button
                    type="button"
                    onClick={() => update({ image_url: "" })}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <Upload className="text-gray-400" />
                  <span className="text-sm text-gray-600">You can drag and drop files here to add them.</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImage(e.target.files?.[0])}
                  />
                  <span className="text-xs text-orange-600 underline">Choose file</span>
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Accepted file types: .gif .jpe .jpeg .jpg .png .svg .svgz .webp
            </p>
          </Row>
        </Section>

        {/* Course format */}
        <Section title="Course format">
          <Row label="Format">
            <Select value={form.format} onChange={(e) => update({ format: e.target.value })}>
              <option>Custom sections</option>
              <option>Weekly sections</option>
              <option>Topics</option>
              <option>Single activity</option>
            </Select>
          </Row>
          <Row label="Hidden sections">
            <Select value={form.hidden_sections} onChange={(e) => update({ hidden_sections: e.target.value })}>
              <option>Hide completely</option>
              <option>Show as collapsed</option>
            </Select>
          </Row>
          <Row label="Course layout">
            <Select value={form.course_layout} onChange={(e) => update({ course_layout: e.target.value })}>
              <option>Show all sections on one page</option>
              <option>Show one section per page</option>
            </Select>
          </Row>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <Row label="Force language">
            <Select value={form.force_language} onChange={(e) => update({ force_language: e.target.value })}>
              <option>Do not force</option>
              <option>English</option>
              <option>Urdu</option>
            </Select>
          </Row>
          <Row label="Number of announcements">
            <Select
              value={form.num_announcements}
              onChange={(e) => update({ num_announcements: +e.target.value })}
            >
              {Array.from({ length: 11 }, (_, i) => <option key={i}>{i}</option>)}
            </Select>
          </Row>
          <Row label="Show gradebook to students">
            <YesNo value={form.show_gradebook} onChange={(v) => update({ show_gradebook: v })} />
          </Row>
          <Row label="Show activity reports">
            <YesNo value={form.show_activity_reports} onChange={(v) => update({ show_activity_reports: v })} />
          </Row>
          <Row label="Show activity dates">
            <YesNo value={form.show_activity_dates} onChange={(v) => update({ show_activity_dates: v })} />
          </Row>
        </Section>

        {/* Files and uploads */}
        <Section title="Files and uploads">
          <Row label="Maximum upload size">
            <Select value={form.max_upload_size} onChange={(e) => update({ max_upload_size: e.target.value })}>
              <option>Site upload limit (1 GB)</option>
              <option>500 MB</option>
              <option>100 MB</option>
              <option>50 MB</option>
              <option>10 MB</option>
            </Select>
          </Row>
        </Section>

        {/* Completion tracking */}
        <Section title="Completion tracking">
          <Row label="Enable completion tracking">
            <YesNo value={form.completion_enabled} onChange={(v) => update({ completion_enabled: v })} />
          </Row>
          <Row label="Show activity completion conditions">
            <YesNo value={form.show_completion_conditions} onChange={(v) => update({ show_completion_conditions: v })} />
          </Row>
        </Section>

        {/* Groups */}
        <Section title="Groups">
          <Row label="Group mode">
            <Select value={form.group_mode} onChange={(e) => update({ group_mode: e.target.value })}>
              <option>No groups</option>
              <option>Separate groups</option>
              <option>Visible groups</option>
            </Select>
          </Row>
          <Row label="Force group mode">
            <YesNo value={form.force_group_mode} onChange={(v) => update({ force_group_mode: v })} />
          </Row>
          <Row label="Default grouping">
            <Select value={form.default_grouping} onChange={(e) => update({ default_grouping: e.target.value })}>
              <option>None</option>
            </Select>
          </Row>
        </Section>

        {/* Tags */}
        <Section title="Tags">
          <Row label="Tags">
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.tags || []).map((t) => (
                <span key={t} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                  {t}
                  <button
                    type="button"
                    onClick={() => update({ tags: form.tags.filter((x) => x !== t) })}
                    className="ml-1 text-orange-500 hover:text-orange-700"
                  >×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter tags…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded"
              >Add</button>
            </div>
          </Row>
        </Section>

        {/* Other fields */}
        <Section title="Other fields">
          <Row label="Course Duration">
            <Input value={form.course_duration} onChange={(e) => update({ course_duration: e.target.value })} />
          </Row>
        </Section>

        {/* Action bar */}
        <div className="flex flex-wrap gap-3 mt-6 sticky bottom-0 bg-white py-4 border-t border-gray-200">
          <button
            disabled={saving}
            onClick={() => save(false)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded disabled:opacity-50"
          >
            Save and return
          </button>
          <button
            disabled={saving}
            onClick={() => save(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded disabled:opacity-50"
          >
            Save and display
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseSettings;
