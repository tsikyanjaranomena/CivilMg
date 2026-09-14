import { useQuery } from '@tanstack/react-query';

import { listerHistorique } from '@/api/historique.api';

export function useHistorique(demandeId: string | undefined) {
  return useQuery({
    queryKey: ['historique', demandeId],
    queryFn: () => listerHistorique(demandeId!),
    enabled: !!demandeId,
  });
}
