import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Démarre l'écoute de la session Supabase et alimente sessionStore.
 * Appelé une seule fois depuis le layout racine. Retourne la fonction de
 * nettoyage à utiliser dans le useEffect appelant.
 */
export function demarrerEcouteSession(): () => void {
  supabase.auth.getSession().then(({ data }) => {
    useSessionStore.getState().setSession(data.session);
    useSessionStore.getState().terminerChargementInitial();
  });

  const { data: abonnement } = supabase.auth.onAuthStateChange((_evenement, session) => {
    useSessionStore.getState().setSession(session);
  });

  return () => abonnement.subscription.unsubscribe();
}
