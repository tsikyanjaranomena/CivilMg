import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { listerDemandesAPlanifier, listerVisitesPlanifiees, recupererCompteRendu } from '@/api/visites.api';
import { sabonnerTable } from '@/lib/realtime';

export function useDemandesAPlanifier() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return sabonnerTable('demandes-a-planifier', 'demandes', undefined, () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-a-planifier'] });
    });
  }, [queryClient]);

  return useQuery({
    queryKey: ['demandes-a-planifier'],
    queryFn: listerDemandesAPlanifier,
    refetchInterval: 30_000,
  });
}

export function useVisitesPlanifiees() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return sabonnerTable('visites-planifiees', 'visites', undefined, () => {
      queryClient.invalidateQueries({ queryKey: ['visites-planifiees'] });
    });
  }, [queryClient]);

  return useQuery({
    queryKey: ['visites-planifiees'],
    queryFn: listerVisitesPlanifiees,
    refetchInterval: 30_000,
  });
}

export function useCompteRenduVisite(visiteId: string | undefined) {
  return useQuery({
    queryKey: ['compte-rendu-visite', visiteId],
    queryFn: () => recupererCompteRendu(visiteId!),
    enabled: !!visiteId,
  });
}
