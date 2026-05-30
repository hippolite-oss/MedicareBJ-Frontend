// Landing page MediCare BJ — hero, fonctionnalités, audience, statistiques.
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck, QrCode, CalendarDays, Smartphone, MessageSquare, Bell,
  ArrowRight, UserPlus, ScanLine, Activity, Stethoscope, User, Settings,
} from "lucide-react";

const FEATURES = [
  { icon: ShieldCheck, title: "Dossier sécurisé", desc: "Vos données médicales chiffrées et protégées." },
  { icon: QrCode, title: "Code QR d'accès", desc: "Partagez votre dossier en un scan, en toute confiance." },
  { icon: CalendarDays, title: "Rendez-vous", desc: "Réservez chez le médecin de votre choix en 3 clics." },
  { icon: Smartphone, title: "Paiement mobile", desc: "MTN Mobile Money & Moov Money intégrés." },
  { icon: MessageSquare, title: "Messagerie", desc: "Échangez directement avec vos médecins." },
  { icon: Bell, title: "Notifications", desc: "Rappels de RDV et alertes de résultats." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" style={{ color: '#1c8cb5' }}>
            <a href="#accueil" className="hover:opacity-80 transition-opacity">Accueil</a>
            <a href="#features" className="hover:opacity-80 transition-opacity">À propos</a>
            <a href="#stats" className="hover:opacity-80 transition-opacity">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="rounded-full bg-gradient-primary shadow-glow">S'inscrire</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="accueil" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:px-10 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
              <Activity className="h-3 w-3" /> Carnet de soins numérique · Bénin
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Votre santé,<br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">tout en un seul scan.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              MediCare BJ rassemble vos consultations, ordonnances et analyses dans un dossier médical
              numérique sécurisé, accessible à tout professionnel via un code QR.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button size="lg" className="rounded-full bg-gradient-primary shadow-glow">
                  Commencer gratuitement <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-full">Se connecter</Button>
              </Link>
            </div>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mx-auto w-full max-w-md"
          >
            <Card className="relative overflow-hidden rounded-3xl border-2 border-card shadow-elevated">
              <div className="bg-primary p-6 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs opacity-80">Patient</p>
                    <p className="font-display text-base font-bold">Adjoa Hounkpatin</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <Mini label="Groupe" value="O+" />
                  <Mini label="Âge" value="33 ans" />
                  <Mini label="RDV" value="2" />
                </div>
              </div>
              <CardContent className="space-y-3 p-5">
                {[
                  { i: Stethoscope, t: "Consultation cardio", s: "Dr. Sogbo · 12 mars" },
                  { i: QrCode, t: "QR généré", s: "Valide 24h · Lecture+Écriture" },
                  { i: CalendarDays, t: "Prochain RDV", s: "Vendredi · 09:30" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <r.i className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.t}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.s}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Comment ça marche</h2>
          <p className="mt-2 text-muted-foreground">3 étapes simples pour démarrer.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { i: UserPlus, t: "Créez votre compte", d: "Inscription rapide en quelques minutes." },
            { i: QrCode, t: "Générez votre QR", d: "Définissez la durée et le niveau d'accès." },
            { i: ScanLine, t: "Le médecin consulte", d: "Un scan suffit pour accéder à votre dossier." },
          ].map((s, i) => (
            <Card key={i} className="rounded-2xl shadow-card">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <s.i className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-accent-foreground">ÉTAPE {i + 1}</span>
                <h3 className="mt-1 font-display text-lg font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="features" className="bg-gradient-soft py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Tout ce dont vous avez besoin</h2>
            <p className="mt-2 text-muted-foreground">Une plateforme complète pensée pour le contexte africain.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="rounded-2xl shadow-card transition-base hover:shadow-elevated">
                <CardContent className="p-5">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section id="audience" className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Pour qui ?</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { i: User, t: "Patients", d: "Gardez le contrôle de vos données et de vos rendez-vous.", c: "from-primary to-primary-glow" },
            { i: Stethoscope, t: "Médecins & techniciens", d: "Accédez aux dossiers en un scan, en toute légalité.", c: "from-secondary to-secondary" },
            { i: Settings, t: "Administrateurs", d: "Supervisez la plateforme et garantissez la qualité du service.", c: "from-accent to-accent" },
          ].map((p) => (
            <Card key={p.t} className="overflow-hidden rounded-2xl shadow-card">
              <div className={`bg-gradient-to-br ${p.c} p-6 text-primary-foreground`}>
                <p.i className="h-8 w-8" />
                <h3 className="mt-3 font-display text-xl font-bold">{p.t}</h3>
              </div>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{p.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 text-center sm:grid-cols-3 lg:px-10">
          {[
            { v: "500+", l: "Médecins partenaires" },
            { v: "10 000+", l: "Patients enregistrés" },
            { v: "34", l: "Zones sanitaires couvertes" },
          ].map((s) => (
            <div key={s.l}>
              <p className="font-display text-4xl font-bold sm:text-5xl">{s.v}</p>
              <p className="mt-1 text-sm opacity-90">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted-foreground sm:flex-row lg:px-10">
          <Logo size="sm" />
          <p>© 2026 MediCare BJ · Tous droits réservés · Cotonou, Bénin</p>
        </div>
      </footer>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 p-2">
      <p className="text-[10px] uppercase opacity-80">{label}</p>
      <p className="font-display text-sm font-bold">{value}</p>
    </div>
  );
}
