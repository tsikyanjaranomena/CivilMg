import { useMutation, useQueryClient } from '@tanstack/react-query';

import { mettreAJourAdresse } from '@/api/adresses.api';
import type { AdresseFormValues } from '@/domain/validation/adresseSchema';

export function useModifierAdresse(demandeId: string, adresseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (valeurs: AdresseFormValues) => mettreAJourAdresse(adresseId, valeurs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', demandeId] });
      queryClient.invalidateQueries({ queryKey: ['adresses-profil'] });
    },
  });
}
