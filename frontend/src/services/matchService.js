import api from './api';

export const matchService = {
  async analyzeMatch(resumeId, jobId) {
    const response = await api.post('/matching/analyze/', {
      resume_id: resumeId,
      job_id: jobId,
    });
    return response.data;
  },

  async getMatchHistory() {
    const response = await api.get('/matching/history/');
    return response.data;
  },

  async getMatchDetail(id) {
    const response = await api.get(`/matching/${id}/`);
    return response.data;
  }
};
