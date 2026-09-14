import { useQuery } from '@tanstack/react-query';

import { recupererNotesInternes } from '@/api/notesInternes.api';

export function useNotesInternes(demandeId: string | undefined) {
  return useQuery({
    queryKey: ['notes-internes', demandeId],
    queryFn: () => recupererNotesInternes(demandeId!),
    enabled: !!demandeId,
  });
}
