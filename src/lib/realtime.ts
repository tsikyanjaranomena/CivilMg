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
export function sabonnerTable(nomCanal: string, table: string, filtre: string | undefined, onChangement: () => void) {
  const canal = supabase
    .channel(nomCanal)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter: filtre }, onChangement)
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}
