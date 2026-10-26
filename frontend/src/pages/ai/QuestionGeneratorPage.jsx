import React, { useState, useEffect } from 'react';
import { coursesApi } from '../../api/courses';
import { aiApi } from '../../api/ai';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  Save,
  Plus,
  RefreshCw,
  Layers,
  Check
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function QuestionGeneratorPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [topic, setTopic] = useState('Data Structures & Algorithms');
  const [difficulty, setDifficulty] = useState('medium');
  const [bloomLevel, setBloomLevel] = useState('Understand');
  const [count, setCount] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    coursesApi.getMyCourses()
      .then((res) => {
        if (res?.data?.courses?.length > 0) {
          setCourses(res.data.courses);
          setSelectedCourseId(res.data.courses[0]._id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setGenerating(true);
    setSavedSuccess(false);

    try {
      const res = await aiApi.generateQuestions(selectedCourseId, {
        topic,
        difficulty,
        bloomLevel,
        count: Number(count),
        questionTypes: ['mcq', 'true_false', 'short_answer'],
        saveToQuestionBank: true,
        questionBankTitle: `${topic} Question Bank`,
      });

      if (res?.data?.questions) {
        setGeneratedQuestions(res.data.questions);
        setSavedSuccess(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Question Bank generator..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AI Question Bank Generator
          </h1>
          <Badge variant="purple">AI Preparation</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Turn any course topic, syllabus objective, or notes into structured question banks aligned with Bloom's taxonomy.
        </p>
      </div>

      {/* Generator Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Topic or Learning Objective</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Distributed Database Consistency and CAP Theorem"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="easy">Easy (Foundational)</option>
                <option value="medium">Medium (Application)</option>
                <option value="hard">Hard (Advanced Reasoning)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bloom's Taxonomy Level</label>
              <select
                value={bloomLevel}
                onChange={(e) => setBloomLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Remember">Remember (Recall)</option>
                <option value="Understand">Understand (Comprehend)</option>
                <option value="Apply">Apply (Execution)</option>
                <option value="Analyze">Analyze (Distinction)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Question Count</label>
              <input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold shadow-md shadow-brand-500/20 flex items-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{generating ? 'Synthesizing Questions...' : 'Generate Question Bank'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generated Questions List */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Questions successfully drafted and saved into your Course Question Bank.</span>
        </div>
      )}

      {generatedQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Generated Questions ({generatedQuestions.length})
          </h3>

          <div className="space-y-4">
            {generatedQuestions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs text-brand-600">Question {idx + 1}</span>
                    <Badge variant="purple" className="text-[10px]">{q.questionType?.toUpperCase()}</Badge>
                    <Badge variant="neutral" className="text-[10px]">{q.bloomLevel}</Badge>
                  </div>
                  <Badge variant="primary">{q.points || 1} Pt</Badge>
                </div>

                <p className="text-xs font-bold text-slate-900">{q.text}</p>

                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center space-x-2 ${
                          opt.isCorrect
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {q.explanation && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700">Explanation: </span>
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
