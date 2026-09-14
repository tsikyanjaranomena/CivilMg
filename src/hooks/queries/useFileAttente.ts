import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { listerFileAttente, type FiltresFileAttente } from '@/api/fileAttente.api';
import { sabonnerTable } from '@/lib/realtime';

export function useFileAttente(filtres: FiltresFileAttente) {
  const queryClient = useQueryClient();
  const queryKey = ['file-attente', filtres];

  useEffect(() => {
    return sabonnerTable('file-attente-demandes', 'demandes', undefined, () => {
      queryClient.invalidateQueries({ queryKey: ['file-attente'] });
    });
  }, [queryClient]);

  return useQuery({
    queryKey,
    queryFn: () => listerFileAttente(filtres),
    refetchInterval: 30_000,
  });
}
