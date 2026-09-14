import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { deconnecter } from '@/api/auth.api';

/** Déconnecte l'utilisateur et vide le cache TanStack Query (données du compte précédent). */
export function useDeconnexion() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await deconnecter();
    queryClient.clear();
  }, [queryClient]);
}
