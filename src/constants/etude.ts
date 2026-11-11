/**
 * Coordonnées de l'étude affichées dans l'onglet Contact.
 * À remplacer par les vraies informations de l'étude.
 */
export const ETUDE = {
  nom: 'Étude notariale',
  siege: 'Lot IVG 123, Antaninarenina, Antananarivo 101',
  telephone: '034 00 000 00',
  horaires: 'Lundi au vendredi, 8h – 12h et 14h – 17h',
  /** Durées annoncées au client sur l'écran d'accueil, étape par étape. */
  durees: {
    saisie: '5 min',
    appel: 'Sous 24 h',
    visite: 'Sous 24 h',
    traitement: '5 jours ouvrables',
    remise: 'Sous 24 h',
  },
} as const;
