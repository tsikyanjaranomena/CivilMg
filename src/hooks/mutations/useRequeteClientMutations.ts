import { useMutation, useQueryClient } from '@tanstack/react-query';

import { marquerRequeteTraitee } from '@/api/requetesClient.api';

export function useMarquerRequeteTraitee(demandeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marquerRequeteTraitee(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requetes-client', demandeId] }),
  });
}
