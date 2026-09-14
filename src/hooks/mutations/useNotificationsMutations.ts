import { useMutation, useQueryClient } from '@tanstack/react-query';

import { marquerNotificationLue, marquerToutesNotificationsLues } from '@/api/notifications.api';
import { executerAvecRepli } from '@/lib/fileEnvoi';
import { useSessionStore } from '@/stores/sessionStore';

export function useMarquerNotificationLue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => executerAvecRepli('marquer_notification_lue', { id }, (p) => marquerNotificationLue(p.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarquerToutesLues() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: () => marquerToutesNotificationsLues(userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
