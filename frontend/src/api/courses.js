import { api } from './client';

export const coursesApi = {
  getMyCourses: () => api.get('/courses'),
  createCourse: (payload) => api.post('/courses', payload),
  enrollByCode: (code) => api.post('/courses/enroll', { code }),
  getCourseById: (courseId) => api.get(`/courses/${courseId}`),
  updateCourse: (courseId, payload) => api.put(`/courses/${courseId}`, payload),
  archiveCourse: (courseId) => api.delete(`/courses/${courseId}`),
  getRoster: (courseId) => api.get(`/courses/${courseId}/students`),
  removeStudent: (courseId, studentId) => api.delete(`/courses/${courseId}/students/${studentId}`),
  
  // Modules
  getModules: (courseId) => api.get(`/courses/${courseId}/modules`),
  createModule: (courseId, payload) => api.post(`/courses/${courseId}/modules`, payload),
  updateModule: (courseId, moduleId, payload) => api.put(`/courses/${courseId}/modules/${moduleId}`, payload),
  deleteModule: (courseId, moduleId) => api.delete(`/courses/${courseId}/modules/${moduleId}`),

  // Resources
  getResources: (courseId) => api.get(`/courses/${courseId}/resources`),
  uploadResource: (courseId, formData) => api.post(`/courses/${courseId}/resources`, formData),
  deleteResource: (courseId, resourceId) => api.delete(`/courses/${courseId}/resources/${resourceId}`),
  processResourceRAG: (resourceId) => api.post(`/resources/${resourceId}/process`),
};
