import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ClipboardList, Plus, Trash2, Save, Edit2, Upload } from "lucide-react";
import { useAuthStore } from "../Store/authStore";

const API = import.meta.env.VITE_API_BASE_URL;

const TABS_ADMIN   = ["Quiz", "Settings", "Questions", "Results"];
const TABS_STUDENT = ["Quiz", "Results"];

const QuizPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const isSuperAdmin = role?.toLowerCase() === "superadmin";
  const studentEmail = user?.email || "";
  const tabs = isSuperAdmin ? TABS_ADMIN : TABS_STUDENT;

  const [tab, setTab] = useState("Quiz");
  const [content, setContent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { id?, question_text, options[], correct_index }
  const [confirmStart, setConfirmStart] = useState(false);
  const [reviewAttempt, setReviewAttempt] = useState(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteSaving, setPasteSaving] = useState(false);

  const finishedAttempts = useMemo(
    () => attempts.filter((a) => a.status === "finished"),
    [attempts]
  );

  const load = async () => {
    setLoading(true);
    try {
      // Pull the quiz row from the bulk contents endpoint (no single-row GET exists).
      const allContents = await axios.get(`${API}academy/course-contents`);
      const found = (allContents.data.contents || []).find((c) => String(c.id) === String(contentId));
      setContent(found || null);

      const qRes = await axios.get(`${API}academy/quiz/${contentId}/questions`, {
        params: { reveal: 1 },
      });
      setQuestions(qRes.data.questions || []);

      if (studentEmail || isSuperAdmin) {
        const aRes = await axios.get(`${API}academy/quiz/${contentId}/attempts`, {
          params: isSuperAdmin ? {} : { email: studentEmail },
        });
        setAttempts(aRes.data.attempts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [contentId]);

  const startAttempt = async () => {
    if (!studentEmail) {
      alert("Please sign in to attempt this quiz.");
      return;
    }
    try {
      await axios.post(`${API}academy/quiz/${contentId}/attempts/start`, { email: studentEmail });
      navigate(`/quiz/${contentId}/attempt`);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to start attempt");
    }
  };

  const saveContentConfig = async (patch) => {
    try {
      const res = await axios.put(`${API}academy/course-contents/${contentId}`, patch);
      setContent(res.data.content);
    } catch (e) {
      alert("Failed to save settings");
    }
  };

  const blankQuestion = () => ({
    question_text: "",
    options: ["", "", "", ""],
    correct_index: 0,
  });

  const saveQuestion = async () => {
    if (!editing.question_text.trim() || editing.options.filter((o) => o.trim()).length < 2) {
      alert("Provide question text and at least 2 options.");
      return;
    }
    try {
      if (editing.id) {
        await axios.put(`${API}academy/quiz/questions/${editing.id}`, editing);
      } else {
        await axios.post(`${API}academy/quiz/${contentId}/questions`, {
          ...editing,
          sort_order: questions.length,
        });
      }
      setEditing(null);
      await load();
    } catch (e) {
      alert("Failed to save question");
    }
  };

  const importText = async () => {
    if (!pasteText.trim()) { alert("Paste the MCQ text first."); return; }
    setPasteSaving(true);
    try {
      const res = await axios.post(`${API}academy/quiz/${contentId}/import-text`, { text: pasteText });
      alert(`Imported ${res.data.imported} question(s).`);
      setPasteOpen(false);
      setPasteText("");
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to import text");
    } finally {
      setPasteSaving(false);
    }
  };

  const importPdf = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axios.post(`${API}academy/quiz/${contentId}/import-pdf`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`Imported ${res.data.imported} question(s). Review and mark correct answers.`);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to import PDF");
    }
  };

  const removeQuestion = async (id) => {
    if (!confirm("Delete this question?")) return;
    try {
      await axios.delete(`${API}academy/quiz/questions/${id}`);
      await load();
    } catch (e) {
      alert("Failed to delete");
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!content) return <div className="p-8 text-gray-500">Quiz not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="text-sm text-orange-600 mb-2">
        {content.course} / {content.section || "General"} / {content.title}
      </div>
      <div className="flex items-center gap-3 mb-2">
        <ClipboardList className="text-pink-500" />
        <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
      </div>

      <div className="border-b border-gray-200 mb-6 flex flex-wrap gap-1 text-sm">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 border-b-2 -mb-px transition ${
              tab === t ? "border-orange-500 text-gray-900 font-medium" : "border-transparent text-orange-600 hover:text-orange-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Quiz" && (
        <QuizIntro
          content={content}
          questions={questions}
          attempts={attempts}
          isSuperAdmin={isSuperAdmin}
          onStart={() => setConfirmStart(true)}
          onReview={(a) => setReviewAttempt(a)}
        />
      )}

      {tab === "Settings" && isSuperAdmin && (
        <QuizSettings content={content} onSave={saveContentConfig} />
      )}

      {tab === "Questions" && isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-gray-600">{questions.length} question{questions.length === 1 ? "" : "s"} in this quiz</p>
            <div className="flex items-center gap-2">
              {questions.length > 0 && (
                <button
                  onClick={() => setConfirmStart(true)}
                  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg"
                >
                  Preview quiz
                </button>
              )}
              <button
                onClick={() => setEditing(blankQuestion())}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-orange-300 hover:bg-orange-50 text-orange-600 text-sm rounded-lg"
              >
                <Plus size={14} /> Add question
              </button>
              <label className="flex items-center gap-2 px-3 py-2 bg-white border border-orange-300 hover:bg-orange-50 text-orange-600 text-sm rounded-lg cursor-pointer">
                <Upload size={14} /> Import from PDF
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    importPdf(f);
                  }}
                />
              </label>
              <button
                onClick={() => setPasteOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-orange-300 hover:bg-orange-50 text-orange-600 text-sm rounded-lg"
              >
                Paste MCQs
              </button>
            </div>
          </div>

          {questions.length === 0 ? (
            <p className="text-sm text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center">
              No questions yet. Click "Add question" to build the quiz.
            </p>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-medium text-gray-800">Q{idx + 1}. {q.question_text}</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setEditing({ ...q })} className="text-gray-500 hover:text-orange-600"><Edit2 size={14} /></button>
                      <button onClick={() => removeQuestion(q.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <ul className="text-sm space-y-1">
                    {(q.options || []).map((opt, i) => (
                      <li key={i} className={i === q.correct_index ? "text-green-700 font-medium" : "text-gray-700"}>
                        {String.fromCharCode(97 + i)}. {opt} {i === q.correct_index && "✓"}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "Results" && (
        <ResultsView attempts={attempts} totalQuestions={questions.length} isAdmin={isSuperAdmin} />
      )}

      {editing && (
        <QuestionEditor
          editing={editing}
          setEditing={setEditing}
          onSave={saveQuestion}
          onCancel={() => setEditing(null)}
        />
      )}

      {confirmStart && (
        <ConfirmStart
          content={content}
          questionCount={questions.length}
          finishedCount={finishedAttempts.length}
          onCancel={() => setConfirmStart(false)}
          onConfirm={() => { setConfirmStart(false); startAttempt(); }}
        />
      )}

      {reviewAttempt && (
        <ReviewAttempt
          attempt={reviewAttempt}
          questions={questions}
          content={content}
          onClose={() => setReviewAttempt(null)}
          canSeeAnswers={isSuperAdmin}
        />
      )}

      {pasteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPasteOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800">Paste MCQs</h3>
              <p className="text-xs text-gray-500 mt-1">
                Paste questions in this format. Add "Answer: B" lines to mark correct options (optional — defaults to A).
              </p>
            </div>
            <div className="px-5 py-4">
              <textarea
                rows={14}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`1. Which component is the brain of the computer?\nA) CPU\nB) RAM\nC) HDD\nD) Motherboard\nAnswer: A\n\n2. What does RAM stand for?\nA) Random Access Memory\nB) Read Always Memory\nC) Run Action Memory\nD) Rapid Allocation Module\nAnswer: A`}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setPasteOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg">Cancel</button>
              <button onClick={importText} disabled={pasteSaving} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg disabled:opacity-50">
                {pasteSaving ? "Importing…" : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuizIntro = ({ content, questions, attempts, isSuperAdmin, onStart, onReview }) => {
  const finished = attempts.filter((a) => a.status === "finished");
  const best = finished.reduce((acc, a) => {
    const pct = a.total ? (a.score / a.total) * 100 : 0;
    return pct > acc ? pct : acc;
  }, 0);
  const attemptsAllowed = content.attempts_allowed || 2;
  const canAttempt = finished.length < attemptsAllowed;
  const label = finished.length === 0 ? (isSuperAdmin ? "Preview quiz" : "Attempt quiz now") : "Re-attempt quiz";

  return (
    <div className="space-y-4">
      {content.body && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-line">
          {content.body}
        </div>
      )}

      <div className="text-sm text-gray-700 space-y-1">
        <p><strong>Attempts allowed:</strong> {attemptsAllowed || "Unlimited"}</p>
        <p><strong>Time limit:</strong> {content.time_limit_minutes ? `${content.time_limit_minutes} mins` : "No limit"}</p>
        <p><strong>Grading method:</strong> {content.grading_method || "Highest grade"}</p>
        <p><strong>Negative marking:</strong> −{content.negative_marks || 0.25} per wrong answer</p>
        <p><strong>Questions:</strong> {questions.length}</p>
      </div>

      {finished.length > 0 && !isSuperAdmin && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <p className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-50 border-b border-gray-200">
            Summary of your previous attempts
          </p>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-4 py-2">Attempt</th>
                <th className="text-left px-4 py-2">State</th>
                <th className="text-left px-4 py-2">Marks</th>
                <th className="text-left px-4 py-2">Grade</th>
                <th className="text-left px-4 py-2">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {finished.map((a, idx) => {
                const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2 text-green-700">Finished<br/>
                      <span className="text-[11px] text-gray-500">{new Date(a.finished_at).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-2">{a.score} / {a.total}</td>
                    <td className="px-4 py-2">{pct}%</td>
                    <td className="px-4 py-2">
                      <button onClick={() => onReview(a)} className="text-orange-600 hover:underline">Review</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-gray-600 border-t border-gray-200 bg-gray-50">
            Highest grade: <strong>{Math.round(best)}%</strong>
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 pt-2">
        {canAttempt ? (
          <button
            onClick={onStart}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg"
          >
            {label}
          </button>
        ) : (
          <p className="text-sm text-red-600">No more attempts allowed.</p>
        )}
        {attemptsAllowed > 0 && !isSuperAdmin && (
          <p className="text-xs text-gray-500">
            {Math.max(0, attemptsAllowed - finished.length)} attempt{attemptsAllowed - finished.length === 1 ? "" : "s"} remaining
          </p>
        )}
      </div>
    </div>
  );
};

const ConfirmStart = ({ content, questionCount, finishedCount, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-800">Start attempt?</h3>
      </div>
      <div className="px-5 py-4 text-sm text-gray-700 space-y-2">
        <p>You are about to start a new attempt at <strong>{content.title}</strong>.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{questionCount} question{questionCount === 1 ? "" : "s"}</li>
          {content.time_limit_minutes ? (
            <li>The attempt has a time limit of <strong>{content.time_limit_minutes} minutes</strong>. Once you start, the timer will count down and cannot be paused.</li>
          ) : (
            <li>No time limit.</li>
          )}
          {content.attempts_allowed > 0 && (
            <li>This is attempt {finishedCount + 1} of {content.attempts_allowed}.</li>
          )}
          <li>You must finish the attempt before submitting your answers.</li>
        </ul>
      </div>
      <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg">Start attempt</button>
      </div>
    </div>
  </div>
);

const ReviewAttempt = ({ attempt, questions, content, onClose, canSeeAnswers }) => {
  // Need correct_index for review — questions list will only include it if admin pulled with reveal=1.
  // For students, we still show their picks and mark right/wrong based on whether server stored score.
  const answers = attempt.answers || {};
  const negativeMarks = Number(content?.negative_marks) || 0.25;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  questions.forEach((q) => {
    const chosen = answers[q.id];
    if (chosen == null) unansweredCount += 1;
    else if (Number(chosen) === Number(q.correct_index)) correctCount += 1;
    else wrongCount += 1;
  });
  const penalty = wrongCount * negativeMarks;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="px-5 py-4 border-b border-gray-200 sticky top-0 bg-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Review attempt</h3>
            <p className="text-xs text-gray-500">
              Finished {new Date(attempt.finished_at).toLocaleString()} — Score {attempt.score} / {attempt.total}
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              <span className="text-green-700">Correct: {correctCount}</span>
              {" · "}
              <span className="text-red-600">Wrong: {wrongCount}</span>
              {" · "}
              <span className="text-gray-500">Unanswered: {unansweredCount}</span>
            </p>
            <p className="text-[11px] text-red-600 mt-0.5">
              Negative marking: −{negativeMarks} per wrong answer · Penalty applied: −{penalty.toFixed(2)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {questions.map((q, idx) => {
            const chosen = answers[q.id];
            const hasCorrect = q.correct_index !== undefined;
            const isCorrect = hasCorrect && Number(chosen) === Number(q.correct_index);
            return (
              <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-800 mb-2">Q{idx + 1}. {q.question_text}</p>
                <ul className="space-y-1 text-sm">
                  {(q.options || []).map((opt, i) => {
                    const isChosen = Number(chosen) === i;
                    const isCorrectOpt = hasCorrect && Number(q.correct_index) === i;
                    let cls = "text-gray-700";
                    if (isCorrectOpt) cls = "text-green-700 font-medium";
                    else if (isChosen && !isCorrectOpt) cls = "text-red-600";
                    return (
                      <li key={i} className={cls}>
                        {String.fromCharCode(97 + i)}. {opt}
                        {isChosen && <span className="ml-2 text-[11px]">(your answer)</span>}
                        {isCorrectOpt && canSeeAnswers && <span className="ml-2 text-[11px]">✓ correct</span>}
                      </li>
                    );
                  })}
                </ul>
                {hasCorrect && (
                  <p className={`mt-2 text-xs ${isCorrect ? "text-green-700" : "text-red-600"}`}>
                    {isCorrect
                      ? "Correct (+1)"
                      : chosen == null
                      ? "Not answered (0)"
                      : `Incorrect (−${negativeMarks})`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 sticky bottom-0 bg-white flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
};

const QuizSettings = ({ content, onSave }) => {
  const [form, setForm] = useState({
    time_limit_minutes: content.time_limit_minutes || 0,
    attempts_allowed: content.attempts_allowed || 0,
    grading_method: content.grading_method || "Highest grade",
    time_per_question_seconds: content.time_per_question_seconds || 0,
    negative_marks: content.negative_marks || 0,
    body: content.body || "",
  });
  return (
    <div className="space-y-4 bg-white border border-gray-200 rounded-lg p-5">
      <div>
        <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Instructions</label>
        <textarea
          rows={5}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Time limit (minutes)</label>
          <input
            type="number"
            min="0"
            value={form.time_limit_minutes}
            onChange={(e) => setForm({ ...form, time_limit_minutes: +e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">0 = no limit</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Attempts allowed</label>
          <input
            type="number"
            min="0"
            value={form.attempts_allowed}
            onChange={(e) => setForm({ ...form, attempts_allowed: +e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">0 = unlimited</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Grading method</label>
          <select
            value={form.grading_method}
            onChange={(e) => setForm({ ...form, grading_method: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
          >
            <option>Highest grade</option>
            <option>Average grade</option>
            <option>First attempt</option>
            <option>Last attempt</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Time per question (seconds)</label>
          <input
            type="number"
            min="0"
            value={form.time_per_question_seconds}
            onChange={(e) => setForm({ ...form, time_per_question_seconds: +e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">0 = no per-question limit</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Negative marks (per wrong answer)</label>
          <input
            type="number"
            min="0"
            step="0.25"
            value={form.negative_marks}
            onChange={(e) => setForm({ ...form, negative_marks: +e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">0 = no negative marking</p>
        </div>
      </div>
      <button
        onClick={() => onSave(form)}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg flex items-center gap-2"
      >
        <Save size={14} /> Save settings
      </button>
    </div>
  );
};

const QuestionEditor = ({ editing, setEditing, onSave, onCancel }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-800">{editing.id ? "Edit" : "New"} question</h3>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase block mb-1">Question</label>
          <textarea
            rows={3}
            value={editing.question_text}
            onChange={(e) => setEditing({ ...editing, question_text: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase block mb-2">Options (select the correct one)</label>
          <div className="space-y-2">
            {editing.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={editing.correct_index === i}
                  onChange={() => setEditing({ ...editing, correct_index: i })}
                />
                <input
                  value={opt}
                  onChange={(e) => {
                    const opts = [...editing.options];
                    opts[i] = e.target.value;
                    setEditing({ ...editing, options: opts });
                  }}
                  placeholder={`Option ${String.fromCharCode(97 + i)}`}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                />
                {editing.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      const opts = editing.options.filter((_, idx) => idx !== i);
                      setEditing({
                        ...editing,
                        options: opts,
                        correct_index: Math.min(editing.correct_index, opts.length - 1),
                      });
                    }}
                    className="text-red-500 hover:text-red-700"
                  ><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          </div>
          {editing.options.length < 6 && (
            <button
              type="button"
              onClick={() => setEditing({ ...editing, options: [...editing.options, ""] })}
              className="text-xs text-orange-600 mt-2 hover:underline"
            >
              + Add option
            </button>
          )}
        </div>
      </div>
      <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg">Cancel</button>
        <button onClick={onSave} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg">Save</button>
      </div>
    </div>
  </div>
);

const ResultsView = ({ attempts, totalQuestions, isAdmin }) => {
  if (attempts.length === 0) {
    return <p className="text-sm text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center">No attempts yet.</p>;
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {isAdmin && <th className="text-left px-4 py-2">Student</th>}
            <th className="text-left px-4 py-2">Started</th>
            <th className="text-left px-4 py-2">Finished</th>
            <th className="text-left px-4 py-2">Score</th>
            <th className="text-left px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {attempts.map((a) => (
            <tr key={a.id}>
              {isAdmin && <td className="px-4 py-2 text-gray-700">{a.student_email}</td>}
              <td className="px-4 py-2 text-gray-600">{a.started_at ? new Date(a.started_at).toLocaleString() : "—"}</td>
              <td className="px-4 py-2 text-gray-600">{a.finished_at ? new Date(a.finished_at).toLocaleString() : "—"}</td>
              <td className="px-4 py-2 text-gray-800 font-medium">
                {a.status === "finished" ? `${a.score} / ${a.total ?? totalQuestions}` : "—"}
              </td>
              <td className="px-4 py-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  a.status === "finished" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                }`}>{a.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuizPage;
