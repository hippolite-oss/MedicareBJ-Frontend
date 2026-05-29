// Tableau de bord patient — données réelles via API.
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMonDossier, useMesRdv } from "@/hooks/useQueries";
import {
  CalendarDays,
  Stethoscope,
  Pill,
  FlaskConical,
  QrCode,
  CreditCard,
  MessageSquare,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data: dossier, isLoading: loadingDossier } = useMonDossier();
  const { data: rdvData, isLoading: loadingRdv } = useMesRdv();

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const consultations: any[] = dossier?.dossier?.consultations ?? [];
  const prescriptions: any[] = dossier?.dossier?.prescriptions ?? [];
  const analyses: any[] = dossier?.dossier?.analyses ?? [];
  const rdvList: any[] = rdvData?.rdv ?? [];

  const upcoming = rdvList
    .filter((a) => new Date(a.date_heure) > new Date() && a.statut !== "annule")
    .sort((a, b) => +new Date(a.date_heure) - +new Date(b.date_heure));
  const next = upcoming[0];

  const activeRx = prescriptions.filter((p) => p.statut === "active").length;
  const pendingAnalyses = analyses.filter(
    (a) => a.statut === "demandee" || a.statut === "en_cours",
  ).length;
  const lastConsult = consultations[0];

  const kpis = [
    {
      label: "Prochain RDV",
      value: next ? fmt(next.date_heure) : "Aucun",
      hint: next
        ? `Dr. ${next.medecin?.prenom} ${next.medecin?.nom}`
        : "Planifiez-en un",
      icon: CalendarDays,
    },
    {
      label: "Dernière consultation",
      value: lastConsult ? fmt(lastConsult.date_consultation) : "—",
      hint: lastConsult ? (lastConsult.diagnostic ?? "").slice(0, 32) : "",
      icon: Stethoscope,
    },
    {
      label: "Ordonnances actives",
      value: String(activeRx),
      hint: "Médicaments en cours",
      icon: Pill,
    },
    {
      label: "Analyses en attente",
      value: String(pendingAnalyses),
      hint: "Résultats à venir",
      icon: FlaskConical,
    },
  ];

  const quickLinks = [
    {
      to: "/patient/qr",
      label: "Générer QR",
      icon: QrCode,
      tone: "bg-gradient-primary text-primary-foreground",
    },
    {
      to: "/patient/rdv",
      label: "Prendre RDV",
      icon: CalendarDays,
      tone: "bg-secondary/15 text-secondary",
    },
    {
      to: "/patient/messages",
      label: "Messages",
      icon: MessageSquare,
      tone: "bg-info/15 text-info",
    },
    {
      to: "/patient/paiements",
      label: "Payer",
      icon: CreditCard,
      tone: "bg-accent/20 text-accent-foreground",
    },
  ];

  const isLoading = loadingDossier || loadingRdv;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-elevated sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">{today}</p>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
              Bonjour {user?.prenom} 👋
            </h1>
            <p className="mt-1 max-w-md text-sm opacity-90">
              Votre santé en un coup d'œil. Voici un résumé de votre activité
              médicale.
            </p>
            {dossier?.dossier?.numero_dossier && (
              <p className="mt-2 text-xs opacity-70 font-mono">
                N° dossier : {dossier.dossier.numero_dossier}
              </p>
            )}
          </div>
          <Link to="/patient/qr">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Mon QR
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="rounded-2xl border-border/60 shadow-card transition-base hover:shadow-elevated">
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {k.label}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <k.icon className="h-4 w-4" />
                  </span>
                </div>
                {isLoading ? (
                  <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="font-display text-xl font-bold sm:text-2xl">
                    {k.value}
                  </p>
                )}
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {k.hint}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activité récente */}
        <Card className="rounded-2xl shadow-card lg:col-span-2">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                Activité récente
              </h2>
              <Link
                to="/patient/dossier"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Voir le dossier <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12  animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : consultations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune activité récente.
              </p>
            ) : (
              <ol className="relative space-y-5 border-l border-dashed border-border pl-6">
                {consultations.slice(0, 4).map((c: any, i: number) => (
                  <li key={c.id ?? i} className="relative">
                    <span className="absolute -left-[34px] flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary ring-4 ring-background">
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <div className="ml-4 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                      <p className="text-sm font-medium">
                        {c.diagnostic ?? c.motif}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {fmt(c.date_consultation)}
                      </span>
                    </div>
                    <p className="ml-4 text-xs text-muted-foreground">
                      Dr. {c.medecin?.prenom} {c.medecin?.nom}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Accès rapides */}
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5">
              <h2 className="mb-4 font-display text-base font-semibold">
                Accès rapides
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {quickLinks.map((q) => (
                  <Link
                    key={q.to}
                    to={q.to}
                    className={`flex flex-col items-start gap-2 rounded-xl p-3 text-sm font-semibold transition-base hover:scale-[1.02] ${q.tone}`}
                  >
                    <q.icon className="h-5 w-5" />
                    {q.label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prochains RDV */}
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">
                  À venir
                </h2>
                <Link
                  to="/patient/rdv"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Tout voir
                </Link>
              </div>
              {loadingRdv ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-xl bg-muted"
                    />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun RDV planifié.
                </p>
              ) : (
                <ul className="space-y-3">
                  {upcoming.slice(0, 3).map((rdv: any) => (
                    <li
                      key={rdv.id}
                      className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5 transition-base hover:border-primary/40 hover:bg-primary-soft/30"
                    >
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <span className="text-[10px] font-medium uppercase">
                          {new Date(rdv.date_heure).toLocaleDateString(
                            "fr-FR",
                            { month: "short" },
                          )}
                        </span>
                        <span className="font-display text-base font-bold leading-none">
                          {new Date(rdv.date_heure).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          Dr. {rdv.medecin?.prenom} {rdv.medecin?.nom}
                        </p>
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />{" "}
                          {fmtTime(rdv.date_heure)}
                        </p>
                      </div>
                      <StatusBadge status={rdv.statut as any} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
