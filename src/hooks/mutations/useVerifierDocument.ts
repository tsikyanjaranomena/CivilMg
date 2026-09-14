import { useMutation, useQueryClient } from '@tanstack/react-query';

import { verifierDocument } from '@/api/documents.api';
import type { StatutDocumentDb } from '@/types/database.types';

export function useVerifierDocument(demandeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { documentId: string; statut: StatutDocumentDb; motifRefus?: string }) =>
      verifierDocument(params.documentId, params.statut, params.motifRefus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dossier', demandeId] }),
  });
}
