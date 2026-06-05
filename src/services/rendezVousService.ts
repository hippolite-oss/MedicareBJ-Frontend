import api from './api';

export const rendezVousService = {
  getMedecinsDisponibles: (params?: Record<string, unknown>) =>
    api.get('/rendezvous/medecins-disponibles', { params }),

  getDisponibilites: (id_medecin: string, params?: Record<string, unknown>) =>
    api.get(`/rendezvous/disponibilites/${id_medecin}`, { params }),

  creer: (data: Record<string, unknown>) =>
    api.post('/rendezvous', data),

  demandePaiement: (data: Record<string, unknown>) =>
    api.post('/rendezvous/demande-paiement', data),

  getMesRdv: (params?: Record<string, unknown>) =>
    api.get('/rendezvous/mes-rdv', { params }),

  getAgendaDuJour: () =>
    api.get('/rendezvous/agenda-du-jour'),

  getRdvEnAttente: (params?: Record<string, unknown>) =>
    api.get('/rendezvous/en-attente', { params }),

  updateStatut: (id: string, statut: string, motif_annulation?: string) =>
    api.patch(`/rendezvous/${id}/statut`, { statut, motif_annulation }),
};
