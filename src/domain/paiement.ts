/**
 * Frais fixes, réglés en main propre au notaire (rien n'est payé dans l'app) :
 * une partie lors de sa première visite, le reste quand il remet l'acte.
 */
export const FRAIS = {
  visite: 5000,
  remise: 15000,
} as const;

export const FRAIS_TOTAL = FRAIS.visite + FRAIS.remise;

/** 15000 → « 15 000 Ar » (séparateur fixe, identique sur Android, iOS et web). */
export function formaterAriary(montant: number): string {
  return `${String(Math.round(montant)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ar`;
}
