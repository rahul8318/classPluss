import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coursesApi } from '../../api/courses';
import {
  BookOpen,
  Users,
  FileCheck2,
  HelpCircle,
  Plus,
  Radio,
  Bot,
  CalendarCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function DashboardPage() {
  const { user, isTeacher } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getMyCourses()
      .then((res) => {
        if (res?.data?.courses) {
          setCourses(res.data.courses);
        }
      })
      .catch((err) => console.error('Failed to load courses', err))
      .finally(() => setLoading(false));
  }, []);

  const totalStudents = courses.reduce((acc, c) => acc + (c.studentCount || 0), 0);
  const totalAssignments = courses.reduce((acc, c) => acc + (c.assignmentCount || 0), 0);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-600 to-indigo-800 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>ClassPulse Workspace Active</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-indigo-100 text-sm leading-relaxed">
            {isTeacher
              ? 'Manage your interactive courses, assignments, automated assessments, and live classroom sessions all in one unified workspace.'
              : 'Access your coursework, submit assignments, test your knowledge with interactive quizzes, and study with your grounded AI assistant.'}
          </p>

          {/* Banner Quick CTAs */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-brand-700 text-xs font-extrabold shadow-md hover:bg-indigo-50 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isTeacher ? 'Manage Courses' : 'Browse Courses'}</span>
            </Link>

            <Link
              to="/live"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold shadow-md transition-all"
            >
              <Radio className="w-4 h-4" />
              <span>{isTeacher ? 'Start Live Room' : 'Join Live Room'}</span>
            </Link>

            <Link
              to="/ai/study"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/60 text-white border border-white/20 text-xs font-extrabold transition-all"
            >
              <Bot className="w-4 h-4 text-brand-300" />
              <span>AI Study Assistant</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
        <div className="absolute right-32 top-8 w-40 h-40 rounded-full bg-brand-400/20 pointer-events-none blur-xl"></div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Courses</p>
            <p className="text-2xl font-extrabold text-slate-900">{courses.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            {isTeacher ? <Users className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isTeacher ? 'Students Enrolled' : 'Active Term'}
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {isTeacher ? totalStudents : 'Fall 2026'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignments</p>
            <p className="text-2xl font-extrabold text-slate-900">{totalAssignments}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-2xl font-extrabold text-slate-900">96.4%</p>
          </div>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isTeacher ? 'Your Active Courses' : 'Your Enrolled Courses'}
            </h2>
            <p className="text-xs text-slate-500">
              {isTeacher ? 'Manage syllabus, documents, assignments & roster' : 'Access resources and learning materials'}
            </p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No courses found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {isTeacher
                ? 'Get started by creating your first course to share join codes with students.'
                : 'Join your class using the 6-character course code provided by your instructor.'}
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md hover:bg-brand-700"
            >
              <Plus className="w-4 h-4" />
              <span>{isTeacher ? 'Create Course' : 'Join Course via Code'}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 6).map((course) => (
              <Link
                key={course._id}
                to={`/courses/${course._id}`}
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="primary">{course.subject || 'General'}</Badge>
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                      {course.code}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.studentCount || 0} Students</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.assignmentCount || 0} Assignments</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
