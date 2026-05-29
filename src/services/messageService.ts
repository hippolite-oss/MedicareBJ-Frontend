import api from "./api";

export const messageService = {
  getConversations: () => api.get("/messages/conversations"),

  getConversation: (id_utilisateur: string, params?: Record<string, unknown>) =>
    api.get(`/messages/conversation/${id_utilisateur}`, { params }),

  envoyer: (data: {
    id_destinataire: string;
    contenu?: string;
    type_message?: "texte" | "image" | "fichier" | "qr";
    media_url?: string;
    nom_fichier?: string;
    mime_type?: string;
    taille_fichier?: number;
  }) => api.post("/messages/envoyer", data),

  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append("fichier", file);
    return api.post("/uploads/message-media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  supprimer: (id: string) => api.delete(`/messages/${id}`),

  marquerLu: (id_expediteur: string) =>
    api.patch(`/messages/marquer-lu/${id_expediteur}`),

  getCountNonLus: () => api.get("/messages/count-non-lus"),
};
