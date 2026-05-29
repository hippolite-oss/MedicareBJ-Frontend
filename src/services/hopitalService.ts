import api from './api';

export const hopitalService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/hopitaux', { params }),

  getById: (id: string) =>
    api.get(`/hopitaux/${id}`),
};
