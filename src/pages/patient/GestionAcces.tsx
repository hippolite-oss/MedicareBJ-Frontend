// Gestion des accès patient — données réelles via API.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMonDossierAcces } from "@/hooks/useQueries";
import { accesService } from "@/services/accesService";
import { rendezVousService } from "@/services/rendezVousService";
import { toast } from "sonner";
import { Plus, Ban, Clock, ShieldCheck, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const DURATIONS = [
  { value: "1", label: "1 heure", jours: null, heures: 1 },
  { value: "6", label: "6 heures", jours: null, heures: 6 },
  { value: "24", label: "24 heures", jours: 1, heures: null },
  { value: "7j", label: "7 jours", jours: 7, heures: null },
  { value: "30j", label: "30 jours", jours: 30, heures: null },
];

export default function GestionAcces() {
  const [grantOpen, setGrantOpen] = useState(false);
  const [selectedPro, setSelectedPro] = useState<any>(null);
  const [level, setLevel] = useState<"lecture" | "ecriture">("lecture");
  const [duration, setDuration] = useState("24");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useMonDossierAcces();
  const acces: any[] = data?.acces ?? [];
  const actifs = acces.filter((a) => a.statut === "actif");
  const historique = acces.filter((a) => a.statut !== "actif");

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const res: any = await rendezVousService.getMedecinsDisponibles({
        search: searchQuery,
      });
      setSearchResults(res?.data?.medecins ?? []);
    } catch {
      toast.error("Erreur de recherche");
    } finally {
      setSearching(false);
    }
  };

  const handleGrant = async () => {
    if (!selectedPro) {
      toast.error("Sélectionnez un professionnel.");
      return;
    }
    setGranting(true);
    try {
      const dur = DURATIONS.find((d) => d.value === duration);
      await accesService.accorder({
        id_professionnel:
          selectedPro.utilisateur?.id ??
          selectedPro.Utilisateur?.id ??
          selectedPro.id_utilisateur,
        type_acces: level,
        duree_jours: dur?.jours ?? undefined,
      });
      toast.success("Accès accordé");
      qc.invalidateQueries({ queryKey: ["mon-dossier-acces"] });
      setGrantOpen(false);
      setSelectedPro(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await accesService.revoquer(id);
      qc.invalidateQueries({ queryKey: ["mon-dossier-acces"] });
      toast.success("Accès révoqué");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setRevoking(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Gestion des accès"
        subtitle="Contrôlez qui peut consulter ou modifier votre dossier médical."
        actions={
          <Button
            onClick={() => setGrantOpen(true)}
            className="rounded-full bg-gradient-primary shadow-glow"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Accorder un accès
          </Button>
        }
      />

      {/* Accès actifs */}
      <div className="mb-6">
        <h2 className="mb-3 font-display text-base font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Accès actifs (
          {actifs.length})
        </h2>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : actifs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun accès actif.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {actifs.map((g: any) => (
              <Card key={g.id} className="rounded-2xl shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={`${g.professionnel?.prenom} ${g.professionnel?.nom}`}
                      photoUrl={g.professionnel?.photo_profil}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-semibold">
                          Dr. {g.professionnel?.prenom} {g.professionnel?.nom}
                        </h3>
                        <StatusBadge status={g.statut as any} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {g.professionnel?.profil_professionnel?.specialite ??
                          "—"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={g.type_acces} />
                        <span className="text-xs text-muted-foreground">
                          Depuis{" "}
                          {new Date(g.date_debut).toLocaleDateString("fr-FR")}
                          {g.date_fin
                            ? ` → ${new Date(g.date_fin).toLocaleDateString("fr-FR")}`
                            : ""}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(g.id)}
                        disabled={revoking === g.id}
                        className="mt-3 text-destructive hover:bg-destructive/10"
                      >
                        {revoking === g.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Ban className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Révoquer l'accès
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Historique */}
      {historique.length > 0 && (
        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
              <Clock className="h-4 w-4 text-primary" /> Historique (
              {historique.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Professionnel</th>
                    <th className="px-3 py-2 font-medium">Niveau</th>
                    <th className="px-3 py-2 font-medium">Période</th>
                    <th className="px-3 py-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {historique.map((g: any) => (
                    <tr
                      key={g.id}
                      className="border-t border-border hover:bg-muted/30"
                    >
                      <td className="px-3 py-3">
                        Dr. {g.professionnel?.prenom} {g.professionnel?.nom}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={g.type_acces} />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {new Date(g.date_debut).toLocaleDateString("fr-FR")}
                        {g.date_fin
                          ? ` → ${new Date(g.date_fin).toLocaleDateString("fr-FR")}`
                          : ""}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={g.statut as any} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal accorder accès */}
      <Dialog
        open={grantOpen}
        onOpenChange={(o) => {
          if (!o) {
            setGrantOpen(false);
            setSelectedPro(null);
            setSearchResults([]);
            setSearchQuery("");
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Accorder un accès
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Rechercher un médecin
              </Label>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nom du médecin…"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  variant="outline"
                  onClick={handleSearch}
                  disabled={searching}
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((m: any) => {
                    const u = m.utilisateur ?? m.Utilisateur ?? {};
                    return (
                      <button
                        key={m.id_utilisateur || m.id}
                        onClick={() => setSelectedPro(m)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-base",
                          selectedPro?.id === m.id
                            ? "border-primary bg-primary-soft"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <UserAvatar name={`${u.prenom} ${u.nom}`} size="sm" />
                        <div>
                          <p className="text-sm font-semibold">
                            Dr. {u.prenom} {u.nom}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.specialite}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">
                Niveau d'accès
              </Label>
              <RadioGroup
                value={level}
                onValueChange={(v) => setLevel(v as any)}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  {
                    v: "lecture",
                    t: "Lecture seule",
                    d: "Consultation uniquement",
                  },
                  {
                    v: "ecriture",
                    t: "Lecture + Écriture",
                    d: "Peut ajouter des données",
                  },
                ].map((opt) => (
                  <label
                    key={opt.v}
                    htmlFor={`lvl-${opt.v}`}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-3 transition-base",
                      level === opt.v
                        ? "border-primary bg-primary-soft"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem
                        id={`lvl-${opt.v}`}
                        value={opt.v}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-semibold">{opt.t}</p>
                        <p className="text-xs text-muted-foreground">{opt.d}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">
                Durée de validité
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setGrantOpen(false)}
                className="flex-1 rounded-full"
              >
                Annuler
              </Button>
              <Button
                onClick={handleGrant}
                disabled={granting || !selectedPro}
                className="flex-1 rounded-full bg-gradient-primary shadow-glow"
              >
                {granting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Accorder l'accès
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
