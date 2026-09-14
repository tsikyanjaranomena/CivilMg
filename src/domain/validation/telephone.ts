/**
 * Validation légère des numéros de téléphone malgaches.
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
