import { useQuery } from '@tanstack/react-query';

import { listerDelaisStandards, listerTarifs, listerTypesPieces } from '@/api/referentiels.api';
import type { TypeActeDb } from '@/types/database.types';

export function useTarifs() {
  return useQuery({ queryKey: ['tarifs'], queryFn: listerTarifs, staleTime: 5 * 60_000 });
}

export function useDelaisStandards() {
  return useQuery({ queryKey: ['delais-standards'], queryFn: listerDelaisStandards, staleTime: 5 * 60_000 });
}

export function useTypesPieces(typeActe: TypeActeDb | undefined) {
  return useQuery({
    queryKey: ['types-pieces', typeActe],
    queryFn: () => listerTypesPieces(typeActe!),
    enabled: !!typeActe,
    staleTime: 5 * 60_000,
  });
}
