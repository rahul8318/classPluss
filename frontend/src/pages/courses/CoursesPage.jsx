import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coursesApi } from '../../api/courses';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  FileCheck2,
  FolderOpen,
  KeyRound,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CoursesPage() {
  const { isTeacher } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science');
  const [newLevel, setNewLevel] = useState('Intermediate');
  const [newTerm, setNewTerm] = useState('Fall 2026');
  const [newDescription, setNewDescription] = useState('');

  // Join Form State
  const [joinCode, setJoinCode] = useState('');

  const loadCourses = () => {
    setLoading(true);
    coursesApi.getMyCourses()
      .then((res) => {
        if (res?.data?.courses) {
          setCourses(res.data.courses);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await coursesApi.createCourse({
        title: newTitle,
        subject: newSubject,
        level: newLevel,
        term: newTerm,
        description: newDescription,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      loadCourses();
    } catch (err) {
      setFormError(err.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinCourse = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await coursesApi.enrollByCode(joinCode.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCode('');
      loadCourses();
    } catch (err) {
      setFormError(err.message || 'Failed to join course. Check your course code.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.subject && c.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Courses & Learning Spaces
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher
              ? 'Organize curriculum, invite students via code, and manage modules'
              : 'View your enrolled subjects and access course materials'}
          </p>
        </div>

        {/* Action Button */}
        <div>
          {isTeacher ? (
            <button
              onClick={() => {
                setFormError('');
                setShowCreateModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setFormError('');
                setShowJoinModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>Join with Course Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by course title, subject, or code..."
          className="w-full text-xs font-medium focus:outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Course List */}
      {loading ? (
        <LoadingSpinner text="Loading courses..." />
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No courses match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher ? 'Create a new course to get started.' : 'Ask your instructor for a course code to enroll.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-lg transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="primary">{course.subject || 'General'}</Badge>

                  {/* Course Join Code Pill */}
                  <button
                    onClick={() => copyCode(course.code)}
                    title="Click to copy join code"
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-slate-700 text-xs font-mono font-bold transition-colors"
                  >
                    <span>{course.code}</span>
                    {copiedCode === course.code ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </div>

                <Link to={`/courses/${course._id}`}>
                  <h3 className="text-base font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                </Link>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {course.description || 'No course overview provided yet.'}
                </p>

                <div className="mt-3 flex items-center space-x-3 text-[11px] text-slate-400 font-medium">
                  <span>Level: {course.level || 'Intermediate'}</span>
                  <span>•</span>
                  <span>{course.term || 'Current Term'}</span>
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center space-x-4 text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.studentCount || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.moduleCount || 0} modules</span>
                  </span>
                </div>

                <Link
                  to={`/courses/${course._id}`}
                  className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors"
                >
                  Enter Course →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Learning Space"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          {formError && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Title *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Distributed Systems & Cloud Architectures"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Computer Science"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Level</label>
              <select
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-medium"
              >
                <option value="Introductory">Introductory</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Academic Term</label>
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Fall 2026"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Brief course objectives and overview..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Join Course Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Course by Invite Code"
      >
        <form onSubmit={handleJoinCourse} className="space-y-4">
          {formError && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Code</label>
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g. CP-8921"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono uppercase text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 text-center">
              Enter the unique 6-character code provided by your instructor.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowJoinModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {submitting ? 'Joining...' : 'Join Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
