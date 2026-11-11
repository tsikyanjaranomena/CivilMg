import { supabase } from '@/lib/supabase';

/**
 * S'abonne aux changements d'une table Postgres et déclenche `onChangement`
 * à chaque insert/update/delete. Retourne la fonction de nettoyage.
 *
 * Le repli "polling si le socket tombe" exigé par le cahier des charges est
 * assuré au niveau des hooks appelants via `refetchInterval` sur useQuery :
 * plus simple et plus robuste que de traquer précisément l'état du canal
 * (WebSocket qui se reconnecte silencieusement, etc.) — si le realtime est
 * up, les mises à jour sont quasi instantanées ; sinon, le polling de repli
 * rattrape dans un délai borné.
 */
let compteurCanaux = 0;

export function sabonnerTable(nomCanal: string, table: string, filtre: string | undefined, onChangement: () => void) {
  // supabase.channel(nom) renvoie le canal existant s'il porte déjà ce nom :
  // deux composants abonnés au même sujet (ex. badge d'onglet + écran
  // Notifications) feraient alors un .on() sur un canal déjà souscrit, ce qui
  // lève une erreur. Un suffixe unique donne à chaque abonné son propre canal.
  compteurCanaux += 1;
  const canal = supabase
    .channel(`${nomCanal}-${compteurCanaux}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter: filtre }, onChangement)
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}
