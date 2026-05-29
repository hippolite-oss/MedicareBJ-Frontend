// Badge de statut cohérent — couleurs sémantiques selon état.
import { cn } from "@/lib/utils";

type StatusKey =
  | "actif" | "inactif" | "en_attente" | "valide" | "suspendu"
  | "planifie" | "confirme" | "annule" | "termine" | "en_cours" | "traite"
  | "active" | "terminee" | "annulee"
  | "a_payer" | "paye" | "echec"
  | "disponible" | "lecture" | "ecriture" | "revoque" | "expire"
  | "succes" | "rejete" | "valide_status";

const STYLES: Record<StatusKey, { label: string; className: string }> = {
  actif:       { label: "Actif",        className: "bg-success/10 text-success ring-success/20" },
  active:      { label: "Active",       className: "bg-success/10 text-success ring-success/20" },
  inactif:     { label: "Inactif",      className: "bg-muted text-muted-foreground ring-border" },
  en_attente:  { label: "En attente",   className: "bg-accent/15 text-accent-foreground ring-accent/30" },
  valide:      { label: "Validé",       className: "bg-success/10 text-success ring-success/20" },
  disponible:  { label: "Disponible",   className: "bg-success/10 text-success ring-success/20" },
  suspendu:    { label: "Suspendu",     className: "bg-destructive/10 text-destructive ring-destructive/20" },
  planifie:    { label: "Planifié",     className: "bg-info/10 text-info ring-info/20" },
  confirme:    { label: "Confirmé",     className: "bg-secondary/15 text-secondary ring-secondary/30" },
  annule:      { label: "Annulé",       className: "bg-destructive/10 text-destructive ring-destructive/20" },
  annulee:     { label: "Annulée",      className: "bg-destructive/10 text-destructive ring-destructive/20" },
  termine:     { label: "Terminé",      className: "bg-muted text-muted-foreground ring-border" },
  terminee:    { label: "Terminée",     className: "bg-muted text-muted-foreground ring-border" },
  en_cours:    { label: "En cours",     className: "bg-info/10 text-info ring-info/20" },
  traite:      { label: "Traité",       className: "bg-success/10 text-success ring-success/20" },
  a_payer:     { label: "À payer",      className: "bg-accent/15 text-accent-foreground ring-accent/30" },
  paye:        { label: "Payé",         className: "bg-success/10 text-success ring-success/20" },
  echec:       { label: "Échec",        className: "bg-destructive/10 text-destructive ring-destructive/20" },
  lecture:     { label: "Lecture",      className: "bg-info/10 text-info ring-info/20" },
  ecriture:    { label: "Lecture+Écriture", className: "bg-primary/10 text-primary ring-primary/20" },
  revoque:     { label: "Révoqué",      className: "bg-destructive/10 text-destructive ring-destructive/20" },
  expire:      { label: "Expiré",       className: "bg-muted text-muted-foreground ring-border" },
  succes:      { label: "Succès",       className: "bg-success/10 text-success ring-success/20" },
  rejete:      { label: "Rejeté",       className: "bg-destructive/10 text-destructive ring-destructive/20" },
  valide_status: { label: "Validé",     className: "bg-success/10 text-success ring-success/20" },
};

interface StatusBadgeProps {
  status: StatusKey;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const s = STYLES[status] ?? { label: status, className: "bg-muted text-muted-foreground ring-border" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.className,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {label ?? s.label}
    </span>
  );
}
