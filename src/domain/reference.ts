/**
 * Numéro de référence lisible d'un dossier : ACT-{année}-{compteur}, sans
 * zéros de tête (ex. ACT-2026-12). La génération réelle se fait côté base
 * (séquence Postgres) pour garantir l'unicité ; ce module ne fait que
 * valider/normaliser le format côté app (suivi public, affichage).
 */

const REFERENCE_REGEX = /^ACT-(\d{4})-(\d+)$/;

export interface ReferenceParsee {
  annee: number;
  compteur: number;
}

export function formatReference(annee: number, compteur: number): string {
  return `ACT-${annee}-${compteur}`;
}

export function estReferenceValide(reference: string): boolean {
  return REFERENCE_REGEX.test(reference.trim().toUpperCase());
}

export function parserReference(reference: string): ReferenceParsee | null {
  const match = REFERENCE_REGEX.exec(reference.trim().toUpperCase());
  if (!match) return null;
  return { annee: Number(match[1]), compteur: Number(match[2]) };
}

/** Forme canonique (ex. « act-2026-0012 » -> « ACT-2026-12 ») ; inchangée si invalide. */
export function normaliserReference(reference: string): string {
  const parsee = parserReference(reference);
  return parsee ? formatReference(parsee.annee, parsee.compteur) : reference.trim().toUpperCase();
}
