import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribeNoop = () => () => {};

/**
 * Pour le rendu statique web, la valeur doit être recalculée côté client
 * après hydratation. useSyncExternalStore avec un getServerSnapshot distinct
 * évite l'effet + setState synchrone (rendus en cascade).
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
