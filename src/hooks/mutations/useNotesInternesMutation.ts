import { useMutation, useQueryClient } from '@tanstack/react-query';

import { enregistrerNotesInternes } from '@/api/notesInternes.api';
import { useSessionStore } from '@/stores/sessionStore';

export function useEnregistrerNotesInternes(demandeId: string) {
  const queryClient = useQueryClient();
  const responsableId = useSessionStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: (notes: string) => enregistrerNotesInternes(demandeId, notes, responsableId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes-internes', demandeId] }),
  });
}
