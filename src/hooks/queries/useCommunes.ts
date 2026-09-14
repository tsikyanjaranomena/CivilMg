import { useQuery } from '@tanstack/react-query';

import { listerCommunes } from '@/api/communes.api';

export function useCommunes() {
  return useQuery({
    queryKey: ['communes'],
    queryFn: listerCommunes,
    staleTime: 5 * 60_000,
  });
}
