import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AdresseFormValues } from '@/domain/validation/adresseSchema';
import type { Etape1Values, PersonneValues } from '@/domain/validation/demandeSchema';

export interface DocumentBrouillon {
  id: string;
  typePieceId?: string;
  typePieceCode?: string;
  typePieceLibelle: string;
  uri: string;
  nomFichier: string;
  mimeType: string;
}

function genererIdLocal(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface AdresseBrouillon extends AdresseFormValues {
  /** Renseigné quand le client réutilise une adresse déjà enregistrée sur son profil. */
  idExistant?: string;
}

interface NouvelleDemandeState {
  etape1: Etape1Values | null;
  etape2: PersonneValues | null;
  etape3: AdresseBrouillon | null;
  etape4: DocumentBrouillon[];
  definirEtape1: (valeurs: Etape1Values) => void;
  definirEtape2: (valeurs: PersonneValues) => void;
  definirEtape3: (valeurs: AdresseBrouillon) => void;
  ajouterDocument: (document: Omit<DocumentBrouillon, 'id'>) => void;
  retirerDocument: (id: string) => void;
  reinitialiser: () => void;
}

/**
 * Brouillon de la demande en cours, persisté localement (AsyncStorage) pour
 * résister aux coupures réseau : rien n'est envoyé à Supabase avant la
 * confirmation finale (étape 5), donc les 4 premières étapes fonctionnent
 * entièrement hors ligne.
 */
export const useNouvelleDemandeStore = create<NouvelleDemandeState>()(
  persist(
    (set) => ({
      etape1: null,
      etape2: null,
      etape3: null,
      etape4: [],
      definirEtape1: (valeurs) => set({ etape1: valeurs }),
      definirEtape2: (valeurs) => set({ etape2: valeurs }),
      definirEtape3: (valeurs) => set({ etape3: valeurs }),
      ajouterDocument: (document) =>
        set((etat) => ({ etape4: [...etat.etape4, { ...document, id: genererIdLocal() }] })),
      retirerDocument: (id) => set((etat) => ({ etape4: etat.etape4.filter((d) => d.id !== id) })),
      reinitialiser: () => set({ etape1: null, etape2: null, etape3: null, etape4: [] }),
    }),
    {
      name: 'civilmg-brouillon-nouvelle-demande',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
