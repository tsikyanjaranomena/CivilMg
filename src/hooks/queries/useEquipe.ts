import { useQuery } from '@tanstack/react-query';

import { listerEquipe } from '@/api/equipe.api';

export function useEquipe() {
  return useQuery({ queryKey: ['equipe'], queryFn: listerEquipe });
}
