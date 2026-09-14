/**
 * Source unique de vérité pour les statuts de dossier : valeurs, libellés,
 * couleur sémantique et regroupement pour les tableaux de bord.
 * Ne jamais dupliquer ces libellés/couleurs ailleurs dans l'app.
 *
 * Les libellés viennent de src/lib/i18n/fr.json (clés "statuts.*" et
 * "statutsDescriptionClient.*") — c'est ce fichier JSON qui fait autorité
 * pour le texte affiché, celui-ci pour la structure/couleur/terminalité.
 * Tant qu'une seule langue existe, CONFIG_STATUTS reste un objet statique ;
 * le jour où mg.json est ajouté, en faire un hook (useConfigStatuts) qui lit
 * la langue courante plutôt que de figer le français au chargement.
 */
import { fr } from '@/lib/i18n';

export const STATUTS_DEMANDE = [
  'BROUILLON',
  'SOUMIS',
  'PIECES_A_COMPLETER',
  'VISITE_PLANIFIEE',
  'VISITE_A_REPLANIFIER',
  'EN_TRAITEMENT',
  'EN_VALIDATION',
  'PRET',
  'LIVRE',
  'REJETE',
  'ANNULE',
] as const;

export type StatutDemande = (typeof STATUTS_DEMANDE)[number];

export type CouleurSemantique = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

interface ConfigStatut {
  libelle: string;
  /** Phrase courte affichée au client dans la timeline. */
  descriptionClient: string;
  couleur: CouleurSemantique;
  /** true si le dossier est clos et ne peut plus évoluer. */
  terminal: boolean;
}

export const CONFIG_STATUTS: Record<StatutDemande, ConfigStatut> = {
  BROUILLON: {
    libelle: fr.statuts.BROUILLON,
    descriptionClient: fr.statutsDescriptionClient.BROUILLON,
    couleur: 'neutral',
    terminal: false,
  },
  SOUMIS: {
    libelle: fr.statuts.SOUMIS,
    descriptionClient: fr.statutsDescriptionClient.SOUMIS,
    couleur: 'info',
    terminal: false,
  },
  PIECES_A_COMPLETER: {
    libelle: fr.statuts.PIECES_A_COMPLETER,
    descriptionClient: fr.statutsDescriptionClient.PIECES_A_COMPLETER,
    couleur: 'warning',
    terminal: false,
  },
  VISITE_PLANIFIEE: {
    libelle: fr.statuts.VISITE_PLANIFIEE,
    descriptionClient: fr.statutsDescriptionClient.VISITE_PLANIFIEE,
    couleur: 'info',
    terminal: false,
  },
  VISITE_A_REPLANIFIER: {
    libelle: fr.statuts.VISITE_A_REPLANIFIER,
    descriptionClient: fr.statutsDescriptionClient.VISITE_A_REPLANIFIER,
    couleur: 'warning',
    terminal: false,
  },
  EN_TRAITEMENT: {
    libelle: fr.statuts.EN_TRAITEMENT,
    descriptionClient: fr.statutsDescriptionClient.EN_TRAITEMENT,
    couleur: 'info',
    terminal: false,
  },
  EN_VALIDATION: {
    libelle: fr.statuts.EN_VALIDATION,
    descriptionClient: fr.statutsDescriptionClient.EN_VALIDATION,
    couleur: 'info',
    terminal: false,
  },
  PRET: {
    libelle: fr.statuts.PRET,
    descriptionClient: fr.statutsDescriptionClient.PRET,
    couleur: 'success',
    terminal: false,
  },
  LIVRE: {
    libelle: fr.statuts.LIVRE,
    descriptionClient: fr.statutsDescriptionClient.LIVRE,
    couleur: 'success',
    terminal: true,
  },
  REJETE: {
    libelle: fr.statuts.REJETE,
    descriptionClient: fr.statutsDescriptionClient.REJETE,
    couleur: 'danger',
    terminal: true,
  },
  ANNULE: {
    libelle: fr.statuts.ANNULE,
    descriptionClient: fr.statutsDescriptionClient.ANNULE,
    couleur: 'neutral',
    terminal: true,
  },
};

/** Regroupement utilisé par les cartes de synthèse du tableau de bord client. */
export type CategorieTableauDeBord = 'en_cours' | 'pieces_a_completer' | 'pret' | 'termine';

export function categorieTableauDeBord(statut: StatutDemande): CategorieTableauDeBord {
  switch (statut) {
    case 'BROUILLON':
    case 'SOUMIS':
    case 'VISITE_PLANIFIEE':
    case 'VISITE_A_REPLANIFIER':
    case 'EN_TRAITEMENT':
    case 'EN_VALIDATION':
      return 'en_cours';
    case 'PIECES_A_COMPLETER':
      return 'pieces_a_completer';
    case 'PRET':
      return 'pret';
    case 'LIVRE':
    case 'REJETE':
    case 'ANNULE':
      return 'termine';
  }
}
