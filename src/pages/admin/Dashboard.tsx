// Tableau de bord admin — données réelles via API.
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useAdminStats,
  useValidationsEnAttente,
  useSignalements,
  useValiderMedecin,
} from "@/hooks/useQueries";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Users,
  UserCheck,
  Activity,
  Flag,
  CreditCard,
  UserPlus,
  CheckCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const fmt = (n: number | undefined) =>
  n !== undefined ? n.toLocaleString("fr-FR") : "—";

const fmtFCFA = (n: number | undefined) =>
  n !== undefined ? `${n.toLocaleString("fr-FR")} FCFA` : "—";

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: validData, isLoading: loadingValid } = useValidationsEnAttente({
    limit: 5,
  });
  const { data: sigData, isLoading: loadingSig } = useSignalements({
    limit: 4,
  });
  const valider = useValiderMedecin();

  const validations: any[] = validData?.validations ?? [];
  const signalements: any[] = sigData?.signalements ?? [];

  const kpis = [
    {
      label: "Total utilisateurs",
      value: fmt(
        (stats?.total_patients ?? 0) + (stats?.total_medecins_valides ?? 0),
      ),
      icon: Users,
      color: "bg-primary-soft text-primary",
    },
    {
      label: "Médecins validés",
      value: fmt(stats?.total_medecins_valides),
      icon: UserCheck,
      color: "bg-secondary/15 text-secondary",
    },
    {
      label: "Patients actifs",
      value: fmt(stats?.total_patients),
      icon: Activity,
      color: "bg-info/15 text-info",
    },
    {
      label: "Signalements en cours",
      value: fmt(stats?.total_signalements_en_cours),
      icon: Flag,
      color: "bg-destructive/10 text-destructive",
    },
    {
      label: "Revenus ce mois",
      value: fmtFCFA(stats?.revenus_mois_en_cours),
      icon: CreditCard,
      color: "bg-accent/20 text-accent-foreground",
    },
    {
      label: "Nouveaux inscrits",
      value: fmt(stats?.nouveaux_inscrits_mois),
      icon: UserPlus,
      color: "bg-success/10 text-success",
    },
  ];

  const handleValider = async (id: string) => {
    try {
      await valider.mutateAsync(id);
      toast.success("Médecin validé avec succès");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    }
  };

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la plateforme MediCare BJ."
      />

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="rounded-2xl shadow-card transition-base hover:shadow-elevated">
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {k.label}
                  </span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${k.color}`}
                  >
                    <k.icon className="h-4 w-4" />
                  </span>
                </div>
                {loadingStats ? (
                  <div className="h-7 w-20 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="font-display text-xl font-bold sm:text-2xl">
                    {k.value}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inscriptions mensuelles */}
        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-base font-semibold">
              Inscriptions mensuelles
            </h2>
            <div className="h-52">
              {loadingStats ? (
                <div className="h-full animate-pulse rounded-xl bg-muted" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.consultations_par_mois ?? []}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Consultations"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Répartition rôles */}
        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-base font-semibold">
              Répartition des comptes
            </h2>
            <div className="space-y-3">
              {loadingStats
                ? [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-8 animate-pulse rounded bg-muted"
                    />
                  ))
                : [
                    {
                      label: "Patients / Usagers",
                      value: stats?.total_patients ?? 0,
                      color: "bg-primary",
                    },
                    {
                      label: "Médecins validés",
                      value: stats?.total_medecins_valides ?? 0,
                      color: "bg-secondary",
                    },
                    {
                      label: "En attente",
                      value: stats?.total_inscriptions_attente ?? 0,
                      color: "bg-accent",
                    },
                  ].map((row) => {
                    const total =
                      (stats?.total_patients ?? 0) +
                      (stats?.total_medecins_valides ?? 0) +
                      (stats?.total_inscriptions_attente ?? 0);
                    const pct =
                      total > 0 ? Math.round((row.value / total) * 100) : 0;
                    return (
                      <div key={row.label}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {row.label}
                          </span>
                          <span className="font-medium">{row.value}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${row.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Derniers signalements */}
        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">
                Derniers signalements
              </h2>
              <Link
                to="/admin/signalements"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Voir tous <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loadingSig ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : signalements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun signalement.
              </p>
            ) : (
              <ul className="space-y-3">
                {signalements.map((r: any) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                  >
                    <UserAvatar
                      name={`${r.emetteur?.prenom} ${r.emetteur?.nom}`}
                      photoUrl={r.emetteur?.photo_profil}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {r.motif?.slice(0, 50)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.emetteur?.prenom} {r.emetteur?.nom} →{" "}
                        {r.cible?.prenom} {r.cible?.nom}
                      </p>
                    </div>
                    <StatusBadge status={r.statut as any} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Validations en attente */}
        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">
                Validations en attente
              </h2>
              <Link
                to="/admin/validations"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Voir tous <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loadingValid ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : validations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune validation en attente. ✅
              </p>
            ) : (
              <ul className="space-y-3">
                {validations.map((d: any) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                  >
                    <UserAvatar
                      name={`${d.prenom} ${d.nom}`}
                      photoUrl={d.photo_profil}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        Dr. {d.prenom} {d.nom}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.professionnel?.specialite}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleValider(d.id)}
                      disabled={valider.isPending}
                      className="rounded-full bg-success/10 text-success hover:bg-success/20 shrink-0"
                    >
                      {valider.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="mr-1 h-3.5 w-3.5" /> Valider
                        </>
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
