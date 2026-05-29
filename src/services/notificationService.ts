import api from './api';

export const notificationService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/notifications', { params }),

  getCountNonLues: () =>
    api.get('/notifications/count-non-lues'),

  marquerLue: (id: string) =>
    api.patch(`/notifications/${id}/lire`),

  toutLire: () =>
    api.patch('/notifications/tout-lire'),

  supprimer: (id: string) =>
    api.delete(`/notifications/${id}`),
};
