import { useQuery } from '@tanstack/react-query';

import { listerRequetesNonTraitees } from '@/api/requetesClient.api';

export function useRequetesNonTraitees(demandeId: string | undefined) {
  return useQuery({
    queryKey: ['requetes-client', demandeId],
    queryFn: () => listerRequetesNonTraitees(demandeId!),
    enabled: !!demandeId,
  });
}
