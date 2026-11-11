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
      // Côté notaire : accueil (compteurs), liste des dossiers et onglet Visites.
      queryClient.invalidateQueries({ queryKey: ['indicateurs'] });
      queryClient.invalidateQueries({ queryKey: ['file-attente'] });
      queryClient.invalidateQueries({ queryKey: ['demandes-a-planifier'] });
      queryClient.invalidateQueries({ queryKey: ['visites-planifiees'] });
    },
  });
}
