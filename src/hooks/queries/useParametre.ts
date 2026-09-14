import { useQuery } from '@tanstack/react-query';

import { recupererParametre } from '@/api/referentiels.api';

export function useParametre(cle: string) {
  return useQuery({
    queryKey: ['parametre', cle],
    queryFn: () => recupererParametre(cle),
    staleTime: 5 * 60_000,
  });
}
