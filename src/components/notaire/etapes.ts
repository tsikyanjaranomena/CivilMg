import type { NomIcone } from '@/components/ui/Bouton';
import { ETUDE } from '@/constants/etude';
import { FRAIS } from '@/domain/paiement';
import type { StatutDemande } from '@/domain/statuts/statutConfig';

/**
 * Les étapes du travail du notaire, miroir de « Comment ça marche ? » côté
 * client. Chaque statut technique est rangé dans une seule étape, pour que le
 * notaire voie toujours « ce qu'il doit faire maintenant ».
 */
export type CleEtape = 'appeler' | 'visite' | 'preparer' | 'remettre' | 'termine';

export interface EtapeNotaire {
  cle: CleEtape;
  titre: string;
  /** Titre court pour les puces de filtre. */
  court: string;
  icone: NomIcone;
  statuts: StatutDemande[];
  duree?: string;
  frais?: number;
  couleur: string;
  fond: string;
}

export const ETAPES_NOTAIRE: EtapeNotaire[] = [
  {
    cle: 'appeler',
    titre: 'Appeler le client',
    court: 'À appeler',
    icone: 'phone-in-talk',
    statuts: ['BROUILLON', 'SOUMIS', 'PIECES_A_COMPLETER', 'VISITE_A_REPLANIFIER'],
    duree: ETUDE.durees.appel,
    couleur: '#1E56A0',
    fond: '#E3EDFB',
  },
  {
    cle: 'visite',
    titre: 'Aller chez le client',
    court: 'Visites',
    icone: 'home-account',
    statuts: ['VISITE_PLANIFIEE'],
    duree: ETUDE.durees.visite,
    frais: FRAIS.visite,
    couleur: '#B26A00',
    fond: '#FFF1D6',
  },
  {
    cle: 'preparer',
    titre: "Préparer l'acte",
    court: 'À préparer',
    icone: 'progress-clock',
    statuts: ['EN_TRAITEMENT', 'EN_VALIDATION'],
    duree: ETUDE.durees.traitement,
    couleur: '#6B4FA3',
    fond: '#EEE8F8',
  },
  {
    cle: 'remettre',
    titre: "Remettre l'acte",
    court: 'À remettre',
    icone: 'file-certificate-outline',
    statuts: ['PRET'],
    duree: ETUDE.durees.remise,
    frais: FRAIS.remise,
    couleur: '#1B7A3D',
    fond: '#E2F4E8',
  },
  {
    cle: 'termine',
    titre: 'Terminé',
    court: 'Terminés',
    icone: 'check-decagram',
    statuts: ['LIVRE'],
    couleur: '#4A5568',
    fond: '#EDF0F4',
  },
];

/** Étape d'un statut, ou null pour un dossier rejeté / annulé. */
export function etapeDuStatut(statut: StatutDemande): EtapeNotaire | null {
  return ETAPES_NOTAIRE.find((e) => e.statuts.includes(statut)) ?? null;
}

export function etapeParCle(cle: string | undefined): EtapeNotaire | null {
  return ETAPES_NOTAIRE.find((e) => e.cle === cle) ?? null;
}
