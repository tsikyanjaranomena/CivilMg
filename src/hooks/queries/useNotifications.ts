import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { listerNotifications } from '@/api/notifications.api';
import { sabonnerTable } from '@/lib/realtime';
import { useSessionStore } from '@/stores/sessionStore';

function cleNotifications(userId: string | undefined) {
  return ['notifications', userId] as const;
}

export function useNotifications() {
  const userId = useSessionStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    return sabonnerTable(`notifications-${userId}`, 'notifications', `destinataire_id=eq.${userId}`, () => {
      queryClient.invalidateQueries({ queryKey: cleNotifications(userId) });
    });
  }, [userId, queryClient]);

  return useQuery({
    queryKey: cleNotifications(userId),
    queryFn: () => listerNotifications(userId!),
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}
