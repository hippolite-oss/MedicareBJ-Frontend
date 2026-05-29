// Supervision des transactions — données réelles via API.
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useQueries";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { CreditCard, TrendingUp, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

export default function SupervisionTransactions() {
  const { data, isLoading } = useTransactions({ limit: 100 });
  const paiements: any[] = data?.paiements ?? [];

  const success = paiements.filter((t) => t.statut === "complete");
  const failed = paiements.filter((t) => t.statut === "echoue");
  const totalRevenue = success.reduce((s, t) => s + Number(t.montant), 0);
  const successRate = paiements.length > 0 ? Math.round((success.length / paiements.length) * 100) : 0;

  // Grouper par mois pour le graphique
  const byMonth: Record<string, number> = {};
  success.forEach((t) => {
    const m = new Date(t.date_paiement ?? t.createdAt).toLocaleDateString("fr-FR", { month: "short" });
    byMonth[m] = (byMonth[m] ?? 0) + Number(t.montant);
  });
  const chartData = Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));

  const kpis = [
    { label: "Total encaissé",    value: fmt(totalRevenue),         icon: CreditCard,  color: "bg-primary-soft text-primary" },
    { label: "Nb transactions",   value: String(paiements.length),  icon: TrendingUp,  color: "bg-secondary/15 text-secondary" },
    { label: "Taux de succès",    value: `${successRate}%`,         icon: CheckCircle, color: "bg-success/10 text-success" },
    { label: "Échecs",            value: String(failed.length),     icon: XCircle,     color: "bg-destructive/10 text-destructive" },
  ];

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Supervision des paiements et revenus de la plateforme."
        actions={
          <Button variant="outline" className="rounded-full gap-2">
            <Download className="h-4 w-4" /> Exporter
          </Button>
        }
      />

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="rounded-2xl shadow-card">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${k.color}`}>
                  <k.icon className="h-4 w-4" />
                </span>
              </div>
              {isLoading
                ? <div className="h-7 w-20 animate-pulse rounded bg-muted" />
                : <p className="font-display text-xl font-bold">{k.value}</p>
              }
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphique */}
      {chartData.length > 0 && (
        <Card className="mb-6 rounded-2xl shadow-card">
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-base font-semibold">Revenus mensuels (FCFA)</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [fmt(v), "Revenus"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau */}
      <Card className="overflow-hidden rounded-2xl shadow-card">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Référence</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {paiements.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucune transaction.</td></tr>
                  : paiements.map((t: any) => (
                    <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(t.date_paiement ?? t.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {t.patient?.prenom} {t.patient?.nom}
                      </td>
                      <td className="px-4 py-3 font-semibold">{fmt(Number(t.montant))}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.mode_paiement?.replace("_", " ").toUpperCase() ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.numero_recu ?? t.reference_externe ?? "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={t.statut as any} /></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
