// Audit & Accès — données réelles via API.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAudit } from "@/hooks/useQueries";
import { adminService } from "@/services/adminService";
import { Download, Search, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AuditAcces() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useAudit({ limit: 200 });
  const logs: any[] = data?.logs ?? [];

  const filtered = logs.filter((e: any) => {
    const user = e.utilisateur ?? e.Utilisateur;
    return e.action?.toLowerCase().includes(query.toLowerCase()) ||
      e.ip?.toLowerCase().includes(query.toLowerCase()) ||
      `${user?.prenom} ${user?.nom}`.toLowerCase().includes(query.toLowerCase());
  });

  const handleExportCSV = async () => {
    try {
      const res: any = await adminService.exportAudit();
      const blob = new Blob([res], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `audit-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback local
      const csv = ["ID,Utilisateur,Action,IP,Date,Statut",
        ...filtered.map((e: any) => {
          const user = e.utilisateur ?? e.Utilisateur;
          return `${e.id},${user?.email ?? ""},${e.action},${e.ip ?? ""},${e.createdAt},${e.statut}`;
        })
      ].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `audit-${Date.now()}.csv`; a.click();
    }
  };

  const suspiciousActions = ["CONNEXION_ECHEC", "ACCES_DOSSIER", "SCAN_QR"];
  const isSuspicious = (e: any) => e.statut === "echec" || (suspiciousActions.includes(e.action) && e.statut === "echec");

  return (
    <>
      <PageHeader
        title="Audit & Accès"
        subtitle="Journal chronologique de toutes les actions sensibles sur la plateforme."
        actions={
          <Button variant="outline" className="rounded-full gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par utilisateur, action, IP…" className="pl-10 rounded-xl" />
        </div>
        {filtered.filter(isSuspicious).length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive ring-1 ring-destructive/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            {filtered.filter(isSuspicious).length} action(s) suspecte(s)
          </div>
        )}
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
                  <th className="px-4 py-3 font-medium">Utilisateur</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Aucune entrée trouvée.</td></tr>
                  : filtered.map((e: any) => {
                    const suspicious = isSuspicious(e);
                    return (
                      <tr key={e.id} className={cn("border-t border-border", suspicious ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/30")}>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {new Date(e.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-1.5">
                            {suspicious && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                            {(() => {
                              const user = e.utilisateur ?? e.Utilisateur;
                              return user ? `${user.prenom} ${user.nom}` : "Système";
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3">{e.action}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.ip ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                            e.statut === "succes" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          )}>
                            {e.statut}
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
        {!isLoading && filtered.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">Aucune entrée trouvée.</p>
        )}
      </Card>
    </>
  );
}
