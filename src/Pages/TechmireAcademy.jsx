import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, User, Lock, LogIn, UserCheck, Smartphone, ShieldCheck,
  Clock, GraduationCap, ChevronRight, Home, Info, Mail, Menu, X,
  Shield, UserPlus, Trash2, Mail as MailIcon, ToggleLeft, ToggleRight,
  FileText, ClipboardList, FileQuestion, Link2, MessageSquare, Calendar,
  CheckSquare, Megaphone, Folder, Plus, Edit2, ArrowLeft, Upload, Download,
} from "lucide-react";

// Moodle-style activity / resource types
const ACTIVITY_TYPES = [
  { key: "assignment", label: "Assignment",   icon: ClipboardList, group: "Assessment",        desc: "Tasks learners submit (text or file)." },
  { key: "quiz",       label: "Quiz",         icon: FileQuestion,  group: "Assessment",        desc: "Auto-graded questions." },
  { key: "feedback",   label: "Feedback",     icon: Megaphone,     group: "Assessment",        desc: "Collect responses from learners." },
  { key: "attendance", label: "Attendance",   icon: Calendar,      group: "Administration",    desc: "Track attendance per session." },
  { key: "page",       label: "Page",         icon: FileText,      group: "Resources",         desc: "A rich text page of content." },
  { key: "book",       label: "Book",         icon: BookOpen,      group: "Resources",         desc: "Multi-page reading material." },
  { key: "file",       label: "File",         icon: Folder,        group: "Resources",         desc: "Downloadable document." },
  { key: "url",        label: "URL",          icon: Link2,         group: "Resources",         desc: "Link to an external site." },
  { key: "forum",      label: "Forum",        icon: MessageSquare, group: "Collaboration",     desc: "Threaded discussion board." },
  { key: "choice",     label: "Choice",       icon: CheckSquare,   group: "Communication",     desc: "Single-question poll." },
  { key: "text",       label: "Text and media", icon: FileText,    group: "Interactive content", desc: "Inline note or media block." },
];

const ACTIVITY_BY_KEY = Object.fromEntries(ACTIVITY_TYPES.map((a) => [a.key, a]));
import { useAuthStore } from "../Store/authStore";

const API = import.meta.env.VITE_API_BASE_URL;

// ── Course catalog (mirrors edu.techmiresolutions.com) ──────────────────────
const CATEGORIES = [
  {
    id: "foundational",
    name: "Foundational Skills",
    color: "from-sky-500 to-blue-600",
    courses: [
      { title: "Computer & Internet Basics", duration: "Beginner", teacher: "TMS Faculty" },
      { title: "Technology Fundamentals", duration: "Beginner", teacher: "TMS Faculty" },
      { title: "Typing Mastery", duration: "3 months", teacher: "TMS Faculty" },
      { title: "MS Excel", duration: "Beginner → Advance", teacher: "TMS Faculty" },
      { title: "MS Word", duration: "Beginner → Advance", teacher: "TMS Faculty" },
      { title: "MS PowerPoint", duration: "Beginner → Advance", teacher: "TMS Faculty" },
      { title: "MS Office Suite", duration: "Complete pathway", teacher: "TMS Faculty" },
    ],
  },
  {
    id: "language",
    name: "Language & Communication",
    color: "from-emerald-500 to-teal-600",
    courses: [
      { title: "English Language Course", duration: "54 hours", teacher: "TMS Faculty" },
      { title: "General Aptitude Test (English)", duration: "Self-paced", teacher: "TMS Faculty" },
      { title: "General Aptitude Test (Urdu)", duration: "Self-paced", teacher: "TMS Faculty" },
      { title: "Sales Training & Networking", duration: "Progressive", teacher: "TMS Faculty" },
    ],
  },
  {
    id: "tech",
    name: "Technology & Development",
    color: "from-orange-500 to-red-600",
    courses: [
      { title: "Python Programming – Level 1", duration: "72 hours", teacher: "Syed Anum Zehra Rizvi" },
      { title: "HTML & CSS Fundamentals", duration: "Beginner", teacher: "TMS Faculty" },
      { title: "JavaScript Essentials", duration: "Intermediate", teacher: "TMS Faculty" },
      { title: "React.js", duration: "Intermediate", teacher: "TMS Faculty" },
      { title: "Full-Stack Development Pathway", duration: "Multi-level", teacher: "TMS Faculty" },
      { title: "DevOps Course", duration: "Advanced", teacher: "TMS Faculty" },
    ],
  },
  {
    id: "design",
    name: "Creative & Design",
    color: "from-pink-500 to-rose-600",
    courses: [
      { title: "Adobe Photoshop", duration: "Beginner → Advance", teacher: "TMS Faculty" },
      { title: "Adobe Illustrator", duration: "Beginner → Advance", teacher: "TMS Faculty" },
      { title: "Adobe InDesign", duration: "Beginner → Advance", teacher: "TMS Faculty" },
      { title: "Figma", duration: "66 hours", teacher: "TMS Faculty" },
      { title: "Canva Design Learning", duration: "60 hours", teacher: "TMS Faculty" },
      { title: "Blender – Beginner", duration: "Beginner", teacher: "TMS Faculty" },
      { title: "Blender – Advance", duration: "Advanced", teacher: "TMS Faculty" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing & Business",
    color: "from-purple-500 to-violet-600",
    courses: [
      { title: "Social Media Marketing – Level 1", duration: "18 hours", teacher: "TMS Faculty" },
      { title: "Social Media Marketing – Level 5", duration: "20 hours", teacher: "TMS Faculty" },
      { title: "Social Media Marketing – Level 11", duration: "23 hours", teacher: "TMS Faculty" },
      { title: "E-Commerce Pathway", duration: "27–63 hours", teacher: "TMS Faculty" },
      { title: "Sales Mastery – 3 Levels", duration: "Progressive", teacher: "TMS Faculty" },
      { title: "Digital Marketing in Social Media", duration: "Comprehensive", teacher: "TMS Faculty" },
    ],
  },
  {
    id: "ai",
    name: "Emerging Technologies",
    color: "from-amber-500 to-orange-600",
    courses: [
      { title: "ChatGPT", duration: "26 hours", teacher: "TMS Faculty" },
      { title: "Prompt Engineering", duration: "12–40 hours", teacher: "TMS Faculty" },
      { title: "AI Image Generation", duration: "32 hours", teacher: "TMS Faculty" },
      { title: "Machine Learning – Level 1", duration: "29 hours", teacher: "TMS Faculty" },
      { title: "Machine Learning – Level 6", duration: "48 hours", teacher: "TMS Faculty" },
    ],
  },
  {
    id: "cyber",
    name: "Cybersecurity",
    color: "from-slate-600 to-slate-800",
    courses: [
      { title: "Networking", duration: "22 hours", teacher: "TMS Faculty" },
      { title: "OS Internals", duration: "21 hours", teacher: "TMS Faculty" },
      { title: "Web & Scripting", duration: "24 hours", teacher: "TMS Faculty" },
      { title: "Security Essentials", duration: "19 hours", teacher: "TMS Faculty" },
      { title: "Exploitation", duration: "26 hours", teacher: "TMS Faculty" },
      { title: "Web Vulnerabilities", duration: "25 hours", teacher: "TMS Faculty" },
    ],
  },
  {
    id: "other",
    name: "Other Programs",
    color: "from-indigo-500 to-blue-700",
    courses: [
      { title: "WordPress – Level 1", duration: "29 hours", teacher: "TMS Faculty" },
      { title: "WordPress – Level 3", duration: "38 hours", teacher: "TMS Faculty" },
      { title: "Google Sheets", duration: "12–16 hours", teacher: "TMS Faculty" },
      { title: "Developer's Aptitude Test", duration: "Self-paced", teacher: "TMS Faculty" },
      { title: "Student Achievement Center", duration: "Resource Hub", teacher: "TMS Faculty" },
      { title: "Moodle Course", duration: "LMS Training", teacher: "TMS Faculty" },
    ],
  },
];

const TechmireAcademy = () => {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const isSuperAdmin = role?.toLowerCase() === "superadmin";
  const portalEmail = user?.email || "";

  // Super Admin lands on the catalog; everyone else must log in to the academy first.
  const [tab, setTab] = useState(isSuperAdmin ? "home" : "login");
  const [myEnrollment, setMyEnrollment] = useState(null); // { full_name, email, courses[] }
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseContents, setSelectedCourseContents] = useState([]);
  const [selectedCourseSettings, setSelectedCourseSettings] = useState(null);
  const [selectedCourseLoading, setSelectedCourseLoading] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loginMsg, setLoginMsg] = useState("");

  // Course content manager state
  const [contentCourse, setContentCourse] = useState(null);        // course title being edited
  const [contents, setContents] = useState([]);                     // list for that course
  const [pickerOpen, setPickerOpen] = useState(false);             // "Add activity or resource" modal
  const [pickerGroup, setPickerGroup] = useState("All");
  const [pickerSearch, setPickerSearch] = useState("");
  const [editingItem, setEditingItem] = useState(null);            // currently editing/new item form
  const [viewerItem, setViewerItem] = useState(null);              // learner-side activity viewer
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API}academy/course-contents/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditingItem((p) => p ? { ...p, file_name: res.data.file_name, file_url: res.data.file_url } : p);
    } catch (err) {
      setUploadError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fetchCourseContents = async (course) => {
    try {
      const res = await axios.get(`${API}academy/course-contents`, { params: { course } });
      setContents(res.data.contents || []);
    } catch (err) {
      console.error(err);
      setContents([]);
    }
  };

  const openCourseManager = (courseTitle) => {
    setContentCourse(courseTitle);
    fetchCourseContents(courseTitle);
  };

  const startNewActivity = (typeKey) => {
    const t = ACTIVITY_BY_KEY[typeKey];
    setEditingItem({
      id: null,
      course: contentCourse,
      section: "General",
      type: typeKey,
      title: "",
      description: "",
      body: "",
      url: "",
    });
    setPickerOpen(false);
  };

  const saveActivity = async () => {
    if (!editingItem?.title) return;
    try {
      let savedId = editingItem.id;
      if (savedId) {
        await axios.put(`${API}academy/course-contents/${savedId}`, editingItem);
      } else {
        const res = await axios.post(`${API}academy/course-contents`, editingItem);
        savedId = res.data?.content?.id;
      }
      // Auto-import MCQs when a PDF or TXT is attached to a quiz/assignment.
      const lowName = (editingItem.file_name || "").toLowerCase();
      const isImportable = lowName.endsWith(".pdf") || lowName.endsWith(".txt") || lowName.endsWith(".md");
      if (
        savedId &&
        isImportable &&
        editingItem.file_url &&
        ["quiz", "assignment"].includes(editingItem.type)
      ) {
        try {
          const imp = await axios.post(
            `${API}academy/quiz/${savedId}/import-uploaded-pdf`,
            { file_url: editingItem.file_url }
          );
          alert(`Saved. Imported ${imp.data.imported} MCQ(s) from the attached file.`);
        } catch (err) {
          const msg = err.response?.data?.message || err.message || "Unknown error";
          alert(
            `Saved, but MCQ auto-import failed:\n\n${msg}\n\n` +
            `Use "Manage MCQs / Import PDF" on the quiz page, then click "Paste MCQs" to add them manually.`
          );
        }
      }
      setEditingItem(null);
      await fetchCourseContents(contentCourse);
    } catch (err) {
      console.error(err);
    }
  };

  const removeActivity = async (id) => {
    if (!confirm("Delete this activity/resource?")) return;
    try {
      await axios.delete(`${API}academy/course-contents/${id}`);
      setContents((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Admin enrollment state
  const [enrollments, setEnrollments] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", courses: [] });
  const [formMsg, setFormMsg] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const fetchEnrollments = async () => {
    setAdminLoading(true);
    try {
      const res = await axios.get(`${API}academy/enrollments`);
      setEnrollments(res.data.enrollments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "admin" && isSuperAdmin) fetchEnrollments();
  }, [tab, isSuperAdmin]);

  const toggleFormCourse = (title) => {
    setForm((p) => {
      const list = [...p.courses];
      const i = list.indexOf(title);
      if (i === -1) list.push(title);
      else list.splice(i, 1);
      return { ...p, courses: list };
    });
  };

  const submitEnrollment = async (e) => {
    e.preventDefault();
    setFormMsg("");
    if (!form.full_name || !form.email || !form.password) {
      setFormMsg("Name, email and password are required.");
      return;
    }
    setFormSaving(true);
    try {
      await axios.post(`${API}academy/enrollments`, form);
      setForm({ full_name: "", email: "", password: "", courses: [] });
      setFormMsg("Enrolled successfully.");
      await fetchEnrollments();
    } catch (err) {
      const detail = err.response?.data?.message
        || err.response?.data?.error
        || (err.response?.status ? `Server returned ${err.response.status}` : null)
        || err.message
        || "Failed to enroll.";
      setFormMsg(detail);
    } finally {
      setFormSaving(false);
    }
  };

  const toggleStatus = async (row) => {
    const next = row.status === "active" ? "suspended" : "active";
    try {
      await axios.put(`${API}academy/enrollments/${row.id}`, { status: next });
      setEnrollments((prev) => prev.map((r) => r.id === row.id ? { ...r, status: next } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const removeEnrollment = async (row) => {
    if (!confirm(`Remove ${row.full_name}'s enrollment?`)) return;
    try {
      await axios.delete(`${API}academy/enrollments/${row.id}`);
      setEnrollments((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      console.error(err);
    }
  };

  const updateEnrollmentCourses = async (row, courses) => {
    try {
      await axios.put(`${API}academy/enrollments/${row.id}`, { courses });
      setEnrollments((prev) => prev.map((r) => r.id === row.id ? { ...r, courses } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const totalCourses = useMemo(
    () => CATEGORIES.reduce((n, c) => n + c.courses.length, 0),
    []
  );

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CATEGORIES
      .filter((c) => activeCategory === "all" || c.id === activeCategory)
      .map((cat) => ({
        ...cat,
        courses: cat.courses.filter((c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.teacher.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.courses.length > 0);
  }, [search, activeCategory]);

  // Pre-fill the username with the portal email for convenience.
  useEffect(() => {
    if (portalEmail && !username) setUsername(portalEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalEmail]);

  // Auto-resolve the academy enrollment for an already-signed-in TMS user.
  // Falls back to a virtual enrollment built from the TMS profile so the catalog is reachable
  // even when a Super Admin hasn't created an academy_enrollments row yet.
  useEffect(() => {
    if (isSuperAdmin) return;
    if (myEnrollment) return;
    if (!portalEmail) return;
    let cancel = false;
    (async () => {
      try {
        const res = await axios.get(`${API}academy/enrollments/me`, { params: { email: portalEmail } });
        if (cancel) return;
        const row = res.data.enrollment;
        if (row && row.status === "active") {
          setMyEnrollment(row);
          setTab("mycourses");
          return;
        }
      } catch {
        // 404 = no enrollment row yet — fall through to virtual enrollment.
      }
      if (cancel) return;
      setMyEnrollment({
        full_name: user?.full_name || user?.name || portalEmail,
        email: portalEmail,
        courses: [],
      });
      setTab("mycourses");
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalEmail, isSuperAdmin]);

  // When a course card opens, fetch its built content so the learner sees the outline.
  useEffect(() => {
    if (!selectedCourse) { setSelectedCourseContents([]); setSelectedCourseSettings(null); return; }
    let cancel = false;
    setSelectedCourseLoading(true);
    Promise.all([
      axios.get(`${API}academy/course-contents`, { params: { course: selectedCourse.title } })
        .then((res) => res.data.contents || [])
        .catch(() => []),
      axios.get(`${API}academy/course-settings`, { params: { course: selectedCourse.title } })
        .then((res) => res.data.settings || null)
        .catch(() => null),
    ])
      .then(([contents, settings]) => {
        if (cancel) return;
        setSelectedCourseContents(contents);
        setSelectedCourseSettings(settings);
      })
      .finally(() => { if (!cancel) setSelectedCourseLoading(false); });
    return () => { cancel = true; };
  }, [selectedCourse]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginMsg("Enter both username and password.");
      return;
    }
    setLoginMsg("Signing in…");
    try {
      const res = await axios.post(`${API}academy/enrollments/login`, {
        email: username,
        password,
      });
      setMyEnrollment(res.data.enrollment);
      setLoginMsg("");
      setTab("mycourses");
    } catch (err) {
      setLoginMsg(err.response?.data?.message || "Login failed.");
    }
  };

  // ── Sub-views ───────────────────────────────────────────────────────────
  const HomeView = (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,#f97316_0%,transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-medium border border-orange-500/30">
              Techmire Online Courses
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">
              Learn skills that <span className="text-orange-400">power careers</span>.
            </h2>
            <p className="mt-4 text-gray-300 text-base leading-relaxed max-w-lg">
              {totalCourses}+ professional courses across development, design,
              cybersecurity, AI, marketing, and more — all delivered through the
              Techmire Academy platform.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setTab("login")}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium text-sm shadow-lg shadow-orange-500/30 transition"
              >
                Sign in to learn
              </button>
              <button
                onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}
                className="px-5 py-2.5 border border-white/20 hover:bg-white/10 rounded-lg font-medium text-sm transition"
              >
                Browse catalog
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: GraduationCap, label: `${totalCourses}+ Courses`, sub: "Hands-on training" },
              { icon: ShieldCheck, label: "Secure Access", sub: "Encrypted credentials" },
              { icon: Smartphone, label: "Mobile App", sub: "iOS & Android" },
              { icon: BookOpen, label: "8 Categories", sub: "Dev, Design, AI…" },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <f.icon className="text-orange-400 mb-2" size={20} />
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-xs text-gray-400">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & category filter */}
      <section id="catalog" className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses or instructors…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeCategory === "all"
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All ({totalCourses})
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeCategory === c.id
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c.name} ({c.courses.length})
            </button>
          ))}
        </div>

        {/* Categories with courses */}
        {filteredCategories.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No courses match your search.</div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-1.5 h-8 rounded-full bg-gradient-to-b ${cat.color}`} />
                <h3 className="text-xl font-bold text-gray-800">{cat.name}</h3>
                <span className="text-xs text-gray-400">{cat.courses.length} courses</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.courses.map((course, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedCourse({ ...course, category: cat.name, color: cat.color })}
                    className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-orange-300 transition"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 shadow-sm`}>
                      <BookOpen className="text-white" size={18} />
                    </div>
                    <p className="font-semibold text-gray-800 text-sm leading-snug mb-2">
                      {course.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <Clock size={11} />
                      <span>{course.duration}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 truncate">{course.teacher}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );

  const AboutView = (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">About Techmire Academy</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Techmire Academy is the official learning platform of Techmire Solutions,
        delivering professional training in software development, design, marketing,
        cybersecurity, and emerging technologies. Our courses combine guided
        instruction, hands-on labs, and project-based assessments.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Courses", value: `${totalCourses}+` },
          { label: "Categories", value: CATEGORIES.length },
          { label: "Format", value: "Self-paced + Live" },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-3xl font-bold text-orange-500">{s.value}</p>
            <p className="text-sm text-gray-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mt-10 mb-3">Our mission</h3>
      <p className="text-gray-600 leading-relaxed">
        Empower learners with industry-relevant skills through a structured, accessible,
        and continuously updated online curriculum.
      </p>
    </section>
  );

  const ContactView = (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Contact us</h2>
      <p className="text-gray-500 mb-8">
        Questions about a course, enrollment, or your account? We're here to help.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs uppercase text-gray-500">Email</p>
            <p className="text-gray-800 font-medium">info@techmiresolutions.com</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs uppercase text-gray-500">Academy URL</p>
            <p className="text-gray-800 font-medium">edu.techmiresolutions.com</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs uppercase text-gray-500">Support hours</p>
            <p className="text-gray-800 font-medium">Mon–Fri · 9am – 6pm PKT</p>
          </div>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); alert("Message sent."); }}
          className="bg-white border border-gray-200 rounded-xl p-5 space-y-3"
        >
          <input required placeholder="Your name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
          <input required type="email" placeholder="Email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
          <textarea required rows="4" placeholder="How can we help?" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg">Send message</button>
        </form>
      </div>
    </section>
  );

  const LoginView = (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <BookOpen className="text-white" size={24} />
          </div>
          <h3 className="mt-4 text-2xl font-bold text-gray-800">Sign in to Academy</h3>
          <p className="text-sm text-gray-500">Access your courses and progress</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Username</label>
            <div className="mt-1 relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                placeholder="Your username"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Password</label>
            <div className="mt-1 relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                placeholder="Your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-orange-500" />
              Remember me
            </label>
            <button type="button" className="text-orange-500 hover:text-orange-600 font-medium">Lost password?</button>
          </div>

          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-orange-500/30 transition">
            <LogIn size={16} /> Log in
          </button>

          {loginMsg && (
            <p className="text-xs text-center text-gray-600 bg-orange-50 border border-orange-100 rounded-lg p-2">
              {loginMsg}
            </p>
          )}
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 h-px bg-gray-200" /> OR <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg transition">
          <UserCheck size={16} /> Continue as guest
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-5">
          Cookies must be enabled. By signing in you agree to Techmire Academy's
          data retention &amp; privacy policy.
        </p>
      </div>
    </section>
  );

  // Build "My Courses" view from the enrollment's assigned course titles,
  // hydrating each with the catalog metadata (duration, teacher, category).
  const myCoursesHydrated = useMemo(() => {
    if (!myEnrollment) return [];
    const titles = new Set(myEnrollment.courses || []);
    const out = [];
    CATEGORIES.forEach((cat) => {
      cat.courses.forEach((c) => {
        if (titles.has(c.title)) {
          out.push({ ...c, category: cat.name, color: cat.color });
        }
      });
    });
    return out;
  }, [myEnrollment]);

  const MyCoursesView = (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 mb-8 shadow-lg">
        <p className="text-sm opacity-90">Welcome back</p>
        <h2 className="text-2xl font-bold">{myEnrollment?.full_name}</h2>
        <p className="text-sm opacity-90 mt-1">{myEnrollment?.email}</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs">
          <GraduationCap size={14} />
          {myCoursesHydrated.length} course{myCoursesHydrated.length === 1 ? "" : "s"} enrolled by Super Admin
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4">My Courses</h3>

      {myCoursesHydrated.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <BookOpen className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-600 font-medium">No courses assigned yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            The Super Admin hasn't enrolled you in any courses. Please contact them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCoursesHydrated.map((course, idx) => (
            <motion.button
              key={idx}
              whileHover={{ y: -3 }}
              onClick={() => navigate(`/course/${encodeURIComponent(course.title)}`)}
              className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-orange-300 transition"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center mb-3 shadow-sm`}>
                <BookOpen className="text-white" size={20} />
              </div>
              <p className="text-[11px] uppercase text-gray-500">{course.category}</p>
              <p className="font-semibold text-gray-800 text-sm leading-snug mt-1 mb-3">
                {course.title}
              </p>
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><Clock size={11} /> {course.duration}</span>
                <span className="text-orange-500 font-medium flex items-center gap-1">
                  Start <ChevronRight size={12} />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => { setMyEnrollment(null); setTab("home"); }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to catalog
        </button>
      </div>
    </section>
  );

  const allCourseTitles = useMemo(
    () => CATEGORIES.flatMap((c) => c.courses.map((co) => ({ title: co.title, category: c.name }))),
    []
  );

  const CourseContentManager = (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <button
        onClick={() => { setContentCourse(null); setContents([]); }}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} /> Back to courses
      </button>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase text-gray-500">Editing course</p>
          <h2 className="text-2xl font-bold text-gray-800">{contentCourse}</h2>
          <p className="text-sm text-gray-500">{contents.length} activit{contents.length === 1 ? "y" : "ies"} / resources</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/course-settings/${encodeURIComponent(contentCourse)}`)}
            className="flex items-center gap-2 bg-white border border-orange-300 hover:bg-orange-50 text-orange-600 text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Edit2 size={14} /> Edit course settings
          </button>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg shadow-orange-500/30"
          >
            <Plus size={14} /> Add an activity or resource
          </button>
        </div>
      </div>

      {contents.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <BookOpen className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-600 font-medium">No content yet.</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add an activity or resource" to start building this course.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y">
          {contents.map((c) => {
            const A = ACTIVITY_BY_KEY[c.type] || ACTIVITY_BY_KEY.text;
            return (
              <div key={c.id} className="flex items-start gap-3 p-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                  <A.icon size={18} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-800">{c.title}</p>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">{A.label}</span>
                    {c.section && c.section !== "General" && (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">{c.section}</span>
                    )}
                  </div>
                  {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
                  {c.url && <p className="text-xs text-orange-500 mt-1 truncate">{c.url}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditingItem({ ...c })}
                    className="p-1.5 rounded text-gray-500 hover:bg-gray-100"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => removeActivity(c.id)}
                    className="p-1.5 rounded text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const courseManagerList = (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <BookOpen className="text-orange-500" size={18} /> Manage course content
      </h3>
      <p className="text-xs text-gray-500 mb-3">Pick a course to add activities (Assignment, Quiz, Page, File, URL, etc.) — learners enrolled in it will see what you build.</p>
      <div className="max-h-[60vh] overflow-y-auto space-y-1">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="mb-2">
            <p className="text-[10px] uppercase text-gray-400 px-1 mb-1">{cat.name}</p>
            {cat.courses.map((c) => (
              <button
                key={c.title}
                onClick={() => openCourseManager(c.title)}
                className="w-full text-left text-xs px-3 py-2 rounded hover:bg-orange-50 hover:text-orange-700 flex items-center justify-between"
              >
                <span className="truncate">{c.title}</span>
                <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const AdminView = contentCourse ? CourseContentManager : (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-orange-500" size={26} />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Academy Admin</h2>
          <p className="text-sm text-gray-500">Enroll learners, assign courses, and build course content.</p>
        </div>
      </div>

      <div className="mb-6">{courseManagerList}</div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Add person form */}
        <form
          onSubmit={submitEnrollment}
          className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 h-fit"
        >
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="text-orange-500" size={18} />
            <h3 className="font-semibold text-gray-800">Add a person</h3>
          </div>

          <label className="text-xs font-medium text-gray-600 uppercase">Full name</label>
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
            placeholder="e.g. Ali Ahmed"
            required
          />

          <label className="text-xs font-medium text-gray-600 uppercase">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
            placeholder="learner@example.com"
            required
          />

          <label className="text-xs font-medium text-gray-600 uppercase">Initial password</label>
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
            placeholder="Set or generate"
            required
          />

          <label className="text-xs font-medium text-gray-600 uppercase">Courses ({form.courses.length} selected)</label>
          <div className="mt-1 mb-4 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 bg-gray-50">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="mb-2">
                <p className="text-[10px] uppercase text-gray-400 px-1 mb-1">{cat.name}</p>
                {cat.courses.map((c) => {
                  const checked = form.courses.includes(c.title);
                  return (
                    <label
                      key={c.title}
                      className={`flex items-center gap-2 px-2 py-1 text-xs rounded cursor-pointer ${
                        checked ? "bg-orange-100 text-orange-800" : "hover:bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFormCourse(c.title)}
                        className="accent-orange-500"
                      />
                      <span className="truncate">{c.title}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={formSaving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <UserPlus size={14} />
            {formSaving ? "Enrolling…" : "Enroll person"}
          </button>
          {formMsg && (
            <p className="text-xs mt-2 text-center text-gray-600 bg-gray-50 border border-gray-100 rounded p-2">
              {formMsg}
            </p>
          )}
        </form>

        {/* Enrollment list */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              Enrolled learners <span className="text-xs text-gray-400 font-normal">({enrollments.length})</span>
            </h3>
            <button
              onClick={fetchEnrollments}
              className="text-xs text-orange-500 hover:text-orange-600"
            >
              Refresh
            </button>
          </div>

          {adminLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : enrollments.length === 0 ? (
            <p className="text-sm text-gray-500">No enrollments yet. Add a person from the form on the left.</p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {enrollments.map((row) => (
                <details key={row.id} className="border border-gray-200 rounded-lg p-3 group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 truncate">{row.full_name}</p>
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${
                          row.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {row.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MailIcon size={11} /> {row.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(row.courses || []).length} course{(row.courses || []).length === 1 ? "" : "s"} assigned
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.preventDefault(); toggleStatus(row); }}
                        className="p-1.5 rounded text-gray-500 hover:bg-gray-100"
                        title={row.status === "active" ? "Suspend" : "Activate"}
                      >
                        {row.status === "active" ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); removeEnrollment(row); }}
                        className="p-1.5 rounded text-red-500 hover:bg-red-50"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </summary>

                  {/* Course assignments editor */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[11px] uppercase text-gray-500 mb-2">Assigned courses</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                      {allCourseTitles.map((c) => {
                        const list = Array.isArray(row.courses) ? row.courses : [];
                        const checked = list.includes(c.title);
                        return (
                          <label
                            key={c.title}
                            className={`flex items-center gap-2 px-2 py-1 text-xs rounded cursor-pointer ${
                              checked ? "bg-orange-50 text-orange-800" : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? list.filter((x) => x !== c.title)
                                  : [...list, c.title];
                                updateEnrollmentCourses(row, next);
                              }}
                              className="accent-orange-500"
                            />
                            <span className="truncate">{c.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // Once authenticated (Super Admin OR a learner who completed academy login),
  // the full nav is available. Otherwise we only show the Log in entry.
  const authed = isSuperAdmin || !!myEnrollment;
  const NAV = authed
    ? [
        { id: myEnrollment ? "mycourses" : "home", label: myEnrollment ? "My Courses" : "Home", icon: Home },
        { id: "about", label: "About", icon: Info },
        { id: "contact", label: "Contact", icon: Mail },
        ...(isSuperAdmin ? [{ id: "admin", label: "Admin", icon: Shield }] : []),
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top brand bar */}
      <header className="sticky top-0 z-30 bg-[#0f172a]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => setTab("home")} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <BookOpen className="text-white" size={20} />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-base leading-tight">Techmire Academy</p>
              <p className="text-orange-400 text-[10px] uppercase tracking-wide">Online Courses</p>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  tab === n.id
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {n.label}
              </button>
            ))}
            {authed && !isSuperAdmin ? (
              <button
                onClick={() => { setMyEnrollment(null); setTab("login"); }}
                className="ml-2 px-4 py-1.5 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-800 text-white transition"
              >
                Sign out
              </button>
            ) : (
              !isSuperAdmin && (
                <button
                  onClick={() => setTab("login")}
                  className={`ml-2 px-4 py-1.5 text-sm font-medium rounded-lg transition ${
                    tab === "login"
                      ? "bg-orange-600 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  }`}
                >
                  Log in
                </button>
              )
            )}
          </nav>

          <button className="md:hidden text-white" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {mobileNav && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="md:hidden overflow-hidden border-t border-white/10"
            >
              <div className="px-6 py-3 space-y-1">
                {NAV.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { setTab(n.id); setMobileNav(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg ${
                      tab === n.id ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
                <button
                  onClick={() => { setTab("login"); setMobileNav(false); }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg bg-orange-500 text-white"
                >
                  Log in
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "home" && authed && HomeView}
          {tab === "about" && authed && AboutView}
          {tab === "contact" && authed && ContactView}
          {tab === "login" && LoginView}
          {tab === "admin" && isSuperAdmin && AdminView}
          {tab === "mycourses" && myEnrollment && MyCoursesView}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-gray-400 text-sm mt-10">
        <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <BookOpen className="text-white" size={16} />
              </div>
              <p className="text-white font-semibold">Techmire Academy</p>
            </div>
            <p className="text-xs">
              Online courses by Techmire Solutions. Build the skills that move you forward.
            </p>
          </div>
          <div>
            <p className="text-white font-semibold mb-2 text-xs uppercase">Explore</p>
            <ul className="space-y-1 text-xs">
              {CATEGORIES.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <button onClick={() => { setActiveCategory(c.id); setTab("home"); }} className="hover:text-orange-400">
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-2 text-xs uppercase">Support</p>
            <ul className="space-y-1 text-xs">
              <li><button onClick={() => setTab("about")} className="hover:text-orange-400">About</button></li>
              <li><button onClick={() => setTab("contact")} className="hover:text-orange-400">Contact</button></li>
              <li><button onClick={() => setTab("login")} className="hover:text-orange-400">Sign in</button></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-2 text-xs uppercase">Mobile app</p>
            <p className="text-xs">Available on iOS &amp; Android. Take your courses anywhere.</p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-[11px]">
          © {new Date().getFullYear()} Techmire Solutions · Powered by Techmire Academy
        </div>
      </footer>

      {/* "Add an activity or resource" picker modal (Super Admin) */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setPickerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Add an activity or resource</h3>
                <button onClick={() => setPickerOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>
              <div className="flex flex-1 overflow-hidden">
                <aside className="w-44 border-r border-gray-100 p-3 text-sm overflow-y-auto">
                  {["All", "Administration", "Assessment", "Collaboration", "Communication", "Resources", "Interactive content"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setPickerGroup(g)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg mb-1 ${
                        pickerGroup === g
                          ? "bg-orange-500 text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </aside>
                <div className="flex-1 p-4 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{pickerGroup}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ACTIVITY_TYPES
                      .filter((a) => pickerGroup === "All" || a.group === pickerGroup)
                      .filter((a) => !pickerSearch || a.label.toLowerCase().includes(pickerSearch.toLowerCase()))
                      .map((a) => (
                        <button
                          key={a.key}
                          onClick={() => startNewActivity(a.key)}
                          className="flex flex-col items-start gap-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition text-left"
                        >
                          <a.icon className="text-orange-500" size={20} />
                          <p className="text-sm font-medium text-gray-800">{a.label}</p>
                          <p className="text-[11px] text-gray-500 leading-snug">{a.desc}</p>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity edit form modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const A = ACTIVITY_BY_KEY[editingItem.type] || ACTIVITY_BY_KEY.text;
                  return (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                        <A.icon className="text-orange-500" size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{editingItem.id ? "Edit" : "New"} {A.label}</h3>
                        <p className="text-xs text-gray-500">{editingItem.course}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <label className="text-xs font-medium text-gray-600 uppercase">Title</label>
              <input
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                placeholder="e.g. Week 1 — Reading"
              />

              <label className="text-xs font-medium text-gray-600 uppercase">Section</label>
              <input
                value={editingItem.section}
                onChange={(e) => setEditingItem({ ...editingItem, section: e.target.value })}
                className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                placeholder="General"
              />

              <label className="text-xs font-medium text-gray-600 uppercase">Description</label>
              <textarea
                value={editingItem.description || ""}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                rows={2}
                className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                placeholder="Short summary shown in the course outline"
              />

              {editingItem.type === "url" && (
                <>
                  <label className="text-xs font-medium text-gray-600 uppercase">URL</label>
                  <input
                    value={editingItem.url || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                    className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                    placeholder="https://…"
                  />
                </>
              )}

              {editingItem.type === "file" && (
                <>
                  <label className="text-xs font-medium text-gray-600 uppercase">Upload file</label>
                  <div className="mt-1 mb-3">
                    {editingItem.file_url ? (
                      <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 flex items-center gap-3">
                        <Folder className="text-orange-500 flex-shrink-0" size={20} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{editingItem.file_name}</p>
                          <a
                            href={`${API.replace(/\/api\/?$/, "")}${editingItem.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-orange-600 hover:text-orange-700"
                          >
                            Preview
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, file_name: "", file_url: "" })}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 rounded-lg p-6 cursor-pointer transition">
                        <Upload className="text-gray-400" size={22} />
                        <p className="text-sm text-gray-600">
                          {uploading ? "Uploading…" : "Click or drag a file to upload"}
                        </p>
                        <p className="text-[11px] text-gray-400">Up to 50 MB</p>
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => handleFileUpload(e.target.files?.[0])}
                        />
                      </label>
                    )}
                    {uploadError && (
                      <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                    )}
                  </div>
                </>
              )}

              {["page", "book", "text", "assignment", "quiz", "forum", "feedback", "choice", "attendance"].includes(editingItem.type) && (
                <>
                  <label className="text-xs font-medium text-gray-600 uppercase">Content / instructions</label>
                  <textarea
                    value={editingItem.body || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, body: e.target.value })}
                    rows={6}
                    className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Lesson text, quiz questions, assignment brief, etc."
                  />

                  <label className="text-xs font-medium text-gray-600 uppercase">Attachment (optional)</label>
                  <div className="mt-1 mb-3">
                    {editingItem.file_url ? (
                      <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 flex items-center gap-3">
                        <Folder className="text-orange-500 flex-shrink-0" size={20} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{editingItem.file_name}</p>
                          <a
                            href={`${API.replace(/\/api\/?$/, "")}${editingItem.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-orange-600 hover:text-orange-700"
                          >
                            Preview
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, file_name: "", file_url: "" })}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 rounded-lg p-4 cursor-pointer transition">
                        <Upload className="text-gray-400" size={18} />
                        <p className="text-xs text-gray-600">
                          {uploading ? "Uploading…" : "Attach a file (brief, rubric, slides, etc.)"}
                        </p>
                        <p className="text-[10px] text-gray-400">Up to 50 MB</p>
                        <input
                          type="file"
                          accept=".pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => handleFileUpload(e.target.files?.[0])}
                        />
                      </label>
                    )}
                    {uploadError && (
                      <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                    )}
                    {editingItem.id &&
                      editingItem.file_url &&
                      (editingItem.file_name || "").toLowerCase().endsWith(".pdf") &&
                      ["assignment", "quiz"].includes(editingItem.type) && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await axios.post(
                                `${API}academy/quiz/${editingItem.id}/import-uploaded-pdf`,
                                { file_url: editingItem.file_url }
                              );
                              alert(`Imported ${res.data.imported} question(s) from the PDF.`);
                            } catch (err) {
                              alert(err.response?.data?.message || "Failed to import MCQs from PDF");
                            }
                          }}
                          className="mt-2 inline-flex items-center gap-2 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded"
                        >
                          Import MCQs from this PDF
                        </button>
                      )}
                  </div>
                </>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveActivity}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Learner-side activity viewer */}
      <AnimatePresence>
        {viewerItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setViewerItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              {(() => {
                const A = ACTIVITY_BY_KEY[viewerItem.type] || ACTIVITY_BY_KEY.text;
                return (
                  <>
                    <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                        <A.icon className="text-orange-500" size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] uppercase text-gray-500">{A.label}</p>
                        <h3 className="font-bold text-gray-800">{viewerItem.title}</h3>
                      </div>
                      <button onClick={() => setViewerItem(null)} className="text-gray-400 hover:text-gray-700">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="p-5 space-y-3">
                      {viewerItem.description && <p className="text-sm text-gray-700">{viewerItem.description}</p>}
                      {viewerItem.url && (
                        <a href={viewerItem.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600">
                          <Link2 size={14} /> Open link
                        </a>
                      )}
                      {viewerItem.file_url ? (
                        <a
                          href={`${API.replace(/\/api\/?$/, "")}${viewerItem.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
                        >
                          <Download size={14} /> Download {viewerItem.file_name || "file"}
                        </a>
                      ) : viewerItem.file_name && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Folder size={14} /> {viewerItem.file_name}
                        </p>
                      )}
                      {viewerItem.body && (
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {viewerItem.body}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course detail modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              {selectedCourseSettings?.image_url ? (
                <div className="h-40 bg-gray-100 overflow-hidden">
                  <img
                    src={`${(API || "").replace(/\/api\/?$/, "")}${selectedCourseSettings.image_url}`}
                    alt={selectedCourse.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`h-24 bg-gradient-to-br ${selectedCourse.color} flex items-end p-5`}>
                  <BookOpen className="text-white opacity-80" size={28} />
                </div>
              )}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <p className="text-xs uppercase text-gray-500">{selectedCourseSettings?.category || selectedCourse.category}</p>
                <h3 className="text-xl font-bold text-gray-800 mt-1">{selectedCourseSettings?.full_name || selectedCourse.title}</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-gray-500">Duration</p>
                    <p className="text-gray-800 font-medium">{selectedCourseSettings?.course_duration || selectedCourse.duration}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-gray-500">Instructor</p>
                    <p className="text-gray-800 font-medium">{selectedCourse.teacher}</p>
                  </div>
                </div>

                {selectedCourseSettings?.summary && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-1">About this course</h4>
                    <p className="text-xs text-gray-700 whitespace-pre-line bg-gray-50 border border-gray-100 rounded-lg p-3">
                      {selectedCourseSettings.summary}
                    </p>
                  </div>
                )}

                {(selectedCourseSettings?.start_date || selectedCourseSettings?.end_date_enabled) && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {selectedCourseSettings?.start_date && (
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                        <p className="text-gray-500">Start date</p>
                        <p className="text-gray-800 font-medium">{selectedCourseSettings.start_date}</p>
                      </div>
                    )}
                    {selectedCourseSettings?.end_date_enabled && selectedCourseSettings?.end_date && (
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                        <p className="text-gray-500">End date</p>
                        <p className="text-gray-800 font-medium">{selectedCourseSettings.end_date}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Course outline (activities/resources added by Super Admin) */}
                <div className="mt-5">
                  <h4 className="text-sm font-bold text-gray-800 mb-2">Course outline</h4>
                  {selectedCourseLoading ? (
                    <p className="text-xs text-gray-400">Loading…</p>
                  ) : selectedCourseContents.length === 0 ? (
                    <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3">
                      No content has been added to this course yet.
                    </p>
                  ) : (
                    (() => {
                      // group by section
                      const bySection = {};
                      selectedCourseContents.forEach((c) => {
                        const k = c.section || "General";
                        if (!bySection[k]) bySection[k] = [];
                        bySection[k].push(c);
                      });
                      return Object.entries(bySection).map(([section, items]) => (
                        <div key={section} className="mb-3">
                          <p className="text-[10px] uppercase text-gray-500 mb-1">{section}</p>
                          <div className="border border-gray-200 rounded-lg divide-y">
                            {items.map((c) => {
                              const A = ACTIVITY_BY_KEY[c.type] || ACTIVITY_BY_KEY.text;
                              return (
                                <button
                                  key={c.id}
                                  onClick={() => setViewerItem(c)}
                                  className="w-full flex items-center gap-3 text-left px-3 py-2 hover:bg-orange-50 transition"
                                >
                                  <A.icon size={16} className="text-orange-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                                    {c.description && <p className="text-[11px] text-gray-500 truncate">{c.description}</p>}
                                  </div>
                                  <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TechmireAcademy;
