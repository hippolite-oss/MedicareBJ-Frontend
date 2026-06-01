// Inscription médecin/technicien — connectée à l'API.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, CheckCircle, User, Lock, Stethoscope, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";
import { useHopitaux } from "@/hooks/useQueries";

const SPECIALTIES = [
  "Médecin généraliste","Cardiologue","Pédiatre","Radiologue","Neurologue",
  "Gynécologue","Dermatologue","Ophtalmologue","Technicien de laboratoire","Technicien de radiologie",
];

const STEPS = [
  { label: "Identité",      icon: User },
  { label: "Compte",        icon: Lock },
  { label: "Professionnel", icon: Stethoscope },
  { label: "Confirmation",  icon: CheckCircle },
];

export default function RegisterPro() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    prenom: "", nom: "", telephone: "",
    email: "", mot_de_passe: "", confirm: "",
    numero_ordre: "", specialite: "", id_hopital: "", profil_public: true,
    role: "medecin" as "medecin" | "technicien",
  });

  const { data: hopData } = useHopitaux({ limit: 50 });
  const hopitaux: any[] = hopData?.hopitaux ?? [];

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => {
    if (step === 1 && (!form.prenom || !form.nom)) { toast.error("Prénom et nom requis."); return; }
    if (step === 2 && (!form.email || !form.mot_de_passe)) { toast.error("Email et mot de passe requis."); return; }
    if (step === 2 && form.mot_de_passe !== form.confirm) { toast.error("Mots de passe différents."); return; }
    if (step === 2 && form.mot_de_passe.length < 8) { toast.error("Minimum 8 caractères."); return; }
    if (step === 3 && (!form.numero_ordre || !form.specialite)) { toast.error("N° ordre et spécialité requis."); return; }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await authService.registerPro({
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone || undefined,
        email: form.email,
        mot_de_passe: form.mot_de_passe,
        role: form.role,
        numero_ordre: form.numero_ordre,
        specialite: form.specialite,
        id_hopital: form.id_hopital || undefined,
        profil_public: form.profil_public,
      });
      toast.success("Inscription soumise", { description: "Votre dossier est en cours de validation." });
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de l'inscription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-5">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block mb-4"><Logo /></Link>
          <h1 className="font-display text-2xl font-bold">Inscription professionnel de santé</h1>
          <p className="mt-1 text-sm text-muted-foreground">Médecin, spécialiste ou technicien.</p>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex items-center justify-between">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={s.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 transition-base",
                    done ? "border-secondary bg-secondary text-secondary-foreground"
                      : active ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground"
                  )}>
                    {done ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className={cn("text-[10px] font-medium hidden sm:block", active ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={cn("mx-1 h-0.5 flex-1 transition-base", step > n ? "bg-secondary" : "bg-border")} />}
              </div>
            );
          })}
        </div>

        <div className="mb-5 h-1.5 w-full rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-primary transition-all duration-500" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
        </div>

        <Card className="rounded-2xl shadow-elevated">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-lg font-semibold">Informations personnelles</h2>
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium">Rôle *</Label>
                      <Select value={form.role} onValueChange={(v) => set("role", v)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="medecin">Médecin</SelectItem>
                          <SelectItem value="technicien">Technicien</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Prénom *" value={form.prenom} onChange={(v) => set("prenom", v)} placeholder="Kossi" />
                      <Field label="Nom *" value={form.nom} onChange={(v) => set("nom", v)} placeholder="Adoukonou" />
                    </div>
                    <Field label="Téléphone" value={form.telephone} onChange={(v) => set("telephone", v)} placeholder="+229 01 XX XX XX XX" />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-lg font-semibold">Informations de connexion</h2>
                    <Field label="Email professionnel *" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="dr.nom@hopital.bj" />
                    <Field label="Mot de passe *" type="password" value={form.mot_de_passe} onChange={(v) => set("mot_de_passe", v)} placeholder="••••••••" />
                    <Field label="Confirmer *" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} placeholder="••••••••" />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-lg font-semibold">Informations professionnelles</h2>
                    <Field label="N° ordre professionnel *" value={form.numero_ordre} onChange={(v) => set("numero_ordre", v)} placeholder="BJ-MED-2025-XXXX" />
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium">Spécialité *</Label>
                      <Select value={form.specialite} onValueChange={(v) => set("specialite", v)}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir une spécialité" /></SelectTrigger>
                        <SelectContent>{SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-sm font-medium">Hôpital d'exercice</Label>
                      <Select value={form.id_hopital} onValueChange={(v) => set("id_hopital", v)}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir un établissement" /></SelectTrigger>
                        <SelectContent>
                          {hopitaux.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.nom}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div>
                        <p className="text-sm font-medium">Profil public</p>
                        <p className="text-xs text-muted-foreground">Visible dans la recherche de médecins</p>
                      </div>
                      <Switch checked={form.profil_public} onCheckedChange={(v) => set("profil_public", v)} />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-lg font-semibold">Récapitulatif</h2>
                    <div className="rounded-xl bg-gradient-soft p-5 space-y-2 text-sm">
                      <Row label="Nom" value={`Dr. ${form.prenom} ${form.nom}`} />
                      <Row label="Email" value={form.email || "—"} />
                      <Row label="Spécialité" value={form.specialite || "—"} />
                      <Row label="N° ordre" value={form.numero_ordre || "—"} />
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-accent/10 p-4 ring-1 ring-accent/20">
                      <Clock className="h-8 w-8 text-accent-foreground shrink-0" />
                      <div>
                        <p className="font-semibold text-accent-foreground">En attente de validation</p>
                        <p className="text-xs text-muted-foreground">
                          Votre dossier sera examiné sous 24–48h. Vous recevrez un email de confirmation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex justify-between gap-3">
              {step > 1
                ? <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="rounded-full gap-2">
                    <ArrowLeft className="h-4 w-4" /> Précédent
                  </Button>
                : <Link to="/login"><Button variant="ghost" className="rounded-full">Déjà un compte ?</Button></Link>
              }
              {step < 4
                ? <Button onClick={next} className="rounded-full bg-gradient-primary shadow-glow gap-2">
                    Suivant <ArrowRight className="h-4 w-4" />
                  </Button>
                : <Button onClick={submit} disabled={submitting} className="rounded-full bg-gradient-primary shadow-glow gap-2">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Soumettre
                  </Button>
              }
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Vous êtes patient ?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">Inscription patient</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      <Input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
