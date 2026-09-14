/**
 * Numéro de référence lisible d'un dossier : ACT-{année}-{compteur global}.
 * La génération réelle se fait côté base (séquence Postgres, voir
 * supabase/migrations) pour garantir l'unicité sous concurrence ; ce module
 * ne fait que valider/parser le format côté app (formulaire de suivi public,
 * affichage).
 */

const REFERENCE_REGEX = /^ACT-(\d{4})-(\d{6})$/;

export interface ReferenceParsee {
  annee: number;
  compteur: number;
}

export function formatReference(annee: number, compteur: number): string {
  return `ACT-${annee}-${String(compteur).padStart(6, '0')}`;
}

export function estReferenceValide(reference: string): boolean {
  return REFERENCE_REGEX.test(reference.trim().toUpperCase());
}

export function parserReference(reference: string): ReferenceParsee | null {
  const match = REFERENCE_REGEX.exec(reference.trim().toUpperCase());
  if (!match) return null;
  return { annee: Number(match[1]), compteur: Number(match[2]) };
}
