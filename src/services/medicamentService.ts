/**
 * services/medicamentService.ts — Service pour la gestion des médicaments
 */
import api from './api';

export interface Medicament {
  id: string;
  nom: string;
  dosage: string;
  forme: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicamentSearchResult {
  medicaments: Medicament[];
}

export interface MedicamentListResult {
  medicaments: Medicament[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateMedicamentData {
  nom: string;
  dosage: string;
  forme?: string;
}

export interface UpdateMedicamentData {
  nom?: string;
  dosage?: string;
  forme?: string;
}

const medicamentService = {
  /**
   * Rechercher des médicaments (autocomplete)
   */
  async search(query: string): Promise<Medicament[]> {
    const response: any = await api.get(`/medicaments/search`, {
      params: { q: query }
    });
    return response.data.medicaments;
  },

  /**
   * Obtenir la liste paginée des médicaments
   */
  async getAll(page = 1, limit = 50, search = ''): Promise<MedicamentListResult> {
    const response: any = await api.get('/medicaments', {
      params: { page, limit, search }
    });
    return response.data;
  },

  /**
   * Obtenir un médicament par ID
   */
  async getById(id: string): Promise<Medicament> {
    const response: any = await api.get(`/medicaments/${id}`);
    return response.data.medicament;
  },

  /**
   * Créer un nouveau médicament (admin uniquement)
   */
  async create(data: CreateMedicamentData): Promise<Medicament> {
    const response: any = await api.post('/medicaments', data);
    return response.data.medicament;
  },

  /**
   * Mettre à jour un médicament (admin uniquement)
   */
  async update(id: string, data: UpdateMedicamentData): Promise<Medicament> {
    const response: any = await api.put(`/medicaments/${id}`, data);
    return response.data.medicament;
  },

  /**
   * Supprimer un médicament (admin uniquement)
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/medicaments/${id}`);
  },
};

export default medicamentService;
