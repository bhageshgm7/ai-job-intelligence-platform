import api from './api';

export const dashboardService = {
  async getDashboardData() {
    const response = await api.get('/dashboard/');
    return response.data;
  }
};
