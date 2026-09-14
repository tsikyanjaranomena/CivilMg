import { useMutation, useQueryClient } from '@tanstack/react-query';

import { televerserPieceJointe, type PieceJointeATeleverser } from '@/api/documents.api';

export function useAjouterDocument(demandeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (piece: PieceJointeATeleverser) => televerserPieceJointe(demandeId, piece),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dossier', demandeId] }),
  });
}
