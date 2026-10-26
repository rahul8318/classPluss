import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentsApi } from '../../api/assessments';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function TakeAssessmentPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1800);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    assessmentsApi.startAttempt(assessmentId)
      .then((res) => {
        if (res?.data) {
          setAttemptId(res.data.attemptId);
          setQuestions(res.data.questions || []);
          const mins = res.data.durationMinutes || 30;
          setDurationMinutes(mins);
          setTimeLeftSeconds(mins * 60);
        }
      })
      .catch((err) => {
        alert(err.message || 'Could not start assessment attempt.');
        navigate('/courses');
      })
      .finally(() => setLoading(false));
  }, [assessmentId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!result && timeLeftSeconds > 0) {
      const timer = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [result, timeLeftSeconds]);

  const handleSelectOption = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        selectedOptionId: optionId,
        textAnswer: optionId,
      },
    }));
  };

  const handleTextAnswer = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        textAnswer: text,
      },
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting || result) return;

    setSubmitting(true);
    try {
      const formattedAnswers = Object.values(answers);
      const res = await assessmentsApi.submitAttempt(attemptId, formattedAnswers);
      if (res?.data) {
        setResult(res.data);
      }
    } catch (err) {
      alert(err.message || 'Error submitting attempt');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Preparing quiz attempt..." />;
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Quiz Top bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between sticky top-20 z-30">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-brand-600" />
          <span className="text-sm font-bold text-slate-800">
            {result ? 'Assessment Summary' : 'Live Assessment Attempt'}
          </span>
        </div>

        {!result && (
          <div className="flex items-center space-x-2 bg-indigo-50 border border-brand-200 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-brand-700">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Time Left: {formatTime(timeLeftSeconds)}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {result ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-inner">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Quiz Completed!</h2>
            <p className="text-xs text-slate-500 mt-1">Automatic objective evaluation results</p>
          </div>

          <div className="max-w-xs mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-500 font-semibold">
              <span>Score Earned:</span>
              <span className="text-slate-900 font-bold">{result.score} / {result.totalPossibleScore}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-semibold">
              <span>Percentage:</span>
              <span className="text-brand-600 font-bold">{result.percentage}%</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-semibold">
              <span>Status:</span>
              <Badge variant="success">{result.status?.toUpperCase()}</Badge>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20"
            >
              Return to Course Space
            </button>
          </div>
        </div>
      ) : (
        /* Questions Answering Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, idx) => {
            const currentSelected = answers[q._id]?.selectedOptionId;
            return (
              <div
                key={q._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-brand-600 uppercase tracking-wider">
                    Question {idx + 1} of {questions.length}
                  </span>
                  <Badge variant="neutral">{q.points || 1} Point</Badge>
                </div>

                <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.text}</p>

                {/* Question Options */}
                {q.questionType === 'mcq' || q.questionType === 'true_false' ? (
                  <div className="space-y-2.5 pt-2">
                    {q.options?.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center space-x-3 p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          currentSelected === opt.id
                            ? 'border-brand-600 bg-brand-50/60 text-brand-900 ring-2 ring-brand-500/20'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q._id}`}
                          checked={currentSelected === opt.id}
                          onChange={() => handleSelectOption(q._id, opt.id)}
                          className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="flex-1">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    placeholder="Type your explanation or response..."
                    onChange={(e) => handleTextAnswer(q._id, e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                )}
              </div>
            );
          })}

          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-400 font-medium">
              Answered {Object.keys(answers).length} of {questions.length} questions
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {submitting ? 'Submitting & Grading...' : 'Submit Assessment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
