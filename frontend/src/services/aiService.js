import api from './api';

export const aiService = {
  async askQuestion(question) {
    const response = await api.post('/ai/ask/', { question });
    return response.data;
  },

  async getHistory() {
    const response = await api.get('/ai/history/');
    return response.data;
  },

  async clearHistory() {
    const response = await api.delete('/ai/history/');
    return response.data;
  },

  async checkStatus() {
    const response = await api.get('/ai/status/');
    return response.data;
  }
};
