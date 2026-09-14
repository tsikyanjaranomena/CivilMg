import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** true = hors ligne (pas de connexion confirmée). null tant que l'état initial n'est pas connu. */
export function useEtatReseau(): { horsLigne: boolean } {
  const [connecte, setConnecte] = useState(true);

  useEffect(() => {
    const abonnement = NetInfo.addEventListener((etat) => {
      setConnecte(etat.isConnected !== false);
    });
    return () => abonnement();
  }, []);

  return { horsLigne: !connecte };
}
