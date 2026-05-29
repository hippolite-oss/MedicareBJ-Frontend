// Rendez-vous patient — données réelles via API.
import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMesRdv, useMedecinsDisponibles, useCreerRdv } from "@/hooks/useQueries";
import { rendezVousService } from "@/services/rendezVousService";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight, Clock, CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const SLOTS = ["08:30","09:00","09:30","10:00","10:30","11:00","14:00","14:30","15:00","15:30","16:00","16:30"];
const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "medium" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function RendezVous() {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [chosenDoctor, setChosenDoctor] = useState<any>(null);
  const [chosenSlot, setChosenSlot] = useState<string | null>(null);
  const [chosenDate, setChosenDate] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [disponibilites, setDisponibilites] = useState<any>(null);
  const [loadingDispo, setLoadingDispo] = useState(false);
  const qc = useQueryClient();

  const { data: rdvData, isLoading } = useMesRdv();
  const { data: medData } = useMedecinsDisponibles();
  const creerRdv = useCreerRdv();

  const rdvList: any[] = rdvData?.rdv ?? [];
  const medecins: any[] = medData?.medecins ?? [];

  const upcoming = rdvList
    .filter((a) => new Date(a.date_heure) >= new Date() && a.statut !== "annule")
    .sort((a, b) => +new Date(a.date_heure) - +new Date(b.date_heure));

  const monthLabel = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7;

  const cells = useMemo(() => {
    const out: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) out.push(null);
    for (let i = 1; i <= daysInMonth; i++) out.push(i);
    return out;
  }, [cursor, firstDay, daysInMonth]);

  const rdvByDay = useMemo(() => {
    const map = new Map<number, any[]>();
    rdvList.forEach((a) => {
      const d = new Date(a.date_heure);
      if (d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear()) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(a);
      }
    });
    return map;
  }, [rdvList, cursor]);

  const dayRdv = selectedDay ? (rdvByDay.get(selectedDay) ?? []) : [];

  const reset = () => {
    setStep(1);
    setChosenDoctor(null);
    setChosenSlot(null);
    setChosenDate(null);
    setReason("");
    setDisponibilites(null);
  };

  // Fonction pour récupérer les disponibilités du médecin
  const fetchDisponibilites = async (idMedecin: string, date: Date) => {
    setLoadingDispo(true);
    try {
      const dateDebut = new Date(date);
      dateDebut.setHours(0, 0, 0, 0);
      const dateFin = new Date(date);
      dateFin.setHours(23, 59, 59, 999);

      const response = await rendezVousService.getDisponibilites(idMedecin, {
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
      });
      
      setDisponibilites(response.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des disponibilités:", err);
      toast.error("Erreur lors de la récupération des disponibilités");
    } finally {
      setLoadingDispo(false);
    }
  };

  // Fonction pour vérifier si un créneau est disponible
  const isSlotAvailable = (slot: string, date: number): boolean => {
    if (!disponibilites) return true; // Si pas encore chargé, afficher tous les créneaux

    const [h, m] = slot.split(":").map(Number);
    const slotDate = new Date(cursor.getFullYear(), cursor.getMonth(), date, h, m, 0, 0);
    const slotTime = slotDate.getTime();

    // Vérifier les RDV existants
    const hasRdv = disponibilites.rdv_existants?.some((rdv: any) => {
      const rdvTime = new Date(rdv.date_heure).getTime();
      const rdvEnd = rdvTime + (rdv.duree_minutes || 30) * 60000;
      return slotTime >= rdvTime && slotTime < rdvEnd;
    });

    if (hasRdv) return false;

    // Vérifier les créneaux bloqués
    const isBlocked = disponibilites.bloques?.some((bloque: any) => {
      const bloqueDebut = new Date(bloque.date_debut).getTime();
      const bloqueFin = new Date(bloque.date_fin).getTime();
      return slotTime >= bloqueDebut && slotTime < bloqueFin;
    });

    return !isBlocked;
  };

  // Filtrer les créneaux disponibles
  const availableSlots = useMemo(() => {
    if (!chosenDate || !disponibilites) return SLOTS;
    return SLOTS.filter(slot => isSlotAvailable(slot, chosenDate));
  }, [chosenDate, disponibilites, cursor]);

  // Charger les disponibilités quand une date est choisie
  useEffect(() => {
    if (chosenDate && chosenDoctor) {
      const idMedecin = chosenDoctor.utilisateur?.id ?? chosenDoctor.Utilisateur?.id ?? chosenDoctor.id_utilisateur;
      const selectedDate = new Date(cursor.getFullYear(), cursor.getMonth(), chosenDate);
      fetchDisponibilites(idMedecin, selectedDate);
    }
  }, [chosenDate, chosenDoctor, cursor]);

  const handleSubmit = async () => {
    if (!chosenDoctor || !chosenDate || !chosenSlot) return;
    const dateHeure = new Date(cursor.getFullYear(), cursor.getMonth(), chosenDate);
    const [h, m] = chosenSlot.split(":").map(Number);
    dateHeure.setHours(h, m, 0, 0);
    try {
      await creerRdv.mutateAsync({
        id_medecin: chosenDoctor.utilisateur?.id ?? chosenDoctor.Utilisateur?.id ?? chosenDoctor.id_utilisateur,
        date_heure: dateHeure.toISOString(),
        motif: reason,
      });
      toast.success("Rendez-vous confirmé !");
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la prise de RDV");
    }
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await rendezVousService.updateStatut(id, "annule");
      qc.invalidateQueries({ queryKey: ["mes-rdv"] });
      toast("Rendez-vous annulé");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Rendez-vous"
        subtitle="Gérez vos consultations et planifiez de nouveaux rendez-vous."
        actions={
          <Button onClick={() => { reset(); setOpen(true); }} className="rounded-full bg-gradient-primary shadow-glow">
            <Plus className="mr-1.5 h-4 w-4" /> Nouveau RDV
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* CALENDRIER */}
        <Card className="rounded-2xl shadow-card lg:col-span-3">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => { setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)); setSelectedDay(null); }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-display text-base font-semibold capitalize">{monthLabel}</h3>
              <Button variant="ghost" size="icon" onClick={() => { setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)); setSelectedDay(null); }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted-foreground">
              {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((c, i) => {
                const isToday = c !== null && new Date().toDateString() === new Date(cursor.getFullYear(), cursor.getMonth(), c).toDateString();
                const isSelected = c !== null && c === selectedDay;
                const dayList = c ? rdvByDay.get(c) ?? [] : [];
                return (
                  <button
                    key={i}
                    disabled={!c}
                    onClick={() => c && setSelectedDay(c === selectedDay ? null : c)}
                    className={cn(
                      "relative aspect-square rounded-lg p-1.5 text-xs transition-base",
                      !c && "invisible",
                      c && !isToday && !isSelected && "bg-muted/40 hover:bg-primary-soft/60 cursor-pointer",
                      isToday && !isSelected && "bg-primary/10 text-primary font-bold cursor-pointer",
                      isSelected && "bg-primary text-primary-foreground cursor-pointer ring-2 ring-primary ring-offset-1",
                    )}
                  >
                    {c && <span className="font-medium">{c}</span>}
                    {dayList.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayList.slice(0, 3).map((_, j) => (
                          <span key={j} className={cn("h-1 w-1 rounded-full", isSelected ? "bg-primary-foreground" : "bg-secondary")} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-3 text-sm font-semibold">
                  {new Date(cursor.getFullYear(), cursor.getMonth(), selectedDay).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                {dayRdv.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun rendez-vous ce jour.</p>
                ) : (
                  <ul className="space-y-2">
                    {dayRdv.map((rdv: any) => (
                      <li key={rdv.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5">
                        <UserAvatar name={`Dr. ${rdv.medecin?.nom}`} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">Dr. {rdv.medecin?.prenom} {rdv.medecin?.nom}</p>
                          <p className="text-xs text-muted-foreground">{fmtTime(rdv.date_heure)} · {rdv.motif ?? "Consultation"}</p>
                        </div>
                        <StatusBadge status={rdv.statut as any} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* LISTE À VENIR */}
        <Card className="rounded-2xl shadow-card lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="mb-4 font-display text-base font-semibold">Prochains rendez-vous</h3>
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
              </div>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun rendez-vous à venir.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((rdv: any) => (
                  <li key={rdv.id} className="rounded-xl border border-border/60 p-3 transition-base hover:border-primary/40">
                    <div className="flex items-start gap-3">
                      <UserAvatar name={`Dr. ${rdv.medecin?.nom}`} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">Dr. {rdv.medecin?.prenom} {rdv.medecin?.nom}</p>
                        <p className="truncate text-xs text-muted-foreground">{rdv.medecin?.profil_professionnel?.specialite ?? "—"}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" /> {fmt(rdv.date_heure)} · {fmtTime(rdv.date_heure)}
                        </p>
                      </div>
                      <StatusBadge status={rdv.statut as any} />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost" size="sm"
                        className="rounded-full text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => handleCancel(rdv.id)}
                        disabled={cancelling === rdv.id}
                      >
                        {cancelling === rdv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Annuler"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL NOUVEAU RDV */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); reset(); } }}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Nouveau rendez-vous</DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="mb-4 flex items-center gap-2">
            {["Médecin","Date & Heure","Motif"].map((label, i) => {
              const s = i + 1;
              return (
                <div key={s} className="flex flex-1 items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>{s}</span>
                    <span className={cn("hidden text-xs font-medium sm:block", step === s ? "text-primary" : "text-muted-foreground")}>{label}</span>
                  </div>
                  {s < 3 && <span className={cn("h-0.5 flex-1", step > s ? "bg-primary" : "bg-muted")} />}
                </div>
              );
            })}
          </div>

          {/* Step 1 — Médecin */}
          {step === 1 && (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              <p className="text-sm text-muted-foreground">Choisissez un médecin :</p>
              {medecins.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun médecin disponible.</p>
              ) : (
                medecins.map((m: any) => {
                  const u = m.utilisateur ?? m.Utilisateur ?? {};
                  return (
                    <button
                      key={m.id_utilisateur || m.id}
                      onClick={() => { setChosenDoctor(m); setStep(2); }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-base",
                        chosenDoctor?.id_utilisateur === m.id_utilisateur ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40"
                      )}
                    >
                      <UserAvatar name={`${u.prenom} ${u.nom}`} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Dr. {u.prenom} {u.nom}</p>
                        <p className="text-xs text-muted-foreground">{m.specialite} · {m.hopital?.nom ?? "—"}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Step 2 — Date & Créneau */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Choisissez un jour :</p>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                  {["L","M","M","J","V","S","D"].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((c, i) => {
                    const isPast = c !== null && new Date(cursor.getFullYear(), cursor.getMonth(), c) < new Date(new Date().setHours(0,0,0,0));
                    return (
                      <button
                        key={i}
                        disabled={!c || isPast}
                        onClick={() => c && !isPast && setChosenDate(c)}
                        className={cn(
                          "aspect-square rounded-lg text-xs font-medium transition-base",
                          !c && "invisible",
                          c && isPast && "text-muted-foreground/30 cursor-not-allowed",
                          c && !isPast && chosenDate !== c && "bg-muted/40 hover:bg-primary-soft cursor-pointer",
                          chosenDate === c && "bg-primary text-primary-foreground",
                        )}
                      >{c}</button>
                    );
                  })}
                </div>
              </div>

              {chosenDate && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Créneaux disponibles — {new Date(cursor.getFullYear(), cursor.getMonth(), chosenDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} :
                  </p>
                  {loadingDispo ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="rounded-xl bg-muted/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Aucun créneau disponible pour cette date.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Veuillez choisir une autre date.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {availableSlots.map((s) => (
                        <button
                          key={s}
                          onClick={() => setChosenSlot(s)}
                          className={cn(
                            "rounded-lg border-2 py-2 text-sm font-medium transition-base",
                            chosenSlot === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                          )}
                        >{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>Précédent</Button>
                <Button onClick={() => setStep(3)} disabled={!chosenSlot || !chosenDate}>Suivant</Button>
              </div>
            </div>
          )}

          {/* Step 3 — Motif */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Motif de la consultation</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex. Suivi tension, douleurs, contrôle…"
                  rows={4}
                />
              </div>
              <div className="rounded-xl bg-primary-soft p-4 text-sm space-y-1">
                <p className="font-semibold">
                  Dr. {chosenDoctor?.utilisateur?.prenom ?? chosenDoctor?.Utilisateur?.prenom} {chosenDoctor?.utilisateur?.nom ?? chosenDoctor?.Utilisateur?.nom}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {chosenDate && new Date(cursor.getFullYear(), cursor.getMonth(), chosenDate).toLocaleDateString("fr-FR", { dateStyle: "long" })} à {chosenSlot}
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>Précédent</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={creerRdv.isPending}
                  className="bg-gradient-primary shadow-glow"
                >
                  {creerRdv.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirmer le rendez-vous
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
