import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ChevronDown, ChevronRight, Link2, FileText, Folder, BookOpen,
  ClipboardList, FileQuestion, MessageSquare, CheckSquare, Megaphone,
  Calendar, ArrowLeft, X, Download, Upload, CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "../Store/authStore";

const API = import.meta.env.VITE_API_BASE_URL;
const ASSET_BASE = (API || "").replace(/\/api\/?$/, "");

const ICONS = {
  assignment: ClipboardList,
  quiz:       FileQuestion,
  feedback:   Megaphone,
  attendance: Calendar,
  page:       FileText,
  book:       BookOpen,
  file:       Folder,
  url:        Link2,
  forum:      MessageSquare,
  choice:     CheckSquare,
  text:       FileText,
};

const BASE_TABS = ["Course", "Participants", "Grades", "Activities", "More"];

const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/;
const VIMEO_RE   = /vimeo\.com\/(\d+)/;

const embedUrl = (url) => {
  if (!url) return null;
  const yt = url.match(YOUTUBE_RE);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const v = url.match(VIMEO_RE);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
};

const SectionBlock = ({ name, items, defaultOpen = true, onOpenItem, isSuperAdmin }) => {
  const [open, setOpen] = useState(defaultOpen);

  // Split items into "link rows" and embeddable videos so we mirror Moodle layout
  // (rows on top, embedded video previews below).
  const videos = items.filter((it) => it.type === "url" && embedUrl(it.url));
  const rows   = items;

  return (
    <div className="border border-gray-200 rounded-lg bg-white mb-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left border-b border-gray-100"
      >
        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-100 text-orange-600">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <h3 className="text-base font-semibold text-gray-800 flex-1">{name}</h3>
      </button>

      {open && (
        <div>
          <ul>
            {rows.map((it) => {
              const Icon = ICONS[it.type] || FileText;
              const isPureUrl = it.type === "url" && it.url && !it.body && !it.description;
              const isPureFile = it.type === "file" && it.file_url && !it.body && !it.description;
              const directHref = isPureUrl
                ? it.url
                : isPureFile
                ? `${ASSET_BASE}${it.file_url}`
                : null;
              const commonClass = "w-full text-left flex items-center gap-3 px-5 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition";
              return (
                <li key={it.id} className="border-b border-gray-100 last:border-b-0">
                  {it.type === "quiz" ? (
                    <div className="flex items-center gap-2 px-5 py-2.5">
                      <button
                        type="button"
                        onClick={() => onOpenItem({ ...it, __quiz: true })}
                        className="flex-1 flex items-center gap-3 text-left text-sm text-orange-600 hover:text-orange-700 min-w-0"
                      >
                        <Icon size={16} className="flex-shrink-0" />
                        <span className="truncate">{it.title}</span>
                      </button>
                      {!isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => onOpenItem({ ...it, __attempt: true })}
                          className="flex-shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded"
                        >
                          Attempt quiz
                        </button>
                      )}
                    </div>
                  ) : directHref ? (
                    <a href={directHref} target="_blank" rel="noreferrer" className={commonClass}>
                      <Icon size={16} className="flex-shrink-0" />
                      <span className="flex-1 truncate">{it.title}</span>
                    </a>
                  ) : (
                    <button type="button" onClick={() => onOpenItem(it)} className={commonClass}>
                      <Icon size={16} className="flex-shrink-0" />
                      <span className="flex-1 truncate">{it.title}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {videos.length > 0 && (
            <div className="px-5 py-4 space-y-4 border-t border-gray-100">
              {videos.map((v) => (
                <div key={`v-${v.id}`} className="rounded overflow-hidden border border-gray-200">
                  <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                    <iframe
                      src={embedUrl(v.url)}
                      title={v.title}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CourseView = () => {
  const { course } = useParams();
  const courseTitle = useMemo(() => decodeURIComponent(course || ""), [course]);
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const isSuperAdmin = role?.toLowerCase() === "superadmin";
  const tabs = useMemo(
    () => (isSuperAdmin ? ["Course", "Settings", ...BASE_TABS.slice(1)] : BASE_TABS),
    [isSuperAdmin]
  );

  const [tab, setTab] = useState("Course");
  const [contents, setContents] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerItem, setViewerItem] = useState(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    Promise.all([
      axios.get(`${API}academy/course-contents`, { params: { course: courseTitle } })
        .then((r) => r.data.contents || []).catch(() => []),
      axios.get(`${API}academy/course-settings`, { params: { course: courseTitle } })
        .then((r) => r.data.settings || null).catch(() => null),
    ]).then(([c, s]) => {
      if (cancel) return;
      setContents(c);
      setSettings(s);
    }).finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [courseTitle]);

  // Group by section, preserving order of first appearance.
  const sections = useMemo(() => {
    const order = [];
    const map = {};
    contents.forEach((c) => {
      const k = c.section || "General";
      if (!map[k]) { map[k] = []; order.push(k); }
      map[k].push(c);
    });
    if (order.length === 0) order.push("General");
    if (!map["General"]) map["General"] = [];
    return order.map((name) => ({ name, items: map[name] }));
  }, [contents]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {settings?.full_name || courseTitle}
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 flex flex-wrap gap-1 text-sm">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => {
              if (t === "Settings") navigate(`/course-settings/${encodeURIComponent(courseTitle)}`);
              else setTab(t);
            }}
            className={`px-4 py-2 border-b-2 -mb-px transition ${
              tab === t
                ? "border-orange-500 text-gray-900 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {settings?.image_url && (
        <div className="rounded-lg overflow-hidden mb-6 border border-gray-200">
          <img
            src={`${ASSET_BASE}${settings.image_url}`}
            alt={courseTitle}
            className="w-full max-h-64 object-cover"
          />
        </div>
      )}

      {settings?.summary && (
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6 text-sm text-gray-800 whitespace-pre-line">
          {settings.summary}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : tab === "Course" ? (
        <>
          {sections.map((s) => (
            <SectionBlock
              key={s.name}
              name={s.name}
              items={s.items}
              isSuperAdmin={isSuperAdmin}
              onOpenItem={(it) => {
                if (it.__attempt) {
                  navigate(`/quiz/${it.id}/attempt`);
                } else if (it.__quiz) {
                  navigate(`/quiz/${it.id}`);
                } else {
                  setViewerItem(it);
                }
              }}
            />
          ))}
          {contents.length === 0 && (
            <p className="text-sm text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center">
              No content has been added to this course yet.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500">This tab is not available yet.</p>
      )}

      {viewerItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setViewerItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                {(() => {
                  const Icon = ICONS[viewerItem.type] || FileText;
                  return <Icon size={20} className="text-orange-500 flex-shrink-0" />;
                })()}
                <div className="min-w-0">
                  <p className="text-[11px] uppercase text-gray-500">{viewerItem.type}</p>
                  <h3 className="text-base font-bold text-gray-800 truncate">{viewerItem.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setViewerItem(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {viewerItem.description && (
                <p className="text-sm text-gray-700">{viewerItem.description}</p>
              )}

              {viewerItem.body && (
                <div className="text-sm text-gray-800 whitespace-pre-line bg-gray-50 border border-gray-100 rounded-lg p-4">
                  {viewerItem.body}
                </div>
              )}

              {viewerItem.url && (
                <a
                  href={viewerItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 underline break-all"
                >
                  <Link2 size={14} /> {viewerItem.url}
                </a>
              )}

              {viewerItem.file_url && viewerItem.type !== "assignment" && (() => {
                const href = `${ASSET_BASE}${viewerItem.file_url}`;
                return (
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm bg-white border border-orange-300 hover:bg-orange-50 text-orange-600 px-3 py-2 rounded-lg"
                    >
                      Preview
                    </a>
                    <a
                      href={href}
                      download={viewerItem.file_name || true}
                      className="inline-flex items-center gap-2 text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg"
                    >
                      <Download size={14} /> {viewerItem.file_name || "Download attachment"}
                    </a>
                  </div>
                );
              })()}

              {viewerItem.type === "assignment" && (
                isSuperAdmin ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/quiz/${viewerItem.id}`)}
                      className="inline-flex items-center gap-2 text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                    >
                      Manage MCQs / Import PDF
                    </button>
                    <button
                      onClick={() => navigate(`/quiz/${viewerItem.id}/attempt`)}
                      className="inline-flex items-center gap-2 text-sm bg-white border border-orange-300 hover:bg-orange-50 text-orange-600 px-4 py-2 rounded-lg"
                    >
                      Preview attempt
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(`/quiz/${viewerItem.id}/attempt`)}
                    className="inline-flex items-center gap-2 text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                  >
                    Attempt quiz
                  </button>
                )
              )}

              {!viewerItem.description && !viewerItem.body && !viewerItem.url && !viewerItem.file_url && (
                <p className="text-sm text-gray-500 italic">No additional details for this item.</p>
              )}

            </div>

            <div className="px-5 py-3 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setViewerItem(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const AssignmentSubmission = ({ contentId }) => {
  const { user, role } = useAuthStore();
  const isSuperAdmin = role?.toLowerCase() === "superadmin";
  const email = user?.email || "";
  const [mine, setMine] = useState(null);
  const [allSubs, setAllSubs] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    try {
      if (isSuperAdmin) {
        const res = await axios.get(`${API}academy/assignments/${contentId}/submissions`);
        setAllSubs(res.data.submissions || []);
      } else if (email) {
        const res = await axios.get(`${API}academy/assignments/${contentId}/submissions`, { params: { email } });
        const m = (res.data.submissions || [])[0] || null;
        setMine(m);
        if (m) setText(m.text || "");
      }
    } catch {}
    setLoaded(true);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [contentId, email]);

  const uploadFile = async (f) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await axios.post(`${API}academy/course-contents/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile({ file_name: res.data.file_name, file_url: res.data.file_url });
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!email) { alert("Please sign in."); return; }
    if (!text.trim() && !file && !mine?.file_url) {
      alert("Add some text or attach a file before submitting.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}academy/assignments/${contentId}/submissions`, {
        student_email: email,
        student_name: user?.full_name || user?.name || "",
        text: text || null,
        file_name: file?.file_name || mine?.file_name || null,
        file_url:  file?.file_url  || mine?.file_url  || null,
      });
      setFile(null);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  if (isSuperAdmin) {
    return (
      <div className="mt-2 border-t border-gray-200 pt-4">
        <p className="text-sm font-semibold text-gray-800 mb-2">Submissions ({allSubs.length})</p>
        {allSubs.length === 0 ? (
          <p className="text-xs text-gray-500">No submissions yet.</p>
        ) : (
          <div className="space-y-2">
            {allSubs.map((s) => (
              <div key={s.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-medium text-gray-800">{s.student_name || s.student_email}</p>
                  <span className="text-[11px] text-gray-500">{new Date(s.submitted_at).toLocaleString()}</span>
                </div>
                {s.text && <p className="mt-1 text-gray-700 whitespace-pre-line">{s.text}</p>}
                {s.file_url && (
                  <a
                    href={`${ASSET_BASE}${s.file_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-orange-600 hover:underline text-xs"
                  >
                    <Download size={12} /> {s.file_name || "Download"}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 border-t border-gray-200 pt-4">
      <p className="text-sm font-semibold text-gray-800 mb-2">Your submission</p>

      {mine && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-sm">
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <CheckCircle2 size={14} /> Submitted on {new Date(mine.submitted_at).toLocaleString()}
          </div>
          {mine.text && <p className="mt-1 text-gray-700 whitespace-pre-line">{mine.text}</p>}
          {mine.file_url && (
            <a
              href={`${ASSET_BASE}${mine.file_url}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-orange-600 hover:underline text-xs"
            >
              <Download size={12} /> {mine.file_name || "Download"}
            </a>
          )}
          {mine.grade && <p className="mt-2 text-sm"><strong>Grade:</strong> {mine.grade}</p>}
          {mine.feedback && <p className="mt-1 text-sm text-gray-700"><strong>Feedback:</strong> {mine.feedback}</p>}
        </div>
      )}

      <label className="text-xs font-medium text-gray-600 uppercase">Online text</label>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your response here…"
        className="w-full mt-1 mb-3 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      <label className="text-xs font-medium text-gray-600 uppercase">File submission</label>
      <div className="mt-1 mb-3">
        {file ? (
          <div className="flex items-center justify-between border border-orange-200 bg-orange-50 rounded-lg p-2 text-sm">
            <span className="truncate">{file.file_name}</span>
            <button onClick={() => setFile(null)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
          </div>
        ) : (
          <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 rounded-lg p-3 cursor-pointer text-sm text-gray-600">
            <Upload size={14} />
            {uploading ? "Uploading…" : "Attach a file (optional)"}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
            />
          </label>
        )}
      </div>

      <button
        onClick={submit}
        disabled={saving || uploading}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg disabled:opacity-50"
      >
        {saving ? "Submitting…" : mine ? "Update submission" : "Submit assignment"}
      </button>
    </div>
  );
};

export default CourseView;
