import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { paiementService } from "@/services/paiementService";
import { pollPaymentStatus } from "@/utils/paymentUtils";

export default function PaiementRetour() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "complete" | "echoue" | "timeout">("loading");

  const idPaiement = searchParams.get("id") ?? searchParams.get("id_paiement");
  const simule = searchParams.get("simule");

  useEffect(() => {
    if (simule === "1" && idPaiement) {
      setStatus("complete");
      return;
    }
    if (!idPaiement) {
      setStatus("timeout");
      return;
    }

    (async () => {
      const result = await pollPaymentStatus(idPaiement);
      setStatus(result);
    })();
  }, [idPaiement, simule]);

  const icon =
    status === "loading" ? <Loader2 className="h-12 w-12 animate-spin text-primary" /> :
    status === "complete" ? <CheckCircle className="h-12 w-12 text-success" /> :
    <XCircle className="h-12 w-12 text-destructive" />;

  const title =
    status === "loading" ? "Vérification du paiement…" :
    status === "complete" ? "Paiement confirmé !" :
    status === "echoue" ? "Paiement échoué" :
    "Paiement en attente";

  const description =
    status === "loading" ? "Merci de patienter quelques instants." :
    status === "complete" ? "Votre rendez-vous a été enregistré si le paiement concernait une consultation." :
    status === "echoue" ? "Le paiement n'a pas pu être validé. Réessayez depuis la page Paiements." :
    "Confirmez sur votre téléphone ou consultez vos paiements plus tard.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-elevated">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {icon}
          <h1 className="font-display text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/patient/paiements")}>
              Mes paiements
            </Button>
            <Button className="rounded-full bg-gradient-primary" onClick={() => navigate("/patient/rdv")}>
              Mes rendez-vous
            </Button>
          </div>
          {idPaiement && status !== "loading" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => paiementService.verifierStatut(idPaiement).then(() => setStatus("complete"))}
            >
              Actualiser le statut
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
