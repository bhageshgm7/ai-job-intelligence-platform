import api from './api';

export const resumeService = {
  async getResumes() {
    const response = await api.get('/resumes/');
    return response.data;
  },

  async uploadResume(title, file) {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    const response = await api.post('/resumes/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteResume(id) {
    const response = await api.delete(`/resumes/${id}/`);
    return response.data;
  },

  async setActiveResume(id) {
    const response = await api.post(`/resumes/${id}/set-active/`);
    return response.data;
  },

  async getAiImprovements(id) {
    const response = await api.post(`/resumes/${id}/improve/`);
    return response.data;
  }
};
