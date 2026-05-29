/** Analyse avec résultats renseignés (consultation possible). */
export function analyseHasResults(analyse: {
  statut?: string;
  resultat?: string | null;
  id_technicien?: string | null;
} | null): boolean {
  if (!analyse) return false;
  return (
    analyse.statut === "disponible" ||
    Boolean(analyse.resultat?.trim()) ||
    Boolean(analyse.id_technicien)
  );
}

export function formatProfessionnelName(
  user?: { prenom?: string; nom?: string; role?: string } | null,
): string | null {
  if (!user?.nom) return null;
  const prefix =
    user.role === "medecin" || user.role === "technicien" ? "Dr. " : "";
  return `${prefix}${user.prenom ?? ""} ${user.nom}`.trim();
}
