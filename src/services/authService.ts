import api from './api';

export const authService = {
  login: (credentials: { email: string; mot_de_passe: string }) =>
    api.post('/auth/login', credentials),

  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),

  registerPro: (data: Record<string, unknown>) =>
    api.post('/auth/register/pro', data),

  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refreshToken }),

  getMe: () =>
    api.get('/auth/me'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, nouveau_mot_de_passe: string) =>
    api.post('/auth/reset-password', { token, nouveau_mot_de_passe }),
};
