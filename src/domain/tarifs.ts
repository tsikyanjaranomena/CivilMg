/**
 * Calcul du montant d'une demande à partir du référentiel de tarifs.
 * Un tarif avec communeId = null sert de valeur par défaut quand aucun tarif
 * spécifique à la commune n'existe.
 */
import type { TypeActe } from './validation/demandeSchema';

export interface Tarif {
  typeActe: TypeActe;
  communeId: string | null;
  montant: number;
}

export function trouverTarifApplicable(
  tarifs: Tarif[],
  typeActe: TypeActe,
  communeId: string,
): Tarif | null {
  const specifique = tarifs.find((t) => t.typeActe === typeActe && t.communeId === communeId);
  if (specifique) return specifique;
  return tarifs.find((t) => t.typeActe === typeActe && t.communeId === null) ?? null;
}

export function calculerMontant(
  tarifs: Tarif[],
  typeActe: TypeActe,
  communeId: string,
  nombreCopies: number,
): number | null {
  const tarif = trouverTarifApplicable(tarifs, typeActe, communeId);
  if (!tarif) return null;
  return tarif.montant * nombreCopies;
}
