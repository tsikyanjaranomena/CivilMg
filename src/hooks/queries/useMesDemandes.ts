import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { listerMesDemandes } from '@/api/demandes.api';
import { sabonnerTable } from '@/lib/realtime';
import { useSessionStore } from '@/stores/sessionStore';

const POLLING_REPLI_MS = 30_000;

function cleDemandes(userId: string | undefined) {
  return ['demandes', 'liste', userId] as const;
}

export function useMesDemandes() {
  const userId = useSessionStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    return sabonnerTable(`demandes-client-${userId}`, 'demandes', `demandeur_id=eq.${userId}`, () => {
      queryClient.invalidateQueries({ queryKey: cleDemandes(userId) });
    });
  }, [userId, queryClient]);

  return useQuery({
    queryKey: cleDemandes(userId),
    queryFn: () => listerMesDemandes(userId!),
    enabled: !!userId,
    refetchInterval: POLLING_REPLI_MS,
  });
}
