import api from "./api";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api/v1";

export const prescriptionService = {
  creer: (data: Record<string, unknown>) => api.post("/prescriptions", data),

  getById: (id: string) => api.get(`/prescriptions/${id}`),

  getPdf: async (id: string): Promise<Blob> => {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get(`${BASE_URL}/prescriptions/${id}/pdf`, {
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateStatut: (id: string, statut: string) =>
    api.patch(`/prescriptions/${id}/statut`, { statut }),

  renouveler: (data: {
    id_prescription_source?: string;
    id_dossier: string;
    motif_consultation?: string;
    diagnostic_consultation?: string;
    medicaments: Array<{
      nom_medicament: string;
      dosage: string;
      forme: string;
      frequence: string;
      duree_jours?: number;
      instructions?: string;
    }>;
    instructions_generales?: string;
  }) => api.post("/prescriptions/renouveler", data),

  supprimer: (id: string) => api.delete(`/prescriptions/${id}`),
};
