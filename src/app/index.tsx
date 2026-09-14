import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { deconnecter } from '@/api/auth.api';
import { ChargementPleinEcran } from '@/components/ui/ChargementPleinEcran';
import { useProfil } from '@/hooks/queries/useProfil';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Porte d'entrée : redirige selon l'état d'authentification et le rôle.
 * Ne rend jamais d'UI propre — uniquement des redirections ou un indicateur
 * de chargement pendant la lecture de la session/du profil.
 */
export default function Index() {
  const session = useSessionStore((s) => s.session);
  const chargementInitial = useSessionStore((s) => s.chargementInitial);
  const { data: profil, isLoading: profilEnChargement } = useProfil();

  const compteSuspendu = profil?.statut_compte === 'suspendu';

  useEffect(() => {
    if (compteSuspendu) {
      deconnecter();
    }
  }, [compteSuspendu]);

  if (chargementInitial || (session && profilEnChargement)) {
    return <ChargementPleinEcran />;
  }

  if (!session || !profil || compteSuspendu) {
    return <Redirect href="/connexion" />;
  }

  return <Redirect href={profil.role === 'responsable' ? '/dashboard' : '/accueil'} />;
}
