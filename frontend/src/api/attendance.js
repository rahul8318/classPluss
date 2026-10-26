import { api } from './client';

export const attendanceApi = {
  getCourseAttendance: (courseId) => api.get(`/courses/${courseId}/attendance`),
  recordAttendance: (courseId, payload) => api.post(`/courses/${courseId}/attendance`, payload),
  generateSessionCode: (courseId, durationMinutes = 15) =>
    api.post(`/courses/${courseId}/attendance/session-code`, { durationMinutes }),
  studentCheckIn: (code, qrToken) => api.post('/attendance/check-in', { code, qrToken }),
  updateStudentStatus: (recordId, studentId, payload) =>
    api.put(`/attendance/${recordId}/students/${studentId}`, payload),
  importFromSpringBoot: (courseId, payload) =>
    api.post(`/courses/${courseId}/attendance/import-live-session`, payload),
  getReport: (courseId) => api.get(`/courses/${courseId}/attendance/report`),
};
