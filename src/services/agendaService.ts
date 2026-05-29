/**
 * services/agendaService.ts — Service pour la gestion de l'agenda médecin
 */
import api from './api';

export interface CreneauBloque {
  id?: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  type_entree: 'bloque' | 'conge' | 'formation' | 'autre';
  notes?: string;
}

export const agendaService = {
  /**
   * Récupérer l'agenda du médecin
   */
  async getMonAgenda(params?: { date_debut?: string; date_fin?: string }) {
    return api.get('/agenda/mon-agenda', { params });
  },

  /**
   * Bloquer un créneau
   */
  async bloquer(data: CreneauBloque) {
    return api.post('/agenda/bloquer', data);
  },

  /**
   * Modifier un créneau bloqué
   */
  async update(id: string, data: Partial<CreneauBloque>) {
    return api.patch(`/agenda/${id}`, data);
  },

  /**
   * Supprimer un créneau bloqué
   */
  async delete(id: string) {
    return api.delete(`/agenda/${id}`);
  },
};
