import { useMutation, useQueryClient } from '@tanstack/react-query';

import { changerStatutCompte, creerCompteResponsable } from '@/api/equipe.api';

export function useCreerCompteResponsable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { email: string; password: string; nom: string }) =>
      creerCompteResponsable(params.email, params.password, params.nom),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipe'] }),
  });
}

export function useChangerStatutCompte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { profileId: string; suspendu: boolean }) =>
      changerStatutCompte(params.profileId, params.suspendu),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipe'] }),
  });
}
