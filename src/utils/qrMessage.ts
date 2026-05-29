/** Extrait le token JWT d'un message de type QR (format envoyé depuis CodeQR). */
export function extractQrTokenFromMessage(
  contenu?: string | null,
): string | null {
  if (!contenu) return null;
  if (!contenu.includes("Token :")) return null;
  const token = contenu.split("Token :").pop()?.trim();
  return token && token.length > 0 ? token : null;
}

export function isQrMessage(message: { type_message?: string } | null): boolean {
  return message?.type_message === "qr";
}

/** Contenu affiché sans la section token. */
export function getQrMessagePreview(contenu?: string | null): string {
  if (!contenu) return "";
  if (contenu.includes("Token :")) {
    return contenu.split("\n\nToken :")[0].trim();
  }
  return contenu;
}
