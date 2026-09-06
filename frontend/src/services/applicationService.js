import api from './api';

export const applicationService = {
  async getApplications(params = {}) {
    const response = await api.get('/applications/', { params });
    return response.data;
  },

  async getApplication(id) {
    const response = await api.get(`/applications/${id}/`);
    return response.data;
  },

  async createApplication(data) {
    const response = await api.post('/applications/', data);
    return response.data;
  },

  async updateApplication(id, data) {
    const response = await api.patch(`/applications/${id}/`, data);
    return response.data;
  },

  async deleteApplication(id) {
    const response = await api.delete(`/applications/${id}/`);
    return response.data;
  }
};
