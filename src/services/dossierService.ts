import api from "./api";

export const dossierService = {
  getMonDossier: () => api.get("/dossiers/mon-dossier"),

  getMesPatients: () => api.get("/dossiers/medecin/mes-patients"),

  getDossier: (id: string) => api.get(`/dossiers/${id}`),

  getConsultations: (id: string, params?: Record<string, unknown>) =>
    api.get(`/dossiers/${id}/consultations`, { params }),

  getPrescriptions: (id: string, params?: Record<string, unknown>) =>
    api.get(`/dossiers/${id}/prescriptions`, { params }),

  getAnalyses: (id: string, params?: Record<string, unknown>) =>
    api.get(`/dossiers/${id}/analyses`, { params }),

  updateProfilMedical: (id: string, data: Record<string, unknown>) =>
    api.patch(`/dossiers/${id}/profil-medical`, data),
};
