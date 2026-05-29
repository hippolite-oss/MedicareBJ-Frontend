/**
 * hooks/useQueries.ts — Hooks React Query pour les données API
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dossierService } from "../services/dossierService";
import { rendezVousService } from "../services/rendezVousService";
import { notificationService } from "../services/notificationService";
import { adminService } from "../services/adminService";
import { consultationService } from "../services/consultationService";
import { qrcodeService } from "../services/qrcodeService";
import { paiementService } from "../services/paiementService";
import { messageService } from "../services/messageService";
import { accesService } from "../services/accesService";
import { useAuth } from "../context/AuthContext";

// ── Dossier ───────────────────────────────────────────────
export const useMonDossier = () =>
  useQuery({
    queryKey: ["mon-dossier"],
    queryFn: () => dossierService.getMonDossier(),
    select: (res: any) => res?.data,
  });

export const useDossier = (id: string) =>
  useQuery({
    queryKey: ["dossier", id],
    queryFn: () => dossierService.getDossier(id),
    select: (res: any) => res?.data,
    enabled: !!id,
  });

// ── Rendez-vous ───────────────────────────────────────────
export const useMesRdv = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["mes-rdv", params],
    queryFn: () => rendezVousService.getMesRdv(params),
    select: (res: any) => res?.data,
    refetchOnMount: true, // Toujours refetch au montage
    refetchOnWindowFocus: true, // Refetch quand la fenêtre reprend le focus
    staleTime: 5000, // Considérer les données comme fraîches pendant 5 secondes
  });

export const useAgendaDuJour = () =>
  useQuery({
    queryKey: ["agenda-du-jour"],
    queryFn: () => rendezVousService.getAgendaDuJour(),
    select: (res: any) => res?.data,
  });

export const useRdvEnAttente = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["rdv-en-attente", params],
    queryFn: () => rendezVousService.getRdvEnAttente(params),
    select: (res: any) => res?.data,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

export const useMedecinsDisponibles = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["medecins-disponibles", params],
    queryFn: () => rendezVousService.getMedecinsDisponibles(params),
    select: (res: any) => res?.data,
  });

// ── Notifications ─────────────────────────────────────────
export const useNotifications = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationService.getAll(params),
    select: (res: any) => res?.data,
    refetchOnMount: true, // Toujours refetch au montage
    refetchOnWindowFocus: true, // Refetch quand la fenêtre reprend le focus
  });

export const useNotifCount = () =>
  useQuery({
    queryKey: ["notif-count"],
    queryFn: () => notificationService.getCountNonLues(),
    select: (res: any) => res?.data?.count ?? 0,
    refetchInterval: 120000, // Fallback polling léger (2 min), le temps réel vient du socket
    staleTime: 60000,
    retry: (failureCount, err: any) => {
      if (err?.status === 429) return false;
      return failureCount < 2;
    },
    refetchOnMount: true, // Toujours refetch au montage du composant
    refetchOnWindowFocus: false,
  });

export const useMessageCount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["message-count", user?.id],
    queryFn: () => messageService.getCountNonLus(),
    select: (res: any) => res?.data?.count ?? 0,
    refetchInterval: 120000,
    staleTime: 60000,
    retry: (failureCount, err: any) => {
      if (err?.status === 429) return false;
      return failureCount < 2;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: !!user?.id,
  });
};

// ── Admin ─────────────────────────────────────────────────
export const useAdminStats = () =>
  useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminService.getStats(),
    select: (res: any) => res?.data,
    staleTime: 5 * 60 * 1000,
  });

export const useValidationsEnAttente = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["validations-en-attente", params],
    queryFn: () => adminService.getValidationsEnAttente(params),
    select: (res: any) => res?.data,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

export const useValidationsCount = () =>
  useQuery({
    queryKey: ["validations-count"],
    queryFn: () => adminService.getValidationsEnAttente({ limit: 1 }),
    select: (res: any) => res?.data?.meta?.total ?? 0,
    refetchInterval: 30000, // Polling toutes les 30 secondes
    staleTime: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

export const useUtilisateurs = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["utilisateurs", params],
    queryFn: () => adminService.getUtilisateurs(params),
    select: (res: any) => res?.data,
  });

export const useSignalements = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["signalements", params],
    queryFn: () => adminService.getSignalements(params),
    select: (res: any) => res?.data,
  });

export const useSignalementsEnAttenteCount = () =>
  useQuery({
    queryKey: ["signalements-en-attente-count"],
    queryFn: () => adminService.getSignalementsEnAttenteCount(),
    select: (res: any) => res?.data?.count ?? res?.count ?? 0,
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

export const useHopitaux = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["hopitaux", params],
    queryFn: () => adminService.getHopitaux(params),
    select: (res: any) => res?.data,
    staleTime: 0, // Toujours considérer comme périmé pour forcer le rafraîchissement
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

export const useMedicaments = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["medicaments", params],
    queryFn: () => adminService.getMedicaments(params),
    select: (res: any) => res?.data,
    staleTime: 60 * 60 * 1000,
  });

export const useAudit = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["audit", params],
    queryFn: () => adminService.getAudit(params),
    select: (res: any) => res?.data,
  });

export const useTransactions = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["transactions", params],
    queryFn: () => adminService.getTransactions(params),
    select: (res: any) => res?.data,
  });

export const useDroitsAcces = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["droits-acces", params],
    queryFn: () => adminService.getDroitsAcces(params),
    select: (res: any) => res?.data,
  });

// ── Consultations ─────────────────────────────────────────
export const useMesConsultations = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["mes-consultations", params],
    queryFn: () => consultationService.getMesConsultations(params),
    select: (res: any) => res?.data,
  });

// ── Mes patients (médecin) ────────────────────────────────
export const useMesPatientsMediacin = () =>
  useQuery({
    queryKey: ["mes-patients-medecin"],
    queryFn: () => dossierService.getMesPatients(),
    select: (res: any) => res?.data,
    refetchOnMount: true,
  });

// ── QR Codes ──────────────────────────────────────────────
export const useMesCodesQR = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["mes-codes-qr", params],
    queryFn: () => qrcodeService.getMesCodes(params),
    select: (res: any) => res?.data,
  });

// ── Paiements ─────────────────────────────────────────────
export const useMesPaiements = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ["mes-paiements", params],
    queryFn: () => paiementService.getMesPaiements(params),
    select: (res: any) => res?.data,
  });

// ── Messages ──────────────────────────────────────────────
export const useConversations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => messageService.getConversations(),
    select: (res: any) => res?.data,
    enabled: !!user?.id,
  });
};

// ── Accès dossier ─────────────────────────────────────────
export const useMonDossierAcces = () =>
  useQuery({
    queryKey: ["mon-dossier-acces"],
    queryFn: () => accesService.getMonDossierAcces(),
    select: (res: any) => res?.data,
  });

// ── Mutations ─────────────────────────────────────────────
export const useCreerRdv = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      rendezVousService.creer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mes-rdv"] });
      qc.invalidateQueries({ queryKey: ["agenda-du-jour"] });
    },
  });
};

export const useValiderMedecin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.validerMedecin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["validations-en-attente"] });
      qc.invalidateQueries({ queryKey: ["validations-count"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useRejeterMedecin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif_rejet }: { id: string; motif_rejet: string }) =>
      adminService.rejeterMedecin(id, motif_rejet),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["validations-en-attente"] });
      qc.invalidateQueries({ queryKey: ["validations-count"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useGenererQR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      duree_heures: number;
      type_acces: "lecture" | "ecriture";
    }) => qrcodeService.generer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mes-codes-qr"] });
    },
  });
};

export const useRevoquerQR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qrcodeService.revoquer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mes-codes-qr"] });
    },
  });
};

export const useSupprimerQR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => qrcodeService.supprimer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mes-codes-qr"] });
    },
  });
};

export const useHistoriqueScansQR = (id: string) =>
  useQuery({
    queryKey: ["historique-scans-qr", id],
    queryFn: async () => {
      const res = await qrcodeService.getHistoriqueScans(id);
      return res.data;
    },
    enabled: !!id,
  });

export const useMarquerNotifLue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.marquerLue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
    },
  });
};

export const useToutLireNotifs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.toutLire(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
    },
  });
};
