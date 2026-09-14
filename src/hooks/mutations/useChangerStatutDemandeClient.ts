import { useMutation, useQueryClient } from '@tanstack/react-query';

import { changerStatutDemande } from '@/api/demandes.api';
import { executerAvecRepli } from '@/lib/fileEnvoi';
import type { StatutDemandeDb } from '@/types/database.types';

/**
 * Variante client de useChangerStatutDemande : passe par la file d'envoi
 * hors ligne (executerAvecRepli). Réservée aux écrans client — côté
 * responsable, l'action doit rester synchrone (les transitions s'enchaînent
 * et l'UI dépend du résultat immédiat), voir useChangerStatutDemande.
 */
export function useChangerStatutDemandeClient(demandeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { nouveauStatut: StatutDemandeDb; commentaireClient?: string }) =>
      executerAvecRepli('changer_statut_demande', { demandeId, ...params }, (p) =>
        changerStatutDemande(p.demandeId, p.nouveauStatut, p.commentaireClient),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', demandeId] });
      queryClient.invalidateQueries({ queryKey: ['historique', demandeId] });
      queryClient.invalidateQueries({ queryKey: ['demandes', 'liste'] });
    },
  });
}
