// Landing page MediCare BJ — Accueil · À propos · Contact
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck, QrCode, CalendarDays, Smartphone, MessageSquare, Bell,
  ArrowRight, UserPlus, ScanLine, Activity, Stethoscope, User, Settings,
  Mail, Phone, MapPin, Send,
} from "lucide-react";

// ─── Données ──────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: ShieldCheck, title: "Dossier sécurisé", desc: "Vos données médicales chiffrées et protégées." },
  { icon: QrCode, title: "Code QR d'accès", desc: "Partagez votre dossier en un scan, en toute confiance." },
  { icon: CalendarDays, title: "Rendez-vous", desc: "Réservez chez le médecin de votre choix en 3 clics." },
  { icon: Smartphone, title: "Paiement mobile", desc: "MTN Mobile Money & Moov Money intégrés." },
  { icon: MessageSquare, title: "Messagerie", desc: "Échangez directement avec vos médecins." },
  { icon: Bell, title: "Notifications", desc: "Rappels de RDV et alertes de résultats." },
];

// ─── Variants d'animation ─────────────────────────────────────────────────────

const easeExpo = [0.16, 1, 0.3, 1] as const;

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeExpo } },
};

const slideIn = (dir: "left" | "right" = "left") => ({
  hidden: { opacity: 0, x: dir === "left" ? -24 : 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: easeExpo } },
});

const popIn = (delay = 0) => ({
  hidden: { opacity: 0, scale: 0.75 },
  visible: { opacity: 1, scale: 1, transition: { delay, duration: 0.45, type: "spring", stiffness: 200, damping: 18 } },
});

// ─── Hook scroll reveal ───────────────────────────────────────────────────────

function useReveal(margin = "-80px") {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: margin as any });
  return { ref, inView };
}

// ─── Composant compteur animé ─────────────────────────────────────────────────

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1400;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ inView, label, title, sub }: { inView: boolean; label?: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 text-center">
      {label && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary mb-3"
        >
          {label}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, delay: label ? 0.08 : 0, ease: easeExpo }}
        className="font-display text-3xl font-bold sm:text-4xl"
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="mt-2 text-muted-foreground max-w-lg mx-auto"
        >
          {sub}
        </motion.p>
      )}
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <motion.header
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: easeExpo }}
        className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-10">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
            <Logo />
          </motion.div>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" style={{ color: '#1c8cb5' }}>
            {[
              { label: "Accueil", href: "#accueil" },
              { label: "À propos", href: "#apropos" },
              { label: "Contact", href: "#contact" },
            ].map((item, i) => (
              <motion.a
                key={item.href}
                href={item.href}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.4 }}
                className="relative py-1 hover:opacity-100 opacity-80 transition-opacity group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-current rounded-full transition-all duration-300 group-hover:w-full" />
              </motion.a>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Link to="/login">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link to="/register">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button size="sm" className="rounded-full bg-gradient-primary shadow-glow">S'inscrire</Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════
          SECTION 1 — ACCUEIL (#accueil)
      ══════════════════════════════════════════ */}
      <section id="accueil" ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:px-10 lg:py-24"
        >
          {/* Texte */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span variants={slideUp} className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary">
              <Activity className="h-3 w-3" /> Carnet de soins numérique · Bénin
            </motion.span>

            <motion.h1 variants={slideUp} className="mt-4 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Votre santé,<br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                tout en un seul scan.
              </span>
            </motion.h1>

            <motion.p variants={slideUp} className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              MediCare BJ rassemble vos consultations, ordonnances et analyses dans un dossier médical
              numérique sécurisé, accessible à tout professionnel via un code QR.
            </motion.p>

            <motion.div variants={slideUp} className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="rounded-full bg-gradient-primary shadow-glow">
                    Commencer gratuitement <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/login">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" variant="outline" className="rounded-full">Se connecter</Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Card illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.25, ease: easeExpo }}
            className="relative mx-auto w-full max-w-md"
          >
            {/* Halo décoratif */}
            <div className="absolute -inset-4 rounded-[2rem] bg-primary/8 blur-2xl" />

            <Card className="relative overflow-hidden rounded-3xl border-2 border-card shadow-elevated">
              <div className="bg-primary p-6 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={popIn(0.5).hidden}
                    animate={popIn(0.5).visible}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"
                  >
                    <User className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <p className="text-xs opacity-80">Patient</p>
                    <p className="font-display text-base font-bold">Adjoa Hounkpatin</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <Mini label="Groupe" value="O+" delay={0.55} />
                  <Mini label="Âge" value="33 ans" delay={0.65} />
                  <Mini label="RDV" value="2" delay={0.75} />
                </div>
              </div>
              <CardContent className="space-y-3 p-5">
                {[
                  { i: Stethoscope, t: "Consultation cardio", s: "Dr. Sogbo · 12 mars" },
                  { i: QrCode, t: "QR généré", s: "Valide 24h · Lecture+Écriture" },
                  { i: CalendarDays, t: "Prochain RDV", s: "Vendredi · 09:30" },
                ].map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.13, duration: 0.45, ease: easeExpo }}
                    className="flex items-center gap-3 rounded-xl border border-border p-2.5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <r.i className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.t}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.s}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Comment ça marche — toujours dans #accueil visuellement */}
      <HowItWorks />

      {/* ══════════════════════════════════════════
          SECTION 2 — À PROPOS (#apropos)
      ══════════════════════════════════════════ */}
      <section id="apropos">
        {/* Fonctionnalités */}
        <FeaturesGrid />

        {/* Audience */}
        <AudienceSection />

        {/* Stats */}
        <StatsSection />
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — CONTACT (#contact)
      ══════════════════════════════════════════ */}
      <ContactSection />

      {/* FOOTER */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="border-t border-border py-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted-foreground sm:flex-row lg:px-10">
          <Logo size="sm" />
          <p>© 2026 MediCare BJ · Tous droits réservés · Cotonou, Bénin</p>
        </div>
      </motion.footer>
    </div>
  );
}

// ─── Comment ça marche ────────────────────────────────────────────────────────

function HowItWorks() {
  const { ref, inView } = useReveal();
  return (
    <div ref={ref} className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
      <SectionHeader inView={inView} title="Comment ça marche" sub="3 étapes simples pour démarrer." />
      <div className="grid gap-5 md:grid-cols-3">
        {[
          { i: UserPlus, t: "Créez votre compte", d: "Inscription rapide en quelques minutes." },
          { i: QrCode, t: "Générez votre QR", d: "Définissez la durée et le niveau d'accès." },
          { i: ScanLine, t: "Le médecin consulte", d: "Un scan suffit pour accéder à votre dossier." },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.55, ease: easeExpo }}
          >
            <Card className="rounded-2xl shadow-card h-full group hover:shadow-elevated transition-shadow duration-300">
              <CardContent className="p-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 200, damping: 16 }}
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow group-hover:scale-110 transition-transform duration-300"
                >
                  <s.i className="h-6 w-6" />
                </motion.div>
                <span className="text-xs font-bold text-accent-foreground tracking-wider">ÉTAPE {i + 1}</span>
                <h3 className="mt-1 font-display text-lg font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Fonctionnalités ──────────────────────────────────────────────────────────

function FeaturesGrid() {
  const { ref, inView } = useReveal();
  return (
    <div ref={ref} className="bg-gradient-soft py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeader
          inView={inView}
          label="Fonctionnalités"
          title="Tout ce dont vous avez besoin"
          sub="Une plateforme complète pensée pour le contexte africain."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.07, duration: 0.5, ease: easeExpo }}
              whileHover={{ y: -5, transition: { duration: 0.22 } }}
            >
              <Card className="rounded-2xl shadow-card hover:shadow-elevated transition-shadow duration-300 h-full">
                <CardContent className="p-5">
                  <motion.span
                    initial={{ rotate: -15, opacity: 0, scale: 0.7 }}
                    animate={inView ? { rotate: 0, opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.4, type: "spring", stiffness: 180 }}
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"
                  >
                    <f.icon className="h-5 w-5" />
                  </motion.span>
                  <h3 className="font-display font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Audience ─────────────────────────────────────────────────────────────────

function AudienceSection() {
  const { ref, inView } = useReveal();
  return (
    <div ref={ref} className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
      <SectionHeader inView={inView} label="Pour qui ?" title="Une solution pour tous les acteurs de santé" />
      <div className="grid gap-5 md:grid-cols-3">
        {[
          { i: User, t: "Patients", d: "Gardez le contrôle de vos données et de vos rendez-vous.", c: "from-primary to-primary-glow" },
          { i: Stethoscope, t: "Médecins & techniciens", d: "Accédez aux dossiers en un scan, en toute légalité.", c: "from-secondary to-secondary" },
          { i: Settings, t: "Administrateurs", d: "Supervisez la plateforme et garantissez la qualité du service.", c: "from-accent to-accent" },
        ].map((p, i) => (
          <motion.div
            key={p.t}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.55, ease: easeExpo }}
            whileHover={{ scale: 1.02, transition: { duration: 0.22 } }}
          >
            <Card className="overflow-hidden rounded-2xl shadow-card h-full">
              <div className={`bg-gradient-to-br ${p.c} p-6 text-primary-foreground`}>
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={inView ? { scale: 1, rotate: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 160, damping: 14 }}
                >
                  <p.i className="h-8 w-8" />
                </motion.div>
                <h3 className="mt-3 font-display text-xl font-bold">{p.t}</h3>
              </div>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{p.d}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsSection() {
  const { ref, inView } = useReveal();
  return (
    <div ref={ref} className="bg-primary py-16 text-primary-foreground">
      <div className="mx-auto grid max-w-5xl gap-8 px-5 text-center sm:grid-cols-3 lg:px-10">
        {[
          { target: 500, suffix: "+", l: "Médecins partenaires" },
          { target: 10000, suffix: "+", l: "Patients enregistrés" },
          { target: 34, suffix: "", l: "Zones sanitaires couvertes" },
        ].map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5, ease: easeExpo }}
          >
            <p className="font-display text-4xl font-bold sm:text-5xl">
              <CountUp target={s.target} suffix={s.suffix} />
            </p>
            <p className="mt-1 text-sm opacity-90">{s.l}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function ContactSection() {
  const { ref, inView } = useReveal();
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" ref={ref} className="bg-gradient-soft py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeader
          inView={inView}
          label="Contact"
          title="Parlons de votre projet"
          sub="Une question, un partenariat ? Notre équipe vous répond sous 24h."
        />

        <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
          {/* Infos */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.55, ease: easeExpo }}
            className="space-y-5"
          >
            {[
              { i: Mail, label: "Email", value: "contact@medicare-bj.com" },
              { i: Phone, label: "Téléphone", value: "+229 01 97 00 00 00" },
              { i: MapPin, label: "Adresse", value: "Cotonou, Bénin — Zone Sanitaire Centre" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.18 + i * 0.09, duration: 0.45, ease: easeExpo }}
                className="flex items-start gap-4 rounded-2xl border border-border bg-background p-4 shadow-card"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <item.i className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="mt-0.5 text-sm font-medium">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Formulaire */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.55, ease: easeExpo }}
          >
            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {!sent ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Nom complet</label>
                          <input
                            type="text"
                            placeholder="Kofi Mensah"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Email</label>
                          <input
                            type="email"
                            placeholder="kofi@exemple.com"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Sujet</label>
                        <input
                          type="text"
                          placeholder="Partenariat, question technique..."
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Message</label>
                        <textarea
                          rows={4}
                          placeholder="Décrivez votre demande..."
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
                        />
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          className="w-full rounded-xl bg-gradient-primary shadow-glow"
                          onClick={() => setSent(true)}
                        >
                          Envoyer le message <Send className="ml-2 h-4 w-4" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 180 }}
                      className="flex flex-col items-center justify-center py-10 text-center gap-3"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary"
                      >
                        <Send className="h-6 w-6" />
                      </motion.div>
                      <h3 className="font-display text-lg font-bold">Message envoyé !</h3>
                      <p className="text-sm text-muted-foreground">Nous vous répondons sous 24h.</p>
                      <Button variant="outline" size="sm" className="mt-2 rounded-full" onClick={() => setSent(false)}>
                        Envoyer un autre
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Mini stat card ───────────────────────────────────────────────────────────

function Mini({ label, value, delay = 0 }: { label: string; value: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: easeExpo }}
      className="rounded-xl bg-white/15 p-2"
    >
      <p className="text-[10px] uppercase opacity-80">{label}</p>
      <p className="font-display text-sm font-bold">{value}</p>
    </motion.div>
  );
}