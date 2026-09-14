import { useMutation } from '@tanstack/react-query';

import { creerRequeteClient, type TypeRequeteClient } from '@/api/requetesClient.api';
import { executerAvecRepli } from '@/lib/fileEnvoi';

export function useCreerRequeteClient(demandeId: string) {
  return useMutation({
    mutationFn: (params: { type: TypeRequeteClient; message?: string }) =>
      executerAvecRepli('creer_requete_client', { demandeId, ...params }, (p) =>
        creerRequeteClient(p.demandeId, p.type, p.message),
      ),
  });
}
