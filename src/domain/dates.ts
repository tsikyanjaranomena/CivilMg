/**
 * Formate une date Postgres `date` (AAAA-MM-JJ) en JJ/MM/AAAA. Découpe la
 * chaîne plutôt que de passer par `new Date()` pour éviter tout décalage de
 * fuseau horaire qui ferait afficher la veille.
 */
export function formaterDateFr(dateIso: string | null | undefined): string {
  if (!dateIso) return '';
  const [annee, mois, jour] = dateIso.slice(0, 10).split('-');
  if (!annee || !mois || !jour) return dateIso;
  return `${jour}/${mois}/${annee}`;
}
