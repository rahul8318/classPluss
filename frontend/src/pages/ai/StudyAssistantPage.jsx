import React, { useState, useEffect } from 'react';
import { coursesApi } from '../../api/courses';
import { aiApi } from '../../api/ai';
import {
  Bot,
  Send,
  BookOpen,
  Sparkles,
  RefreshCw,
  FileText,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function StudyAssistantPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [level, setLevel] = useState('standard');
  const [chatLoading, setChatLoading] = useState(false);

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

  useEffect(() => {
    if (selectedCourseId) {
      aiApi.getChatHistory(selectedCourseId)
        .then((res) => {
          if (res?.data?.sessions?.[0]?.messages) {
            setMessages(res.data.sessions[0].messages);
          } else {
            setMessages([]);
          }
        })
        .catch(() => setMessages([]));
    }
  }, [selectedCourseId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim() || !selectedCourseId) return;

    const userText = question;
    setQuestion('');
    setChatLoading(true);

    setMessages((prev) => [...prev, { role: 'user', content: userText, level }]);

    try {
      const res = await aiApi.studyChat(selectedCourseId, {
        question: userText,
        level,
      });

      if (res?.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.answer,
            sources: res.data.sources || [],
            level: res.data.level,
            isFallback: res.data.isFallback,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Connecting to AI Study Assistant..." />;
  }

  const levels = [
    { id: 'standard', label: 'Standard' },
    { id: 'simple', label: 'Simple' },
    { id: 'breakdown', label: 'Step-by-step' },
    { id: 'example', label: 'Example' },
    { id: 'recap', label: 'Quick Recap' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              AI Study Assistant
            </h1>
            <Badge variant="purple">RAG Grounded</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Answers are retrieved strictly from your course's uploaded lecture notes & slides.
          </p>
        </div>

        {/* Course Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-600">Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
        {/* Chat Control Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Explanation Depth:</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setLevel(lvl.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  level === lvl.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-brand-600 flex items-center justify-center mb-3">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Ask your course material anything</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                The assistant will locate relevant textbook chapters and lecture passages to answer with exact page citations.
              </p>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-600 text-white shadow-md'
                      : m.isFallback
                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  {m.isFallback && (
                    <div className="flex items-center space-x-1.5 text-amber-700 font-bold mb-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Honest Fallback: Information Not Found in Course Materials</span>
                    </div>
                  )}

                  <p className="whitespace-pre-line text-xs font-medium">{m.content}</p>

                  {/* Sources citation list */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-[11px]">
                      <p className="font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                        <span>Supporting Sources Cited ({m.sources.length})</span>
                      </p>
                      <div className="space-y-1.5">
                        {m.sources.map((s, sIdx) => (
                          <div key={sIdx} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{s.fileName}</span>
                              <Badge variant="primary" className="text-[9px]">Page {s.pageNumber}</Badge>
                            </div>
                            <p className="text-slate-500 text-[10px] mt-1 italic line-clamp-2">"{s.snippet}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {chatLoading && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 italic">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
              <span>Searching authorized document chunks & generating grounded answer...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about formulas, concepts, or topics in your course..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={chatLoading}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
}
