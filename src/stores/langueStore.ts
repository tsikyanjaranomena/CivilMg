import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Langue } from '@/lib/i18n';

export const LANGUES_DISPONIBLES: { valeur: Langue; libelle: string; disponible: boolean }[] = [
  { valeur: 'fr', libelle: 'Français', disponible: true },
  { valeur: 'mg', libelle: 'Malagasy', disponible: false },
];

interface LangueState {
  langue: Langue;
  definirLangue: (langue: Langue) => void;
}

export const useLangueStore = create<LangueState>()(
  persist(
    (set) => ({
      langue: 'fr',
      definirLangue: (langue) => set({ langue }),
    }),
    {
      name: 'civilmg-langue',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
