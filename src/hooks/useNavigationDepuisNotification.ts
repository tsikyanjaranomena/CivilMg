import { router } from 'expo-router';
import { useEffect } from 'react';

import { chargerNotifications } from '@/lib/notifications';

function ouvrirDossierSiPresent(donnees: unknown) {
  const demandeId = (donnees as { demandeId?: string } | undefined)?.demandeId;
  if (demandeId) {
    router.push(`/dossier/${demandeId}`);
  }
}

/** Ouvre le dossier concerné quand l'utilisateur appuie sur une notification push (app en fond ou fermée). */
export function useNavigationDepuisNotification() {
  useEffect(() => {
    const Notifications = chargerNotifications();
    if (!Notifications) return;

    Notifications.getLastNotificationResponseAsync().then((reponse) => {
      if (reponse) ouvrirDossierSiPresent(reponse.notification.request.content.data);
    });

    const abonnement = Notifications.addNotificationResponseReceivedListener((reponse) => {
      ouvrirDossierSiPresent(reponse.notification.request.content.data);
    });

    return () => abonnement.remove();
  }, []);
}
