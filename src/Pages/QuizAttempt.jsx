import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Flag, ClipboardList, Edit2 } from "lucide-react";
import { useAuthStore } from "../Store/authStore";

const API = import.meta.env.VITE_API_BASE_URL;
const TABS_ADMIN   = ["Quiz", "Settings", "Questions", "Results", "Question bank", "More"];
const TABS_STUDENT = ["Quiz", "Results"];

const QuizAttempt = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const isSuperAdmin = role?.toLowerCase() === "superadmin";
  const studentEmail = user?.email || "";
  const tabs = isSuperAdmin ? TABS_ADMIN : TABS_STUDENT;

  const [content, setContent] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null); // seconds, or null when no limit
  const [hideTimer, setHideTimer] = useState(false);
  const [perQTotal, setPerQTotal] = useState(0); // seconds per question (0 = disabled)
  const [perQLeft, setPerQLeft] = useState(0);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [lockedQs, setLockedQs] = useState({}); // qid -> true once time expired
  const submittedRef = useRef(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (!studentEmail) {
          alert("You need to be signed in with an email to attempt this quiz.");
          navigate(-1);
          return;
        }

        // pull content for breadcrumb header
        const allContents = await axios.get(`${API}academy/course-contents`);
        const found = (allContents.data.contents || []).find((c) => String(c.id) === String(contentId));
        if (!cancel) setContent(found || null);
        if (!found) {
          alert("This quiz no longer exists.");
          navigate(-1);
          return;
        }

        const res = await axios.post(`${API}academy/quiz/${contentId}/attempts/start`, { email: studentEmail });
        if (cancel) return;
        setAttempt(res.data.attempt);
        setQuestions(res.data.questions || []);
        setAnswers(res.data.attempt.answers || {});
        setPerQTotal(Number(res.data.attempt.time_per_question_seconds) || 30);
        setNegativeMarks(Number(res.data.attempt.negative_marks) || 0.25);
        if (res.data.attempt.time_limit_minutes) {
          const started = new Date(res.data.attempt.started_at).getTime();
          const limitMs = res.data.attempt.time_limit_minutes * 60 * 1000;
          const remaining = Math.max(0, Math.floor((started + limitMs - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      } catch (e) {
        const msg = e?.response?.data?.message
          || (e?.response?.status ? `Server returned ${e.response.status}` : null)
          || e?.message
          || "Failed to start attempt";
        alert(msg);
        navigate(-1);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [contentId, studentEmail, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      submit(true);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => (t == null ? t : t - 1)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [timeLeft]);

  // Per-question countdown: reset whenever the active question changes
  useEffect(() => {
    if (!perQTotal || questions.length === 0) return;
    const qid = questions[currentIdx]?.id;
    if (qid != null && lockedQs[qid]) {
      setPerQLeft(0);
      return;
    }
    setPerQLeft(perQTotal);
  }, [currentIdx, perQTotal, questions, lockedQs]);

  useEffect(() => {
    if (!perQTotal) return;
    if (perQLeft <= 0) {
      const qid = questions[currentIdx]?.id;
      if (qid != null && !lockedQs[qid]) {
        setLockedQs((m) => ({ ...m, [qid]: true }));
        if (currentIdx < questions.length - 1) {
          setCurrentIdx((i) => i + 1);
        }
      }
      return;
    }
    const id = setInterval(() => setPerQLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [perQLeft, perQTotal, currentIdx, questions, lockedQs]);

  const formattedTime = useMemo(() => {
    if (timeLeft == null) return null;
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [timeLeft]);

  const saveProgress = async (next) => {
    if (!attempt) return;
    try {
      await axios.put(`${API}academy/quiz/attempts/${attempt.id}`, { answers: next });
    } catch {}
  };

  const chooseAnswer = (qid, optIdx) => {
    if (lockedQs[qid]) return;
    const next = { ...answers, [qid]: optIdx };
    setAnswers(next);
    saveProgress(next);
  };

  const submit = async (auto = false) => {
    if (submittedRef.current) return;
    if (!auto && !confirm("Submit your attempt? You will not be able to change your answers.")) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await axios.put(`${API}academy/quiz/attempts/${attempt.id}`, { answers, finish: true });
      navigate(`/quiz/${contentId}`);
    } catch (e) {
      alert("Failed to submit");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (questions.length === 0) {
    return <NoQuestionsTaskView content={content} contentId={contentId} studentEmail={studentEmail} user={user} isSuperAdmin={isSuperAdmin} onBack={() => navigate(-1)} />;
  }

  const currentQ = questions[currentIdx];

  const startNewPreview = async () => {
    try {
      await axios.put(`${API}academy/quiz/attempts/${attempt.id}`, { answers: {}, finish: true });
    } catch {}
    submittedRef.current = false;
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Breadcrumb */}
      <div className="text-sm text-orange-600 mb-2">
        {content?.course && <span>{content.course} / </span>}
        {content?.section && content.section !== "General" && <span>{content.section} / </span>}
        {content?.title && <span>{content.title} / </span>}
        <span className="text-gray-600">{isSuperAdmin ? "Preview" : "Attempt"}</span>
      </div>

      {/* Title with icon */}
      <div className="flex items-center gap-3 mb-2">
        <ClipboardList className="text-pink-500" />
        <h1 className="text-2xl font-bold text-gray-900">{content?.title || "Quiz"}</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 flex flex-wrap gap-1 text-sm">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => navigate(`/quiz/${contentId}`)}
            className={`px-4 py-2 border-b-2 -mb-px transition ${
              t === "Quiz"
                ? "border-orange-500 text-gray-900 font-medium"
                : "border-transparent text-orange-600 hover:text-orange-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(`/quiz/${contentId}`)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm rounded">
          Back
        </button>
        {formattedTime != null && (
          <div className="flex items-center gap-2">
            {!hideTimer && (
              <div className="border border-orange-300 text-orange-700 px-3 py-1.5 rounded text-sm font-medium">
                Time left {formattedTime}
              </div>
            )}
            <button
              onClick={() => setHideTimer((h) => !h)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm rounded"
            >
              {hideTimer ? "Show" : "Hide"}
            </button>
          </div>
        )}
      </div>

<div className="grid grid-cols-1 md:grid-cols-[200px_1fr_220px] gap-4">
        {/* Left status card */}
        <div className="bg-white border border-gray-200 rounded p-3 h-fit">
          <p className="font-bold text-gray-800">Question <span className="text-lg">{currentIdx + 1}</span></p>
          <p className="text-xs text-gray-500 mt-1">
            {answers[currentQ.id] != null ? "Answered" : "Not yet answered"}
          </p>
          <button
            type="button"
            className="mt-3 flex items-center gap-1 text-xs text-orange-600 hover:underline"
          >
            <Flag size={12} /> Flag question
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => navigate(`/quiz/${contentId}`)}
              className="mt-2 flex items-center gap-1 text-xs text-orange-600 hover:underline"
            >
              <Edit2 size={12} /> Edit question
            </button>
          )}
          {isSuperAdmin && (
            <div className="mt-3 inline-block bg-orange-500 text-white text-[11px] px-2 py-1 rounded">
              v1 (latest)
            </div>
          )}
        </div>

        {/* Middle question */}
        <div className="bg-cyan-50 border border-cyan-100 rounded p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-gray-800 flex-1">{currentQ.question_text}</p>
            {perQTotal > 0 && (
              <span className={`text-xs font-semibold px-2 py-1 rounded shrink-0 ${
                lockedQs[currentQ.id]
                  ? "bg-red-100 text-red-700"
                  : perQLeft <= 5
                  ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
              }`}>
                {lockedQs[currentQ.id] ? "Time up" : `${perQLeft}s left`}
              </span>
            )}
          </div>
          {negativeMarks > 0 && (
            <p className="text-[11px] text-red-600 mb-3">
              Negative marking: −{negativeMarks} mark{negativeMarks === 1 ? "" : "s"} per wrong answer.
            </p>
          )}
          <div className="space-y-2">
            {(currentQ.options || []).map((opt, i) => (
              <label key={i} className={`flex items-start gap-2 text-sm text-gray-800 ${lockedQs[currentQ.id] ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
                <input
                  type="radio"
                  name={`q-${currentQ.id}`}
                  checked={answers[currentQ.id] === i}
                  disabled={!!lockedQs[currentQ.id]}
                  onChange={() => chooseAnswer(currentQ.id, i)}
                  className="mt-1"
                />
                <span><span className="font-medium mr-2">{String.fromCharCode(97 + i)}.</span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Right navigation grid */}
        <div className="bg-white border border-gray-200 rounded p-4 h-fit">
          <p className="font-semibold text-gray-800 mb-3">Quiz navigation</p>
          <div className="grid grid-cols-5 gap-1">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`w-9 h-9 text-xs border ${
                  i === currentIdx
                    ? "border-gray-900 font-bold"
                    : answers[q.id] != null
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-300"
                } hover:bg-gray-100`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => submit(false)}
            disabled={submitting}
            className="mt-4 text-sm text-orange-600 hover:underline block"
          >
            Finish attempt …
          </button>
          {isSuperAdmin && (
            <button
              onClick={startNewPreview}
              className="mt-2 w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm rounded border border-gray-300"
            >
              Start a new preview
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded disabled:opacity-50"
        >
          Previous page
        </button>
        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded"
          >
            Next page
          </button>
        ) : (
          <button
            onClick={() => submit(false)}
            disabled={submitting}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded"
          >
            {submitting ? "Submitting…" : "Submit attempt"}
          </button>
        )}
      </div>
    </div>
  );
};

const NoQuestionsTaskView = ({ content, contentId, studentEmail, user, isSuperAdmin, onBack }) => {
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    (async () => {
      if (!studentEmail) return;
      try {
        const r = await axios.get(`${API}academy/assignments/${contentId}/submissions`, { params: { email: studentEmail } });
        const m = (r.data.submissions || [])[0];
        if (m) {
          setSubmitted(m);
          setText(m.text || "");
          if (m.file_url && /^https?:\/\//i.test(m.file_url)) setLinkUrl(m.file_url);
        }
      } catch {}
    })();
  }, [contentId, studentEmail]);

  const onPickFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
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
    if (!studentEmail) { alert("Please sign in."); return; }
    if (!text.trim() && !file && !linkUrl.trim()) {
      alert("Add a text answer, attach a file, or paste a link before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}academy/assignments/${contentId}/submissions`, {
        student_email: studentEmail,
        student_name: user?.full_name || user?.name || "",
        text: text || null,
        file_name: file?.file_name || (linkUrl.trim() ? "External link" : null),
        file_url:  file?.file_url  || (linkUrl.trim() || null),
      });
      alert("Submitted!");
      onBack();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{content?.title || "Task"}</h2>
        {content?.description && (
          <p className="text-sm text-gray-600 mb-3">{content.description}</p>
        )}
        {content?.body && (
          <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-800 whitespace-pre-line mb-4">
            {content.body}
          </div>
        )}
        {!content?.body && !content?.description && (
          <p className="text-sm text-gray-500 mb-4">
            {isSuperAdmin
              ? "No MCQs added yet. Students can still submit work for this task below."
              : "Your instructor hasn't published questions yet. You can submit your work below."}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase block mb-1">Your answer (optional)</label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Type your answer here…"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase block mb-1">Upload file</label>
            <input type="file" onChange={onPickFile} className="text-sm" />
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
            {file && <p className="text-xs text-green-700 mt-1">Attached: {file.file_name}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase block mb-1">Or paste a link</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="https://drive.google.com/… or https://github.com/…"
            />
          </div>

          {submitted && (
            <p className="text-xs text-gray-500">
              Last submission: {new Date(submitted.updatedAt || submitted.createdAt).toLocaleString()}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={submit}
              disabled={submitting || uploading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm rounded-lg"
            >
              {submitting ? "Submitting…" : submitted ? "Update submission" : "Submit"}
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;
