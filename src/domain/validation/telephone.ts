/**
 * Numéros de téléphone malgaches.
 * Formats acceptés : 03X XX XXX XX (10 chiffres, commence par 03) ou
 * +261 3X XX XXX XX. On normalise avant de stocker/comparer.
 */

export function normaliserTelephone(valeur: string): string {
  return valeur.replace(/[\s.-]/g, '');
}

export function estTelephoneMalgacheValide(valeur: string): boolean {
  const normalise = normaliserTelephone(valeur);
  return /^(0|\+261)3[2-9]\d{7}$/.test(normalise);
}

/** Format international exigé par Supabase Auth : « 034 12 345 67 » -> « +261341234567 ». */
export function versFormatInternational(valeur: string): string {
  const normalise = normaliserTelephone(valeur);
  return normalise.startsWith('0') ? `+261${normalise.slice(1)}` : normalise;
}

/** Format local affiché à l'utilisateur : « +261341234567 » ou « 261341234567 » -> « 0341234567 ». */
export function versFormatLocal(valeur: string): string {
  const normalise = normaliserTelephone(valeur).replace(/^\+?261/, '0');
  return normalise;
}
