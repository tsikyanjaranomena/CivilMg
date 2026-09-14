import { useQuery } from '@tanstack/react-query';

import { listerAdressesProfil } from '@/api/adresses.api';
import { useSessionStore } from '@/stores/sessionStore';

export function useAdressesProfil() {
  const userId = useSessionStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['adresses-profil', userId],
    queryFn: () => listerAdressesProfil(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
