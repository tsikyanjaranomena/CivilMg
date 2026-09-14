import fr from './fr.json';

/**
 * Architecture i18n : une seule langue active aujourd'hui (français), mais
 * prête pour l'ajout du malgache — créer src/lib/i18n/mg.json avec les
 * mêmes clés que fr.json, puis l'ajouter à `dictionnaires` ci-dessous et à
 * LANGUES_DISPONIBLES dans src/stores/langueStore.ts (disponible: true).
 */
export type Langue = 'fr' | 'mg';

type Dictionnaire = typeof fr;

const dictionnaires: Partial<Record<Langue, Dictionnaire>> = { fr };

function obtenirValeur(dictionnaire: unknown, chemin: string): unknown {
  return chemin
    .split('.')
    .reduce<unknown>(
      (acc, segment) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[segment] : undefined),
      dictionnaire,
    );
}

/**
 * Traduit `cle` (notation pointée, ex. "commun.annuler") dans `langue`.
 * Retombe sur le dictionnaire français puis sur la clé elle-même si
 * introuvable — jamais d'exception pour un texte manquant.
 */
export function traduire(langue: Langue, cle: string, params?: Record<string, string | number>): string {
  const valeur = obtenirValeur(dictionnaires[langue] ?? dictionnaires.fr, cle);
  let texte = typeof valeur === 'string' ? valeur : cle;
  if (params) {
    for (const [nom, remplacement] of Object.entries(params)) {
      texte = texte.replaceAll(`{${nom}}`, String(remplacement));
    }
  }
  return texte;
}

export { fr };
