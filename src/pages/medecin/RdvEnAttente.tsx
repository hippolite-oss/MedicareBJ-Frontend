// Page RDV en attente — Liste des RDV à confirmer pour le médecin
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRdvEnAttente } from "@/hooks/useQueries";
import { rendezVousService } from "@/services/rendezVousService";
import { toast } from "sonner";
import { Clock, CalendarDays, MapPin, FileText, Check, X, Loader2, Phone, Mail } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "full" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function RdvEnAttente() {
  const [selectedRdv, setSelectedRdv] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionRdv, setActionRdv] = useState<'confirmer' | 'annuler' | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState("");
  const [processing, setProcessing] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useRdvEnAttente();
  const rdvList: any[] = data?.rdv ?? [];

  const handleConfirmer = async () => {
    if (!selectedRdv) return;
    setProcessing(true);
    try {
      await rendezVousService.updateStatut(selectedRdv.id, 'confirme');
      toast.success("Rendez-vous confirmé ! Le patient a été notifié.");
      qc.invalidateQueries({ queryKey: ['rdv-en-attente'] });
      qc.invalidateQueries({ queryKey: ['mon-agenda'] });
      qc.invalidateQueries({ queryKey: ['rdv-jour'] });
      setDetailsOpen(false);
      setSelectedRdv(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erreur lors de la confirmation");
    } finally {
      setProcessing(false);
    }
  };

  const handleAnnuler = async () => {
    if (!selectedRdv || !motifAnnulation.trim()) {
      toast.error("Le motif d'annulation est requis");
      return;
    }
    setProcessing(true);
    try {
      await rendezVousService.updateStatut(selectedRdv.id, 'annule', motifAnnulation);
      toast.success("Rendez-vous refusé. Le patient a été notifié.");
      qc.invalidateQueries({ queryKey: ['rdv-en-attente'] });
      qc.invalidateQueries({ queryKey: ['mon-agenda'] });
      qc.invalidateQueries({ queryKey: ['rdv-jour'] });
      setDetailsOpen(false);
      setSelectedRdv(null);
      setMotifAnnulation("");
      setActionRdv(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erreur lors du refus");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Rendez-vous en attente"
        subtitle="Confirmez ou refusez les demandes de rendez-vous de vos patients."
      />

      <Card className="rounded-2xl shadow-card">
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : rdvList.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                Aucun rendez-vous en attente
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Les nouvelles demandes apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rdvList.map((rdv: any) => (
                <div
                  key={rdv.id}
                  onClick={() => {
                    setSelectedRdv(rdv);
                    setActionRdv(null);
                    setMotifAnnulation("");
                    setDetailsOpen(true);
                  }}
                  className="cursor-pointer rounded-xl border border-border/60 p-4 transition-base hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar patient */}
                    <UserAvatar
                      name={`${rdv.patient?.prenom} ${rdv.patient?.nom}`}
                      size="lg"
                    />

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {rdv.patient?.prenom} {rdv.patient?.nom}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {rdv.patient?.telephone || "Non renseigné"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {rdv.patient?.email || "Non renseigné"}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status="planifie" />
                      </div>

                      {/* Date et heure */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-primary">
                          <CalendarDays className="h-4 w-4" />
                          {fmt(rdv.date_heure)}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-primary">
                          <Clock className="h-4 w-4" />
                          {fmtTime(rdv.date_heure)}
                        </span>
                        {rdv.hopital && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {rdv.hopital.nom}
                          </span>
                        )}
                      </div>

                      {/* Motif */}
                      {rdv.motif && (
                        <div className="mt-2 flex items-start gap-1.5 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-muted-foreground">{rdv.motif}</p>
                        </div>
                      )}

                      {/* Actions rapides */}
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRdv(rdv);
                            setActionRdv('annuler');
                            setDetailsOpen(true);
                          }}
                          className="rounded-full"
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" />
                          Refuser
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRdv(rdv);
                            handleConfirmer();
                          }}
                          disabled={processing && selectedRdv?.id === rdv.id}
                          className="rounded-full bg-gradient-primary shadow-glow"
                        >
                          {processing && selectedRdv?.id === rdv.id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Confirmer
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog détails RDV */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDetailsOpen(false);
            setActionRdv(null);
            setMotifAnnulation("");
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Détails du rendez-vous</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Informations patient */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <UserAvatar
                name={`${selectedRdv?.patient?.prenom} ${selectedRdv?.patient?.nom}`}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {selectedRdv?.patient?.prenom} {selectedRdv?.patient?.nom}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selectedRdv?.patient?.telephone || "Non renseigné"}
                </p>
              </div>
              <StatusBadge status="planifie" />
            </div>

            {/* Date/heure */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date et heure</p>
              <p className="font-medium">
                {selectedRdv &&
                  new Date(selectedRdv.date_heure).toLocaleString("fr-FR", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
              </p>
            </div>

            {/* Motif */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Motif de consultation</p>
              <p className="text-sm">{selectedRdv?.motif || "Non spécifié"}</p>
            </div>

            {/* Hôpital */}
            {selectedRdv?.hopital && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lieu</p>
                <p className="text-sm">
                  {selectedRdv.hopital.nom} - {selectedRdv.hopital.ville}
                </p>
              </div>
            )}

            {/* Actions */}
            {!actionRdv && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setActionRdv("annuler")}
                  className="flex-1 rounded-full"
                >
                  <X className="mr-2 h-4 w-4" /> Refuser
                </Button>
                <Button
                  onClick={handleConfirmer}
                  disabled={processing}
                  className="flex-1 rounded-full bg-gradient-primary shadow-glow"
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Confirmer
                </Button>
              </div>
            )}

            {/* Formulaire d'annulation */}
            {actionRdv === "annuler" && (
              <div className="space-y-3 border-t pt-3">
                <Label>Motif du refus *</Label>
                <Textarea
                  value={motifAnnulation}
                  onChange={(e) => setMotifAnnulation(e.target.value)}
                  placeholder="Expliquez la raison du refus..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionRdv(null);
                      setMotifAnnulation("");
                    }}
                    className="flex-1 rounded-full"
                  >
                    Retour
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleAnnuler}
                    disabled={processing}
                    className="flex-1 rounded-full"
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Confirmer le refus
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
