import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coursesApi } from '../../api/courses';
import { assessmentsApi } from '../../api/assessments';
import {
  HelpCircle,
  Clock,
  Award,
  ArrowRight,
  Filter,
  CheckCircle2,
  Sparkles,
  Play
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AssessmentsPage() {
  const { isTeacher } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getMyCourses()
      .then(async (res) => {
        const fetchedCourses = res?.data?.courses || [];
        setCourses(fetchedCourses);

        // Fetch assessments for all courses
        const allAssessments = [];
        for (const course of fetchedCourses) {
          try {
            const assessRes = await assessmentsApi.getCourseAssessments(course._id);
            const courseAssess = (assessRes?.data?.assessments || []).map((a) => ({
              ...a,
              courseTitle: course.title,
              courseCode: course.code,
              courseId: course._id,
            }));
            allAssessments.push(...courseAssess);
          } catch (err) {
            console.error(`Failed to load assessments for course ${course._id}`, err);
          }
        }
        setAssessments(allAssessments);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredAssessments = selectedCourseId === 'all'
    ? assessments
    : assessments.filter((a) => a.courseId === selectedCourseId);

  if (loading) {
    return <LoadingSpinner text="Loading quizzes & assessments..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <HelpCircle className="w-7 h-7 text-brand-600" />
            <span>Assessments & Quizzes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher
              ? 'Manage automated objective evaluations, timed tests, and question banks.'
              : 'Take timed course assessments with instant auto-grading feedback.'}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all">All Courses ({assessments.length})</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code}: {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assessment List */}
      {filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No assessments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {isTeacher
              ? 'Create a quiz in your course workspace or generate questions with the AI Question Bank.'
              : 'No quizzes currently scheduled for the selected filter.'}
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-all"
          >
            <span>Go to Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssessments.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-extrabold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg border border-brand-100">
                    {quiz.courseCode}
                  </span>
                  <Badge variant="success">Auto-Graded</Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {quiz.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duration: {quiz.durationMinutes || 30} mins</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{quiz.totalMarks || 100} Total Marks</span>
                  </div>
                </div>

                {isTeacher ? (
                  <Link
                    to={`/courses/${quiz.courseId}?tab=assessments`}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-brand-50 text-brand-700 font-bold text-xs border border-slate-200/80 transition-all"
                  >
                    <span>Manage / Results</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    to={`/assessments/${quiz._id}/take`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Quiz</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
