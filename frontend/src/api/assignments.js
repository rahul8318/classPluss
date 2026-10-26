import { api } from './client';

export const assignmentsApi = {
  getCourseAssignments: (courseId) => api.get(`/courses/${courseId}/assignments`),
  createAssignment: (courseId, payload) => api.post(`/courses/${courseId}/assignments`, payload),
  getAssignmentById: (assignmentId) => api.get(`/assignments/${assignmentId}`),
  updateAssignment: (assignmentId, payload) => api.put(`/assignments/${assignmentId}`, payload),
  deleteAssignment: (assignmentId) => api.delete(`/assignments/${assignmentId}`),

  // Submissions
  submitWork: (assignmentId, formDataOrJson) => api.post(`/assignments/${assignmentId}/submissions`, formDataOrJson),
  getMySubmission: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions/my`),
  getAssignmentSubmissions: (assignmentId, status) =>
    api.get(`/assignments/${assignmentId}/submissions${status ? `?status=${status}` : ''}`),
  gradeSubmission: (submissionId, payload) => api.post(`/submissions/${submissionId}/grade`, payload),
  requestResubmission: (submissionId, reason) => api.post(`/submissions/resubmit/${submissionId}`, { reason }),

  // Gradebook
  getCourseGradebook: (courseId) => api.get(`/courses/${courseId}/gradebook`),
  getMyGrades: (courseId) => api.get(`/courses/${courseId}/my-grades`),
};
