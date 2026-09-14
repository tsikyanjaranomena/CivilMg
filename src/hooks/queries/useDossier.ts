import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { recupererDossierComplet } from '@/api/demandes.api';
import { sabonnerTable } from '@/lib/realtime';

const POLLING_REPLI_MS = 15_000;

function cleDossier(demandeId: string) {
  return ['dossier', demandeId] as const;
}

export function useDossier(demandeId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!demandeId) return;
    const nettoyages = [
      sabonnerTable(`dossier-${demandeId}-demande`, 'demandes', `id=eq.${demandeId}`, () => {
        queryClient.invalidateQueries({ queryKey: cleDossier(demandeId) });
      }),
      sabonnerTable(`dossier-${demandeId}-visite`, 'visites', `demande_id=eq.${demandeId}`, () => {
        queryClient.invalidateQueries({ queryKey: cleDossier(demandeId) });
      }),
      sabonnerTable(`dossier-${demandeId}-historique`, 'historique_statuts', `demande_id=eq.${demandeId}`, () => {
        queryClient.invalidateQueries({ queryKey: ['historique', demandeId] });
      }),
      sabonnerTable(`dossier-${demandeId}-documents`, 'documents', `demande_id=eq.${demandeId}`, () => {
        queryClient.invalidateQueries({ queryKey: cleDossier(demandeId) });
      }),
    ];
    return () => nettoyages.forEach((nettoyer) => nettoyer());
  }, [demandeId, queryClient]);

  return useQuery({
    queryKey: cleDossier(demandeId ?? ''),
    queryFn: () => recupererDossierComplet(demandeId!),
    enabled: !!demandeId,
    refetchInterval: POLLING_REPLI_MS,
  });
}
