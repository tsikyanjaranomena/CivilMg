import { useQuery } from '@tanstack/react-query';

import { recupererProfil } from '@/api/profiles.api';
import { useSessionStore } from '@/stores/sessionStore';

export function useProfil() {
  const userId = useSessionStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['profil', userId],
    queryFn: () => recupererProfil(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
