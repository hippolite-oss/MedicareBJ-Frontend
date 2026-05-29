// Agenda médecin — données réelles + blocage de créneaux.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { agendaService } from "@/services/agendaService";
import { rendezVousService } from "@/services/rendezVousService";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Lock, Loader2, Plus, Trash2, Edit, Check, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const HOURS = ["08:00","09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00"];
const BLOCK_TYPES = [
  { value: "bloque",    label: "Créneau bloqué" },
  { value: "conge",     label: "Congé" },
  { value: "formation", label: "Formation" },
  { value: "autre",     label: "Autre" },
];

function getWeekDays(base: Date) {
  const monday = new Date(base);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toLocalDateTimeInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function MonAgenda() {
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [blockOpen, setBlockOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  // États pour la gestion des créneaux bloqués
  const [editCreneauOpen, setEditCreneauOpen] = useState(false);
  const [selectedCreneau, setSelectedCreneau] = useState<any>(null);
  const [isEditingCreneau, setIsEditingCreneau] = useState(false);
  const [deletingCreneau, setDeletingCreneau] = useState(false);

  // États pour la gestion des RDV
  const [rdvDetailsOpen, setRdvDetailsOpen] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState<any>(null);
  const [actionRdv, setActionRdv] = useState<'confirmer' | 'annuler' | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState("");
  const [processingRdv, setProcessingRdv] = useState(false);

  // Pré-remplir avec le jour sélectionné
  const defaultStart = () => {
    const d = new Date(selectedDay);
    d.setHours(9, 0, 0, 0);
    return toLocalDateTimeInput(d);
  };
  const defaultEnd = () => {
    const d = new Date(selectedDay);
    d.setHours(10, 0, 0, 0);
    return toLocalDateTimeInput(d);
  };

  const [blockForm, setBlockForm] = useState({
    titre: "",
    date_debut: defaultStart(),
    date_fin: defaultEnd(),
    type_entree: "bloque",
    notes: "",
  });

  const weekDays = getWeekDays(weekBase);
  const dateDebut = weekDays[0].toISOString();
  const dateFin = weekDays[6].toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["mon-agenda", dateDebut, dateFin],
    queryFn: () => api.get("/agenda/mon-agenda", { params: { date_debut: dateDebut, date_fin: dateFin } }),
    select: (res: any) => res?.data?.agenda ?? [],
  });

  const { data: rdvData, refetch: refetchRdv } = useQuery({
    queryKey: ["rdv-jour", selectedDay.toDateString()],
    queryFn: () => api.get("/rendezvous/agenda-du-jour", {
      params: { date: selectedDay.toISOString() },
    }),
    select: (res: any) => res?.data?.rdv ?? [],
  });

  const agenda: any[] = data ?? [];
  const rdvJour: any[] = rdvData ?? [];

  // Pour les indicateurs de points dans le calendrier, on utilise l'agenda de la semaine
  const rdvForDay = (day: Date) =>
    agenda.filter((a: any) => {
      const d = new Date(a.date_debut);
      return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && a.type_entree === 'rdv';
    });

  const agendaForDay = (day: Date) =>
    agenda.filter((a: any) => {
      const d = new Date(a.date_debut);
      return d.getDate() === day.getDate() && d.getMonth() === day.getMonth();
    });

  const rdvDuJour = rdvJour.sort((a: any, b: any) => +new Date(a.date_heure) - +new Date(b.date_heure));
  const selectedAgenda = agendaForDay(selectedDay);

  const weekLabel = `${weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — ${weekDays[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;

  const openBlockModal = (day?: Date) => {
    const base = day ?? selectedDay;
    const start = new Date(base); start.setHours(9, 0, 0, 0);
    const end = new Date(base); end.setHours(10, 0, 0, 0);
    setBlockForm({
      titre: "",
      date_debut: toLocalDateTimeInput(start),
      date_fin: toLocalDateTimeInput(end),
      type_entree: "bloque",
      notes: "",
    });
    setBlockOpen(true);
  };

  const handleBlock = async () => {
    if (!blockForm.titre.trim()) { toast.error("Le titre est requis."); return; }
    if (!blockForm.date_debut || !blockForm.date_fin) { toast.error("Les dates sont requises."); return; }
    if (new Date(blockForm.date_fin) <= new Date(blockForm.date_debut)) {
      toast.error("La date de fin doit être après la date de début."); return;
    }
    setSaving(true);
    try {
      await api.post("/agenda/bloquer", {
        titre: blockForm.titre,
        date_debut: new Date(blockForm.date_debut).toISOString(),
        date_fin: new Date(blockForm.date_fin).toISOString(),
        type_entree: blockForm.type_entree,
        notes: blockForm.notes || undefined,
      });
      toast.success("Créneau bloqué avec succès");
      qc.invalidateQueries({ queryKey: ["mon-agenda"] });
      setBlockOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors du blocage");
    } finally {
      setSaving(false);
    }
  };

  // Gestion des créneaux bloqués
  const handleEditCreneau = async () => {
    if (!selectedCreneau) return;
    if (!selectedCreneau.titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    try {
      await agendaService.update(selectedCreneau.id, {
        titre: selectedCreneau.titre,
        date_debut: new Date(selectedCreneau.date_debut).toISOString(),
        date_fin: new Date(selectedCreneau.date_fin).toISOString(),
        type_entree: selectedCreneau.type_entree,
        notes: selectedCreneau.notes,
      });
      toast.success("Créneau modifié avec succès");
      qc.invalidateQueries({ queryKey: ["mon-agenda"] });
      setEditCreneauOpen(false);
      setIsEditingCreneau(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erreur lors de la modification");
    }
  };

  const handleDeleteCreneau = async () => {
    if (!selectedCreneau) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce créneau bloqué ?")) return;
    
    setDeletingCreneau(true);
    try {
      await agendaService.delete(selectedCreneau.id);
      toast.success("Créneau supprimé avec succès");
      qc.invalidateQueries({ queryKey: ["mon-agenda"] });
      qc.invalidateQueries({ queryKey: ["rdv-jour"] });
      setEditCreneauOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erreur lors de la suppression");
    } finally {
      setDeletingCreneau(false);
    }
  };

  // Gestion des RDV
  const handleConfirmerRdv = async () => {
    if (!selectedRdv) return;
    setProcessingRdv(true);
    try {
      await rendezVousService.updateStatut(selectedRdv.id, 'confirme');
      toast.success("Rendez-vous confirmé ! Le patient a été notifié.");
      qc.invalidateQueries({ queryKey: ["mon-agenda"] });
      qc.invalidateQueries({ queryKey: ["rdv-jour"] });
      refetchRdv();
      setRdvDetailsOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erreur lors de la confirmation");
    } finally {
      setProcessingRdv(false);
    }
  };

  const handleAnnulerRdv = async () => {
    if (!selectedRdv || !motifAnnulation.trim()) {
      toast.error("Le motif d'annulation est requis");
      return;
    }
    setProcessingRdv(true);
    try {
      await rendezVousService.updateStatut(selectedRdv.id, 'annule', motifAnnulation);
      toast.success("Rendez-vous annulé. Le patient a été notifié.");
      qc.invalidateQueries({ queryKey: ["mon-agenda"] });
      qc.invalidateQueries({ queryKey: ["rdv-jour"] });
      refetchRdv();
      setRdvDetailsOpen(false);
      setMotifAnnulation("");
      setActionRdv(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erreur lors de l'annulation");
    } finally {
      setProcessingRdv(false);
    }
  };

  const getRdvColor = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'bg-yellow-100 border-yellow-300';
      case 'confirme': return 'bg-green-100 border-green-300';
      case 'annule': return 'bg-gray-100 border-gray-300';
      case 'termine': return 'bg-blue-100 border-blue-300';
      default: return 'bg-primary-soft/40 border-primary/30';
    }
  };

  return (
    <>
      <PageHeader
        title="Mon agenda"
        subtitle="Gérez vos disponibilités et consultations de la semaine."
        actions={
          <Button onClick={() => openBlockModal()} className="rounded-full bg-gradient-primary shadow-glow gap-2">
            <Lock className="h-4 w-4" /> Bloquer un créneau
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendrier semaine */}
        <Card className="rounded-2xl shadow-card lg:col-span-2">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="font-display text-sm font-semibold">{weekLabel}</p>
              <Button variant="ghost" size="icon" onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* En-têtes jours */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-xs text-muted-foreground" />
              {weekDays.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                const isSelected = d.toDateString() === selectedDay.toDateString();
                const hasEvent = rdvForDay(d).length > 0 || agendaForDay(d).length > 0;
                return (
                  <button key={i} onClick={() => setSelectedDay(d)}
                    className={cn("flex flex-col items-center rounded-xl py-2 text-xs font-medium transition-base",
                      isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary-soft text-primary" : "hover:bg-muted"
                    )}
                  >
                    <span className="uppercase text-[9px]">{d.toLocaleDateString("fr-FR", { weekday: "short" })}</span>
                    <span className="font-bold">{d.getDate()}</span>
                    {hasEvent && <span className={cn("mt-0.5 h-1.5 w-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-secondary")} />}
                  </button>
                );
              })}
            </div>

            {/* Grille horaire */}
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-1">
                {HOURS.map((h) => {
                  const rdv = rdvDuJour.find((a: any) => {
                    const t = new Date(a.date_heure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                    return t === h;
                  });
                  const blocked = selectedAgenda.find((a: any) => {
                    const t = new Date(a.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                    return t === h && a.type_entree !== "rdv";
                  });
                  return (
                    <div key={h} className="grid grid-cols-8 gap-1 items-center">
                      <span className="text-[10px] text-muted-foreground text-right pr-2">{h}</span>
                      <button
                        onClick={() => {
                          if (rdv) {
                            // Clic sur un RDV
                            setSelectedRdv(rdv);
                            setActionRdv(null);
                            setMotifAnnulation("");
                            setRdvDetailsOpen(true);
                          } else if (blocked) {
                            // Clic sur un créneau bloqué
                            setSelectedCreneau(blocked);
                            setIsEditingCreneau(false);
                            setEditCreneauOpen(true);
                          } else {
                            // Clic sur un créneau vide
                            const [hh, mm] = h.split(":").map(Number);
                            const d = new Date(selectedDay);
                            d.setHours(hh, mm, 0, 0);
                            const end = new Date(d); end.setHours(hh + 1, mm, 0, 0);
                            setBlockForm(f => ({ ...f, date_debut: toLocalDateTimeInput(d), date_fin: toLocalDateTimeInput(end) }));
                            setBlockOpen(true);
                          }
                        }}
                        className={cn(
                          "col-span-7 h-10 rounded-lg border border-dashed border-border/60 transition-base flex items-center px-2 text-left w-full",
                          rdv ? getRdvColor(rdv.statut) : blocked ? "bg-destructive/10 border-destructive/30" : "hover:border-primary/30 hover:bg-primary-soft/20"
                        )}
                      >
                        {rdv && (
                          <div className="flex items-center gap-2 w-full">
                            <span className={cn(
                              "h-2 w-2 rounded-full shrink-0",
                              rdv.statut === 'planifie' ? "bg-yellow-500" :
                              rdv.statut === 'confirme' ? "bg-green-500" :
                              rdv.statut === 'annule' ? "bg-gray-500" : "bg-blue-500"
                            )} />
                            <span className="text-xs font-medium truncate">
                              {rdv.patient?.prenom} {rdv.patient?.nom}
                            </span>
                            <StatusBadge status={rdv.statut as any} />
                          </div>
                        )}
                        {blocked && !rdv && (
                          <div className="flex items-center gap-2 w-full">
                            <Lock className="h-3 w-3 text-destructive shrink-0" />
                            <span className="text-xs font-medium text-destructive truncate">{blocked.titre}</span>
                          </div>
                        )}
                        {!rdv && !blocked && (
                          <span className="text-[10px] text-muted-foreground/40">+ Bloquer</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RDV du jour sélectionné */}
        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">
                {selectedDay.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <Button size="sm" variant="outline" onClick={() => openBlockModal(selectedDay)} className="rounded-full gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Bloquer
              </Button>
            </div>

            {rdvDuJour.length === 0 && selectedAgenda.filter(a => a.type_entree !== "rdv").length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement ce jour.</p>
            ) : (
              <ul className="space-y-3">
                {rdvDuJour.map((rdv: any) => (
                  <li 
                    key={rdv.id} 
                    onClick={() => { 
                      setSelectedRdv(rdv); 
                      setActionRdv(null);
                      setMotifAnnulation("");
                      setRdvDetailsOpen(true); 
                    }}
                    className="rounded-xl border border-border/60 p-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-base"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary">
                        {new Date(rdv.date_heure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <StatusBadge status={rdv.statut as any} />
                    </div>
                    <div className="flex items-center gap-2">
                      <UserAvatar name={`${rdv.patient?.prenom} ${rdv.patient?.nom}`} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{rdv.patient?.prenom} {rdv.patient?.nom}</p>
                        <p className="text-xs text-muted-foreground">{rdv.motif ?? "Consultation"}</p>
                      </div>
                    </div>
                  </li>
                ))}
                {selectedAgenda.filter((a: any) => a.type_entree !== "rdv").map((a: any) => (
                  <li key={a.id} className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs font-bold text-destructive">
                        {new Date(a.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {" — "}
                        {new Date(a.date_fin).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{a.titre}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.type_entree}</p>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal bloquer créneau */}
      <Dialog open={blockOpen} onOpenChange={(o) => !o && setBlockOpen(false)}>
        <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Bloquer un créneau
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Titre *</Label>
              <Input
                value={blockForm.titre}
                onChange={(e) => setBlockForm({ ...blockForm, titre: e.target.value })}
                placeholder="ex. Réunion, Congé, Formation…"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Type</Label>
              <Select value={blockForm.type_entree} onValueChange={(v) => setBlockForm({ ...blockForm, type_entree: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Début *</Label>
                <Input
                  type="datetime-local"
                  value={blockForm.date_debut}
                  onChange={(e) => setBlockForm({ ...blockForm, date_debut: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Fin *</Label>
                <Input
                  type="datetime-local"
                  value={blockForm.date_fin}
                  onChange={(e) => setBlockForm({ ...blockForm, date_fin: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Notes (optionnel)</Label>
              <Textarea
                value={blockForm.notes}
                onChange={(e) => setBlockForm({ ...blockForm, notes: e.target.value })}
                placeholder="Informations complémentaires…"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setBlockOpen(false)} className="flex-1 rounded-full">Annuler</Button>
              <Button onClick={handleBlock} disabled={saving} className="flex-1 rounded-full bg-gradient-primary shadow-glow">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Bloquer le créneau
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog détails/modification créneau bloqué */}
      <Dialog open={editCreneauOpen} onOpenChange={(o) => { if (!o) { setEditCreneauOpen(false); setIsEditingCreneau(false); } }}>
        <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              {isEditingCreneau ? "Modifier le créneau" : "Détails du créneau"}
            </DialogTitle>
          </DialogHeader>
          
          {!isEditingCreneau ? (
            // Mode lecture
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Titre</p>
                <p className="font-medium">{selectedCreneau?.titre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="capitalize">{selectedCreneau?.type_entree?.replace('_', ' ')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Début</p>
                  <p className="text-sm">{selectedCreneau && new Date(selectedCreneau.date_debut).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fin</p>
                  <p className="text-sm">{selectedCreneau && new Date(selectedCreneau.date_fin).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
                </div>
              </div>
              {selectedCreneau?.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedCreneau.notes}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-3">
                <Button variant="outline" onClick={() => setIsEditingCreneau(true)} className="flex-1 rounded-full">
                  <Edit className="mr-2 h-4 w-4" /> Modifier
                </Button>
                <Button variant="destructive" onClick={handleDeleteCreneau} disabled={deletingCreneau} className="flex-1 rounded-full">
                  {deletingCreneau ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Supprimer
                </Button>
              </div>
            </div>
          ) : (
            // Mode édition
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Titre *</Label>
                <Input
                  value={selectedCreneau?.titre || ""}
                  onChange={(e) => setSelectedCreneau({ ...selectedCreneau, titre: e.target.value })}
                  placeholder="ex. Réunion, Congé, Formation…"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Type</Label>
                <Select 
                  value={selectedCreneau?.type_entree || "bloque"} 
                  onValueChange={(v) => setSelectedCreneau({ ...selectedCreneau, type_entree: v })}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BLOCK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Début *</Label>
                  <Input
                    type="datetime-local"
                    value={selectedCreneau && toLocalDateTimeInput(new Date(selectedCreneau.date_debut))}
                    onChange={(e) => setSelectedCreneau({ ...selectedCreneau, date_debut: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Fin *</Label>
                  <Input
                    type="datetime-local"
                    value={selectedCreneau && toLocalDateTimeInput(new Date(selectedCreneau.date_fin))}
                    onChange={(e) => setSelectedCreneau({ ...selectedCreneau, date_fin: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Notes (optionnel)</Label>
                <Textarea
                  value={selectedCreneau?.notes || ""}
                  onChange={(e) => setSelectedCreneau({ ...selectedCreneau, notes: e.target.value })}
                  placeholder="Informations complémentaires…"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setIsEditingCreneau(false)} className="flex-1 rounded-full">
                  Annuler
                </Button>
                <Button onClick={handleEditCreneau} className="flex-1 rounded-full bg-gradient-primary shadow-glow">
                  <Check className="mr-2 h-4 w-4" /> Enregistrer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog détails/actions RDV */}
      <Dialog open={rdvDetailsOpen} onOpenChange={(o) => { if (!o) { setRdvDetailsOpen(false); setActionRdv(null); setMotifAnnulation(""); } }}>
        <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Détails du rendez-vous</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Informations patient */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <UserAvatar name={`${selectedRdv?.patient?.prenom} ${selectedRdv?.patient?.nom}`} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{selectedRdv?.patient?.prenom} {selectedRdv?.patient?.nom}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {selectedRdv?.patient?.telephone || "Non renseigné"}
                </p>
              </div>
              <StatusBadge status={selectedRdv?.statut as any} />
            </div>
            
            {/* Date/heure */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date et heure</p>
              <p className="font-medium">{selectedRdv && new Date(selectedRdv.date_heure).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}</p>
            </div>
            
            {/* Motif */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Motif de consultation</p>
              <p className="text-sm">{selectedRdv?.motif || "Non spécifié"}</p>
            </div>
            
            {/* Motif d'annulation si annulé */}
            {selectedRdv?.statut === 'annule' && selectedRdv?.motif_annulation && (
              <div className="rounded-xl bg-destructive/10 p-3">
                <p className="text-xs text-destructive font-medium mb-1">Motif d'annulation</p>
                <p className="text-sm text-destructive">{selectedRdv.motif_annulation}</p>
                {selectedRdv.annule_par && (
                  <p className="text-xs text-muted-foreground mt-1">Annulé par : {selectedRdv.annule_par}</p>
                )}
              </div>
            )}
            
            {/* Actions selon le statut */}
            {!actionRdv && selectedRdv?.statut === 'planifie' && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setActionRdv('annuler')} className="flex-1 rounded-full">
                  <X className="mr-2 h-4 w-4" /> Refuser
                </Button>
                <Button onClick={handleConfirmerRdv} disabled={processingRdv} className="flex-1 rounded-full bg-gradient-primary shadow-glow">
                  {processingRdv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Confirmer
                </Button>
              </div>
            )}
            
            {!actionRdv && selectedRdv?.statut === 'confirme' && (
              <Button variant="destructive" onClick={() => setActionRdv('annuler')} className="w-full rounded-full">
                <X className="mr-2 h-4 w-4" /> Annuler le rendez-vous
              </Button>
            )}
            
            {/* Formulaire d'annulation */}
            {actionRdv === 'annuler' && (
              <div className="space-y-3 border-t pt-3">
                <Label>Motif d'annulation *</Label>
                <Textarea
                  value={motifAnnulation}
                  onChange={(e) => setMotifAnnulation(e.target.value)}
                  placeholder="Expliquez la raison de l'annulation..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setActionRdv(null); setMotifAnnulation(""); }} className="flex-1 rounded-full">
                    Retour
                  </Button>
                  <Button variant="destructive" onClick={handleAnnulerRdv} disabled={processingRdv} className="flex-1 rounded-full">
                    {processingRdv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirmer l'annulation
                  </Button>
                </div>
              </div>
            )}
            
            {/* Message si RDV annulé ou terminé */}
            {(selectedRdv?.statut === 'annule' || selectedRdv?.statut === 'termine') && !actionRdv && (
              <div className="text-center text-sm text-muted-foreground pt-2">
                {selectedRdv.statut === 'annule' ? "Ce rendez-vous a été annulé" : "Ce rendez-vous est terminé"}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
