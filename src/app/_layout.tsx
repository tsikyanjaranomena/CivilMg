import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { BandeauHorsLigne } from '@/components/ui/BandeauHorsLigne';
import { useFileEnvoiAutomatique } from '@/hooks/useFileEnvoiAutomatique';
import { demarrerEcouteSession } from '@/lib/auth/sessionListener';
import { enregistrerGestionnairesFileEnvoi } from '@/lib/enregistrerGestionnairesFileEnvoi';
import { persistOptions } from '@/lib/queryPersistence';

enregistrerGestionnairesFileEnvoi();

// Une seule instance de QueryClient pour toute l'app — pas de re-création à
// chaque rendu du layout racine.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Connexions lentes/intermittentes attendues sur le terrain : on évite
      // de re-fetcher trop agressivement.
      staleTime: 30_000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  useEffect(() => demarrerEcouteSession(), []);
  useFileEnvoiAutomatique();

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <StatusBar style="auto" />
      <BandeauHorsLigne />
      <Stack screenOptions={{ headerShown: false }} />
    </PersistQueryClientProvider>
  );
}
