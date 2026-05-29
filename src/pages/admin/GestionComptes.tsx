// Gestion des comptes — données réelles via API.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useUtilisateurs } from "@/hooks/useQueries";
import { adminService } from "@/services/adminService";
import { toast } from "sonner";
import { Search, Eye, Ban, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const ROLE_LABELS: Record<string, string> = {
  patient: "Patient",
  usager: "Usager",
  medecin: "Médecin",
  technicien: "Technicien",
  admin: "Admin",
};

export default function GestionComptes() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<any>(null);
  const [suspending, setSuspending] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useUtilisateurs({
    search: query || undefined,
    role: roleFilter,
    limit: 50,
  });

  const utilisateurs: any[] = data?.utilisateurs ?? data ?? [];

  const handleSuspend = async (id: string, statut: string) => {
    setSuspending(true);
    try {
      await adminService.updateStatutUtilisateur(
        id,
        statut === "actif" ? "suspendu" : "actif",
      );
      toast.success(statut === "actif" ? "Compte suspendu" : "Compte réactivé");
      qc.invalidateQueries({ queryKey: ["utilisateurs"] });
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setSuspending(false);
    }
  };

  const tabs = ["tous", "patient", "medecin", "technicien", "admin"];

  return (
    <>
      <PageHeader
        title="Gestion des comptes"
        subtitle="Gérez tous les utilisateurs de la plateforme."
      />

      <div className="mb-5 relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          className="pl-10 rounded-xl"
        />
      </div>

      <Tabs
        defaultValue="tous"
        onValueChange={(v) => setRoleFilter(v === "tous" ? undefined : v)}
      >
        <TabsList className="mb-5 rounded-xl bg-muted p-1">
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-lg capitalize">
              {t === "tous" ? "Tous" : (ROLE_LABELS[t] ?? t)}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab} value={tab}>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : utilisateurs.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucun compte trouvé.
              </p>
            ) : (
              <Card className="overflow-hidden rounded-2xl shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Utilisateur</th>
                        <th className="px-4 py-3 font-medium">Rôle</th>
                        <th className="px-4 py-3 font-medium">Statut</th>
                        <th className="px-4 py-3 font-medium">Inscrit le</th>
                        <th className="px-4 py-3 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {utilisateurs.map((u: any) => (
                        <tr
                          key={u.id}
                          className="border-t border-border hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                name={`${u.prenom} ${u.nom}`}
                                photoUrl={u.photo_profil}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium">
                                  {u.prenom} {u.nom}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className="rounded-full text-xs"
                            >
                              {ROLE_LABELS[u.role] ?? u.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={u.statut as any} />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelected(u)}
                                className="rounded-full"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSuspend(u.id, u.statut)}
                                className="rounded-full text-warning hover:bg-warning/10"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal détail */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Détail du compte</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <UserAvatar
                  name={`${selected.prenom} ${selected.nom}`}
                  photoUrl={selected.photo_profil}
                  size="lg"
                />
                <div>
                  <p className="font-display text-lg font-semibold">
                    {selected.prenom} {selected.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selected.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-4 text-sm">
                <InfoRow
                  label="Rôle"
                  value={ROLE_LABELS[selected.role] ?? selected.role}
                />
                <InfoRow
                  label="Statut"
                  value={<StatusBadge status={selected.statut as any} />}
                />
                <InfoRow label="Téléphone" value={selected.telephone ?? "—"} />
                <InfoRow
                  label="Inscrit le"
                  value={new Date(selected.createdAt).toLocaleDateString(
                    "fr-FR",
                  )}
                />
              </div>
              <Button
                onClick={() => handleSuspend(selected.id, selected.statut)}
                disabled={suspending}
                variant="outline"
                className="w-full rounded-full text-warning border-warning/30 hover:bg-warning/10"
              >
                {suspending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                {selected.statut === "actif"
                  ? "Suspendre le compte"
                  : "Réactiver le compte"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  );
}
