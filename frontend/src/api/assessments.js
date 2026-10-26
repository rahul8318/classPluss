import { api } from './client';

export const assessmentsApi = {
  getCourseAssessments: (courseId) => api.get(`/courses/${courseId}/assessments`),
  createAssessment: (courseId, payload) => api.post(`/courses/${courseId}/assessments`, payload),
  getAssessmentById: (assessmentId) => api.get(`/assessments/${assessmentId}`),
  
  // Attempt Workflow
  startAttempt: (assessmentId) => api.post(`/assessments/${assessmentId}/start`),
  submitAttempt: (attemptId, answers) => api.post(`/attempts/${attemptId}/submit`, { answers }),
  getResults: (assessmentId) => api.get(`/assessments/${assessmentId}/results`),
  gradeSubjective: (attemptId, questionId, payload) =>
    api.put(`/attempts/${attemptId}/questions/${questionId}/grade`, payload),

  // Question Banks
  getQuestionBanks: (courseId) => api.get(`/courses/${courseId}/question-banks`),
  createQuestionBank: (courseId, payload) => api.post(`/courses/${courseId}/question-banks`, payload),
  getQuestionBankById: (bankId) => api.get(`/question-banks/${bankId}`),
  addQuestion: (bankId, payload) => api.post(`/question-banks/${bankId}/questions`, payload),
  deleteQuestion: (bankId, questionId) => api.delete(`/question-banks/${bankId}/questions/${questionId}`),
};
