import { useEffect } from 'react';

import { enregistrerJetonPush } from '@/api/pushTokens.api';
import { demanderJetonPushExpo } from '@/lib/notifications';
import { useSessionStore } from '@/stores/sessionStore';

/** Enregistre le jeton push Expo du profil connecté, une fois par session. */
export function useEnregistrementPush() {
  const userId = useSessionStore((s) => s.session?.user.id);

  useEffect(() => {
    if (!userId) return;
    let annule = false;

    demanderJetonPushExpo().then((jeton) => {
      if (jeton && !annule) {
        enregistrerJetonPush(userId, jeton).catch((erreur) => {
          console.warn("Impossible d'enregistrer le jeton push :", erreur);
        });
      }
    });

    return () => {
      annule = true;
    };
  }, [userId]);
}
