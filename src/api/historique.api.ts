import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type LigneHistorique = Database['public']['Tables']['historique_statuts']['Row'];

export async function listerHistorique(demandeId: string): Promise<LigneHistorique[]> {
  const { data, error } = await supabase
    .from('historique_statuts')
    .select('*')
    .eq('demande_id', demandeId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}
