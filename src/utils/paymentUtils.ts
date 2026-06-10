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

/**
 * Ouvre le modal FedaPay avec le token reçu du backend.
 * Retourne une Promise qui se résout quand le paiement est complété ou fermé.
 */
function ouvrirModalFedaPay(token: string): Promise<"complete" | "close"> {
  return new Promise((resolve) => {
    const env = import.meta.env.VITE_FEDAPAY_ENV === "live" ? "live" : "sandbox";

    // FedaPay injecté via le script dans index.html
    const FedaPay = (window as any).FedaPay;
    if (!FedaPay) {
      console.error("FedaPay widget non chargé");
      resolve("close");
      return;
    }

    FedaPay.init({
      public_key: import.meta.env.VITE_FEDAPAY_PUBLIC_KEY,
      transaction: { token },
      environment: env,
      onComplete(resp: any) {
        const status = String(resp?.reason || "").toLowerCase();
        if (status === "approved" || status === "complete" || status === "completed") {
          resolve("complete");
        } else {
          resolve("close");
        }
      },
    }).open();
  });
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

  const normalizedPhone =
    mode === "fedapay" ? telephone : normalizeTelephoneBJ(telephone) ?? telephone;

  const res: any = await paiementService.initier({
    id_paiement: idPaiement,
    montant,
    mode_paiement: mode,
    telephone: normalizedPhone,
  });

  const data = res?.data ?? res;

  // Mode Mobile Money (MTN / Moov) — pas de redirection, polling
  if (data?.sans_redirection) {
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

  // Mode FedaPay carte — ouvrir le MODAL officiel FedaPay avec le token
  if (data?.payment_token) {
    const modalResult = await ouvrirModalFedaPay(data.payment_token);

    if (modalResult === "complete") {
      // Vérifier le statut réel côté backend après confirmation du modal
      const statut = await pollPaymentStatus(idPaiement, 10, 2000);
      if (statut === "complete") {
        const verify: any = await paiementService.verifierStatut(idPaiement);
        return { ok: true, rdvCreated: !!verify?.data?.id_rdv };
      }
      return { ok: true, rdvCreated: false };
    }

    return { ok: false, message: "Paiement annulé ou fermé." };
  }

  // Fallback : redirection classique si pas de token (ne devrait pas arriver)
  if (data?.payment_url) {
    window.location.href = data.payment_url;
    return { ok: true, rdvCreated: false };
  }

  return { ok: false, message: "Erreur lors de l'initiation du paiement." };
}
