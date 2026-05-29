// Nouvelle prescription — connectée à l'API.
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { prescriptionService } from "@/services/prescriptionService";
import { toast } from "sonner";
import { Plus, Trash2, Pill, FileText, Loader2 } from "lucide-react";

interface Med {
  id: string;
  nom_medicament: string;
  dosage: string;
  forme: string;
  frequence: string;
  duree_jours: string;
  instructions: string;
}

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

export default function NouvellePrescription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const consultationId = searchParams.get("consultation") ?? "";
  const dossierId = searchParams.get("dossier") ?? "";

  const [idConsultation, setIdConsultation] = useState(consultationId);
  const [meds, setMeds] = useState<Med[]>([]);
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [newMed, setNewMed] = useState<Omit<Med, "id">>({
    nom_medicament: "",
    dosage: "",
    forme: "Comprimé",
    frequence: "1 fois/jour",
    duree_jours: "7",
    instructions: "",
  });

  const addMed = () => {
    if (!newMed.nom_medicament || !newMed.dosage) {
      toast.error("Nom et dosage requis.");
      return;
    }
    setMeds((m) => [...m, { ...newMed, id: `med-${Date.now()}` }]);
    setNewMed({
      nom_medicament: "",
      dosage: "",
      forme: "Comprimé",
      frequence: "1 fois/jour",
      duree_jours: "7",
      instructions: "",
    });
  };

  const submit = async () => {
    if (!idConsultation) {
      toast.error("ID de consultation requis.");
      return;
    }
    if (meds.length === 0) {
      toast.error("Ajoutez au moins un médicament.");
      return;
    }
    setSaving(true);
    try {
      await prescriptionService.creer({
        id_consultation: idConsultation,
        instructions_generales: instructions || undefined,
        medicaments: meds.map((m) => ({
          nom_medicament: m.nom_medicament,
          dosage: m.dosage,
          forme: m.forme,
          frequence: m.frequence,
          duree_jours: m.duree_jours ? parseInt(m.duree_jours) : undefined,
          instructions: m.instructions || undefined,
        })),
      });
      toast.success("Prescription créée et envoyée au patient");
      navigate(
        dossierId ? `/medecin/patient/${dossierId}` : "/medecin/dashboard",
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Nouvelle prescription"
        subtitle="Rédigez et envoyez une ordonnance au patient."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {/* ID Consultation */}
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5">
              <h3 className="mb-3 font-display text-base font-semibold">
                Consultation associée
              </h3>
              {!consultationId && (
                <div className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 ring-1 ring-amber-200">
                  Démarrez idéalement depuis une consultation enregistrée pour
                  éviter toute erreur d'association au dossier patient.
                </div>
              )}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  ID de la consultation *
                </Label>
                <Input
                  value={idConsultation}
                  onChange={(e) => setIdConsultation(e.target.value)}
                  placeholder="UUID de la consultation"
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ajout médicament */}
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5">
              <h3 className="mb-4 font-display text-base font-semibold flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" /> Ajouter un médicament
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-sm font-medium">
                    Nom du médicament *
                  </Label>
                  <Input
                    value={newMed.nom_medicament}
                    onChange={(e) =>
                      setNewMed({ ...newMed, nom_medicament: e.target.value })
                    }
                    placeholder="ex. Amlodipine 5mg"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Dosage *
                  </Label>
                  <Input
                    value={newMed.dosage}
                    onChange={(e) =>
                      setNewMed({ ...newMed, dosage: e.target.value })
                    }
                    placeholder="ex. 1 comprimé"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Forme
                  </Label>
                  <Select
                    value={newMed.forme}
                    onValueChange={(v) => setNewMed({ ...newMed, forme: v })}
                  >
                    <SelectTrigger className="rounded-xl">
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
                  <Label className="mb-1.5 block text-sm font-medium">
                    Fréquence
                  </Label>
                  <Select
                    value={newMed.frequence}
                    onValueChange={(v) =>
                      setNewMed({ ...newMed, frequence: v })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
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
                  <Label className="mb-1.5 block text-sm font-medium">
                    Durée (jours)
                  </Label>
                  <Select
                    value={newMed.duree_jours}
                    onValueChange={(v) =>
                      setNewMed({ ...newMed, duree_jours: v })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
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
                  <Label className="mb-1.5 block text-sm font-medium">
                    Instructions spécifiques
                  </Label>
                  <Input
                    value={newMed.instructions}
                    onChange={(e) =>
                      setNewMed({ ...newMed, instructions: e.target.value })
                    }
                    placeholder="ex. Prendre avec de la nourriture"
                  />
                </div>
              </div>
              <Button
                onClick={addMed}
                variant="outline"
                className="mt-4 rounded-full"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Ajouter
              </Button>
            </CardContent>
          </Card>

          {/* Liste médicaments */}
          {meds.length > 0 && (
            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-5">
                <h3 className="mb-3 font-display text-base font-semibold">
                  Médicaments ({meds.length})
                </h3>
                <div className="space-y-2">
                  {meds.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <Pill className="h-4 w-4 shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {m.nom_medicament}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.dosage} · {m.forme} · {m.frequence} ·{" "}
                          {m.duree_jours}j
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setMeds((ms) => ms.filter((x) => x.id !== m.id))
                        }
                        className="text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-base"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions générales */}
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5">
              <Label className="mb-1.5 block text-sm font-medium">
                Instructions générales
              </Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Conseils, précautions, mode de prise…"
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Aperçu */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24 rounded-2xl shadow-elevated ring-1 ring-accent/20">
            <div className="bg-gradient-soft p-5 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-display text-base font-semibold">
                  Aperçu de l'ordonnance
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                MediCare BJ · {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>
            <CardContent className="p-5">
              {meds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aucun médicament ajouté
                </p>
              ) : (
                <ol className="space-y-3">
                  {meds.map((m, i) => (
                    <li key={m.id} className="text-sm">
                      <span className="font-bold text-primary">{i + 1}.</span>{" "}
                      <span className="font-semibold">{m.nom_medicament}</span>
                      <br />
                      <span className="text-muted-foreground text-xs">
                        {m.dosage} — {m.frequence} — {m.duree_jours}j
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              {instructions && (
                <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <strong>Instructions :</strong> {instructions}
                </div>
              )}
              <Button
                onClick={submit}
                disabled={saving || meds.length === 0}
                className="mt-5 w-full bg-gradient-primary shadow-glow"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Valider et envoyer au patient
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
