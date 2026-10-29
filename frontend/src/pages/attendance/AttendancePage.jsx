import React, { useState, useEffect } from 'react';
import { coursesApi } from '../../api/courses';
import { attendanceApi } from '../../api/attendance';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarCheck,
  QrCode,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  FileDown,
  Edit3,
  Plus,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Eye,
  X,
  FileText
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { exportAttendancePdf } from '../../utils/attendancePdfExport';

export default function AttendancePage() {
  const { user, isTeacher } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);

  // Data states
  const [records, setRecords] = useState([]);
  const [report, setReport] = useState([]);
  const [totalClasses, setTotalClasses] = useState(0);

  // Selected session for detailed roster view
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Check-In Code State (for Teacher Broadcast)
  const [sessionCode, setSessionCode] = useState(null);
  const [copied, setCopied] = useState(false);

  // Student Check-In State
  const [studentCode, setStudentCode] = useState('');
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Modify Modal State
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyingStudent, setModifyingStudent] = useState(null);
  const [modifyStatus, setModifyStatus] = useState('present');
  const [modifyNotes, setModifyNotes] = useState('');
  const [clearProxyWarning, setClearProxyWarning] = useState(false);
  const [savingModify, setSavingModify] = useState(false);

  // Create Manual Session Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSessionTitle, setNewSessionTitle] = useState('Lecture Session');
  const [defaultMark, setDefaultMark] = useState('present');
  const [creatingSession, setCreatingSession] = useState(false);

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

  const loadAttendanceData = async (cId) => {
    if (!cId) return;
    try {
      const [recRes, repRes] = await Promise.all([
        attendanceApi.getCourseAttendance(cId),
        attendanceApi.getReport(cId).catch(() => ({ data: {} })),
      ]);
      const fetchedRecords = recRes?.data?.attendanceRecords || [];
      setRecords(fetchedRecords);
      setReport(repRes?.data?.report || []);
      setTotalClasses(repRes?.data?.totalClasses || 0);

      // Auto-select latest session if available
      if (fetchedRecords.length > 0 && !selectedRecordId) {
        loadSessionRoster(cId, fetchedRecords[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSessionRoster = async (cId, recId) => {
    if (!cId || !recId) return;
    setSessionLoading(true);
    setSelectedRecordId(recId);
    try {
      const res = await attendanceApi.getSessionAttendance(cId, recId);
      if (res?.data) {
        setSessionDetail(res.data);
      }
    } catch (err) {
      console.error('Failed to load session details', err);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      setSelectedRecordId(null);
      setSessionDetail(null);
      loadAttendanceData(selectedCourseId);
    }
  }, [selectedCourseId]);

  const currentCourse = courses.find((c) => c._id === selectedCourseId);

  // 1. Generate 6-char Check-in Code
  const handleGenerateCode = async () => {
    try {
      const res = await attendanceApi.generateSessionCode(selectedCourseId, 15);
      if (res?.data) {
        setSessionCode(res.data);
      }
    } catch (err) {
      alert(err.message || 'Error generating check-in code');
    }
  };

  // 2. Student Check-in (Strict Anti-Duplicate / Anti-Proxy)
  const handleStudentCheckIn = async (e) => {
    e.preventDefault();
    setCheckInStatus(null);
    setSubmittingCheckIn(true);

    try {
      const res = await attendanceApi.studentCheckIn(studentCode.trim().toUpperCase());
      setCheckInStatus({
        success: true,
        message: 'Attendance recorded successfully! Marked as PRESENT.',
        isProxyWarning: res?.data?.isProxyWarning,
      });
      setStudentCode('');
      loadAttendanceData(selectedCourseId);
      if (selectedRecordId) {
        loadSessionRoster(selectedCourseId, selectedRecordId);
      }
    } catch (err) {
      setCheckInStatus({
        success: false,
        message: err.message || 'Check-in failed. Please ensure the code is active and valid.',
      });
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  // 3. Open Modify Modal
  const openModifyModal = (rosterItem) => {
    setModifyingStudent(rosterItem);
    setModifyStatus(rosterItem.status || 'present');
    setModifyNotes(rosterItem.notes || '');
    setClearProxyWarning(false);
    setShowModifyModal(true);
  };

  // 4. Save Modified Attendance
  const handleSaveModification = async (e) => {
    e.preventDefault();
    if (!selectedRecordId || !modifyingStudent) return;

    setSavingModify(true);
    try {
      const studentId = modifyingStudent.student._id;
      await attendanceApi.updateStudentStatus(selectedRecordId, studentId, {
        status: modifyStatus,
        notes: modifyNotes,
        clearProxyWarning,
      });

      setShowModifyModal(false);
      // Reload session and report
      await loadSessionRoster(selectedCourseId, selectedRecordId);
      await loadAttendanceData(selectedCourseId);
    } catch (err) {
      alert(err.message || 'Failed to update student attendance');
    } finally {
      setSavingModify(false);
    }
  };

  // 5. Create Manual Session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setCreatingSession(true);
    try {
      // Get enrolled students
      const rosterRes = await coursesApi.getRoster(selectedCourseId);
      const students = rosterRes?.data?.students || [];

      const recordsPayload = students.map((s) => ({
        studentId: s._id,
        status: defaultMark,
        source: 'manual',
        notes: 'Initial session mark by instructor',
      }));

      await attendanceApi.recordAttendance(selectedCourseId, {
        classDate: newSessionDate,
        title: newSessionTitle,
        records: recordsPayload,
      });

      setShowCreateModal(false);
      setNewSessionTitle('Lecture Session');
      await loadAttendanceData(selectedCourseId);
    } catch (err) {
      alert(err.message || 'Failed to create attendance session');
    } finally {
      setCreatingSession(false);
    }
  };

  // 6. Delete Session
  const handleDeleteSession = async (recId) => {
    if (!window.confirm('Are you sure you want to delete this attendance session record? This action cannot be undone.')) {
      return;
    }
    try {
      await attendanceApi.deleteRecord(recId);
      if (selectedRecordId === recId) {
        setSelectedRecordId(null);
        setSessionDetail(null);
      }
      loadAttendanceData(selectedCourseId);
    } catch (err) {
      alert(err.message || 'Failed to delete attendance record');
    }
  };

  // 7. Export Official PDF
  const handleExportPdf = () => {
    if (!currentCourse) return;
    exportAttendancePdf({
      course: currentCourse,
      report,
      records,
      totalClasses,
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading Attendance Manager..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <CalendarCheck className="w-7 h-7 text-brand-600" />
              <span>Attendance Register & Verification</span>
            </h1>
            <Badge variant="primary">Official Register</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete institutional attendance roster with anti-proxy verification, audit tracking, and official PDF export.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Course Selector */}
          <div className="flex items-center space-x-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-xs font-bold text-slate-500">Course:</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Export PDF Button (for Teacher) */}
          {isTeacher && (
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all"
            >
              <FileDown className="w-4 h-4 text-brand-300" />
              <span>Export PDF</span>
            </button>
          )}

          {/* Create Manual Session Button */}
          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-brand-600" />
              <span>New Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Anti-Proxy Security Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-4 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
            <ShieldCheck className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Anti-Proxy & Tamper Protection Active
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Attendance records are strictly immutable to students. One submission permitted per student per session with IP collision detection and device fingerprinting. Only certified instructors can modify attendance entries.
            </p>
          </div>
        </div>

        {isTeacher ? (
          <button
            onClick={handleGenerateCode}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-md shadow-rose-500/25 flex items-center space-x-2 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Generate Check-In Code</span>
          </button>
        ) : (
          <form onSubmit={handleStudentCheckIn} className="flex items-center space-x-2 shrink-0">
            <input
              type="text"
              required
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="6-DIGIT CODE"
              className="w-36 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-mono uppercase text-xs font-bold tracking-widest placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="submit"
              disabled={submittingCheckIn}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {submittingCheckIn ? 'Checking...' : 'Check In'}
            </button>
          </form>
        )}
      </div>

      {/* Student Check-In Feedback Alert */}
      {checkInStatus && (
        <div
          className={`p-4 rounded-2xl flex items-center space-x-3 border ${
            checkInStatus.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {checkInStatus.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div className="flex-1 text-xs font-semibold">
            <span>{checkInStatus.message}</span>
            {checkInStatus.isProxyWarning && (
              <p className="text-[11px] text-amber-700 mt-0.5">
                Notice: Multiple check-ins detected from your network connection. Your check-in was flagged for instructor audit.
              </p>
            )}
          </div>
          <button onClick={() => setCheckInStatus(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Check-In Code Display Box (Teacher Broadcast) */}
      {isTeacher && sessionCode && (
        <div className="p-6 rounded-3xl bg-white border border-brand-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-rose-500 px-2.5 py-0.5 rounded-full animate-pulse">
                Live Broadcast Active
              </span>
              <span className="text-xs text-slate-400 font-medium">15 Minute Expiration Window</span>
            </div>
            <p className="text-4xl font-mono font-extrabold text-brand-800 tracking-widest pt-1">
              {sessionCode.code}
            </p>
            <p className="text-xs text-slate-500 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Expires at: {new Date(sessionCode.expiresAt).toLocaleTimeString()}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(sessionCode.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 flex items-center space-x-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={() => setSessionCode(null)}
              className="px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Sessions List (Left) and Detailed Student Register (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recorded Sessions List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recorded Sessions</h3>
              <Badge variant="primary">{records.length} Total</Badge>
            </div>
            <p className="text-xs text-slate-500">
              Select any class session to inspect the complete student register and modify statuses.
            </p>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pt-2">
              {records.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span>No attendance sessions created yet.</span>
                </div>
              ) : (
                records.map((rec) => {
                  const isSelected = selectedRecordId === rec._id;
                  const proxyCount = rec.records?.filter((r) => r.isProxyWarning).length || 0;

                  return (
                    <div
                      key={rec._id}
                      onClick={() => loadSessionRoster(selectedCourseId, rec._id)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all my-1.5 flex items-center justify-between border ${
                        isSelected
                          ? 'bg-brand-50/70 border-brand-300 shadow-sm'
                          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">{rec.title}</span>
                          {proxyCount > 0 && (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              <span>{proxyCount}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">{rec.classDate}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-700">
                          {rec.records?.length || 0} Attended
                        </span>
                        {isTeacher && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(rec._id);
                            }}
                            className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Session Student Roster & Teacher Modifier */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            {sessionLoading ? (
              <LoadingSpinner text="Loading session student roster..." />
            ) : sessionDetail ? (
              <>
                {/* Session Title & Quick Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900">{sessionDetail.attendance?.title}</h3>
                      <Badge variant={sessionDetail.attendance?.isConfirmed ? 'success' : 'warning'}>
                        {sessionDetail.attendance?.isConfirmed ? 'Verified Official' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Class Date: <span className="font-mono font-bold text-slate-700">{sessionDetail.attendance?.classDate}</span> | Total Enrolled: <span className="font-bold text-slate-700">{sessionDetail.totalEnrolled}</span>
                    </p>
                  </div>

                  {/* Present/Late/Absent Badges */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-100">
                      {sessionDetail.presentCount} Present
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 font-extrabold border border-amber-100">
                      {sessionDetail.lateCount} Late
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-extrabold border border-rose-100">
                      {sessionDetail.absentCount} Absent
                    </span>
                    {sessionDetail.excusedCount > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-100">
                        {sessionDetail.excusedCount} Excused
                      </span>
                    )}
                  </div>
                </div>

                {/* Session Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Check-In Time</th>
                        <th className="px-4 py-3">Verification / Anti-Proxy</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sessionDetail.roster?.map((item) => {
                        const statusColors = {
                          present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          late: 'bg-amber-50 text-amber-700 border-amber-200',
                          absent: 'bg-rose-50 text-rose-700 border-rose-200',
                          excused: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        };

                        return (
                          <tr key={item.student?._id} className="hover:bg-slate-50 transition-colors">
                            {/* Student Info */}
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{item.student?.name}</div>
                              <div className="text-[11px] text-slate-400">{item.student?.email}</div>
                              {item.notes && (
                                <div className="text-[10px] text-indigo-600 font-medium mt-0.5 italic">
                                  Note: "{item.notes}"
                                </div>
                              )}
                            </td>

                            {/* Status Badge */}
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider border ${
                                  statusColors[item.status] || statusColors.absent
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>

                            {/* Time */}
                            <td className="px-4 py-3 text-slate-500 font-mono">
                              {item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString() : '—'}
                            </td>

                            {/* Anti-Proxy / Verification */}
                            <td className="px-4 py-3">
                              {item.isProxyWarning ? (
                                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200" title={item.proxyReason}>
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Proxy Alert (IP)</span>
                                </div>
                              ) : item.source === 'code' ? (
                                <div className="inline-flex items-center space-x-1 text-slate-500 text-[11px]">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Verified Code</span>
                                </div>
                              ) : item.source === 'manual' ? (
                                <span className="text-[11px] text-slate-500">Teacher Manual</span>
                              ) : item.source === 'spring_boot_session' ? (
                                <span className="text-[11px] text-slate-500">Live Classroom</span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Unrecorded</span>
                              )}
                            </td>

                            {/* Actions (Teacher Modify) */}
                            <td className="px-4 py-3 text-right">
                              {isTeacher ? (
                                <button
                                  onClick={() => openModifyModal(item)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 font-bold text-xs transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Modify</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400">Locked</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p>Select a session on the left to inspect the complete student register.</p>
              </div>
            )}
          </div>

          {/* Overall Course Performance Report Table (for Teacher) */}
          {isTeacher && report.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Course Attendance Performance ({totalClasses} Total Sessions)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive student attendance overview across the entire term.
                  </p>
                </div>
                <button
                  onClick={handleExportPdf}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200"
                >
                  <FileDown className="w-3.5 h-3.5 text-brand-600" />
                  <span>Download PDF</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-left">
                    <tr>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Present</th>
                      <th className="px-4 py-3">Late</th>
                      <th className="px-4 py-3">Absent</th>
                      <th className="px-4 py-3">Excused</th>
                      <th className="px-4 py-3">Attendance Rate</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.map((item) => (
                      <tr key={item.student._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{item.student.name}</div>
                          <div className="text-[11px] text-slate-400">{item.student.email}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{item.stats.presentCount}</td>
                        <td className="px-4 py-3 text-slate-700">{item.stats.lateCount}</td>
                        <td className="px-4 py-3 text-slate-700">{item.stats.absentCount}</td>
                        <td className="px-4 py-3 text-slate-700">{item.stats.excusedCount || 0}</td>
                        <td className="px-4 py-3 font-mono font-bold text-brand-600">
                          {item.stats.attendancePercentage}%
                        </td>
                        <td className="px-4 py-3">
                          {item.stats.isLowAttendance ? (
                            <span className="inline-flex items-center space-x-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-bold text-[10px] border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low (&lt;75%)</span>
                            </span>
                          ) : (
                            <Badge variant="success">Normal</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Teacher Modify Attendance */}
      <Modal
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        title={`Modify Attendance: ${modifyingStudent?.student?.name || 'Student'}`}
      >
        <form onSubmit={handleSaveModification} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Attendance Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['present', 'late', 'absent', 'excused'].map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setModifyStatus(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all ${
                    modifyStatus === st
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Teacher Note / Justification
            </label>
            <input
              type="text"
              value={modifyNotes}
              onChange={(e) => setModifyNotes(e.target.value)}
              placeholder="e.g. Excused due to medical leave / Arrived at 9:15 AM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {modifyingStudent?.isProxyWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Anti-Proxy Warning Attached</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {modifyingStudent.proxyReason}
              </p>
              <label className="flex items-center space-x-2 text-xs font-bold text-amber-900 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={clearProxyWarning}
                  onChange={(e) => setClearProxyWarning(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Clear proxy alert flag (Verified genuine by instructor)</span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModifyModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingModify}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {savingModify ? 'Saving Changes...' : 'Save & Update Register'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Create Manual Session */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Attendance Session"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Class Date
            </label>
            <input
              type="date"
              required
              value={newSessionDate}
              onChange={(e) => setNewSessionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Session Title / Topic
            </label>
            <input
              type="text"
              required
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              placeholder="e.g. Lecture 4: Neural Loss Functions"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Default Initial Mark for Roster
            </label>
            <select
              value={defaultMark}
              onChange={(e) => setDefaultMark(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="present">Mark All Enrolled Students Present</option>
              <option value="absent">Mark All Enrolled Students Absent (To be checked in)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingSession}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {creatingSession ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
