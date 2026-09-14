/**
 * Machine à états des dossiers — miroir côté app de la fonction Postgres
 * `verifier_transition_demande()` (supabase/migrations). La vérité applicative
 * reste la base ; cette logique sert à l'UX (griser des actions, valider un
 * formulaire) et doit rester strictement synchronisée avec le trigger SQL.
 */
import type { StatutDemande } from './statutConfig';

export type RoleUtilisateur = 'client' | 'responsable';

interface TransitionAutorisee {
  vers: StatutDemande;
  /** Rôles pouvant déclencher cette transition. */
  roles: RoleUtilisateur[];
  /** Un commentaire client non vide est obligatoire pour cette transition. */
  motifClientObligatoire?: boolean;
}

const TRANSITIONS: Record<StatutDemande, TransitionAutorisee[]> = {
  BROUILLON: [
    { vers: 'SOUMIS', roles: ['client'] },
    { vers: 'ANNULE', roles: ['client', 'responsable'] },
  ],
  SOUMIS: [
    { vers: 'PIECES_A_COMPLETER', roles: ['responsable'], motifClientObligatoire: true },
    { vers: 'VISITE_PLANIFIEE', roles: ['responsable'] },
    { vers: 'ANNULE', roles: ['client', 'responsable'] },
  ],
  PIECES_A_COMPLETER: [
    { vers: 'SOUMIS', roles: ['client'] },
    { vers: 'ANNULE', roles: ['client', 'responsable'] },
  ],
  VISITE_PLANIFIEE: [
    { vers: 'VISITE_A_REPLANIFIER', roles: ['responsable'] },
    { vers: 'REJETE', roles: ['responsable'], motifClientObligatoire: true },
    { vers: 'EN_TRAITEMENT', roles: ['responsable'] },
    { vers: 'ANNULE', roles: ['client', 'responsable'] },
  ],
  VISITE_A_REPLANIFIER: [{ vers: 'VISITE_PLANIFIEE', roles: ['responsable'] }],
  EN_TRAITEMENT: [
    { vers: 'PIECES_A_COMPLETER', roles: ['responsable'], motifClientObligatoire: true },
    { vers: 'EN_VALIDATION', roles: ['responsable'] },
  ],
  EN_VALIDATION: [
    { vers: 'EN_TRAITEMENT', roles: ['responsable'] },
    { vers: 'REJETE', roles: ['responsable'], motifClientObligatoire: true },
    { vers: 'PRET', roles: ['responsable'] },
  ],
  PRET: [{ vers: 'LIVRE', roles: ['responsable'] }],
  LIVRE: [],
  REJETE: [],
  ANNULE: [],
};

export function estTerminal(statut: StatutDemande): boolean {
  return TRANSITIONS[statut].length === 0;
}

export function transitionsDisponibles(
  depuis: StatutDemande,
  role: RoleUtilisateur,
): StatutDemande[] {
  return TRANSITIONS[depuis].filter((t) => t.roles.includes(role)).map((t) => t.vers);
}

export function peutTransitionner(
  depuis: StatutDemande,
  vers: StatutDemande,
  role: RoleUtilisateur,
): boolean {
  return TRANSITIONS[depuis].some((t) => t.vers === vers && t.roles.includes(role));
}

export function motifClientObligatoire(depuis: StatutDemande, vers: StatutDemande): boolean {
  const transition = TRANSITIONS[depuis].find((t) => t.vers === vers);
  return transition?.motifClientObligatoire ?? false;
}

/**
 * Verrou métier : le passage VISITE_PLANIFIEE -> EN_TRAITEMENT exige que la
 * visite ait été effectuée, jugée concluante, et la procuration papier
 * récupérée. Reproduit ici pour désactiver l'action dans l'UI ; l'application
 * réelle du verrou est faite par le trigger Postgres sur `demandes`.
 */
export function visiteAutoriseTraitement(visite: {
  statut: 'a_planifier' | 'planifiee' | 'effectuee' | 'client_absent' | 'echec' | 'reportee';
  verificationConcluante: boolean | null;
  procurationRecuperee: boolean;
}): boolean {
  return (
    visite.statut === 'effectuee' &&
    visite.verificationConcluante === true &&
    visite.procurationRecuperee === true
  );
}

/**
 * Verrou métier : une demande ne peut entrer en VISITE_PLANIFIEE que si
 * l'adresse a un fokontany et des points de repère renseignés.
 */
export function adresseAutoriseVisite(adresse: {
  fokontany: string | null | undefined;
  pointsDeRepere: string | null | undefined;
}): boolean {
  return Boolean(adresse.fokontany?.trim()) && Boolean(adresse.pointsDeRepere?.trim());
}
