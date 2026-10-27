import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coursesApi } from '../../api/courses';
import { assignmentsApi } from '../../api/assignments';
import {
  FileCheck2,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Award
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AssignmentsPage() {
  const { isTeacher } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getMyCourses()
      .then(async (res) => {
        const fetchedCourses = res?.data?.courses || [];
        setCourses(fetchedCourses);

        // Fetch assignments for all courses
        const allAssignments = [];
        for (const course of fetchedCourses) {
          try {
            const assignRes = await assignmentsApi.getCourseAssignments(course._id);
            const courseAssigns = (assignRes?.data?.assignments || []).map((a) => ({
              ...a,
              courseTitle: course.title,
              courseCode: course.code,
              courseId: course._id,
            }));
            allAssignments.push(...courseAssigns);
          } catch (err) {
            console.error(`Failed to load assignments for course ${course._id}`, err);
          }
        }
        setAssignments(allAssignments);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredAssignments = selectedCourseId === 'all'
    ? assignments
    : assignments.filter((a) => a.courseId === selectedCourseId);

  if (loading) {
    return <LoadingSpinner text="Loading assignments & coursework..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileCheck2 className="w-7 h-7 text-brand-600" />
            <span>Assignments & Coursework</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher
              ? 'Track student submissions, deadlines, and grade rubric evaluations across all your classes.'
              : 'View all upcoming assignments, submission statuses, receipts, and graded feedback.'}
          </p>
        </div>

        {/* Course Filter */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all">All Courses ({assignments.length})</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code}: {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <FileCheck2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No assignments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {isTeacher
              ? 'Create assignments inside any course workspace to collect student submissions.'
              : 'You have no assignments due for the selected course filter.'}
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
          {filteredAssignments.map((assignment) => {
            const dueDate = new Date(assignment.dueDate);
            const isPast = dueDate < new Date();

            return (
              <div
                key={assignment._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-extrabold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg border border-brand-100">
                      {assignment.courseCode}
                    </span>
                    <Badge variant={isPast ? 'danger' : 'success'}>
                      {isPast ? 'Past Due' : 'Active'}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {assignment.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{assignment.totalMarks} Marks</span>
                    </div>
                  </div>

                  <Link
                    to={`/courses/${assignment.courseId}?tab=assignments`}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-brand-50 text-brand-700 font-bold text-xs border border-slate-200/80 transition-all"
                  >
                    <span>{isTeacher ? 'View & Grade' : 'Open / Submit'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
