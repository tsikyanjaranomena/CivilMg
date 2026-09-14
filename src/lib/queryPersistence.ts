import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'civilmg-cache-requetes',
  throttleTime: 1_000,
});

// Seules les requêtes (données déjà chargées, consultables hors ligne) sont
// persistées — pas les mutations, qui passent par notre propre file d'envoi
// (src/lib/fileEnvoi.ts) pour éviter deux mécanismes de rejeu concurrents.
export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister: asyncStoragePersister,
  maxAge: 24 * 60 * 60 * 1000,
  dehydrateOptions: {
    shouldDehydrateMutation: () => false,
  },
};
