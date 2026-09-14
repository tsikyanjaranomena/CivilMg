import { useMutation, useQueryClient } from '@tanstack/react-query';

import { creerCommune } from '@/api/communes.api';
import { definirDelaiStandard, definirTarif } from '@/api/referentiels.api';
import type { TypeActeDb } from '@/types/database.types';

export function useCreerCommune() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { code: string; nom: string; district: string; region: string }) => creerCommune(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communes'] }),
  });
}

export function useDefinirTarif() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { typeActe: TypeActeDb; communeId: string | null; montant: number }) =>
      definirTarif(params.typeActe, params.communeId, params.montant),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tarifs'] }),
  });
}

export function useDefinirDelaiStandard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { typeActe: TypeActeDb; joursOuvrables: number }) =>
      definirDelaiStandard(params.typeActe, params.joursOuvrables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delais-standards'] }),
  });
}
