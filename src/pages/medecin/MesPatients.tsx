// Mes patients — données réelles via API.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMesPatientsMediacin } from "@/hooks/useQueries";
import {
  Search,
  ChevronRight,
  Loader2,
  Users,
  CalendarDays,
  Hash,
  Stethoscope,
} from "lucide-react";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function MesPatients() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useMesPatientsMediacin();
  const rawPatients: any[] = data?.patients ?? [];

  const patients = useMemo(() => {
    const sorted = [...rawPatients].sort((a, b) => {
      const da = a.derniere_consultation
        ? new Date(a.derniere_consultation).getTime()
        : 0;
      const db = b.derniere_consultation
        ? new Date(b.derniere_consultation).getTime()
        : 0;
      return db - da;
    });
    if (!query.trim()) return sorted;
    const q = query.trim().toLowerCase();
    return sorted.filter((p) => {
      const nom =
        `${p.patient?.prenom ?? ""} ${p.patient?.nom ?? ""}`.toLowerCase();
      const nomReverse =
        `${p.patient?.nom ?? ""} ${p.patient?.prenom ?? ""}`.toLowerCase();
      const numero = `${p.numero_dossier ?? ""}`.toLowerCase();
      const email = `${p.patient?.email ?? ""}`.toLowerCase();
      return (
        nom.includes(q) ||
        nomReverse.includes(q) ||
        numero.includes(q) ||
        email.includes(q)
      );
    });
  }, [rawPatients, query]);

  const patientMap = { size: rawPatients.length };

  const patientName = (p: any) => {
    if (p.patient?.prenom || p.patient?.nom) {
      return `${p.patient.prenom ?? ""} ${p.patient.nom ?? ""}`.trim();
    }
    return `Dossier ${p.numero_dossier ?? p.id_dossier.slice(0, 8)}`;
  };

  return (
    <>
      <PageHeader
        title="Mes patients"
        subtitle={`${patientMap.size} patient(s) dans votre suivi.`}
      />

      {/* Barre de recherche */}
      <div className="mb-5 relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, prénom ou numéro de dossier…"
          className="pl-10 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
          <Users className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">
            {query
              ? "Aucun patient ne correspond à cette recherche."
              : "Aucun patient dans votre suivi."}
          </p>
          {query && (
            <p className="mt-1 text-xs text-muted-foreground">
              Essayez avec le nom, le prénom ou le numéro de dossier.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p: any, i: number) => {
            const name = patientName(p);
            const nbConsult = p.nb_consultations ?? 0;
            return (
              <motion.div
                key={p.id_dossier}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="rounded-2xl shadow-card transition-base hover:shadow-elevated">
                  <CardContent className="p-5">
                    {/* En-tête patient */}
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        name={name}
                        photoUrl={p.patient?.photo_profil}
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-semibold text-base leading-tight truncate">
                          {name}
                        </h3>
                        {p.patient?.sexe && (
                          <p className="text-xs text-muted-foreground">
                            {p.patient.sexe === "F"
                              ? "Femme"
                              : p.patient.sexe === "M"
                                ? "Homme"
                                : "—"}
                          </p>
                        )}
                        {p.numero_dossier && (
                          <div className="mt-1 flex items-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {p.numero_dossier}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Infos consultation */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {p.derniere_consultation
                            ? `Dernière visite : ${fmt(p.derniere_consultation)}`
                            : "Aucune consultation encore"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {nbConsult} consultation{nbConsult > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`rounded-full text-xs font-normal ${
                          p.acces_actif
                            ? "border-secondary/40 bg-secondary/10 text-secondary"
                            : ""
                        }`}
                      >
                        {p.acces_actif ? "Accès actif" : "Suivi"}
                      </Badge>
                      <Link to={`/medecin/patient/${p.id_dossier}`}>
                        <Button
                          size="sm"
                          className="rounded-full bg-gradient-primary shadow-glow gap-1"
                        >
                          Dossier <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
