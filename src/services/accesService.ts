import api from './api';

export const accesService = {
  getMonDossierAcces: () =>
    api.get('/acces/mon-dossier'),

  accorder: (data: { id_professionnel: string; type_acces: string; duree_jours?: number }) =>
    api.post('/acces/accorder', data),

  revoquer: (id: string) =>
    api.patch(`/acces/${id}/revoquer`),

  getJournal: (params?: Record<string, unknown>) =>
    api.get('/acces/journal', { params }),
};
