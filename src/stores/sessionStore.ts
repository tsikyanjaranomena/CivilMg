import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

interface SessionState {
  session: Session | null;
  /** true jusqu'à ce que la session initiale ait été lue depuis le storage local. */
  chargementInitial: boolean;
  setSession: (session: Session | null) => void;
  terminerChargementInitial: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  chargementInitial: true,
  setSession: (session) => set({ session }),
  terminerChargementInitial: () => set({ chargementInitial: false }),
}));
