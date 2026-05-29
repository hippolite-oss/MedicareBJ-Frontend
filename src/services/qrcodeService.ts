import api from './api';

export const qrcodeService = {
  generer: (data: { 
    duree_heures: number; 
    type_acces: 'lecture' | 'ecriture';
  }) =>
    api.post('/qrcodes/generer', data),

  getMesCodes: (params?: Record<string, unknown>) =>
    api.get('/qrcodes/mes-codes', { params }),

  scanner: (token: string) =>
    api.post('/qrcodes/scanner', { token }),

  revoquer: (id: string) =>
    api.patch(`/qrcodes/${id}/revoquer`),

  supprimer: (id: string) =>
    api.delete(`/qrcodes/${id}`),

  getHistoriqueScans: (id: string) =>
    api.get(`/qrcodes/${id}/historique`),
};
