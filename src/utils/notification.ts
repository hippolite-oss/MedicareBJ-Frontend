const DECISION_LABELS: Record<string, string> = {
  avertissement: "Avertissement",
  suspension_30j: "Suspension 30 jours",
  suspension_definitive: "Suspension définitive",
  rejete: "Signalement rejeté",
};

export function parseNotificationMetadata(
  metadata: unknown,
): Record<string, unknown> | null {
  if (!metadata) return null;
  if (typeof metadata === "object") return metadata as Record<string, unknown>;
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

export function getSignalementCommentFromNotification(n: {
  contenu?: string;
  metadata?: unknown;
}): string | null {
  const meta = parseNotificationMetadata(n.metadata);
  const fromMeta = meta?.decision_admin;
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();

  const marker = "Commentaire de l'administration :";
  const idx = n.contenu?.indexOf(marker);
  if (idx !== undefined && idx >= 0 && n.contenu) {
    return n.contenu.slice(idx + marker.length).trim();
  }
  return null;
}

export function getSignalementDecisionLabel(n: {
  metadata?: unknown;
  contenu?: string;
}): string | null {
  const meta = parseNotificationMetadata(n.metadata);
  const decision = meta?.decision;
  if (typeof decision === "string") {
    return DECISION_LABELS[decision] || decision;
  }
  const match = n.contenu?.match(/Décision\s*:\s*([^\n.]+)/i);
  return match?.[1]?.trim() ?? null;
}
