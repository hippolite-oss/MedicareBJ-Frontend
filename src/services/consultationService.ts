import api from './api';

export const consultationService = {
  creer: (data: Record<string, unknown>) =>
    api.post('/consultations', data),

  getById: (id: string) =>
    api.get(`/consultations/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/consultations/${id}`, data),

  getMesConsultations: (params?: Record<string, unknown>) =>
    api.get('/consultations/medecin/mes-consultations', { params }),
};
