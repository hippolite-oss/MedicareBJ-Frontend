// Dossier patient (vue médecin) — avec bouton retour, modales consultation/prescription/renouvellement.
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDossier, useQueryClient } from "@/hooks/useQueries";
import { consultationService } from "@/services/consultationService";
import { prescriptionService } from "@/services/prescriptionService";
import { useQueryClient as useQC } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { analyseService } from "@/services/analyseService";
import medicamentService from "@/services/medicamentService";
import {
  FileText,
  Pill,
  FlaskConical,
  Download,
  Eye,
  Droplet,
  ShieldCheck,
  Plus,
  Loader2,
  ArrowLeft,
  Activity,
  Thermometer,
  Weight,
  RefreshCw,
  Trash2,
  Search,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { analyseHasResults, formatProfessionnelName } from "@/utils/analyse";

// ── Constantes formulaire consultation ───────────────────
const TYPES_CONSULT = [
  "Consultation générale",
  "Suivi chronique",
  "Urgence",
  "Téléconsultation",
  "Bilan annuel",
];
const TYPE_MAP: Record<string, string> = {
  "Consultation générale": "presentiel",
  "Suivi chronique": "presentiel",
  Urgence: "presentiel",
  Téléconsultation: "teleconsultation",
  "Bilan annuel": "presentiel",
};

// ── Constantes formulaire prescription ───────────────────
const FORMS = [
  "Comprimé",
  "Gélule",
  "Sirop",
  "Injection",
  "Pommade",
  "Suppositoire",
  "Ampoule",
];
const FREQUENCIES = [
  "1 fois/jour",
  "2 fois/jour",
  "3 fois/jour",
  "Si douleur",
  "1 fois/semaine",
];
const DURATIONS = ["3", "5", "7", "10", "14", "30", "90", "180"];

interface Med {
  id: string;
  nom_medicament: string;
  dosage: string;
  forme: string;
  frequence: string;
  duree_jours: string;
  instructions: string;
}

const emptyMed = (): Omit<Med, "id"> => ({
  nom_medicament: "",
  dosage: "",
  forme: "Comprimé",
  frequence: "1 fois/jour",
  duree_jours: "7",
  instructions: "",
});

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "long" });

// ── Composant principal ───────────────────────────────────
export default function DossierPatient() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, refetch } = useDossier(id ?? "");
  const qc = useQC();

  const dossier = data?.dossier;
  const accesEcriture = data?.acces?.type_acces === "ecriture";
  const patient = dossier?.patient;
  const profil = patient?.patient;
  const bmiMedecin =
    profil?.poids_kg && profil?.taille_cm
      ? (profil.poids_kg / Math.pow(profil.taille_cm / 100, 2)).toFixed(1)
      : null;
  const bmiMedecinLabel = bmiMedecin
    ? parseFloat(bmiMedecin) < 18.5
      ? "Insuffisance pondérale"
      : parseFloat(bmiMedecin) < 25
        ? "Normal"
        : parseFloat(bmiMedecin) < 30
          ? "Surpoids"
          : "Obésité"
    : null;
  const consultations: any[] = dossier?.consultations ?? [];
  const prescriptions: any[] = dossier?.prescriptions ?? [];
  const analyses: any[] = dossier?.analyses ?? [];

  // ── Modales ──────────────────────────────────────────────
  const [newConsultOpen, setNewConsultOpen] = useState(false);
  const [consultDetail, setConsultDetail] = useState<any>(null);
  const [viewingPrescription, setViewingPrescription] = useState<any>(null);
  const [prescCreateConsult, setPrescCreateConsult] = useState<any>(null); // consult pour laquelle on crée une prescription
  const [prescRenewConsult, setPrescRenewConsult] = useState<any>(null); // prescription à renouveler

  // ── State modale Nouvelle Consultation ──────────────────
  const [cTension, setCTension] = useState("");
  const [cTemp, setCTemp] = useState("");
  const [cWeight, setCWeight] = useState("");
  const [cMotif, setCMotif] = useState("");
  const [cDiag, setCDiag] = useState("");
  const [cNotes, setCNotes] = useState("");
  const [cType, setCType] = useState(TYPES_CONSULT[0]);
  const [cSaving, setCSaving] = useState(false);

  // ── State formulaire prescription (création + renouvellement) ──
  const [prescMeds, setPrescMeds] = useState<Med[]>([]);
  const [prescInstructions, setPrescInstructions] = useState("");
  const [prescSaving, setPrescSaving] = useState(false);
  const [prescNewMed, setPrescNewMed] = useState<Omit<Med, "id">>(emptyMed());
  const [renewMotif, setRenewMotif] = useState("Renouvellement de traitement");

  // ── State analyses ──────────────────────────────────────
  const [analyseCreateConsult, setAnalyseCreateConsult] = useState<any>(null);
  const [analyseItems, setAnalyseItems] = useState<
    { id: string; type_analyse: string }[]
  >([{ id: "a0", type_analyse: "" }]);
  const [analyseSaving, setAnalyseSaving] = useState(false);
  const [analyseResultModal, setAnalyseResultModal] = useState<any>(null);
  const [analyseResultat, setAnalyseResultat] = useState("");
  const [analyseInterpretation, setAnalyseInterpretation] = useState("");
  const [analyseResultSaving, setAnalyseResultSaving] = useState(false);
  const [analyseDetailModal, setAnalyseDetailModal] = useState<any>(null);

  // ── Handlers analyses ──────────────────────────────────
  const handleCreateAnalyses = async () => {
    if (!analyseCreateConsult || !dossier) return;
    const validItems = analyseItems.filter((i) => i.type_analyse.trim());
    if (validItems.length === 0) {
      toast.error("Ajoutez au moins un type d'analyse.");
      return;
    }
    setAnalyseSaving(true);
    try {
      for (const item of validItems) {
        await analyseService.creer({
          id_consultation: analyseCreateConsult.id,
          id_dossier: dossier.id,
          type_analyse: item.type_analyse.trim(),
        });
      }
      toast.success(`${validItems.length} analyse(s) demandée(s)`);
      qc.invalidateQueries({ queryKey: ["dossier", id] });
      await refetch();
      setAnalyseItems([{ id: "a0", type_analyse: "" }]);
      setAnalyseCreateConsult(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la demande");
    } finally {
      setAnalyseSaving(false);
    }
  };

  const handleAddResults = async () => {
    if (!analyseResultModal) return;
    if (!analyseResultat.trim()) {
      toast.error("Le résultat est requis.");
      return;
    }
    setAnalyseResultSaving(true);
    try {
      await analyseService.updateResultats(analyseResultModal.id, {
        resultat: analyseResultat,
        interpretation: analyseInterpretation || undefined,
        statut: "disponible",
      });
      toast.success("Résultats enregistrés");
      qc.invalidateQueries({ queryKey: ["dossier", id] });
      await refetch();
      setAnalyseResultModal(null);
      setAnalyseResultat("");
      setAnalyseInterpretation("");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setAnalyseResultSaving(false);
    }
  };

  // ── Réinitialisation des formulaires ────────────────────
  const resetConsultForm = () => {
    setCTension("");
    setCTemp("");
    setCWeight("");
    setCMotif("");
    setCDiag("");
    setCNotes("");
    setCType(TYPES_CONSULT[0]);
  };

  const resetPrescForm = () => {
    setPrescMeds([]);
    setPrescInstructions("");
    setPrescNewMed(emptyMed());
  };

  // ── Ouvrir modale prescription depuis consultation ───────
  const openPrescriptionForConsult = (c: any) => {
    if (c.prescription) {
      setViewingPrescription({
        ...c.prescription,
        medecin: c.medecin,
        patient: patient,
        numero_dossier: dossier?.numero_dossier,
      });
    } else {
      resetPrescForm();
      setPrescCreateConsult(c);
    }
  };

  const handleSupprimerPrescription = async (prescriptionId: string) => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette prescription ? Cette action est irréversible et supprimera également le fichier PDF associé.",
      )
    ) {
      return;
    }
    try {
      await prescriptionService.supprimer(prescriptionId);
      toast.success("Prescription supprimée avec succès");
      qc.invalidateQueries({ queryKey: ["dossier", id] });
      await refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la suppression");
    }
  };

  // ── Gestion médicaments ──────────────────────────────────
  const addMed = (target: "create" | "renew") => {
    if (!prescNewMed.nom_medicament || !prescNewMed.dosage) {
      toast.error("Nom et dosage requis.");
      return;
    }
    setPrescMeds((prev) => [
      ...prev,
      { ...prescNewMed, id: `med-${Date.now()}` },
    ]);
    setPrescNewMed(emptyMed());
  };

  // ── Enregistrer consultation ─────────────────────────────
  const handleSaveConsult = async (withPrescription = false) => {
    if (!cMotif || !cDiag) {
      toast.error("Motif et diagnostic requis.");
      return;
    }
    setCSaving(true);
    try {
      const res: any = await consultationService.creer({
        id_dossier: dossier.id,
        motif: cMotif,
        diagnostic: cDiag,
        observations: cNotes || undefined,
        tension_arterielle: cTension || undefined,
        temperature: cTemp ? parseFloat(cTemp) : undefined,
        poids_jour: cWeight ? parseFloat(cWeight) : undefined,
        type_consultation: TYPE_MAP[cType] ?? "presentiel",
      });
      const newConsult = res?.data?.consultation ?? res?.consultation;
      toast.success("Consultation enregistrée");
      qc.invalidateQueries({ queryKey: ["dossier", id] });
      await refetch();
      resetConsultForm();
      setNewConsultOpen(false);
      if (withPrescription && newConsult?.id) {
        resetPrescForm();
        setPrescCreateConsult(newConsult);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setCSaving(false);
    }
  };

  // ── Créer prescription ───────────────────────────────────
  const handleCreatePrescription = async () => {
    if (!prescCreateConsult?.id) return;
    if (prescMeds.length === 0) {
      toast.error("Ajoutez au moins un médicament.");
      return;
    }
    setPrescSaving(true);
    try {
      await prescriptionService.creer({
        id_consultation: prescCreateConsult.id,
        instructions_generales: prescInstructions || undefined,
        medicaments: prescMeds.map((m) => ({
          nom_medicament: m.nom_medicament,
          dosage: m.dosage,
          forme: m.forme,
          frequence: m.frequence,
          duree_jours: m.duree_jours ? parseInt(m.duree_jours) : undefined,
          instructions: m.instructions || undefined,
        })),
      });
      toast.success("Prescription créée et envoyée au patient");
      qc.invalidateQueries({ queryKey: ["dossier", id] });
      await refetch();
      resetPrescForm();
      setPrescCreateConsult(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la création");
    } finally {
      setPrescSaving(false);
    }
  };

  // ── Préparer renouvellement ──────────────────────────────
  const handleOpenRenew = (c: any) => {
    const meds = (c.prescription?.medicaments ?? []).map(
      (m: any, i: number) => ({
        id: `med-renew-${i}`,
        nom_medicament: m.nom_medicament,
        dosage: m.MedicamentPrescrit?.dosage ?? m.dosage ?? "",
        forme: m.forme ?? "Comprimé",
        frequence:
          m.MedicamentPrescrit?.frequence ?? m.frequence ?? "1 fois/jour",
        duree_jours: String(m.MedicamentPrescrit?.duree_jours ?? 7),
        instructions: m.MedicamentPrescrit?.instructions ?? "",
      }),
    );
    setPrescMeds(meds);
    setPrescInstructions(c.prescription?.instructions_generales ?? "");
    setRenewMotif("Renouvellement de traitement");
    setViewingPrescription(null);
    setPrescRenewConsult(c);
  };

  // ── Renouveler prescription ──────────────────────────────
  const handleRenewPrescription = async () => {
    if (!prescRenewConsult || !dossier) return;
    if (prescMeds.length === 0) {
      toast.error("Ajoutez au moins un médicament.");
      return;
    }
    setPrescSaving(true);
    try {
      await prescriptionService.renouveler({
        id_prescription_source: prescRenewConsult.prescription?.id,
        id_dossier: dossier.id,
        motif_consultation: renewMotif,
        diagnostic_consultation: renewMotif,
        medicaments: prescMeds.map((m) => ({
          nom_medicament: m.nom_medicament,
          dosage: m.dosage,
          forme: m.forme,
          frequence: m.frequence,
          duree_jours: m.duree_jours ? parseInt(m.duree_jours) : undefined,
          instructions: m.instructions || undefined,
        })),
        instructions_generales: prescInstructions || undefined,
      });
      toast.success("Prescription renouvelée avec succès");
      qc.invalidateQueries({ queryKey: ["dossier", id] });
      await refetch();
      resetPrescForm();
      setPrescRenewConsult(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors du renouvellement");
    } finally {
      setPrescSaving(false);
    }
  };

  // ── PDF ──────────────────────────────────────────────────
  const handleDownloadPDF = async (rx: any) => {
    try {
      const blob = await prescriptionService.getPdf(rx.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ordonnance-${rx.numero_ordonnance}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF non disponible");
    }
  };

  // ── Loading / Error ──────────────────────────────────────
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
        <p>Dossier introuvable ou accès non autorisé.</p>
        <p className="text-xs mt-1">
          Scannez le QR du patient pour obtenir l'accès.
        </p>
      </div>
    );
  }

  const allergiesList = profil?.allergies
    ? profil.allergies
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      {/* ── Bouton retour ── */}
      <button
        onClick={() => navigate("/medecin/patients")}
        className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Retour à mes patients
      </button>

      <PageHeader
        title={`Dossier de ${patient?.prenom ?? ""} ${patient?.nom ?? ""}`}
        subtitle="Vue médecin — accès autorisé."
        actions={
          <Button
            onClick={() => {
              resetConsultForm();
              setNewConsultOpen(true);
            }}
            className="rounded-full bg-gradient-primary shadow-glow"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Nouvelle consultation
          </Button>
        }
      />

      {/* Badge accès */}
      <div className="mb-5 flex items-center gap-2 rounded-xl bg-secondary/10 px-4 py-2.5 ring-1 ring-secondary/20">
        <ShieldCheck className="h-4 w-4 text-secondary shrink-0" />
        <p className="text-sm font-medium text-secondary">
          Accès autorisé · N° {dossier.numero_dossier}
        </p>
      </div>

      {/* En-tête patient */}
      <Card className="mb-6 overflow-hidden rounded-2xl shadow-card">
        <div className="bg-gradient-soft p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <UserAvatar
              name={`${patient?.prenom} ${patient?.nom}`}
              photoUrl={patient?.photo_profil}
              size="xl"
            />
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold">
                {patient?.prenom} {patient?.nom}
              </h2>
              <p className="text-sm text-muted-foreground">
                {patient?.sexe === "F"
                  ? "Femme"
                  : patient?.sexe === "M"
                    ? "Homme"
                    : "—"}
                {patient?.date_naissance &&
                  ` · ${new Date(patient.date_naissance).toLocaleDateString("fr-FR", { dateStyle: "long" })}`}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {profil?.groupe_sanguin && (
                  <Badge className="rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                    <Droplet className="mr-1 h-3 w-3" /> {profil.groupe_sanguin}
                  </Badge>
                )}
                {allergiesList.length > 0 && (
                  <Badge className="rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                    ⚠ {allergiesList.join(", ")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Onglets */}
      <Tabs defaultValue="consultations">
        <TabsList className="mb-5 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted p-1">
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

        {/* ── CONSULTATIONS ── */}
        <TabsContent value="consultations">
          {consultations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                Aucune consultation enregistrée.
              </p>
              <Button
                onClick={() => {
                  resetConsultForm();
                  setNewConsultOpen(true);
                }}
                className="mt-4 rounded-full bg-gradient-primary shadow-glow"
                size="sm"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Nouvelle consultation
              </Button>
            </div>
          ) : (
            <Card className="overflow-hidden rounded-2xl shadow-card">
              <div className="divide-y divide-border">
                {consultations.map((c: any, i: number) => {
                  const hasPrescription = !!c.prescription;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {c.diagnostic ?? c.motif}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.date_consultation).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                          {c.hopital?.nom && ` · ${c.hopital.nom}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Icône analyse */}
                        <button
                          onClick={() => {
                            setAnalyseItems([{ id: "a0", type_analyse: "" }]);
                            setAnalyseCreateConsult(c);
                          }}
                          title="Demander une analyse"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <FlaskConical className="h-4 w-4" />
                        </button>
                        {/* Icône prescription */}
                        <button
                          onClick={() => openPrescriptionForConsult(c)}
                          title={
                            hasPrescription
                              ? "Voir la prescription"
                              : "Créer une prescription"
                          }
                          className={cn(
                            "rounded-lg p-1.5 transition-colors",
                            hasPrescription
                              ? "text-success hover:bg-success/10"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <Pill className="h-4 w-4" />
                        </button>
                        {/* Icône détails */}
                        <button
                          onClick={() => setConsultDetail(c)}
                          title="Voir les détails"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ── PRESCRIPTIONS ── */}
        <TabsContent value="prescriptions">
          {prescriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune prescription. Créez-en une depuis une consultation.
            </p>
          ) : (
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
                    {prescriptions.map((p: any) => (
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
                                setViewingPrescription({
                                  ...p,
                                  patient: patient,
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
                            {p.id_medecin === user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                title="Supprimer la prescription"
                                onClick={() =>
                                  handleSupprimerPrescription(p.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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

        {/* ── ANALYSES ── */}
        <TabsContent value="analyses" className="space-y-3">
          {analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
              <FlaskConical className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                Aucune analyse prescrite. Demandez-en une depuis une
                consultation.
              </p>
            </div>
          ) : (
            analyses.map((a: any) => {
              const hasResults = analyseHasResults(a);
              const canFillResults =
                accesEcriture &&
                !hasResults &&
                (user?.role === "medecin" || user?.role === "technicien");
              return (
                <Card key={a.id} className="rounded-2xl shadow-card">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          hasResults
                            ? "bg-success/15 text-success"
                            : a.statut === "en_cours"
                              ? "bg-info/15 text-info"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        <FlaskConical className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {a.type_analyse}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Demandée le{" "}
                          {new Date(a.date_demande).toLocaleDateString("fr-FR")}
                        </p>
                        {hasResults && a.realisateur && (
                          <p className="text-xs text-primary mt-0.5">
                            Réalisée par{" "}
                            {formatProfessionnelName(a.realisateur)}
                          </p>
                        )}
                        {!hasResults && a.demandeur && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Demandée par {formatProfessionnelName(a.demandeur)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={a.statut as any} />
                      {hasResults && (
                        <button
                          type="button"
                          onClick={() => setAnalyseDetailModal(a)}
                          className="rounded-lg p-1.5 text-success hover:bg-success/10 transition-colors"
                          title="Consulter les résultats"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {canFillResults && (
                        <button
                          type="button"
                          onClick={() => {
                            setAnalyseResultat("");
                            setAnalyseInterpretation("");
                            setAnalyseResultModal(a);
                          }}
                          className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition-colors"
                          title="Renseigner les résultats"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ── ANTÉCÉDENTS ── */}
        <TabsContent value="antecedents">
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Allergies
                </p>
                {allergiesList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune connue</p>
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
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Antécédents
                </p>
                <p className="text-sm text-muted-foreground">
                  {profil?.antecedents ?? "Aucun renseigné"}
                </p>
              </div>
              {(profil?.poids_kg || profil?.taille_cm) && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Données biométriques
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <Weight className="mx-auto mb-1 h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Poids</p>
                      <p className="font-semibold text-sm">
                        {profil?.poids_kg ? `${profil.poids_kg} kg` : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <Activity className="mx-auto mb-1 h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Taille</p>
                      <p className="font-semibold text-sm">
                        {profil?.taille_cm ? `${profil.taille_cm} cm` : "—"}
                      </p>
                    </div>
                    {bmiMedecin && (
                      <div className="rounded-xl bg-primary-soft p-3 text-center">
                        <Activity className="mx-auto mb-1 h-4 w-4 text-primary" />
                        <p className="text-xs text-muted-foreground">IMC</p>
                        <p className="font-semibold text-sm text-primary">
                          {bmiMedecin}
                        </p>
                        {bmiMedecinLabel && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {bmiMedecinLabel}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ════════════════════════════════════════════════
          MODALE — Demande d'analyses
      ════════════════════════════════════════════════ */}
      <Dialog
        open={!!analyseCreateConsult}
        onOpenChange={(o) => {
          if (!o) {
            setAnalyseItems([{ id: "a0", type_analyse: "" }]);
            setAnalyseCreateConsult(null);
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" /> Demander des
              analyses
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              Patient :{" "}
              <strong>
                {patient?.prenom} {patient?.nom}
              </strong>{" "}
              · N° {dossier?.numero_dossier}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Types d'analyses à demander
              </Label>
              {analyseItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    value={item.type_analyse}
                    onChange={(e) =>
                      setAnalyseItems((prev) =>
                        prev.map((i) =>
                          i.id === item.id
                            ? { ...i, type_analyse: e.target.value }
                            : i,
                        ),
                      )
                    }
                    placeholder={`ex. NFS, Radio thoracique, Échographie abdominale…`}
                    className="flex-1"
                  />
                  {analyseItems.length > 1 && (
                    <button
                      onClick={() =>
                        setAnalyseItems((prev) =>
                          prev.filter((i) => i.id !== item.id),
                        )
                      }
                      className="text-destructive hover:bg-destructive/10 rounded-lg p-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  setAnalyseItems((prev) => [
                    ...prev,
                    { id: `a${Date.now()}`, type_analyse: "" },
                  ])
                }
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Ajouter une analyse
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setAnalyseCreateConsult(null)}
                className="flex-1 rounded-full"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateAnalyses}
                disabled={
                  analyseSaving ||
                  analyseItems.every((i) => !i.type_analyse.trim())
                }
                className="flex-1 rounded-full bg-gradient-primary shadow-glow"
              >
                {analyseSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FlaskConical className="mr-2 h-4 w-4" />
                )}
                Envoyer la demande
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════
          MODALE — Ajouter résultats d'analyse
      ════════════════════════════════════════════════ */}
      <Dialog
        open={!!analyseResultModal}
        onOpenChange={(o) => {
          if (!o) {
            setAnalyseResultModal(null);
            setAnalyseResultat("");
            setAnalyseInterpretation("");
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" /> Renseigner les
              résultats : {analyseResultModal?.type_analyse}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 p-3">
              Seul le premier professionnel à enregistrer les résultats sera
              identifié comme réalisateur. Vous devez disposer d'un accès en
              écriture au dossier.
            </p>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">
                Résultat *
              </Label>
              <Textarea
                value={analyseResultat}
                onChange={(e) => setAnalyseResultat(e.target.value)}
                placeholder="Décrivez le résultat de l'analyse…"
                rows={4}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">
                Interprétation (optionnel)
              </Label>
              <Textarea
                value={analyseInterpretation}
                onChange={(e) => setAnalyseInterpretation(e.target.value)}
                placeholder="Interprétation clinique, conclusion…"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setAnalyseResultModal(null)}
                className="flex-1 rounded-full"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddResults}
                disabled={analyseResultSaving || !analyseResultat.trim()}
                className="flex-1 rounded-full bg-gradient-primary shadow-glow"
              >
                {analyseResultSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Enregistrer les résultats
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════
          MODALE — Voir résultats d'analyse
      ════════════════════════════════════════════════ */}
      <Dialog
        open={!!analyseDetailModal}
        onOpenChange={(o) => !o && setAnalyseDetailModal(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-success" />{" "}
              {analyseDetailModal?.type_analyse}
            </DialogTitle>
          </DialogHeader>
          {analyseDetailModal && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-gradient-soft p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Demandée le</p>
                  <p className="font-medium">
                    {new Date(
                      analyseDetailModal.date_demande,
                    ).toLocaleDateString("fr-FR")}
                  </p>
                  {analyseDetailModal.demandeur && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Par{" "}
                      {formatProfessionnelName(analyseDetailModal.demandeur)}
                    </p>
                  )}
                </div>
                {analyseDetailModal.date_resultat && (
                  <div>
                    <p className="text-xs text-muted-foreground">Résultat le</p>
                    <p className="font-medium">
                      {new Date(
                        analyseDetailModal.date_resultat,
                      ).toLocaleDateString("fr-FR")}
                    </p>
                    {analyseDetailModal.realisateur && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        Réalisée par{" "}
                        {formatProfessionnelName(
                          analyseDetailModal.realisateur,
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {analyseDetailModal.resultat && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Résultat
                  </p>
                  <div className="rounded-lg bg-muted/50 p-3 whitespace-pre-wrap">
                    {analyseDetailModal.resultat}
                  </div>
                </div>
              )}
              {analyseDetailModal.interpretation && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Interprétation
                  </p>
                  <div className="rounded-lg bg-success/10 p-3 whitespace-pre-wrap text-success">
                    {analyseDetailModal.interpretation}
                  </div>
                </div>
              )}
              <p className="text-xs text-center text-muted-foreground">
                Consultation en lecture seule — les résultats ne peuvent plus
                être modifiés.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════
          MODALE — Nouvelle consultation
      ════════════════════════════════════════════════ */}
      <Dialog
        open={newConsultOpen}
        onOpenChange={(o) => {
          if (!o) {
            resetConsultForm();
            setNewConsultOpen(false);
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Nouvelle
              consultation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Infos patient (non-éditables) */}
            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Patient
              </p>
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={`${patient?.prenom} ${patient?.nom}`}
                  photoUrl={patient?.photo_profil}
                  size="md"
                />
                <div>
                  <p className="font-semibold">
                    {patient?.prenom} {patient?.nom}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    N° {dossier.numero_dossier}
                  </p>
                </div>
              </div>
            </div>

            {/* Type */}
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Type de consultation
              </Label>
              <RadioGroup
                value={cType}
                onValueChange={setCType}
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
              >
                {TYPES_CONSULT.map((t) => (
                  <label
                    key={t}
                    htmlFor={`nc-type-${t}`}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-2.5 text-xs font-medium transition-base",
                      cType === t
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <RadioGroupItem
                      id={`nc-type-${t}`}
                      value={t}
                      className="sr-only"
                    />
                    {t}
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Constantes */}
            <div>
              <p className="mb-3 text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Constantes vitales
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <FieldSmall
                  label="Tension"
                  placeholder="ex. 12/8"
                  value={cTension}
                  onChange={setCTension}
                  icon={Activity}
                />
                <FieldSmall
                  label="Température (°C)"
                  placeholder="ex. 37.2"
                  value={cTemp}
                  onChange={setCTemp}
                  icon={Thermometer}
                />
                <FieldSmall
                  label="Poids (kg)"
                  placeholder="ex. 65"
                  value={cWeight}
                  onChange={setCWeight}
                  icon={Weight}
                />
              </div>
            </div>

            {/* Motif + Diagnostic */}
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Motif *
                </Label>
                <Textarea
                  value={cMotif}
                  onChange={(e) => setCMotif(e.target.value)}
                  placeholder="Motif de la consultation…"
                  rows={2}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Diagnostic *
                </Label>
                <Textarea
                  value={cDiag}
                  onChange={(e) => setCDiag(e.target.value)}
                  placeholder="Diagnostic établi…"
                  rows={2}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Observations
                </Label>
                <Textarea
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  placeholder="Notes complémentaires…"
                  rows={2}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setNewConsultOpen(false)}
                className="flex-1 rounded-full"
              >
                Annuler
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveConsult(false)}
                disabled={cSaving}
                className="flex-1 rounded-full"
              >
                {cSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Enregistrer
              </Button>
              <Button
                onClick={() => handleSaveConsult(true)}
                disabled={cSaving}
                className="flex-1 rounded-full bg-gradient-primary shadow-glow"
              >
                {cSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pill className="mr-1.5 h-4 w-4" />
                )}
                + Prescrire
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          MODALE — Détails consultation
      ════════════════════════════════════════════════════ */}
      <Dialog
        open={!!consultDetail}
        onOpenChange={(o) => !o && setConsultDetail(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Détails de la
              consultation
            </DialogTitle>
          </DialogHeader>
          {consultDetail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-gradient-soft p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {fmt(consultDetail.date_consultation)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {consultDetail.type_consultation ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Médecin</p>
                  <p className="font-medium">
                    Dr. {consultDetail.medecin?.prenom}{" "}
                    {consultDetail.medecin?.nom}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hôpital</p>
                  <p className="font-medium">
                    {consultDetail.hopital?.nom ?? "—"}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Motif
                </p>
                <p className="rounded-lg bg-muted/50 p-3">
                  {consultDetail.motif}
                </p>
              </div>
              {consultDetail.diagnostic && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Diagnostic
                  </p>
                  <p className="rounded-lg bg-primary-soft p-3 font-medium text-primary">
                    {consultDetail.diagnostic}
                  </p>
                </div>
              )}
              {(consultDetail.tension_arterielle ||
                consultDetail.temperature ||
                consultDetail.poids_jour) && (
                <div className="grid grid-cols-3 gap-2">
                  {consultDetail.tension_arterielle && (
                    <Vital
                      label="Tension"
                      value={consultDetail.tension_arterielle}
                    />
                  )}
                  {consultDetail.temperature && (
                    <Vital
                      label="Temp."
                      value={`${consultDetail.temperature}°C`}
                    />
                  )}
                  {consultDetail.poids_jour && (
                    <Vital
                      label="Poids"
                      value={`${consultDetail.poids_jour}kg`}
                    />
                  )}
                </div>
              )}
              {consultDetail.observations && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Observations
                  </p>
                  <p className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
                    {consultDetail.observations}
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {consultDetail.prescription ? (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => {
                      setViewingPrescription({
                        ...consultDetail.prescription,
                        medecin: consultDetail.medecin,
                        patient: patient,
                        numero_dossier: dossier?.numero_dossier,
                      });
                      setConsultDetail(null);
                    }}
                  >
                    <Pill className="mr-2 h-4 w-4" /> Voir la prescription
                  </Button>
                ) : (
                  <Button
                    className="flex-1 rounded-full bg-gradient-primary"
                    onClick={() => {
                      resetPrescForm();
                      setPrescCreateConsult(consultDetail);
                      setConsultDetail(null);
                    }}
                  >
                    <Pill className="mr-2 h-4 w-4" /> Créer une prescription
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          MODALE — Voir prescription existante (Rendu Style PDF Haute Fidélité)
      ════════════════════════════════════════════════════ */}
      <Dialog
        open={!!viewingPrescription}
        onOpenChange={(o) => !o && setViewingPrescription(null)}
      >
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-[#F8FAFC]">
          {viewingPrescription && (
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
                        Dr. {viewingPrescription.medecin?.prenom}{" "}
                        {viewingPrescription.medecin?.nom}
                      </p>
                      <p className="mt-0.5 text-slate-600">
                        {viewingPrescription.medecin?.professionnel
                          ?.specialite || "Médecin généraliste"}
                      </p>
                      {viewingPrescription.medecin?.professionnel
                        ?.numero_ordre && (
                        <p className="text-slate-500 text-[10px] mt-0.5">
                          N° Ordre :{" "}
                          {
                            viewingPrescription.medecin.professionnel
                              .numero_ordre
                          }
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        Date :{" "}
                        {new Date(
                          viewingPrescription.date_prescription ??
                            viewingPrescription.createdAt,
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
                        {viewingPrescription.patient?.prenom}{" "}
                        {viewingPrescription.patient?.nom}
                      </p>
                      <p className="text-slate-700">
                        Né(e) le :{" "}
                        {viewingPrescription.patient?.date_naissance
                          ? new Date(
                              viewingPrescription.patient.date_naissance,
                            ).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "N/A"}
                        {viewingPrescription.patient?.date_naissance &&
                          ` — ${(() => {
                            const birth = new Date(
                              viewingPrescription.patient.date_naissance,
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
                        {viewingPrescription.numero_dossier ||
                          viewingPrescription.numeroDossier ||
                          viewingPrescription.dossier?.numero_dossier ||
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
                      {(viewingPrescription.medicaments ?? []).map(
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
                  {viewingPrescription.instructions_generales && (
                    <div className="bg-[#FFF9E6] border border-[#FFD700] rounded-xl p-3.5 mb-5 text-[11px] text-slate-800 shadow-sm">
                      <p className="font-bold text-slate-900 mb-1">
                        Instructions générales :
                      </p>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                        {viewingPrescription.instructions_generales}
                      </p>
                    </div>
                  )}

                  {/* Signature simulée */}
                  <div className="flex justify-end mt-8 mr-2">
                    <div className="text-center w-56">
                      <div className="border-t border-slate-300 my-1.5"></div>
                      <p className="text-[11px] font-bold text-slate-900">
                        Dr. {viewingPrescription.medecin?.prenom}{" "}
                        {viewingPrescription.medecin?.nom}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {viewingPrescription.medecin?.professionnel
                          ?.specialite || "Médecin généraliste"}
                      </p>
                    </div>
                  </div>

                  {/* Pied de page de l'ordonnance #F5F5F5 */}
                  <div className="bg-[#F5F5F5] rounded-lg p-2 text-center text-[9px] text-slate-500 mt-6">
                    Ordonnance N° {viewingPrescription.numero_ordonnance} —
                    Générée le{" "}
                    {new Date(
                      viewingPrescription.date_prescription ??
                        viewingPrescription.createdAt,
                    ).toLocaleDateString("fr-FR")}{" "}
                    — MediCare BJ
                  </div>
                </div>
              </div>

              {/* Barre d'actions à la base de la modale */}
              <div className="flex gap-2 p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(viewingPrescription)}
                  className="rounded-full text-xs h-9"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Télécharger PDF
                </Button>
                <Button
                  onClick={() =>
                    handleOpenRenew({ prescription: viewingPrescription })
                  }
                  className="rounded-full bg-gradient-primary shadow-glow text-xs h-9"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Renouveler
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setViewingPrescription(null)}
                  className="rounded-full text-xs h-9"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          MODALE — Créer prescription
      ════════════════════════════════════════════════════ */}
      <Dialog
        open={!!prescCreateConsult}
        onOpenChange={(o) => {
          if (!o) {
            resetPrescForm();
            setPrescCreateConsult(null);
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" /> Nouvelle prescription
            </DialogTitle>
          </DialogHeader>
          <PrescriptionForm
            meds={prescMeds}
            setMeds={setPrescMeds}
            newMed={prescNewMed}
            setNewMed={setPrescNewMed}
            instructions={prescInstructions}
            setInstructions={setPrescInstructions}
            saving={prescSaving}
            onAdd={() => addMed("create")}
            onSubmit={handleCreatePrescription}
            onCancel={() => {
              resetPrescForm();
              setPrescCreateConsult(null);
            }}
            submitLabel="Créer la prescription"
          />
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          MODALE — Renouveler prescription
      ════════════════════════════════════════════════════ */}
      <Dialog
        open={!!prescRenewConsult}
        onOpenChange={(o) => {
          if (!o) {
            resetPrescForm();
            setPrescRenewConsult(null);
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" /> Renouveler la
              prescription
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Motif consultation */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium">
                Motif de la consultation de renouvellement
              </Label>
              <Input
                value={renewMotif}
                onChange={(e) => setRenewMotif(e.target.value)}
                placeholder="ex. Renouvellement de traitement"
              />
            </div>
            <PrescriptionForm
              meds={prescMeds}
              setMeds={setPrescMeds}
              newMed={prescNewMed}
              setNewMed={setPrescNewMed}
              instructions={prescInstructions}
              setInstructions={setPrescInstructions}
              saving={prescSaving}
              onAdd={() => addMed("renew")}
              onSubmit={handleRenewPrescription}
              onCancel={() => {
                resetPrescForm();
                setPrescRenewConsult(null);
              }}
              submitLabel="Valider le renouvellement"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Sous-composants ───────────────────────────────────────
function FieldSmall({ label, placeholder, value, onChange, icon: Icon }: any) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-medium">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-8 h-9 text-sm"
        />
      </div>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-display font-bold text-sm">{value}</p>
    </div>
  );
}

function MedSearchInput({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (med: { nom: string; dosage: string; forme: string }) => void;
}) {
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (v.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const meds = await medicamentService.search(v.trim());
        setResults(meds);
        setOpen(meds.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 300);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher dans la BD ou saisir manuellement…"
          className="h-9 pl-8"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-background shadow-elevated max-h-48 overflow-y-auto">
          {results.map((med) => (
            <button
              key={med.id}
              type="button"
              onClick={() => {
                onSelect(med);
                setOpen(false);
                setResults([]);
              }}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 transition-colors"
            >
              <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium">{med.nom}</p>
                <p className="text-xs text-muted-foreground">
                  {med.dosage} · {med.forme}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PrescriptionForm({
  meds,
  setMeds,
  newMed,
  setNewMed,
  instructions,
  setInstructions,
  saving,
  onAdd,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  meds: Med[];
  setMeds: React.Dispatch<React.SetStateAction<Med[]>>;
  newMed: Omit<Med, "id">;
  setNewMed: React.Dispatch<React.SetStateAction<Omit<Med, "id">>>;
  instructions: string;
  setInstructions: React.Dispatch<React.SetStateAction<string>>;
  saving: boolean;
  onAdd: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const FORMS = [
    "Comprimé",
    "Gélule",
    "Sirop",
    "Injection",
    "Pommade",
    "Suppositoire",
    "Ampoule",
  ];
  const FREQUENCIES = [
    "1 fois/jour",
    "2 fois/jour",
    "3 fois/jour",
    "Si douleur",
    "1 fois/semaine",
  ];
  const DURATIONS = ["3", "5", "7", "10", "14", "30", "90", "180"];

  return (
    <div className="space-y-4">
      {/* Ajout médicament */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" /> Ajouter un médicament
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs">Médicament *</Label>
            <MedSearchInput
              value={newMed.nom_medicament}
              onChange={(v) => setNewMed({ ...newMed, nom_medicament: v })}
              onSelect={(med) =>
                setNewMed({
                  ...newMed,
                  nom_medicament: med.nom,
                  dosage: med.dosage,
                  forme: med.forme || newMed.forme,
                })
              }
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Dosage *</Label>
            <Input
              value={newMed.dosage}
              onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
              placeholder="ex. 1 comprimé / 5mg"
              className="h-9"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Forme</Label>
            <Select
              value={newMed.forme}
              onValueChange={(v) => setNewMed({ ...newMed, forme: v })}
            >
              <SelectTrigger className="h-9 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Fréquence</Label>
            <Select
              value={newMed.frequence}
              onValueChange={(v) => setNewMed({ ...newMed, frequence: v })}
            >
              <SelectTrigger className="h-9 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Durée (jours)</Label>
            <Select
              value={newMed.duree_jours}
              onValueChange={(v) => setNewMed({ ...newMed, duree_jours: v })}
            >
              <SelectTrigger className="h-9 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d} jours
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs">
              Instructions spécifiques
            </Label>
            <Input
              value={newMed.instructions}
              onChange={(e) =>
                setNewMed({ ...newMed, instructions: e.target.value })
              }
              placeholder="ex. Prendre avec de la nourriture"
              className="h-9"
            />
          </div>
        </div>
        <Button
          onClick={onAdd}
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Ajouter
        </Button>
      </div>

      {/* Liste médicaments */}
      {meds.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Médicaments ({meds.length})</p>
          {meds.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <Pill className="h-4 w-4 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{m.nom_medicament}</p>
                <p className="text-xs text-muted-foreground">
                  {m.dosage} · {m.forme} · {m.frequence} · {m.duree_jours}j
                </p>
              </div>
              <button
                onClick={() => setMeds((ms) => ms.filter((x) => x.id !== m.id))}
                className="text-destructive hover:bg-destructive/10 rounded-lg p-1.5"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Instructions générales */}
      <div>
        <Label className="mb-1.5 block text-sm font-medium">
          Instructions générales
        </Label>
        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Conseils, précautions, mode de prise…"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-full"
        >
          Annuler
        </Button>
        <Button
          onClick={onSubmit}
          disabled={saving || meds.length === 0}
          className="flex-1 rounded-full bg-gradient-primary shadow-glow"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
