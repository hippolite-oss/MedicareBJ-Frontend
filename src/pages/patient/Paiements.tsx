// Paiements patient — liste et règlement des factures.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/PaymentForm";
import { useMesPaiements } from "@/hooks/useQueries";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { paiementService } from "@/services/paiementService";
import { fmtFcfa, getPaiementLabel, processPaymentInitiation, type PaymentMode } from "@/utils/paymentUtils";

export default function Paiements() {
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useMesPaiements();
  const paiements: any[] = data?.paiements ?? [];

  const aPayer = paiements.filter((p) => p.statut === "en_attente");
  const historique = paiements.filter((p) => p.statut !== "en_attente");
  const total = aPayer.reduce((s, p) => s + Number(p.montant), 0);

  const handlePay = async (mode: PaymentMode, telephone: string) => {
    if (!selected) return;
    setLoading(true);
    try {
      const result = await processPaymentInitiation(
        selected.id,
        Number(selected.montant),
        mode,
        telephone,
      );
      if (result.ok) {
        toast.success("Paiement confirmé", {
          description: result.rdvCreated
            ? "Votre rendez-vous a été enregistré."
            : "Merci pour votre règlement.",
        });
        qc.invalidateQueries({ queryKey: ["mes-paiements"] });
        qc.invalidateQueries({ queryKey: ["mes-rdv"] });
        setSelected(null);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRecu = async (id: string) => {
    try {
      const blob = await paiementService.getRecu(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Reçu non disponible");
    }
  };

  return (
    <>
      <PageHeader title="Paiements" subtitle="Consultez l'historique de vos règlements et payez vos factures en attente." />

      <Card className="mb-6 overflow-hidden rounded-2xl shadow-elevated">
        <div className="bg-primary p-6 text-primary-foreground sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wider opacity-90">Solde dû total</p>
          {isLoading
            ? <div className="mt-2 h-12 w-40 animate-pulse rounded bg-white/20" />
            : <p className="mt-1 font-display text-4xl font-bold sm:text-5xl">{fmtFcfa(total)}</p>
          }
          <p className="mt-2 text-sm opacity-90">{aPayer.length} facture(s) en attente</p>
        </div>
      </Card>

      <Tabs defaultValue="tous">
        <TabsList className="mb-5 rounded-xl bg-muted p-1">
          <TabsTrigger value="tous" className="rounded-lg">Tous ({paiements.length})</TabsTrigger>
          <TabsTrigger value="apayer" className="rounded-lg">À payer ({aPayer.length})</TabsTrigger>
          <TabsTrigger value="historique" className="rounded-lg">Historique ({historique.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tous" className="space-y-3">
          {isLoading
            ? [1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)
            : paiements.length === 0
              ? <Card className="rounded-2xl"><CardContent className="p-8 text-center text-sm text-muted-foreground">Aucun paiement pour le moment.</CardContent></Card>
              : paiements.map((p: any) => <PaiementCard key={p.id} p={p} onPay={() => setSelected(p)} onDownload={handleDownloadRecu} />)
          }
        </TabsContent>

        <TabsContent value="apayer" className="space-y-3">
          {isLoading
            ? [1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)
            : aPayer.length === 0
              ? <Card className="rounded-2xl"><CardContent className="p-8 text-center text-sm text-muted-foreground">Aucune facture en attente.</CardContent></Card>
              : aPayer.map((p: any) => <PaiementCard key={p.id} p={p} onPay={() => setSelected(p)} onDownload={handleDownloadRecu} />)
          }
        </TabsContent>

        <TabsContent value="historique">
          <Card className="overflow-hidden rounded-2xl shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Libellé</th>
                    <th className="px-4 py-3 font-medium">Montant</th>
                    <th className="px-4 py-3 font-medium">Mode</th>
                    <th className="px-4 py-3 font-medium">Référence</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {historique.length === 0
                    ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucun historique.</td></tr>
                    : historique.map((p: any) => (
                      <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">{new Date(p.date_paiement ?? p.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3">{getPaiementLabel(p)}</td>
                        <td className="px-4 py-3 font-semibold">{fmtFcfa(Number(p.montant))}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.mode_paiement?.replace("_", " ").toUpperCase() ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.numero_recu ?? p.reference_externe ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={p.statut as any} /></td>
                        <td className="px-4 py-3 text-right">
                          {p.statut === "complete" && (
                            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => handleDownloadRecu(p.id)}>
                              <Download className="mr-1.5 h-3.5 w-3.5" /> Reçu
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Payer la facture</DialogTitle></DialogHeader>
          {selected && (
            <PaymentForm
              montant={Number(selected.montant)}
              hopital={selected.metadata?.hopital}
              loading={loading}
              onSubmit={handlePay}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PaiementCard({ p, onPay, onDownload }: { p: any; onPay: () => void; onDownload: (id: string) => void }) {
  return (
    <Card className="rounded-2xl shadow-card">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-base font-semibold">{getPaiementLabel(p)}</p>
          <p className="text-xs text-muted-foreground">
            Émis le {new Date(p.createdAt).toLocaleDateString("fr-FR")}
            {p.metadata?.hopital?.nom ? ` · ${p.metadata.hopital.nom}` : ""}
          </p>
          {p.rendezvous?.date_heure && (
            <p className="mt-1 text-xs text-muted-foreground">
              RDV : {new Date(p.rendezvous.date_heure).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={p.statut as any} />
          <p className="font-display text-lg font-bold">{fmtFcfa(Number(p.montant))}</p>
          {p.statut === "en_attente" ? (
            <Button onClick={onPay} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent">
              Payer
            </Button>
          ) : p.statut === "complete" ? (
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => onDownload(p.id)}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Reçu
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
