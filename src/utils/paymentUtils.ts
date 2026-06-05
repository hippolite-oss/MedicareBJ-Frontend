import { paiementService } from "@/services/paiementService";
import { isValidTelephoneBJ, normalizeTelephoneBJ } from "@/utils/telephone";

export const fmtFcfa = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

export const TARIF_CONSULTATION_RDV = 5000;

export type PaymentMode = "mtn_money" | "moov_money" | "fedapay";

export function getPaiementLabel(p: {
  id_rdv?: string | null;
  id_consultation?: string | null;
  metadata?: { type?: string; hopital?: { nom?: string } };
  rendezvous?: { motif?: string; medecin?: { prenom?: string; nom?: string } };
}) {
  if (p.rendezvous) {
    const med = p.rendezvous.medecin;
    const medLabel = med ? `Dr. ${med.prenom} ${med.nom}` : "Rendez-vous";
    return `Consultation — ${medLabel}`;
  }
  if (p.metadata?.type === "consultation_rdv") {
    const hopital = p.metadata.hopital?.nom;
    return hopital ? `Consultation RDV — ${hopital}` : "Consultation (rendez-vous)";
  }
  if (p.id_rdv) return "Rendez-vous";
  if (p.id_consultation) return "Consultation";
  return "Paiement";
}

export async function pollPaymentStatus(
  id: string,
  maxAttempts = 20,
  intervalMs = 3000,
): Promise<"complete" | "echoue" | "timeout"> {
  for (let i = 0; i < maxAttempts; i++) {
    const res: any = await paiementService.verifierStatut(id);
    const statut = res?.data?.statut;
    if (statut === "complete") return "complete";
    if (statut === "echoue") return "echoue";
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return "timeout";
}

export async function processPaymentInitiation(
  idPaiement: string,
  montant: number,
  mode: PaymentMode,
  telephone: string,
): Promise<{ ok: true; rdvCreated: boolean } | { ok: false; message: string }> {
  if (mode !== "fedapay" && !isValidTelephoneBJ(telephone)) {
    return { ok: false, message: "Numéro invalide. Format : +22901XXXXXXXX ou 01XXXXXXXX" };
  }

  const normalizedPhone = mode === "fedapay" ? telephone : normalizeTelephoneBJ(telephone) ?? telephone;

  const res: any = await paiementService.initier({
    id_paiement: idPaiement,
    montant,
    mode_paiement: mode,
    telephone: normalizedPhone,
  });

  const data = res?.data ?? res;
  if (data?.payment_url && !data?.sans_redirection) {
    window.location.href = data.payment_url;
    return { ok: true, rdvCreated: false };
  }

  const statut = await pollPaymentStatus(idPaiement);
  if (statut === "complete") {
    const verify: any = await paiementService.verifierStatut(idPaiement);
    return { ok: true, rdvCreated: !!verify?.data?.id_rdv };
  }
  if (statut === "echoue") {
    return { ok: false, message: "Le paiement a échoué. Réessayez." };
  }
  return {
    ok: false,
    message: "Paiement en cours — confirmez sur votre téléphone puis vérifiez dans Paiements.",
  };
}
