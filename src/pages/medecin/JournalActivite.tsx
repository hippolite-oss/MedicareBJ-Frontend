// Journal d'activité médecin — données réelles via API (audit).
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Download, Search, FileText, Pill, FlaskConical, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  CREATION_CONSULTATION: { icon: FileText,    color: "bg-primary-soft text-primary",        label: "Consultation" },
  CREATION_PRESCRIPTION: { icon: Pill,        color: "bg-accent/20 text-accent-foreground",  label: "Prescription" },
  RESULTATS_ANALYSE:     { icon: FlaskConical, color: "bg-info/15 text-info",                label: "Analyse" },
  ACCES_DOSSIER:         { icon: ShieldCheck, color: "bg-secondary/15 text-secondary",       label: "Accès" },
  SCAN_QR:               { icon: ShieldCheck, color: "bg-secondary/15 text-secondary",       label: "Scan QR" },
};
const DEFAULT_META = { icon: FileText, color: "bg-muted text-muted-foreground", label: "Action" };

export default function JournalActivite() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["mon-journal"],
    queryFn: () => api.get("/audit", { params: { limit: 100 } }),
    select: (res: any) => res?.data?.logs ?? [],
  });

  const logs: any[] = data ?? [];

  const filtered = logs.filter((j: any) =>
    (typeFilter === "all" || j.action === typeFilter) &&
    (j.action.toLowerCase().includes(query.toLowerCase()) || JSON.stringify(j.details ?? {}).toLowerCase().includes(query.toLowerCase()))
  );

  const handleExport = async () => {
    try {
      const res: any = await api.get("/audit/export");
      const blob = new Blob([res], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `journal-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback : télécharger les données actuelles
      const csv = ["Date,Action,IP", ...filtered.map((j: any) => `${j.createdAt},${j.action},${j.ip ?? ""}`).join("\n")].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `journal-${Date.now()}.csv`; a.click();
    }
  };

  return (
    <>
      <PageHeader
        title="Journal d'activité"
        subtitle="Historique chronologique de toutes vos actions sur la plateforme."
        actions={
          <Button variant="outline" className="rounded-full gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Exporter CSV
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="pl-10 rounded-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")} label="Tous" />
          {Object.entries(TYPE_META).map(([k, v]) => (
            <FilterChip key={k} active={typeFilter === k} onClick={() => setTypeFilter(k)} label={v.label} />
          ))}
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl shadow-card">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Date / Heure</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Aucune entrée trouvée.</td></tr>
                  : filtered.map((j: any) => {
                    const meta = TYPE_META[j.action] ?? DEFAULT_META;
                    return (
                      <tr key={j.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(j.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", meta.color)}>
                            <meta.icon className="h-3.5 w-3.5" /> {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{j.action}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{j.ip ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                            j.statut === "succes" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          )}>
                            {j.statut}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition-base",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
      )}
    >
      {label}
    </button>
  );
}
