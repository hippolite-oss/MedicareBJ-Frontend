// Tableau de bord médecin — données réelles via API.
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMesConsultations, useAgendaDuJour } from "@/hooks/useQueries";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Users, CalendarDays, Pill, FileText, ChevronRight, Clock } from "lucide-react";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function MedecinDashboard() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const { data: consultData, isLoading: loadingConsult } = useMesConsultations({ limit: 20 });
  const { data: agendaData, isLoading: loadingAgenda } = useAgendaDuJour();

  const consultations: any[] = consultData?.consultations ?? [];
  const rdvAujourdhui: any[] = agendaData?.rdv ?? [];

  // Patients uniques
  const uniquePatients = [...new Set(consultations.map((c: any) => c.id_dossier))];

  const kpis = [
    { label: "Patients suivis",        value: String(uniquePatients.length), icon: Users,       tone: "primary" },
    { label: "Consultations ce mois",  value: String(consultations.length),  icon: FileText,    tone: "secondary" },
    { label: "RDV aujourd'hui",        value: String(rdvAujourdhui.length),  icon: CalendarDays, tone: "accent" },
    { label: "Prescriptions",          value: "—",                           icon: Pill,         tone: "info" },
  ];

  // Grouper consultations par mois pour le graphique
  const byMonth: Record<string, number> = {};
  consultations.forEach((c: any) => {
    const m = new Date(c.date_consultation).toLocaleDateString("fr-FR", { month: "short" });
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  });
  const chartData = Object.entries(byMonth).map(([month, count]) => ({ month, count }));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-8 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-elevated sm:p-8"
      >
        <p className="text-sm font-medium opacity-90 capitalize">{today}</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
          Bonjour Dr. {user?.nom} 👨‍⚕️
        </h1>
        <p className="mt-1 text-sm opacity-90">
          {rdvAujourdhui.length} rendez-vous aujourd'hui · {consultations.length} consultations enregistrées
        </p>
      </motion.div>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="rounded-2xl shadow-card transition-base hover:shadow-elevated">
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <k.icon className="h-4 w-4" />
                  </span>
                </div>
                {loadingConsult
                  ? <div className="h-7 w-12 animate-pulse rounded bg-muted" />
                  : <p className="font-display text-2xl font-bold">{k.value}</p>
                }
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Consultations récentes */}
        <Card className="rounded-2xl shadow-card lg:col-span-2">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Consultations récentes</h2>
              <Link to="/medecin/patients" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Voir tous <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loadingConsult ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}
              </div>
            ) : consultations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune consultation enregistrée.</p>
            ) : (
              <div className="space-y-3">
                {consultations.slice(0, 5).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3 transition-base hover:border-primary/40 hover:bg-primary-soft/20">
                    <UserAvatar name={`Patient ${c.id_dossier?.slice(0, 4)}`} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{c.diagnostic ?? c.motif}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(c.date_consultation)} · {c.hopital?.nom ?? "—"}
                      </p>
                    </div>
                    <Link to={`/medecin/patient/${c.id_dossier}`}>
                      <Button size="sm" variant="outline" className="rounded-full text-xs">Dossier</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agenda du jour */}
        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-base font-semibold">Agenda du jour</h2>
            {loadingAgenda ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
              </div>
            ) : rdvAujourdhui.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun RDV aujourd'hui.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-dashed border-border pl-5">
                {rdvAujourdhui.slice(0, 6).map((rdv: any) => (
                  <li key={rdv.id} className="relative">
                    <span className="absolute -left-[22px] flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft ring-2 ring-background">
                      <Clock className="h-3 w-3 text-primary" />
                    </span>
                    <p className="text-xs text-muted-foreground">{fmtTime(rdv.date_heure)}</p>
                    <p className="text-sm font-medium">
                      {rdv.patient?.prenom} {rdv.patient?.nom}
                    </p>
                    <p className="text-xs text-muted-foreground">{rdv.motif ?? "Consultation"}</p>
                    <StatusBadge status={rdv.statut as any} />
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphique activité */}
      {chartData.length > 0 && (
        <Card className="mt-6 rounded-2xl shadow-card">
          <CardContent className="p-5 sm:p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Activité mensuelle (consultations)</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Consultations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
