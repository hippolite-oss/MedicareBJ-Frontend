import api from './api';

export const adminService = {
  getStats: () =>
    api.get('/admin/stats'),

  getValidationsEnAttente: (params?: Record<string, unknown>) =>
    api.get('/admin/validations/en-attente', { params }),

  validerMedecin: (id: string) =>
    api.post(`/admin/validations/${id}/valider`),

  rejeterMedecin: (id: string, motif_rejet: string) =>
    api.post(`/admin/validations/${id}/rejeter`, { motif_rejet }),

  getSignalements: (params?: Record<string, unknown>) =>
    api.get('/signalements', { params }),

  getSignalementsEnAttenteCount: () =>
    api.get('/signalements/en-attente/count'),

  traiterSignalement: (id: string, data: Record<string, unknown>) =>
    api.patch(`/signalements/${id}/traiter`, data),

  getUtilisateurs: (params?: Record<string, unknown>) =>
    api.get('/utilisateurs', { params }),

  updateStatutUtilisateur: (id: string, statut: string) =>
    api.patch(`/utilisateurs/${id}/statut`, { statut }),

  getHopitaux: (params?: Record<string, unknown>) =>
    api.get('/hopitaux', { params }),

  creerHopital: (data: Record<string, unknown>) =>
    api.post('/hopitaux', data),

  updateHopital: (id: string, data: Record<string, unknown>) =>
    api.patch(`/hopitaux/${id}`, data),

  deleteHopital: (id: string) =>
    api.delete(`/hopitaux/${id}`),

  getMedicaments: (params?: Record<string, unknown>) =>
    api.get('/medicaments', { params }),

  creerMedicament: (data: Record<string, unknown>) =>
    api.post('/medicaments', data),

  updateMedicament: (id: string, data: Record<string, unknown>) =>
    api.put(`/medicaments/${id}`, data),

  deleteMedicament: (id: string) =>
    api.delete(`/medicaments/${id}`),

  getAudit: (params?: Record<string, unknown>) =>
    api.get('/audit', { params }),

  exportAudit: (params?: Record<string, unknown>) =>
    api.get('/audit/export', { params }),

  getTransactions: (params?: Record<string, unknown>) =>
    api.get('/paiements', { params }),

  getDroitsAcces: (params?: Record<string, unknown>) =>
    api.get('/admin/droits-acces', { params }),

  revoquerAcces: (id: string) =>
    api.patch(`/admin/droits-acces/${id}/revoquer`),
};
