// Inscription usager — formulaire multi-étapes avec stepper.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, CheckCircle, User, Lock, ClipboardList, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";

const STEPS = [
  { label: "Informations", icon: User },
  { label: "Compte", icon: Lock },
  { label: "Confirmation", icon: ClipboardList },
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", birthDate: "", sex: "F", phone: "",
    email: "", password: "", confirm: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => {
    if (step === 1 && (!form.firstName || !form.lastName || !form.phone)) {
      toast.error("Veuillez remplir tous les champs obligatoires."); return;
    }
    if (step === 2 && (!form.email || !form.password)) {
      toast.error("Email et mot de passe requis."); return;
    }
    if (step === 2 && form.password !== form.confirm) {
      toast.error("Les mots de passe ne correspondent pas."); return;
    }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await authService.register({
        nom: form.lastName,
        prenom: form.firstName,
        email: form.email,
        mot_de_passe: form.password,
        telephone: form.phone || undefined,
        date_naissance: form.birthDate || undefined,
        sexe: form.sex,
        role: "patient",
      });
      // Auto-login après inscription
      await login(form.email, form.password);
      toast.success("Compte créé avec succès !", { description: "Bienvenue sur MediCare BJ." });
      navigate("/patient/dashboard");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de l'inscription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/20 p-4 lg:p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-4 text-center">
          <Link to="/" className="inline-block mb-2"><Logo /></Link>
          <h1 className="font-display text-xl font-bold">Créer un compte patient</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Rejoignez MediCare BJ gratuitement.</p>
        </div>

        {/* Stepper */}
        <div className="mb-4 flex items-center justify-between max-w-xl mx-auto">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={s.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-0.5">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-base",
                    done ? "border-secondary bg-secondary text-secondary-foreground"
                      : active ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground"
                  )}>
                    {done ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("mx-2 h-0.5 flex-1 transition-base", step > n ? "bg-secondary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Barre de progression */}
        <div className="mb-4 h-1 w-full max-w-xl mx-auto rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-primary transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        <Card className="rounded-3xl shadow-2xl bg-background overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && (
                  <div className="space-y-3">
                    <h2 className="font-display text-base font-semibold">Informations personnelles</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Prénom *" value={form.firstName} onChange={(v) => set("firstName", v)} placeholder="Adjoa" />
                      <Field label="Nom *" value={form.lastName} onChange={(v) => set("lastName", v)} placeholder="Hounkpatin" />
                    </div>
                    <Field label="Date de naissance" type="date" value={form.birthDate} onChange={(v) => set("birthDate", v)} />
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium">Sexe</Label>
                      <RadioGroup value={form.sex} onValueChange={(v) => set("sex", v)} className="flex gap-3">
                        {[{ v: "F", l: "Femme" }, { v: "M", l: "Homme" }].map((o) => (
                          <label key={o.v} htmlFor={`sex-${o.v}`} className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-base",
                            form.sex === o.v ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-primary/40"
                          )}>
                            <RadioGroupItem id={`sex-${o.v}`} value={o.v} className="sr-only" />
                            {o.l}
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                    <Field label="Téléphone *" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+229 97 XX XX XX" />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <h2 className="font-display text-base font-semibold">Informations de connexion</h2>
                    <Field label="Email *" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="vous@email.com" />
                    <Field label="Mot de passe *" type="password" value={form.password} onChange={(v) => set("password", v)} placeholder="••••••••" />
                    <Field label="Confirmer le mot de passe *" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} placeholder="••••••••" />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    <h2 className="font-display text-base font-semibold">Récapitulatif</h2>
                    <div className="rounded-xl bg-gradient-soft p-4 space-y-1.5 text-xs">
                      <Row label="Prénom" value={form.firstName || "—"} />
                      <Row label="Nom" value={form.lastName || "—"} />
                      <Row label="Sexe" value={form.sex === "F" ? "Femme" : "Homme"} />
                      <Row label="Téléphone" value={form.phone || "—"} />
                      <Row label="Email" value={form.email || "—"} />
                    </div>
                    <div className="flex items-start gap-2 rounded-xl bg-secondary/10 p-2.5 text-xs text-secondary ring-1 ring-secondary/20">
                      <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <p>En créant votre compte, vous acceptez les conditions d'utilisation et la politique de confidentialité de MediCare BJ.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-5 flex justify-between gap-3">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="rounded-full gap-2 text-sm h-9">
                  <ArrowLeft className="h-3.5 w-3.5" /> Précédent
                </Button>
              ) : (
                <Link to="/login"><Button variant="ghost" className="rounded-full text-sm h-9">Déjà un compte ?</Button></Link>
              )}
              {step < 3 ? (
                <Button onClick={next} className="rounded-full bg-gradient-primary shadow-glow gap-2 text-sm h-9">
                  Suivant <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button onClick={submit} className="rounded-full bg-gradient-primary shadow-glow gap-2 text-sm h-9">
                  Créer mon compte <CheckCircle className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Vous êtes Médecin ?{" "}
          <Link to="/register/pro" className="font-semibold text-primary hover:underline">Inscription Médecin / Technicien</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-medium">{label}</Label>
      <Input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl h-9 text-sm" />
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
