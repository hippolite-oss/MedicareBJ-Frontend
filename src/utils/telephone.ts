/** Normalisation des numéros béninois (nouveau format 10 chiffres + ancien 8 chiffres) */

function extractNationalDigits(telephone: string): string {
  let digits = String(telephone).replace(/\D/g, "");
  if (digits.startsWith("00229")) digits = digits.slice(5);
  else if (digits.startsWith("229")) digits = digits.slice(3);
  return digits;
}

export function isValidTelephoneBJ(telephone: string): boolean {
  const national = extractNationalDigits(telephone);
  if (/^0[1-9]\d{8}$/.test(national)) return true;
  if (/^[1-9]\d{7}$/.test(national)) return true;
  return false;
}

export function normalizeTelephoneBJ(telephone: string): string | null {
  if (!isValidTelephoneBJ(telephone)) return null;
  const national = extractNationalDigits(telephone);
  return `+229${national}`;
}
