/**
 * Calcul des délais estimés à partir des paramètres (délais standards par
 * type d'acte, en jours ouvrables). Isolé du reste pour rester testable sans
 * dépendance à Supabase ni à l'horloge système ambiante.
 */
import { addBusinessDays, differenceInCalendarDays, isPast } from 'date-fns';

export function calculerDateEcheanceEstimee(dateDepart: Date, joursOuvrables: number): Date {
  return addBusinessDays(dateDepart, joursOuvrables);
}

export type EtatDelai = 'dans_les_temps' | 'proche_echeance' | 'depasse';

const SEUIL_PROCHE_ECHEANCE_JOURS = 2;

export function joursRestants(dateEcheanceEstimee: Date, maintenant: Date = new Date()): number {
  return differenceInCalendarDays(dateEcheanceEstimee, maintenant);
}

export function etatDelai(dateEcheanceEstimee: Date, maintenant: Date = new Date()): EtatDelai {
  if (isPast(dateEcheanceEstimee) && differenceInCalendarDays(maintenant, dateEcheanceEstimee) > 0) {
    return 'depasse';
  }
  const restants = joursRestants(dateEcheanceEstimee, maintenant);
  return restants <= SEUIL_PROCHE_ECHEANCE_JOURS ? 'proche_echeance' : 'dans_les_temps';
}
