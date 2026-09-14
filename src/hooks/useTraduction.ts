import { useCallback } from 'react';

import { traduire } from '@/lib/i18n';
import { useLangueStore } from '@/stores/langueStore';

export function useTraduction() {
  const langue = useLangueStore((s) => s.langue);
  const t = useCallback(
    (cle: string, params?: Record<string, string | number>) => traduire(langue, cle, params),
    [langue],
  );
  return { t, langue };
}
