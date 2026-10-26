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
  Check
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AttendancePage() {
  const { isTeacher } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);

  const [records, setRecords] = useState([]);
  const [report, setReport] = useState([]);
  const [totalClasses, setTotalClasses] = useState(0);

  // Check-In Code State
  const [sessionCode, setSessionCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [checkInMsg, setCheckInMsg] = useState('');

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
      setRecords(recRes?.data?.attendanceRecords || []);
      setReport(repRes?.data?.report || []);
      setTotalClasses(repRes?.data?.totalClasses || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadAttendanceData(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleGenerateCode = async () => {
    try {
      const res = await attendanceApi.generateSessionCode(selectedCourseId, 15);
      if (res?.data) {
        setSessionCode(res.data);
      }
    } catch (err) {
      alert(err.message || 'Error generating code');
    }
  };

  const handleStudentCheckIn = async (e) => {
    e.preventDefault();
    setCheckInMsg('');
    try {
      await attendanceApi.studentCheckIn(studentCode.trim().toUpperCase());
      setCheckInMsg('Successfully checked in as PRESENT!');
      setStudentCode('');
      loadAttendanceData(selectedCourseId);
    } catch (err) {
      setCheckInMsg(err.message || 'Invalid or expired check-in code');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Attendance Manager..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Attendance Register & Reports
            </h1>
            <Badge variant="primary">Official Register</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official class session records with time-limited QR/code check-in and low-attendance warnings.
          </p>
        </div>

        {/* Course Select */}
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

      {/* Check-In Action Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        {isTeacher ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Broadcast Session Check-In Code</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generates a 6-character code and QR token valid for 15 minutes.
              </p>
            </div>

            <button
              onClick={handleGenerateCode}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold shadow-md shadow-brand-500/20 flex items-center space-x-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Generate Check-In Code</span>
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Student Attendance Check-In</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the active 6-character code presented on the classroom projector.
            </p>
            <form onSubmit={handleStudentCheckIn} className="flex max-w-sm items-center space-x-2">
              <input
                type="text"
                required
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="6-DIGIT CODE"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-center font-mono uppercase text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20"
              >
                Mark Present
              </button>
            </form>
            {checkInMsg && (
              <p className="text-xs font-bold text-emerald-600 mt-2">{checkInMsg}</p>
            )}
          </div>
        )}

        {/* Teacher Active Code Display Card */}
        {isTeacher && sessionCode && (
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-white px-2 py-0.5 rounded-md border border-brand-200">
                Active Code
              </span>
              <p className="text-3xl font-mono font-extrabold text-brand-900 tracking-widest mt-2">
                {sessionCode.code}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Expires: {new Date(sessionCode.expiresAt).toLocaleTimeString()}</span>
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(sessionCode.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 py-2 rounded-xl bg-white border border-brand-200 hover:bg-brand-50 text-brand-700 text-xs font-bold flex items-center space-x-1.5 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Attendance Analytics & Reports (for Teacher) */}
      {isTeacher && report.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Student Attendance Performance ({totalClasses} Total Sessions)
            </h3>
            <p className="text-xs text-slate-500">Students with &lt; 75% attendance are flagged for intervention.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-left">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Present</th>
                  <th className="px-4 py-3">Late</th>
                  <th className="px-4 py-3">Absent</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {report.map((item) => (
                  <tr key={item.student._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{item.student.name}</td>
                    <td className="px-4 py-3 text-slate-700">{item.stats.presentCount}</td>
                    <td className="px-4 py-3 text-slate-700">{item.stats.lateCount}</td>
                    <td className="px-4 py-3 text-slate-700">{item.stats.absentCount}</td>
                    <td className="px-4 py-3 font-mono font-bold text-brand-600">
                      {item.stats.attendancePercentage}%
                    </td>
                    <td className="px-4 py-3">
                      {item.stats.isLowAttendance ? (
                        <span className="inline-flex items-center space-x-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
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

      {/* Attendance Session History */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Recorded Sessions Log</h3>
        <div className="divide-y divide-slate-100">
          {records.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No class sessions recorded yet.</p>
          ) : (
            records.map((rec) => (
              <div key={rec._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{rec.title}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{rec.classDate}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-700">{rec.records?.length || 0} Attended</span>
                  <Badge variant={rec.isConfirmed ? 'success' : 'warning'}>
                    {rec.isConfirmed ? 'Verified' : 'Draft'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
