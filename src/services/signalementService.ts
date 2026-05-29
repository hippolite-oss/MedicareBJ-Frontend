import api from './api';

export const signalementService = {
  creer: (data: { id_cible: string; motif: string }) =>
    api.post('/signalements', data),
};
