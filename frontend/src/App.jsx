import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CoursesPage from './pages/courses/CoursesPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import TakeAssessmentPage from './pages/assessments/TakeAssessmentPage';
import StudyAssistantPage from './pages/ai/StudyAssistantPage';
import QuestionGeneratorPage from './pages/ai/QuestionGeneratorPage';
import AttendancePage from './pages/attendance/AttendancePage';
import LiveClassroomPage from './pages/live/LiveClassroomPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Learning Workspace Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:courseId" element={<CourseDetailPage />} />
            <Route path="assignments" element={<CoursesPage />} />
            <Route path="assessments" element={<CoursesPage />} />
            <Route path="assessments/:assessmentId/take" element={<TakeAssessmentPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="ai/study" element={<StudyAssistantPage />} />
            <Route path="ai/generator" element={<QuestionGeneratorPage />} />
            <Route path="live" element={<LiveClassroomPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
