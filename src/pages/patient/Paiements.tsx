// Paiements patient — données réelles via API.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMesPaiements } from "@/hooks/useQueries";
import { paiementService } from "@/services/paiementService";
import { toast } from "sonner";
import { CreditCard, Smartphone, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

export default function Paiements() {
  const [selected, setSelected] = useState<any>(null);
  const [method, setMethod] = useState<"mtn_money" | "moov_money" | "cinetpay">("mtn_money");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useMesPaiements();
  const paiements: any[] = data?.paiements ?? [];

  const aPayer = paiements.filter((p) => p.statut === "en_attente");
  const historique = paiements.filter((p) => p.statut !== "en_attente");
  const total = aPayer.reduce((s, p) => s + Number(p.montant), 0);

  const handlePay = async () => {
    if (!selected || !phone) return;
    setLoading(true);
    try {
      await paiementService.initier({
        id_consultation: selected.id_consultation,
        id_rdv: selected.id_rdv,
        montant: selected.montant,
        mode_paiement: method,
        telephone: phone,
      });
      toast.success("Demande de paiement envoyée", { description: "Confirmez sur votre téléphone." });
      qc.invalidateQueries({ queryKey: ["mes-paiements"] });
      setSelected(null);
      setPhone("");
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
      a.href = url; a.download = `recu-${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Reçu non disponible");
    }
  };

  return (
    <>
      <PageHeader title="Paiements" subtitle="Gérez vos factures et règlements en quelques clics." />

      <Card className="mb-6 overflow-hidden rounded-2xl shadow-elevated">
        <div className="bg-primary p-6 text-primary-foreground sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wider opacity-90">Solde dû total</p>
          {isLoading
            ? <div className="mt-2 h-12 w-40 animate-pulse rounded bg-white/20" />
            : <p className="mt-1 font-display text-4xl font-bold sm:text-5xl">{fmt(total)}</p>
          }
          <p className="mt-2 text-sm opacity-90">{aPayer.length} facture(s) en attente</p>
        </div>
      </Card>

      <Tabs defaultValue="apayer">
        <TabsList className="mb-5 rounded-xl bg-muted p-1">
          <TabsTrigger value="apayer" className="rounded-lg">À payer ({aPayer.length})</TabsTrigger>
          <TabsTrigger value="historique" className="rounded-lg">Historique ({historique.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="apayer" className="space-y-3">
          {isLoading
            ? [1,2].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)
            : aPayer.length === 0
              ? <Card className="rounded-2xl"><CardContent className="p-8 text-center text-sm text-muted-foreground">Aucune facture en attente. ✨</CardContent></Card>
              : aPayer.map((p: any) => (
                <Card key={p.id} className="rounded-2xl shadow-card">
                  <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-display text-base font-semibold">
                        {p.id_consultation ? "Consultation" : p.id_rdv ? "Rendez-vous" : "Paiement"}
                      </p>
                      <p className="text-xs text-muted-foreground">Émis le {new Date(p.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-display text-lg font-bold">{fmt(Number(p.montant))}</p>
                      <Button onClick={() => setSelected(p)} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent">
                        Payer maintenant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          }
        </TabsContent>

        <TabsContent value="historique">
          <Card className="overflow-hidden rounded-2xl shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Montant</th>
                    <th className="px-4 py-3 font-medium">Mode</th>
                    <th className="px-4 py-3 font-medium">Référence</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {historique.length === 0
                    ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucun historique.</td></tr>
                    : historique.map((p: any) => (
                      <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">{new Date(p.date_paiement ?? p.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3 font-semibold">{fmt(Number(p.montant))}</td>
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

      {/* Modal paiement */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Payer la facture</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="rounded-xl bg-primary-soft p-4">
                <p className="text-xs text-muted-foreground">Montant à payer</p>
                <p className="font-display text-2xl font-bold text-primary">{fmt(Number(selected.montant))}</p>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Mode de paiement</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: "mtn_money",  icon: Smartphone, label: "MTN" },
                    { v: "moov_money", icon: Smartphone, label: "Moov" },
                    { v: "cinetpay",   icon: CreditCard, label: "Carte" },
                  ].map((m) => (
                    <button key={m.v} onClick={() => setMethod(m.v as any)}
                      className={cn("flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-base",
                        method === m.v ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40"
                      )}
                    >
                      <m.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  {method === "cinetpay" ? "Email" : "Numéro de téléphone"}
                </Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder={method === "cinetpay" ? "vous@email.com" : "+229 9X XX XX XX"}
                />
              </div>
              <Button onClick={handlePay} disabled={loading || !phone} className="w-full bg-gradient-primary shadow-glow">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement…</> : `Confirmer ${fmt(Number(selected.montant))}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
