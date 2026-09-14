import { useMutation, useQueryClient } from '@tanstack/react-query';

import { creerEtSoumettreDemande, type NouvelleDemandeInput } from '@/api/demandes.api';

export function useCreerDemande() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NouvelleDemandeInput) => creerEtSoumettreDemande(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adresses-profil'] });
      queryClient.invalidateQueries({ queryKey: ['demandes'] });
    },
  });
}
