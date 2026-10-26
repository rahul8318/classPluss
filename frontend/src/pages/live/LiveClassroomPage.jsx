import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesApi } from '../../api/courses';
import { liveClassroomApi } from '../../api/liveClassroom';
import {
  Radio,
  QrCode,
  Users,
  MessageSquare,
  Cloud,
  Vote,
  Timer,
  Shuffle,
  Lightbulb,
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Badge from '../../components/common/Badge';

export default function LiveClassroomPage() {
  const { isTeacher } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [sessionTitle, setSessionTitle] = useState('Interactive Lecture Session');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState(null);

  useEffect(() => {
    coursesApi.getMyCourses()
      .then((res) => {
        if (res?.data?.courses?.length > 0) {
          setCourses(res.data.courses);
          setSelectedCourseId(res.data.courses[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const handleLaunchRoom = async (e) => {
    e.preventDefault();
    setLaunching(true);
    try {
      const res = await liveClassroomApi.createLiveSession({
        courseId: selectedCourseId,
        title: sessionTitle,
      });
      setLaunchResult(res);
    } catch (err) {
      setLaunchResult({
        success: false,
        message: 'Could not connect to Spring Boot server. Please ensure port 8080 is online.',
      });
    } finally {
      setLaunching(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    const res = await liveClassroomApi.joinLiveSession(roomCodeInput.trim().toUpperCase());
    setLaunchResult(res);
  };

  const features = [
    { title: 'Live Quizzes', desc: 'Auto-scored MCQs with instant answer distribution', icon: CheckCircle2, color: 'text-emerald-400' },
    { title: 'Interactive Polls', desc: 'Single-choice & multi-choice preference polls', icon: Vote, color: 'text-indigo-400' },
    { title: 'Word Cloud', desc: 'Visual cloud aggregating student keywords in real-time', icon: Cloud, color: 'text-sky-400' },
    { title: 'Open Questions', desc: 'Free-text responses with teacher moderation', icon: MessageSquare, color: 'text-amber-400' },
    { title: 'Random Picker', desc: 'Server-side spin-the-wheel for fair student calling', icon: Shuffle, color: 'text-purple-400' },
    { title: 'Class Timer', desc: 'Synchronized server-enforced countdown timer', icon: Timer, color: 'text-rose-400' },
    { title: 'Brainstorming', desc: 'Interactive board for grouping student ideas', icon: Lightbulb, color: 'text-yellow-400' },
    { title: 'Prioritization', desc: 'Point allocation budget across options', icon: SlidersHorizontal, color: 'text-cyan-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white shadow-2xl border border-slate-800">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-4 border border-rose-500/30">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Spring Boot Live Classroom Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Interactive Live Classroom
          </h1>
          <p className="mt-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Inspired by Wooclap. Connects directly to the Spring Boot microservice on port 8080 for low-latency WebSocket interaction, live polls, word clouds, and synchronized session state.
          </p>
        </div>

        {/* Live Launcher / Join Form Box */}
        <div className="mt-8 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 max-w-xl">
          {isTeacher ? (
            <form onSubmit={handleLaunchRoom} className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Radio className="w-4 h-4 text-rose-400" />
                <span>Launch Live Session for a Course</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Link to Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Session Title</label>
                  <input
                    type="text"
                    required
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={launching}
                className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>{launching ? 'Connecting to Spring Boot...' : 'Create Live Session & Generate QR Code'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-rose-400" />
                <span>Join Active Live Classroom</span>
              </h3>
              <p className="text-xs text-slate-400">
                Scan the classroom QR code or enter the 6-digit code shown on the screen.
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  required
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  placeholder="e.g. LIVE-94"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-center font-mono font-bold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30"
                >
                  Join Room
                </button>
              </div>
            </form>
          )}

          {launchResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-700 text-xs">
              <p className="font-bold text-rose-300">Live Session Status</p>
              <p className="text-slate-300 mt-1">{launchResult.message || 'Connected to Spring Boot live session endpoint.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Feature Catalog Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Spring Boot Real-Time Activity Catalogue
          </h2>
          <p className="text-xs text-slate-500">
            Interactive activity components managed in low-latency WebSocket channels:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-2"
              >
                <div className="p-2.5 rounded-xl bg-slate-900 w-fit">
                  <Icon className={`w-5 h-5 ${feat.color}`} />
                </div>
                <h4 className="text-xs font-bold text-slate-900">{feat.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
