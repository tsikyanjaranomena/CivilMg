import { useMutation, useQueryClient } from '@tanstack/react-query';

import { changerStatutDemande } from '@/api/demandes.api';
import type { StatutDemandeDb } from '@/types/database.types';

export function useChangerStatutDemande(demandeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { nouveauStatut: StatutDemandeDb; commentaireClient?: string }) =>
      changerStatutDemande(demandeId, params.nouveauStatut, params.commentaireClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', demandeId] });
      queryClient.invalidateQueries({ queryKey: ['historique', demandeId] });
      queryClient.invalidateQueries({ queryKey: ['demandes', 'liste'] });
    },
  });
}
