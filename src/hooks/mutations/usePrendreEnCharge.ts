import { useMutation, useQueryClient } from '@tanstack/react-query';

import { prendreEnChargeDemande } from '@/api/fileAttente.api';
import { useSessionStore } from '@/stores/sessionStore';

export function usePrendreEnCharge() {
  const queryClient = useQueryClient();
  const responsableId = useSessionStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: (demandeId: string) => prendreEnChargeDemande(demandeId, responsableId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-attente'] });
      queryClient.invalidateQueries({ queryKey: ['demandes-a-planifier'] });
    },
  });
}
