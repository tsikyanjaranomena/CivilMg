import { useQuery } from '@tanstack/react-query';

import { recupererIndicateurs } from '@/api/statistiques.api';

export function useIndicateurs() {
  return useQuery({
    queryKey: ['indicateurs'],
    queryFn: recupererIndicateurs,
    refetchInterval: 60_000,
  });
}
