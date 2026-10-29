import { api } from './client';

export const attendanceApi = {
  getCourseAttendance: (courseId) => api.get(`/courses/${courseId}/attendance`),
  getSessionAttendance: (courseId, recordId) => api.get(`/courses/${courseId}/attendance/${recordId}`),
  recordAttendance: (courseId, payload) => api.post(`/courses/${courseId}/attendance`, payload),
  generateSessionCode: (courseId, durationMinutes = 15) =>
    api.post(`/courses/${courseId}/attendance/session-code`, { durationMinutes }),
  studentCheckIn: (code, qrToken) => api.post('/attendance/check-in', { code, qrToken }),
  updateStudentStatus: (recordId, studentId, payload) =>
    api.put(`/attendance/${recordId}/students/${studentId}`, payload),
  deleteRecord: (recordId) => api.delete(`/attendance/${recordId}`),
  importFromSpringBoot: (courseId, payload) =>
    api.post(`/courses/${courseId}/attendance/import-live-session`, payload),
  getReport: (courseId) => api.get(`/courses/${courseId}/attendance/report`),
};
