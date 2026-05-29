// Gestion des signalements — données réelles via API.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSignalements } from "@/hooks/useQueries";
import { adminService } from "@/services/adminService";
import { toast } from "sonner";
import {
  Flag,
  AlertTriangle,
  Ban,
  XCircle,
  CheckCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type Decision =
  | "avertissement"
  | "suspension_30j"
  | "suspension_definitive"
  | "rejete";

export default function GestionSignalements() {
  const [selected, setSelected] = useState<any>(null);
  const [detailView, setDetailView] = useState<any>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [decisionAdmin, setDecisionAdmin] = useState("");
  const [processing, setProcessing] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useSignalements({ limit: 50 });
  const signalements: any[] = data?.signalements ?? [];

  const byStatus = (s: string) => signalements.filter((r) => r.statut === s);

  const handleDecision = async () => {
    if (!decision || !decisionAdmin.trim()) {
      toast.error("Choisissez une décision et saisissez un commentaire.");
      return;
    }
    setProcessing(true);
    try {
      await adminService.traiterSignalement(selected.id, {
        decision,
        decision_admin: decisionAdmin,
      });
      toast.success("Signalement traité");
      qc.invalidateQueries({ queryKey: ["signalements"] });
      qc.invalidateQueries({ queryKey: ["signalements-en-attente-count"] });
      setSelected(null);
      setDecision(null);
      setDecisionAdmin("");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { key: "en_attente", label: "En attente" },
    { key: "traite", label: "Traités" },
    { key: "rejete", label: "Rejetés" },
  ];

  return (
    <>
      <PageHeader
        title="Signalements"
        subtitle="Traitez les signalements soumis par les utilisateurs."
      />

      <Tabs defaultValue="en_attente">
        <TabsList className="mb-5 rounded-xl bg-muted p-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="rounded-lg">
              {t.label} ({byStatus(t.key).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-2xl bg-muted"
                  />
                ))}
              </div>
            ) : byStatus(tab.key).length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucun signalement dans cette catégorie.
              </p>
            ) : (
              byStatus(tab.key).map((r: any) => (
                <Card
                  key={r.id}
                  className="rounded-2xl shadow-card transition-base hover:shadow-elevated"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                          <Flag className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display font-semibold">
                              {r.motif?.slice(0, 60)}
                            </h3>
                            <StatusBadge status={r.statut as any} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <UserAvatar
                                name={`${r.emetteur?.prenom} ${r.emetteur?.nom}`}
                                size="xs"
                              />
                              {r.emetteur?.prenom} {r.emetteur?.nom}
                            </span>
                            <span>→</span>
                            <span className="flex items-center gap-1">
                              <UserAvatar
                                name={`${r.cible?.prenom} ${r.cible?.nom}`}
                                size="xs"
                              />
                              {r.cible?.prenom} {r.cible?.nom}
                            </span>
                            <span>
                              {new Date(r.createdAt).toLocaleDateString(
                                "fr-FR",
                              )}
                            </span>
                          </div>
                          {r.decision && (
                            <p className="mt-2 text-xs font-medium text-success">
                              Décision : {r.decision.replace(/_/g, " ")}
                            </p>
                          )}
                          {r.decision_admin && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {r.decision_admin}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {(r.statut === "traite" || r.statut === "rejete") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setDetailView(r)}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Détails
                          </Button>
                        )}
                        {r.statut === "en_attente" && (
                          <Button
                            onClick={() => setSelected(r)}
                            size="sm"
                            className="rounded-full"
                          >
                            Traiter
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal détails signalement */}
      <Dialog
        open={!!detailView}
        onOpenChange={(o) => {
          if (!o) setDetailView(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Détails du signalement
            </DialogTitle>
          </DialogHeader>
          {detailView && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-muted/50 p-4 space-y-1">
                <p>
                  <strong>Motif :</strong> {detailView.motif}
                </p>
                <p>
                  <strong>Émetteur :</strong> {detailView.emetteur?.prenom}{" "}
                  {detailView.emetteur?.nom}
                </p>
                <p>
                  <strong>Cible :</strong> {detailView.cible?.prenom}{" "}
                  {detailView.cible?.nom}
                </p>
                <p>
                  <strong>Date :</strong>{" "}
                  {new Date(detailView.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              {detailView.decision && (
                <div className="rounded-xl bg-success/10 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Décision</p>
                  <p className="font-semibold text-success">
                    {detailView.decision.replace(/_/g, " ")}
                  </p>
                </div>
              )}
              {detailView.decision_admin ? (
                <div className="rounded-xl bg-muted/50 p-4 ring-1 ring-border">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Détails de la décision
                  </p>
                  <p className="whitespace-pre-wrap text-foreground">
                    {detailView.decision_admin}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Aucun détail de décision disponible.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal décision */}
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setDecision(null);
            setDecisionAdmin("");
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Traiter le signalement
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-1">
                <p>
                  <strong>Motif :</strong> {selected.motif}
                </p>
                <p>
                  <strong>Émetteur :</strong> {selected.emetteur?.prenom}{" "}
                  {selected.emetteur?.nom}
                </p>
                <p>
                  <strong>Cible :</strong> {selected.cible?.prenom}{" "}
                  {selected.cible?.nom}
                </p>
              </div>
              <p className="text-sm font-medium">Choisissez une décision :</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      key: "avertissement",
                      icon: AlertTriangle,
                      label: "Avertissement",
                      color:
                        "text-warning border-warning/30 hover:bg-warning/10",
                    },
                    {
                      key: "suspension_30j",
                      icon: Ban,
                      label: "Suspension 30j",
                      color:
                        "text-accent-foreground border-accent/30 hover:bg-accent/10",
                    },
                    {
                      key: "suspension_definitive",
                      icon: XCircle,
                      label: "Suspension définitive",
                      color:
                        "text-destructive border-destructive/30 hover:bg-destructive/10",
                    },
                    {
                      key: "rejete",
                      icon: CheckCircle,
                      label: "Rejeter",
                      color:
                        "text-muted-foreground border-border hover:bg-muted",
                    },
                  ] as const
                ).map((d) => (
                  <Button
                    key={d.key}
                    variant="outline"
                    onClick={() => setDecision(d.key)}
                    className={`rounded-xl h-auto py-3 flex-col gap-1.5 ${d.color} ${decision === d.key ? "ring-2 ring-primary" : ""}`}
                  >
                    <d.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{d.label}</span>
                  </Button>
                ))}
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Commentaire *
                </Label>
                <Textarea
                  value={decisionAdmin}
                  onChange={(e) => setDecisionAdmin(e.target.value)}
                  placeholder="Justification de la décision…"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleDecision}
                disabled={processing || !decision}
                className="w-full rounded-full bg-gradient-primary shadow-glow"
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirmer la décision
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
