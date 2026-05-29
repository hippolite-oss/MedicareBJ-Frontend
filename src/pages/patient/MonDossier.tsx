// Mon dossier médical — données réelles via API.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMonDossier } from "@/hooks/useQueries";
import { dossierService } from "@/services/dossierService";
import { prescriptionService } from "@/services/prescriptionService";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Download,
  Eye,
  FileText,
  Pill,
  FlaskConical,
  Activity,
  Droplet,
  Ruler,
  Weight as WeightIcon,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { analyseHasResults, formatProfessionnelName } from "@/utils/analyse";
import { useAuth } from "@/context/AuthContext";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function MonDossier() {
  const { user } = useAuth();
  const { data, isLoading, refetch } = useMonDossier();
  const [consultModal, setConsultModal] = useState<any>(null);
  const [rxModal, setRxModal] = useState<any>(null);
  const [analyseModal, setAnalyseModal] = useState<any>(null);
  const [savingAntecedents, setSavingAntecedents] = useState(false);
  const [antecedents, setAntecedents] = useState("");
  const [allergies, setAllergies] = useState("");

  const dossier = data?.dossier;
  const profil = dossier?.patient?.patient;
  const consultations: any[] = dossier?.consultations ?? [];
  const prescriptions: any[] = dossier?.prescriptions ?? [];
  const analyses: any[] = dossier?.analyses ?? [];

  const bmi =
    profil?.poids_kg && profil?.taille_cm
      ? (profil.poids_kg / Math.pow(profil.taille_cm / 100, 2)).toFixed(1)
      : "—";

  const handleDownloadPDF = async (rx: any) => {
    try {
      const blob = await prescriptionService.getPdf(rx.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ordonnance-${rx.numero_ordonnance}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Ordonnance téléchargée");
    } catch {
      toast.error("PDF non disponible");
    }
  };

  const handleSaveAntecedents = async () => {
    if (!dossier?.id) return;
    setSavingAntecedents(true);
    try {
      await dossierService.updateProfilMedical(dossier.id, {
        antecedents: antecedents || profil?.antecedents,
        allergies: allergies || profil?.allergies,
      });
      toast.success("Antécédents enregistrés");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setSavingAntecedents(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FileText className="mb-3 h-12 w-12 opacity-30" />
        <p>Dossier médical introuvable.</p>
      </div>
    );
  }

  const allergiesList = profil?.allergies
    ? profil.allergies
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];
  const antecedentsList = profil?.antecedents
    ? profil.antecedents
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  const bmiVal = parseFloat(bmi as string);
  const bmiLabel =
    bmi !== "—"
      ? bmiVal < 18.5
        ? "Insuffisance pondérale"
        : bmiVal < 25
          ? "Normal"
          : bmiVal < 30
            ? "Surpoids"
            : "Obésité"
      : null;

  return (
    <>
      <PageHeader
        title="Mon dossier médical"
        subtitle="Toutes vos informations de santé en un seul endroit."
      />

      {/* En-tête patient */}
      <Card className="mb-6 overflow-hidden rounded-2xl shadow-card">
        <div className="bg-gradient-soft p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <UserAvatar
              name={`${user?.prenom} ${user?.nom}`}
              photoUrl={user?.photo_profil}
              size="xl"
            />
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold sm:text-2xl">
                {user?.prenom} {user?.nom}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {profil?.groupe_sanguin && (
                  <Badge className="rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                    <Droplet className="mr-1 h-3 w-3" /> {profil.groupe_sanguin}
                  </Badge>
                )}
                <Badge className="rounded-full bg-primary-soft text-primary">
                  N° {dossier.numero_dossier}
                </Badge>
                {allergiesList.length > 0 && (
                  <Badge className="rounded-full bg-accent/15 text-accent-foreground">
                    ⚠ {allergiesList.length} allergie(s)
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="resume">
        <TabsList className="mb-5 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted p-1">
          <TabsTrigger value="resume" className="rounded-lg">
            Résumé
          </TabsTrigger>
          <TabsTrigger value="consultations" className="rounded-lg">
            Consultations ({consultations.length})
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="rounded-lg">
            Prescriptions ({prescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="analyses" className="rounded-lg">
            Analyses ({analyses.length})
          </TabsTrigger>
          <TabsTrigger value="antecedents" className="rounded-lg">
            Antécédents
          </TabsTrigger>
        </TabsList>

        {/* RÉSUMÉ */}
        <TabsContent value="resume" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon: Ruler,
                label: "Taille",
                val: profil?.taille_cm ? `${profil.taille_cm} cm` : "—",
                sub: null,
              },
              {
                icon: WeightIcon,
                label: "Poids",
                val: profil?.poids_kg ? `${profil.poids_kg} kg` : "—",
                sub: null,
              },
              { icon: Activity, label: "IMC", val: bmi, sub: bmiLabel },
              {
                icon: Droplet,
                label: "Groupe",
                val: profil?.groupe_sanguin ?? "—",
                sub: null,
              },
            ].map((s) => (
              <Card key={s.label} className="rounded-2xl shadow-card">
                <CardContent className="p-4">
                  <s.icon className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="font-display text-lg font-bold">{s.val}</p>
                  {s.sub && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.sub}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5">
              <h3 className="mb-3 font-display text-base font-semibold">
                Allergies & antécédents
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Allergies
                  </p>
                  {allergiesList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune connue
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allergiesList.map((a: string) => (
                        <Badge
                          key={a}
                          className="rounded-full bg-destructive/10 text-destructive"
                        >
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Antécédents
                  </p>
                  {antecedentsList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {antecedentsList.map((c: string) => (
                        <Badge
                          key={c}
                          className="rounded-full bg-accent/15 text-accent-foreground"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONSULTATIONS */}
        <TabsContent value="consultations" className="space-y-4">
          {consultations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune consultation enregistrée.
            </p>
          ) : (
            consultations.map((c: any) => (
              <Card
                key={c.id}
                className="rounded-2xl shadow-card transition-base hover:shadow-elevated"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          {fmt(c.date_consultation)}
                        </p>
                        <h4 className="font-display text-base font-semibold">
                          {c.diagnostic ?? c.motif}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Dr. {c.medecin?.prenom} {c.medecin?.nom} ·{" "}
                          {c.hopital?.nom ?? "—"}
                        </p>
                        <p className="mt-1 text-sm">
                          Motif :{" "}
                          <span className="text-muted-foreground">
                            {c.motif}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full shrink-0"
                      onClick={() => setConsultModal(c)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> Détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* PRESCRIPTIONS */}
        <TabsContent value="prescriptions">
          <Card className="overflow-hidden rounded-2xl shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">
                      Médecin prescripteur
                    </th>
                    <th className="px-4 py-3 text-right font-medium pr-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Aucune prescription.
                      </td>
                    </tr>
                  ) : (
                    prescriptions.map((p: any) => (
                      <tr
                        key={p.id}
                        className="border-t border-border hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(
                            p.date_prescription ?? p.createdAt,
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {p.medecin
                            ? `Dr. ${p.medecin.prenom} ${p.medecin.nom}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              title="Voir la prescription"
                              onClick={() =>
                                setRxModal({
                                  ...p,
                                  patient: dossier?.patient,
                                  numero_dossier: dossier?.numero_dossier,
                                })
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              title="Télécharger le PDF"
                              onClick={() => handleDownloadPDF(p)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ANALYSES */}
        <TabsContent value="analyses" className="space-y-3">
          {analyses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune analyse.</p>
          ) : (
            analyses.map((a: any) => {
              const hasResults = analyseHasResults(a);
              return (
                <Card key={a.id} className="rounded-2xl shadow-card">
                  <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          hasResults
                            ? "bg-success/15 text-success"
                            : "bg-info/15 text-info"
                        }`}
                      >
                        <FlaskConical className="h-5 w-5" />
                      </span>
                      <div>
                        <h4 className="font-display text-base font-semibold">
                          {a.type_analyse}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Demandée le{" "}
                          {new Date(a.date_demande).toLocaleDateString("fr-FR")}
                        </p>
                        {hasResults && a.realisateur && (
                          <p className="text-xs text-primary mt-1">
                            Réalisée par{" "}
                            {formatProfessionnelName(a.realisateur)}
                          </p>
                        )}
                        {!hasResults && (
                          <p className="text-xs text-muted-foreground mt-1">
                            En attente des résultats du laboratoire
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={a.statut as any} />
                      {hasResults ? (
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={() => setAnalyseModal(a)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Voir résultats
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setAnalyseModal(a)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Détails
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ANTÉCÉDENTS */}
        <TabsContent value="antecedents">
          <Card className="rounded-2xl shadow-card">
            <CardContent className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Antécédents médicaux
                </label>
                <Textarea
                  defaultValue={profil?.antecedents ?? ""}
                  onChange={(e) => setAntecedents(e.target.value)}
                  rows={3}
                  placeholder="Maladies chroniques, chirurgies…"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Allergies connues
                </label>
                <Textarea
                  defaultValue={profil?.allergies ?? ""}
                  onChange={(e) => setAllergies(e.target.value)}
                  rows={2}
                  placeholder="Pénicilline, arachides…"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAntecedents}
                  disabled={savingAntecedents}
                  className="bg-gradient-primary shadow-glow"
                >
                  {savingAntecedents ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Enregistrer les modifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal consultation */}
      <Dialog
        open={!!consultModal}
        onOpenChange={(o) => !o && setConsultModal(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Détails de la consultation
            </DialogTitle>
          </DialogHeader>
          {consultModal && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-gradient-soft p-4">
                <InfoRow
                  label="Date"
                  value={fmt(consultModal.date_consultation)}
                />
                <InfoRow
                  label="Médecin"
                  value={`Dr. ${consultModal.medecin?.prenom} ${consultModal.medecin?.nom}`}
                />
                <InfoRow
                  label="Hôpital"
                  value={consultModal.hopital?.nom ?? "—"}
                />
                <InfoRow
                  label="Type"
                  value={consultModal.type_consultation ?? "—"}
                />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Motif
                </p>
                <p className="rounded-lg bg-muted/50 p-3">
                  {consultModal.motif}
                </p>
              </div>
              {consultModal.diagnostic && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Diagnostic
                  </p>
                  <p className="rounded-lg bg-primary-soft p-3 font-medium text-primary">
                    {consultModal.diagnostic}
                  </p>
                </div>
              )}
              {(consultModal.tension_arterielle ||
                consultModal.temperature ||
                consultModal.poids_jour) && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Constantes
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {consultModal.tension_arterielle && (
                      <Vital
                        label="Tension"
                        value={consultModal.tension_arterielle}
                      />
                    )}
                    {consultModal.temperature && (
                      <Vital
                        label="Temp."
                        value={`${consultModal.temperature}°C`}
                      />
                    )}
                    {consultModal.poids_jour && (
                      <Vital
                        label="Poids"
                        value={`${consultModal.poids_jour} kg`}
                      />
                    )}
                  </div>
                </div>
              )}
              {consultModal.observations && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Notes
                  </p>
                  <p className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
                    {consultModal.observations}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal prescription (Rendu Style PDF Haute Fidélité) */}
      <Dialog open={!!rxModal} onOpenChange={(o) => !o && setRxModal(null)}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-[#F8FAFC]">
          {rxModal && (
            <div className="flex flex-col h-full justify-between">
              {/* Conteneur type papier A4 */}
              <div className="bg-white shadow-sm border border-slate-100 flex flex-col justify-between p-0">
                {/* Bandeau d'en-tête bleu/vert canard #1A6B8A */}
                <div className="bg-[#1A6B8A] text-white p-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold tracking-wide">
                      MediCare BJ
                    </h3>
                    <p className="text-[10px] text-white/80 mt-0.5">
                      Carnet de soins numérique
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-white/80">
                    <p>www.medicarebj.bj</p>
                  </div>
                </div>

                <div className="p-6">
                  {/* Titre ORDONNANCE MÉDICALE */}
                  <h2 className="text-lg font-bold text-[#1A6B8A] text-center tracking-widest my-2">
                    ORDONNANCE MÉDICALE
                  </h2>

                  {/* Ligne de séparation */}
                  <div className="h-[2px] bg-[#1A6B8A] w-full mb-4"></div>

                  {/* Infos Médecin / Date */}
                  <div className="flex justify-between items-start mb-5 text-xs text-slate-700">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        Dr. {rxModal.medecin?.prenom} {rxModal.medecin?.nom}
                      </p>
                      <p className="mt-0.5 text-slate-600">
                        {rxModal.medecin?.professionnel?.specialite ||
                          "Médecin généraliste"}
                      </p>
                      {rxModal.medecin?.professionnel?.numero_ordre && (
                        <p className="text-slate-500 text-[10px] mt-0.5">
                          N° Ordre :{" "}
                          {rxModal.medecin.professionnel.numero_ordre}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        Date :{" "}
                        {new Date(
                          rxModal.date_prescription ?? rxModal.createdAt,
                        ).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Infos Patient (encadré bleu doux #F0F7FA avec bordure #D0E8F0) */}
                  <div className="bg-[#F0F7FA] border border-[#D0E8F0] rounded-xl p-4 mb-6 text-xs text-slate-800 shadow-sm">
                    <h4 className="font-bold text-[#1A6B8A] text-[10px] tracking-wider uppercase mb-1.5">
                      PATIENT
                    </h4>
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-slate-900">
                        {rxModal.patient?.prenom} {rxModal.patient?.nom}
                      </p>
                      <p className="text-slate-700">
                        Né(e) le :{" "}
                        {rxModal.patient?.date_naissance
                          ? new Date(
                              rxModal.patient.date_naissance,
                            ).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "N/A"}
                        {rxModal.patient?.date_naissance &&
                          ` — ${(() => {
                            const birth = new Date(
                              rxModal.patient.date_naissance,
                            );
                            const today = new Date();
                            let age = today.getFullYear() - birth.getFullYear();
                            const m = today.getMonth() - birth.getMonth();
                            if (
                              m < 0 ||
                              (m === 0 && today.getDate() < birth.getDate())
                            )
                              age--;
                            return age;
                          })()} ans`}
                      </p>
                      <p className="text-slate-600 font-semibold text-[10px]">
                        N° Dossier :{" "}
                        {rxModal.numero_dossier ||
                          rxModal.numeroDossier ||
                          rxModal.dossier?.numero_dossier ||
                          dossier?.numero_dossier ||
                          "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Médicaments Prescrits */}
                  <div className="mb-6">
                    <h4 className="font-bold text-[#1A6B8A] text-[10px] tracking-wider uppercase mb-1">
                      MÉDICAMENTS PRESCRITS
                    </h4>
                    <div className="h-[1px] bg-[#1A6B8A] w-full mb-3"></div>

                    <div className="space-y-4">
                      {(rxModal.medicaments ?? []).map(
                        (med: any, i: number) => {
                          const nomMed =
                            med.nom_medicament ?? med.nom ?? "Médicament";
                          const dosageMed =
                            med.MedicamentPrescrit?.dosage ??
                            med.dosage ??
                            "N/A";
                          const formeMed =
                            med.MedicamentPrescrit?.forme ?? med.forme ?? "N/A";
                          const frequenceMed =
                            med.MedicamentPrescrit?.frequence ??
                            med.frequence ??
                            "N/A";
                          const dureeMed =
                            med.MedicamentPrescrit?.duree_jours ??
                            med.duree_jours;
                          const instrMed =
                            med.MedicamentPrescrit?.instructions ??
                            med.instructions;

                          return (
                            <div
                              key={med.id ?? i}
                              className="pl-3 border-l-2 border-[#1A6B8A] py-0.5"
                            >
                              <p className="font-bold text-[#1A6B8A] text-xs flex items-center">
                                <span className="inline-flex items-center justify-center bg-[#1A6B8A] text-white rounded-full w-4.5 h-4.5 text-[9px] mr-2">
                                  {i + 1}
                                </span>
                                {nomMed}
                              </p>
                              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-700 pl-6">
                                <p>
                                  <span className="font-medium text-slate-400">
                                    Dosage :
                                  </span>{" "}
                                  {dosageMed}
                                </p>
                                <p>
                                  <span className="font-medium text-slate-400">
                                    Forme :
                                  </span>{" "}
                                  {formeMed}
                                </p>
                                <p className="sm:col-span-2">
                                  <span className="font-medium text-slate-400">
                                    Fréquence :
                                  </span>{" "}
                                  {frequenceMed} —{" "}
                                  <span className="font-medium text-slate-400">
                                    Durée :
                                  </span>{" "}
                                  {dureeMed ? `${dureeMed} jours` : "N/A"}
                                </p>
                              </div>
                              {instrMed && (
                                <p className="text-[11px] italic text-slate-500 mt-0.5 pl-6">
                                  Instructions : {instrMed}
                                </p>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {/* Instructions Générales (encadré jaune vif #FFF9E6 avec bordure #FFD700) */}
                  {rxModal.instructions_generales && (
                    <div className="bg-[#FFF9E6] border border-[#FFD700] rounded-xl p-3.5 mb-5 text-[11px] text-slate-800 shadow-sm">
                      <p className="font-bold text-slate-900 mb-1">
                        Instructions générales :
                      </p>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                        {rxModal.instructions_generales}
                      </p>
                    </div>
                  )}

                  {/* Signature simulée */}
                  <div className="flex justify-end mt-8 mr-2">
                    <div className="text-center w-56">
                      <div className="border-t border-slate-300 my-1.5"></div>
                      <p className="text-[11px] font-bold text-slate-900">
                        Dr. {rxModal.medecin?.prenom} {rxModal.medecin?.nom}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {rxModal.medecin?.professionnel?.specialite ||
                          "Médecin généraliste"}
                      </p>
                    </div>
                  </div>

                  {/* Pied de page de l'ordonnance #F5F5F5 */}
                  <div className="bg-[#F5F5F5] rounded-lg p-2 text-center text-[9px] text-slate-500 mt-6">
                    Ordonnance N° {rxModal.numero_ordonnance} — Générée le{" "}
                    {new Date(
                      rxModal.date_prescription ?? rxModal.createdAt,
                    ).toLocaleDateString("fr-FR")}{" "}
                    — MediCare BJ
                  </div>
                </div>
              </div>

              {/* Barre d'actions à la base de la modale */}
              <div className="flex gap-2 p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(rxModal)}
                  className="rounded-full text-xs h-9"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Télécharger PDF
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setRxModal(null)}
                  className="rounded-full text-xs h-9"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal analyse */}
      <Dialog
        open={!!analyseModal}
        onOpenChange={(o) => !o && setAnalyseModal(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              Résultats d'analyse
            </DialogTitle>
          </DialogHeader>
          {analyseModal && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-gradient-soft p-4">
                <p className="font-display text-base font-semibold">
                  {analyseModal.type_analyse}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Demandée le{" "}
                  {new Date(analyseModal.date_demande).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>
                {analyseModal.demandeur && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Prescrite par{" "}
                    {formatProfessionnelName(analyseModal.demandeur)}
                  </p>
                )}
                <div className="mt-2">
                  <StatusBadge status={analyseModal.statut as any} />
                </div>
              </div>
              {analyseHasResults(analyseModal) ? (
                <>
                  {analyseModal.realisateur && (
                    <p className="text-sm font-medium text-primary">
                      Réalisée par{" "}
                      {formatProfessionnelName(analyseModal.realisateur)}
                      {analyseModal.date_resultat &&
                        ` — le ${new Date(analyseModal.date_resultat).toLocaleDateString("fr-FR")}`}
                    </p>
                  )}
                  {analyseModal.resultat && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Résultat
                      </p>
                      <p className="rounded-lg bg-muted/50 p-3 whitespace-pre-wrap">
                        {analyseModal.resultat}
                      </p>
                    </div>
                  )}
                  {analyseModal.interpretation && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Interprétation
                      </p>
                      <div className="flex items-start gap-2 rounded-xl bg-success/10 p-3 ring-1 ring-success/20">
                        <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <p className="text-sm text-success whitespace-pre-wrap">
                          {analyseModal.interpretation}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="rounded-lg bg-muted/50 p-4 text-muted-foreground text-center">
                  Les résultats ne sont pas encore disponibles. Seul un
                  professionnel de santé habilité pourra les renseigner.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-display font-bold">{value}</p>
    </div>
  );
}
