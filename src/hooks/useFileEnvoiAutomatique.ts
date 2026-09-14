import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { traiterFileEnvoi } from '@/lib/fileEnvoi';

/** Rejoue la file d'envoi dès que la connexion revient. À monter une fois, dans le layout racine. */
export function useFileEnvoiAutomatique() {
  useEffect(() => {
    const abonnement = NetInfo.addEventListener((etat) => {
      if (etat.isConnected) {
        traiterFileEnvoi();
      }
    });
    return () => abonnement();
  }, []);
}
