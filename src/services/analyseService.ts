import api from './api';

export const analyseService = {
  creer: (data: {
    id_consultation: string;
    id_dossier: string;
    type_analyse: string;
  }) => api.post('/analyses', data),

  updateResultats: (id: string, data: {
    resultat: string;
    interpretation?: string;
    statut?: string;
  }) => api.patch(`/analyses/${id}/resultats`, data),

  getById: (id: string) => api.get(`/analyses/${id}`),

  mesAnalyses: (params?: Record<string, unknown>) =>
    api.get('/analyses/medecin/mes-analyses', { params }),
};
