import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coursesApi } from '../../api/courses';
import { assignmentsApi } from '../../api/assignments';
import { assessmentsApi } from '../../api/assessments';
import { attendanceApi } from '../../api/attendance';
import { aiApi } from '../../api/ai';
import { liveClassroomApi } from '../../api/liveClassroom';
import {
  BookOpen,
  FolderOpen,
  FileCheck2,
  HelpCircle,
  CalendarCheck,
  Bot,
  Users,
  Radio,
  Plus,
  Upload,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  RefreshCw,
  Award
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isTeacher } = useAuth();

  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'modules');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Data states
  const [modules, setModules] = useState([]);
  const [resources, setResources] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [roster, setRoster] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState([]);

  // Modals
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Form states
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState('pdf');
  const [resourceFile, setResourceFile] = useState(null);

  // Assignment Form
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignDue, setNewAssignDue] = useState('');
  const [newAssignMarks, setNewAssignMarks] = useState(100);

  // Submit Form
  const [submitText, setSubmitText] = useState('');
  const [submitFile, setSubmitFile] = useState(null);
  const [receipt, setReceipt] = useState(null);

  // Grading Form
  const [gradeMarks, setGradeMarks] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Attendance Code State
  const [activeSessionCode, setActiveSessionCode] = useState(null);
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [checkInStatus, setCheckInStatus] = useState(null);

  // RAG Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatLevel, setChatLevel] = useState('standard');
  const [chatLoading, setChatLoading] = useState(false);

  // Live session state
  const [liveSessionState, setLiveSessionState] = useState(null);

  const loadCourseData = async () => {
    try {
      const res = await coursesApi.getCourseById(courseId);
      if (res?.data?.course) {
        setCourse(res.data.course);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTabData = async () => {
    try {
      if (activeTab === 'modules') {
        const [modRes, resRes] = await Promise.all([
          coursesApi.getModules(courseId),
          coursesApi.getResources(courseId),
        ]);
        setModules(modRes?.data?.modules || []);
        setResources(resRes?.data?.resources || []);
      } else if (activeTab === 'assignments') {
        const assignRes = await assignmentsApi.getCourseAssignments(courseId);
        setAssignments(assignRes?.data?.assignments || []);
      } else if (activeTab === 'assessments') {
        const assessRes = await assessmentsApi.getCourseAssessments(courseId);
        setAssessments(assessRes?.data?.assessments || []);
      } else if (activeTab === 'attendance') {
        const [attRes, repRes] = await Promise.all([
          attendanceApi.getCourseAttendance(courseId),
          attendanceApi.getReport(courseId).catch(() => ({ data: {} })),
        ]);
        setAttendanceRecords(attRes?.data?.attendanceRecords || []);
        setAttendanceReport(repRes?.data?.report || []);
      } else if (activeTab === 'roster') {
        const rosRes = await coursesApi.getRoster(courseId);
        setRoster(rosRes?.data?.students || []);
      } else if (activeTab === 'ai') {
        const chatRes = await aiApi.getChatHistory(courseId);
        if (chatRes?.data?.sessions?.[0]?.messages) {
          setChatMessages(chatRes.data.sessions[0].messages);
        }
      }
    } catch (err) {
      console.error('Failed to load tab data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    loadTabData();
  }, [courseId, activeTab]);

  // Handlers
  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle) return;
    await coursesApi.createModule(courseId, { title: newModuleTitle });
    setShowModuleModal(false);
    setNewModuleTitle('');
    loadTabData();
  };

  const handleUploadResource = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newResourceTitle);
    formData.append('resourceType', newResourceType);
    if (resourceFile) {
      formData.append('file', resourceFile);
    }
    await coursesApi.uploadResource(courseId, formData);
    setShowResourceModal(false);
    setNewResourceTitle('');
    setResourceFile(null);
    loadTabData();
  };

  const handleProcessRAG = async (resourceId) => {
    try {
      await coursesApi.processResourceRAG(resourceId);
      loadTabData();
    } catch (err) {
      alert('RAG Processing completed or in progress.');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    await assignmentsApi.createAssignment(courseId, {
      title: newAssignTitle,
      description: newAssignDesc,
      dueDate: newAssignDue,
      totalMarks: Number(newAssignMarks),
      allowedSubmissionTypes: ['file', 'text'],
    });
    setShowAssignmentModal(false);
    setNewAssignTitle('');
    setNewAssignDesc('');
    loadTabData();
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('content', submitText);
    formData.append('submissionType', submitFile ? 'file' : 'text');
    if (submitFile) {
      formData.append('file', submitFile);
    }

    const res = await assignmentsApi.submitWork(selectedAssignment._id, formData);
    if (res?.data?.receipt) {
      setReceipt(res.data.receipt);
    }
    loadTabData();
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    await assignmentsApi.gradeSubmission(selectedSubmission._id, {
      marksObtained: Number(gradeMarks),
      feedbackText: gradeFeedback,
      status: 'published',
    });
    setShowGradeModal(false);
    setSelectedSubmission(null);
    loadTabData();
  };

  const handleGenerateAttendanceCode = async () => {
    const res = await attendanceApi.generateSessionCode(courseId, 15);
    if (res?.data) {
      setActiveSessionCode(res.data);
    }
  };

  const handleStudentCheckIn = async (e) => {
    e.preventDefault();
    try {
      await attendanceApi.studentCheckIn(studentCodeInput.trim().toUpperCase());
      setCheckInStatus('Present');
      loadTabData();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim()) return;

    const userQ = chatQuestion;
    setChatQuestion('');
    setChatLoading(true);

    // Optimistic user bubble
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: userQ, level: chatLevel },
    ]);

    try {
      const res = await aiApi.studyChat(courseId, {
        question: userQ,
        level: chatLevel,
      });

      if (res?.data) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.answer,
            sources: res.data.sources,
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

  const handleStartLiveSession = async () => {
    const res = await liveClassroomApi.createLiveSession({
      courseId,
      title: `${course?.title} - Live Session`,
    });
    setLiveSessionState(res);
  };

  if (!course) {
    return <LoadingSpinner text="Loading course details..." />;
  }

  const tabs = [
    { id: 'modules', label: 'Modules & Documents', icon: FolderOpen },
    { id: 'assignments', label: 'Assignments', icon: FileCheck2 },
    { id: 'assessments', label: 'Quizzes & Tests', icon: HelpCircle },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'ai', label: 'AI Study Assistant', icon: Bot, badge: 'RAG' },
    { id: 'roster', label: 'Class Roster', icon: Users },
    { id: 'live', label: 'Live Classroom', icon: Radio, highlight: true },
  ];

  return (
    <div className="space-y-6">
      {/* Course Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Badge variant="primary">{course.subject}</Badge>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
                Join Code: {course.code}
              </span>
              <span className="text-xs text-slate-400 font-medium">{course.term}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {course.description || 'Welcome to the interactive course workspace.'}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => switchTab('live')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>{isTeacher ? 'Launch Live Room' : 'Join Live Room'}</span>
            </button>
            <button
              onClick={() => switchTab('ai')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI Notes</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 border-b border-slate-100 mt-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                } ${tab.highlight && !isActive ? 'text-rose-600' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Areas */}
      {loading ? (
        <LoadingSpinner text="Updating workspace..." />
      ) : (
        <div>
          {/* TAB 1: MODULES & DOCUMENTS */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Course Content & Materials</h3>
                  <p className="text-xs text-slate-500">PDFs, lecture slides, and notes indexed for RAG</p>
                </div>
                {isTeacher && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowModuleModal(true)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                    >
                      + Add Module
                    </button>
                    <button
                      onClick={() => setShowResourceModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-sm"
                    >
                      + Upload Document
                    </button>
                  </div>
                )}
              </div>

              {/* Resource List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.length === 0 ? (
                  <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                    No documents uploaded yet.
                  </div>
                ) : (
                  resources.map((res) => (
                    <div
                      key={res._id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between"
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className="p-2.5 rounded-xl bg-indigo-50 text-brand-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{res.title}</h4>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{res.fileName}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge
                              variant={res.processingStatus === 'completed' ? 'success' : 'warning'}
                              className="text-[9px]"
                            >
                              {res.processingStatus === 'completed' ? 'RAG Indexed' : 'Processing'}
                            </Badge>
                            {res.chunkCount > 0 && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                {res.chunkCount} vector passages
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isTeacher && res.processingStatus !== 'completed' && (
                        <button
                          onClick={() => handleProcessRAG(res._id)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Index</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Course Assignments</h3>
                  <p className="text-xs text-slate-500">Track deadlines, submissions, and rubric grades</p>
                </div>
                {isTeacher && (
                  <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-sm"
                  >
                    + Create Assignment
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {assignments.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                    No assignments posted for this course.
                  </div>
                ) : (
                  assignments.map((assign) => (
                    <div
                      key={assign._id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-900">{assign.title}</h4>
                          <Badge variant="neutral">{assign.totalMarks} Points</Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{assign.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                          </span>
                          <span>Policy: {assign.lateSubmissionPolicy}</span>
                        </div>
                      </div>

                      <div>
                        {!isTeacher ? (
                          <div className="flex items-center space-x-3">
                            {assign.submissionStatus === 'submitted' || assign.submissionStatus === 'graded' ? (
                              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{assign.submissionStatus.toUpperCase()}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedAssignment(assign);
                                  setReceipt(null);
                                  setShowSubmitModal(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-sm"
                              >
                                Submit Work
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-700">
                              {assign.totalSubmissions || 0} Submissions
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ASSESSMENTS / QUIZZES */}
          {activeTab === 'assessments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Quizzes & Assessments</h3>
                  <p className="text-xs text-slate-500">Auto-graded objective tests and question banks</p>
                </div>
                {isTeacher && (
                  <Link
                    to="/ai/generator"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Quiz</span>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assessments.length === 0 ? (
                  <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                    No assessments currently published.
                  </div>
                ) : (
                  assessments.map((assess) => (
                    <div
                      key={assess._id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-slate-900">{assess.title}</h4>
                          <Badge variant="primary">{assess.totalMarks} Marks</Badge>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {assess.description || 'Test understanding of course lecture notes and concepts.'}
                        </p>
                        <div className="flex items-center space-x-3 mt-3 text-[11px] text-slate-400 font-medium">
                          <span>{assess.questions?.length || 0} Questions</span>
                          <span>•</span>
                          <span>{assess.durationMinutes} Minutes</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        {!isTeacher ? (
                          <Link
                            to={`/assessments/${assess._id}/take`}
                            className="w-full text-center py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
                          >
                            Start Assessment
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-slate-500 font-medium">Auto-Grading Enabled</span>
                            <span className="text-xs font-bold text-brand-600">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Attendance Register</h3>
                  <p className="text-xs text-slate-500">Official course roster check-ins and time-limited codes</p>
                </div>
                {isTeacher ? (
                  <button
                    onClick={handleGenerateAttendanceCode}
                    className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-sm"
                  >
                    Generate Session Check-In Code
                  </button>
                ) : (
                  <form onSubmit={handleStudentCheckIn} className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      placeholder="ENTER 6-DIGIT CODE"
                      value={studentCodeInput}
                      onChange={(e) => setStudentCodeInput(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 font-mono uppercase text-xs font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-sm"
                    >
                      Check In
                    </button>
                  </form>
                )}
              </div>

              {/* Active Code Display for Teacher */}
              {activeSessionCode && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-brand-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-brand-900">Active Check-In Code (Valid for 15m)</p>
                    <p className="text-2xl font-mono font-extrabold text-brand-700 tracking-widest mt-1">
                      {activeSessionCode.code}
                    </p>
                  </div>
                  <Badge variant="success">Broadcasting Code</Badge>
                </div>
              )}

              {/* Attendance Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-left">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Title / Source</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Records Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                          No attendance records stored yet.
                        </td>
                      </tr>
                    ) : (
                      attendanceRecords.map((rec) => (
                        <tr key={rec._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-800">{rec.classDate}</td>
                          <td className="px-4 py-3 text-slate-600">{rec.title}</td>
                          <td className="px-4 py-3">
                            <Badge variant={rec.isConfirmed ? 'success' : 'warning'}>
                              {rec.isConfirmed ? 'Confirmed' : 'Pending Review'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700">{rec.records?.length || 0} Students</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AI STUDY ASSISTANT (RAG) */}
          {activeTab === 'ai' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-brand-600" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Grounded RAG Study Assistant</h4>
                    <p className="text-[11px] text-slate-500">Only answers from your course's approved documents</p>
                  </div>
                </div>

                {/* Explanation Level Selector */}
                <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold px-2">Level:</span>
                  {['standard', 'simple', 'breakdown', 'example', 'recap'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setChatLevel(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        chatLevel === lvl ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <Bot className="w-12 h-12 text-brand-200 mb-3" />
                    <h4 className="text-sm font-bold text-slate-700">Ask any question about this course</h4>
                    <p className="text-xs max-w-sm mt-1">
                      e.g., "Explain the key concepts covered in the Week 2 lecture notes"
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-brand-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* Citations Box for Assistant */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-600">
                            <p className="font-bold text-slate-700 mb-1 flex items-center space-x-1">
                              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                              <span>Verified Citations ({msg.sources.length})</span>
                            </p>
                            <div className="space-y-1">
                              {msg.sources.map((src, sIdx) => (
                                <div key={sIdx} className="bg-white/80 p-2 rounded-lg border border-slate-200">
                                  <span className="font-bold text-slate-900">{src.fileName}</span> (Page {src.pageNumber})
                                  <p className="text-slate-500 italic mt-0.5 line-clamp-1">"{src.snippet}"</p>
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
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching authorized document chunks & generating grounded answer...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2">
                <input
                  type="text"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  placeholder="Ask a question grounded in this course's syllabus and slides..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center space-x-1 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Ask</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: ROSTER */}
          {activeTab === 'roster' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Enrolled Students ({roster.length})</h3>
              <p className="text-xs text-slate-500 mb-4">Official roster registered in this course</p>

              <div className="divide-y divide-slate-100">
                {roster.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No students enrolled yet. Share code {course.code}.</p>
                ) : (
                  roster.map((r) => (
                    <div key={r.enrollmentId} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {r.student?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{r.student?.name}</p>
                          <p className="text-[11px] text-slate-400">{r.student?.email}</p>
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: LIVE CLASSROOM LAUNCHER (SPRING BOOT INTEGRATION) */}
          {activeTab === 'live' && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
              <div className="max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-4 border border-rose-500/30">
                  <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>Spring Boot Live Classroom Engine</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">Interactive Live Session</h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Seamlessly launch real-time Wooclap-style activities connected to this course.
                  Synchronizes attendance with the MERN register upon session completion.
                </p>

                <div className="mt-6 flex items-center space-x-4">
                  {isTeacher ? (
                    <button
                      onClick={handleStartLiveSession}
                      className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-500/30 flex items-center space-x-2 transition-all"
                    >
                      <Radio className="w-4 h-4" />
                      <span>Launch Room on Spring Boot (Port 8080)</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="ENTER 6-DIGIT ROOM CODE"
                        className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-mono font-bold tracking-widest focus:outline-none"
                      />
                      <button className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold">
                        Join
                      </button>
                    </div>
                  )}
                </div>

                {liveSessionState && (
                  <div className="mt-6 p-4 rounded-2xl bg-white/10 border border-white/20 text-xs">
                    <p className="font-bold text-rose-300">Live Session Status:</p>
                    <p className="text-slate-300 mt-1">{liveSessionState.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD MODULE */}
      <Modal isOpen={showModuleModal} onClose={() => setShowModuleModal(false)} title="Add Course Module">
        <form onSubmit={handleAddModule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Module Title</label>
            <input
              type="text"
              required
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="e.g. Week 1: Foundational Architectures"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowModuleModal(false)}
              className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold">
              Save Module
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: UPLOAD RESOURCE */}
      <Modal isOpen={showResourceModal} onClose={() => setShowResourceModal(false)} title="Upload Learning Material">
        <form onSubmit={handleUploadResource} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={newResourceTitle}
              onChange={(e) => setNewResourceTitle(e.target.value)}
              placeholder="Lecture Slides: Normalization and Indexes"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
            <select
              value={newResourceType}
              onChange={(e) => setNewResourceType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            >
              <option value="pdf">PDF Document</option>
              <option value="docx">Word DOCX</option>
              <option value="pptx">PowerPoint Presentation</option>
              <option value="notes">Text Notes</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select File</label>
            <input
              type="file"
              required
              onChange={(e) => setResourceFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowResourceModal(false)}
              className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
            >
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold">
              Upload & Index
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: SUBMIT ASSIGNMENT WORK */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title={`Submit Work: ${selectedAssignment?.title}`}
      >
        {receipt ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Submission Confirmed!</h4>
            <div className="p-4 rounded-xl bg-slate-50 font-mono text-xs text-slate-700 border">
              <p>Receipt Code: <span className="font-bold text-brand-600">{receipt.receiptCode}</span></p>
              <p className="text-[10px] text-slate-400 mt-1">Submitted: {new Date(receipt.timestamp).toLocaleString()}</p>
            </div>
            <button
              onClick={() => setShowSubmitModal(false)}
              className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitWork} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Written Response / Links</label>
              <textarea
                rows={4}
                value={submitText}
                onChange={(e) => setSubmitText(e.target.value)}
                placeholder="Type your submission notes, analytical summary, or repository link..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attachment (Optional)</label>
              <input
                type="file"
                onChange={(e) => setSubmitFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold">
                Confirm & Submit
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
