// Validation des médecins — données réelles via API.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useValidationsEnAttente, useValiderMedecin, useRejeterMedecin } from "@/hooks/useQueries";
import { toast } from "sonner";
import { CheckCircle, XCircle, Building2, Hash, Loader2, Eye, Mail, Phone, Calendar, User } from "lucide-react";

export default function ValidationMedecins() {
  const [detailsTarget, setDetailsTarget] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, refetch } = useValidationsEnAttente({ limit: 50 });
  const valider = useValiderMedecin();
  const rejeter = useRejeterMedecin();

  const validations: any[] = data?.validations ?? [];

  const handleValider = async (id: string) => {
    try {
      await valider.mutateAsync(id);
      toast.success("Médecin validé", { description: "Un email de confirmation a été envoyé." });
      refetch();
      setDetailsTarget(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    }
  };

  const handleRejeter = async () => {
    if (!rejectReason.trim()) { toast.error("Le motif de rejet est obligatoire."); return; }
    try {
      await rejeter.mutateAsync({ id: rejectTarget.id, motif_rejet: rejectReason });
      toast("Inscription rejetée");
      setRejectTarget(null);
      setRejectReason("");
      setDetailsTarget(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Non renseigné";
    return new Date(dateStr).toLocaleDateString("fr-FR", { 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    });
  };

  return (
    <>
      <PageHeader
        title="Validation des médecins"
        subtitle="Vérifiez et validez les inscriptions des professionnels de santé."
      />

      <Tabs defaultValue="attente">
        <TabsList className="mb-5 rounded-xl bg-muted p-1">
          <TabsTrigger value="attente" className="rounded-lg">
            En attente ({validations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attente">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : validations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
              <CheckCircle className="mb-3 h-12 w-12 text-success/40" />
              <p className="font-medium text-muted-foreground">Aucune validation en attente ✅</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {validations.map((d: any) => (
                <Card key={d.id} className="rounded-2xl shadow-card">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <UserAvatar name={`${d.prenom} ${d.nom}`} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-semibold">Dr. {d.prenom} {d.nom}</h3>
                          <StatusBadge status="en_attente" />
                        </div>
                        <p className="text-sm text-muted-foreground">{d.professionnel?.specialite}</p>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <p className="flex items-center gap-1.5">
                            <Hash className="h-3 w-3" /> {d.professionnel?.numero_ordre}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3" /> {d.professionnel?.hopital?.nom ?? "—"}
                          </p>
                          <p>Inscrit le {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => setDetailsTarget(d)}
                        variant="outline"
                        className="flex-1 rounded-full"
                      >
                        <Eye className="mr-1.5 h-4 w-4" /> Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal détails complets */}
      <Dialog open={!!detailsTarget} onOpenChange={(o) => !o && setDetailsTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Détails de l'inscription</DialogTitle>
          </DialogHeader>
          {detailsTarget && (
            <div className="space-y-5">
              {/* En-tête avec avatar */}
              <div className="flex items-center gap-4 rounded-xl bg-primary-soft/30 p-4">
                <UserAvatar name={`${detailsTarget.prenom} ${detailsTarget.nom}`} size="xl" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold">Dr. {detailsTarget.prenom} {detailsTarget.nom}</h3>
                  <p className="text-sm text-muted-foreground">{detailsTarget.professionnel?.specialite}</p>
                  <StatusBadge status="en_attente" className="mt-2" />
                </div>
              </div>

              {/* Informations personnelles */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="h-4 w-4" /> Informations personnelles
                </h4>
                <div className="grid gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <Mail className="h-3.5 w-3.5" /> {detailsTarget.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <Phone className="h-3.5 w-3.5" /> {detailsTarget.telephone || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date de naissance</p>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(detailsTarget.date_naissance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sexe</p>
                    <p className="text-sm font-medium">
                      {detailsTarget.sexe === 'M' ? 'Masculin' : detailsTarget.sexe === 'F' ? 'Féminin' : 'Autre'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations professionnelles */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4" /> Informations professionnelles
                </h4>
                <div className="grid gap-3 rounded-xl bg-muted/50 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Rôle</p>
                    <p className="text-sm font-medium capitalize">{detailsTarget.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Numéro d'ordre</p>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <Hash className="h-3.5 w-3.5" /> {detailsTarget.professionnel?.numero_ordre}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Spécialité</p>
                    <p className="text-sm font-medium">{detailsTarget.professionnel?.specialite}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hôpital</p>
                    <p className="text-sm font-medium">
                      {detailsTarget.professionnel?.hopital?.nom || "Non renseigné"}
                      {detailsTarget.professionnel?.hopital?.ville && 
                        ` - ${detailsTarget.professionnel.hopital.ville}`
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Profil public</p>
                    <p className="text-sm font-medium">
                      {detailsTarget.professionnel?.profil_public ? "Oui" : "Non"}
                    </p>
                  </div>
                  {detailsTarget.professionnel?.biographie && (
                    <div>
                      <p className="text-xs text-muted-foreground">Biographie</p>
                      <p className="text-sm">{detailsTarget.professionnel.biographie}</p>
                    </div>
                  )}
                  {detailsTarget.professionnel?.tarif_consultation && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tarif consultation</p>
                      <p className="text-sm font-medium">
                        {detailsTarget.professionnel.tarif_consultation} FCFA
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Date d'inscription */}
              <div className="rounded-xl bg-muted/50 p-3 text-center text-xs text-muted-foreground">
                Inscription soumise le {formatDate(detailsTarget.createdAt)} à{" "}
                {new Date(detailsTarget.createdAt).toLocaleTimeString("fr-FR", { 
                  hour: "2-digit", 
                  minute: "2-digit" 
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => {
                    setRejectTarget(detailsTarget);
                    setDetailsTarget(null);
                  }}
                  variant="outline"
                  className="flex-1 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <XCircle className="mr-1.5 h-4 w-4" /> Rejeter
                </Button>
                <Button
                  onClick={() => handleValider(detailsTarget.id)}
                  disabled={valider.isPending}
                  className="flex-1 rounded-full bg-success/10 text-success hover:bg-success/20"
                >
                  {valider.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><CheckCircle className="mr-1.5 h-4 w-4" /> Valider</>
                  }
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal rejet */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Rejeter l'inscription</DialogTitle>
          </DialogHeader>
          {rejectTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-destructive/5 p-3 ring-1 ring-destructive/20">
                <UserAvatar name={`${rejectTarget.prenom} ${rejectTarget.nom}`} size="md" />
                <div>
                  <p className="font-semibold">Dr. {rejectTarget.prenom} {rejectTarget.nom}</p>
                  <p className="text-sm text-muted-foreground">{rejectTarget.professionnel?.specialite}</p>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Motif du rejet *</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Expliquez la raison du rejet (sera communiqué au médecin)…"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRejectTarget(null)} className="flex-1 rounded-full">Annuler</Button>
                <Button
                  onClick={handleRejeter}
                  disabled={rejeter.isPending}
                  className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {rejeter.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer le rejet"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
