import { api } from './client';

export const aiApi = {
  generateQuestions: (courseId, payload) => api.post(`/courses/${courseId}/questions/generate`, payload),
  studyChat: (courseId, payload) => api.post(`/courses/${courseId}/study-chat`, payload),
  getChatHistory: (courseId) => api.get(`/courses/${courseId}/study-chat/history`),
  clearChatSession: (sessionId) => api.delete(`/ai/study-chat/${sessionId}`),
};
