// Mes consultations (vue médecin) — liste complète, lecture seule.
import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMesConsultations } from "@/hooks/useQueries";
import { prescriptionService } from "@/services/prescriptionService";
import {
  Search,
  FileText,
  Eye,
  Pill,
  Download,
  Loader2,
  Stethoscope,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { getImageUrl } from "@/utils/imageUrl";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function MesConsultations() {
  const [query, setQuery] = useState("");
  const [detailModal, setDetailModal] = useState<any>(null);
  const [prescModal, setPrescModal] = useState<any>(null);

  const { data, isLoading } = useMesConsultations({ limit: 200 });
  const consultations: any[] = data?.consultations ?? [];

  const filtered = consultations.filter((c: any) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const patientName =
      `${c.dossier?.patient?.prenom ?? ""} ${c.dossier?.patient?.nom ?? ""}`.toLowerCase();
    const motif = (c.motif ?? "").toLowerCase();
    const diag = (c.diagnostic ?? "").toLowerCase();
    const numero = (c.dossier?.numero_dossier ?? "").toLowerCase();
    return (
      patientName.includes(q) ||
      motif.includes(q) ||
      diag.includes(q) ||
      numero.includes(q)
    );
  });

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

  return (
    <>
      <PageHeader
        title="Mes consultations"
        subtitle="Historique complet de vos consultations."
      />

      <div className="mb-5 relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par patient, motif, diagnostic…"
          className="pl-10 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
          <Stethoscope className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">
            Aucune consultation trouvée.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden rounded-2xl shadow-card">
          <div className="divide-y divide-border">
            {filtered.map((c: any, i: number) => {
              const patient = c.dossier?.patient;
              const patientName = patient
                ? `${patient.prenom} ${patient.nom}`
                : `Dossier ${c.dossier?.numero_dossier ?? c.id_dossier?.slice(0, 8)}`;
              const hasPrescription = !!c.prescription;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  {patient?.photo_profil ? (
                    <img
                      src={getImageUrl(patient.photo_profil) || ""}
                      alt={patientName}
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <UserAvatar name={patientName} size="sm" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">
                        {patientName}
                      </p>
                      {c.dossier?.numero_dossier && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {c.dossier.numero_dossier}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.diagnostic ?? c.motif} · {fmt(c.date_consultation)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px] hidden sm:flex"
                    >
                      {c.type_consultation ?? "—"}
                    </Badge>
                    <button
                      onClick={() => {
                        setPrescModal(c);
                      }}
                      title={
                        hasPrescription
                          ? "Voir la prescription"
                          : "Aucune prescription"
                      }
                      className={`rounded-lg p-1.5 transition-colors ${
                        hasPrescription
                          ? "text-success hover:bg-success/10"
                          : "text-muted-foreground/40 cursor-default"
                      }`}
                    >
                      <Pill className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDetailModal(c)}
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

      {/* Modal détails consultation */}
      <Dialog
        open={!!detailModal}
        onOpenChange={(o) => !o && setDetailModal(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Détails de la
              consultation
            </DialogTitle>
          </DialogHeader>
          {detailModal && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-gradient-soft p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {fmt(detailModal.date_consultation)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {detailModal.type_consultation ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Médecin</p>
                  <p className="font-medium">
                    Dr. {detailModal.medecin?.prenom} {detailModal.medecin?.nom}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hôpital</p>
                  <p className="font-medium">
                    {detailModal.hopital?.nom ?? "—"}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Motif
                </p>
                <p className="rounded-lg bg-muted/50 p-3">
                  {detailModal.motif}
                </p>
              </div>
              {detailModal.diagnostic && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Diagnostic
                  </p>
                  <p className="rounded-lg bg-primary-soft p-3 font-medium text-primary">
                    {detailModal.diagnostic}
                  </p>
                </div>
              )}
              {(detailModal.tension_arterielle ||
                detailModal.temperature ||
                detailModal.poids_jour) && (
                <div className="grid grid-cols-3 gap-2">
                  {detailModal.tension_arterielle && (
                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">
                        Tension
                      </p>
                      <p className="font-display font-bold text-sm">
                        {detailModal.tension_arterielle}
                      </p>
                    </div>
                  )}
                  {detailModal.temperature && (
                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Temp.</p>
                      <p className="font-display font-bold text-sm">
                        {detailModal.temperature}°C
                      </p>
                    </div>
                  )}
                  {detailModal.poids_jour && (
                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Poids</p>
                      <p className="font-display font-bold text-sm">
                        {detailModal.poids_jour}kg
                      </p>
                    </div>
                  )}
                </div>
              )}
              {detailModal.observations && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    Observations
                  </p>
                  <p className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
                    {detailModal.observations}
                  </p>
                </div>
              )}
              {detailModal.prescription && (
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => {
                    setPrescModal(detailModal);
                    setDetailModal(null);
                  }}
                >
                  <Pill className="mr-2 h-4 w-4" /> Voir la prescription
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal prescription */}
      <Dialog
        open={!!prescModal}
        onOpenChange={(o) => !o && setPrescModal(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" /> Prescription
            </DialogTitle>
          </DialogHeader>
          {prescModal &&
            (prescModal.prescription ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-gradient-soft p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      N° {prescModal.prescription.numero_ordonnance}
                    </p>
                    <p className="font-semibold">Ordonnance médicale</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {new Date(
                        prescModal.prescription.date_prescription ??
                          prescModal.prescription.createdAt,
                      ).toLocaleDateString("fr-FR")}
                    </p>
                    <StatusBadge
                      status={prescModal.prescription.statut as any}
                    />
                  </div>
                </div>
                <ol className="space-y-2">
                  {(prescModal.prescription.medicaments ?? []).map(
                    (m: any, i: number) => (
                      <li
                        key={m.id ?? i}
                        className="flex items-start gap-3 rounded-xl border border-border p-3"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{m.nom_medicament}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.MedicamentPrescrit?.dosage ?? m.dosage} ·{" "}
                            {m.MedicamentPrescrit?.frequence ?? m.frequence} ·{" "}
                            {m.MedicamentPrescrit?.duree_jours
                              ? `${m.MedicamentPrescrit.duree_jours}j`
                              : "—"}
                          </p>
                        </div>
                      </li>
                    ),
                  )}
                </ol>
                {prescModal.prescription.instructions_generales && (
                  <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    <strong>Instructions :</strong>{" "}
                    {prescModal.prescription.instructions_generales}
                  </div>
                )}
                <Button
                  onClick={() => handleDownloadPDF(prescModal.prescription)}
                  className="w-full rounded-full bg-gradient-primary shadow-glow"
                >
                  <Download className="mr-2 h-4 w-4" /> Télécharger le PDF
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Pill className="mb-2 h-10 w-10 opacity-20" />
                <p className="text-sm">
                  Aucune prescription pour cette consultation.
                </p>
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
