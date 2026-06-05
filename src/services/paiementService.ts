import api from './api';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export const paiementService = {
  initier: (data: Record<string, unknown>) =>
    api.post('/paiements/initier', data),

  getMesPaiements: (params?: Record<string, unknown>) =>
    api.get('/paiements/mes-paiements', { params }),

  getRecu: async (id: string): Promise<Blob> => {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${BASE_URL}/paiements/${id}/recu`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  listAdmin: (params?: Record<string, unknown>) =>
    api.get('/paiements', { params }),

  verifierStatut: (id: string) =>
    api.get(`/paiements/${id}/verifier`),
};
