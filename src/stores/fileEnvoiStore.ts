import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ActionEnFile {
  id: string;
  type: string;
  payload: unknown;
  creeLe: string;
}

interface FileEnvoiState {
  actions: ActionEnFile[];
  ajouter: (type: string, payload: unknown) => void;
  retirer: (id: string) => void;
}

function genererId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * File d'actions en attente d'envoi (persistée) : chaque action à rejouer
 * dès le retour du réseau, dans l'ordre de création (FIFO). Voir
 * src/lib/fileEnvoi.ts pour l'enregistrement des gestionnaires et le
 * déclenchement automatique au retour de connexion.
 */
export const useFileEnvoiStore = create<FileEnvoiState>()(
  persist(
    (set) => ({
      actions: [],
      ajouter: (type, payload) =>
        set((etat) => ({ actions: [...etat.actions, { id: genererId(), type, payload, creeLe: new Date().toISOString() }] })),
      retirer: (id) => set((etat) => ({ actions: etat.actions.filter((a) => a.id !== id) })),
    }),
    {
      name: 'civilmg-file-envoi',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
