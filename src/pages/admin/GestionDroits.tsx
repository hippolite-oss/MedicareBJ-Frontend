// Gestion des droits d'accès — données réelles via API.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDroitsAcces } from "@/hooks/useQueries";
import { adminService } from "@/services/adminService";
import { toast } from "sonner";
import { ShieldCheck, Ban, ChevronRight, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function GestionDroits() {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const qc = useQueryClient();

  const { data: activeData, isLoading: loadingActive } = useDroitsAcces({
    statut: "actif",
    limit: 100,
  });
  const { data: histData, isLoading: loadingHist } = useDroitsAcces({
    statut: "revoque",
    limit: 50,
  });

  const active: any[] = activeData?.acces ?? [];
  const history: any[] = histData?.acces ?? [];

  const handleRevoke = async (id: string) => {
    setRevoking(true);
    try {
      await adminService.revoquerAcces(id);
      qc.invalidateQueries({ queryKey: ["droits-acces"] });
      toast.success("Accès révoqué");
      setConfirmId(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Droits d'accès"
        subtitle="Supervisez tous les accès aux dossiers médicaux sur la plateforme."
      />

      {/* Accès actifs */}
      <div className="mb-6">
        <h2 className="mb-3 font-display text-base font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Accès actifs (
          {active.length})
        </h2>
        {loadingActive ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun accès actif.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((g: any) => (
              <Card key={g.id} className="rounded-2xl shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <UserAvatar name="Patient" size="sm" />
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <UserAvatar
                        name={`${g.professionnel?.prenom} ${g.professionnel?.nom}`}
                        photoUrl={g.professionnel?.photo_profil}
                        size="sm"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        Professionnel
                      </p>
                      <p className="font-medium text-sm">
                        Dr. {g.professionnel?.prenom} {g.professionnel?.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {g.professionnel?.role}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={g.type_acces} />
                        <span className="text-xs text-muted-foreground">
                          Depuis{" "}
                          {new Date(g.date_debut).toLocaleDateString("fr-FR")}
                          {g.date_fin
                            ? ` → ${new Date(g.date_fin).toLocaleDateString("fr-FR")}`
                            : ""}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          Source : {g.source}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmId(g.id)}
                      className="shrink-0 rounded-full text-destructive hover:bg-destructive/10"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Historique */}
      <div>
        <h2 className="mb-3 font-display text-base font-semibold">
          Historique des accès ({history.length})
        </h2>
        <Card className="overflow-hidden rounded-2xl shadow-card">
          {loadingHist ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Professionnel</th>
                    <th className="px-4 py-3 font-medium">Niveau</th>
                    <th className="px-4 py-3 font-medium">Période</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Aucun historique.
                      </td>
                    </tr>
                  ) : (
                    history.map((g: any) => (
                      <tr
                        key={g.id}
                        className="border-t border-border hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          Dr. {g.professionnel?.prenom} {g.professionnel?.nom}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={g.type_acces} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(g.date_debut).toLocaleDateString("fr-FR")}
                          {g.date_fin
                            ? ` → ${new Date(g.date_fin).toLocaleDateString("fr-FR")}`
                            : ""}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">
                          {g.source}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={g.statut as any} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal confirmation */}
      <Dialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              Confirmer la révocation
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action supprimera immédiatement l'accès du professionnel au
            dossier patient. Cette action est irréversible.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmId(null)}
              className="flex-1 rounded-full"
            >
              Annuler
            </Button>
            <Button
              onClick={() => confirmId && handleRevoke(confirmId)}
              disabled={revoking}
              className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Révoquer l'accès
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
