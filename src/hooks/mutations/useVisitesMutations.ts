import { useMutation, useQueryClient } from '@tanstack/react-query';

import { creerVisite, enregistrerCompteRenduVisite, replanifierVisite } from '@/api/visites.api';
import type { CompteRenduVisiteValues } from '@/domain/validation/visiteSchema';
import { useSessionStore } from '@/stores/sessionStore';

function invaliderVisites(queryClient: ReturnType<typeof useQueryClient>, demandeId: string) {
  queryClient.invalidateQueries({ queryKey: ['dossier', demandeId] });
  queryClient.invalidateQueries({ queryKey: ['demandes-a-planifier'] });
  queryClient.invalidateQueries({ queryKey: ['visites-planifiees'] });
  queryClient.invalidateQueries({ queryKey: ['file-attente'] });
}

export function useCreerVisite(demandeId: string) {
  const queryClient = useQueryClient();
  const responsableId = useSessionStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: (params: { datePlanifiee: string; creneau: string }) =>
      creerVisite(demandeId, responsableId!, params.datePlanifiee, params.creneau),
    onSuccess: () => invaliderVisites(queryClient, demandeId),
  });
}

export function useReplanifierVisite(demandeId: string, visiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { datePlanifiee: string; creneau: string }) =>
      replanifierVisite(visiteId, params.datePlanifiee, params.creneau),
    onSuccess: () => invaliderVisites(queryClient, demandeId),
  });
}

export function useEnregistrerCompteRendu(demandeId: string, visiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (valeurs: CompteRenduVisiteValues) => enregistrerCompteRenduVisite(visiteId, valeurs),
    onSuccess: () => {
      invaliderVisites(queryClient, demandeId);
      queryClient.invalidateQueries({ queryKey: ['compte-rendu-visite', visiteId] });
    },
  });
}
