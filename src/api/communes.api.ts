import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type Commune = Database['public']['Tables']['communes']['Row'];

export async function listerCommunes(): Promise<Commune[]> {
  const { data, error } = await supabase.from('communes').select('*').order('nom');
  if (error) throw error;
  return data;
}

export async function creerCommune(commune: {
  code: string;
  nom: string;
  district: string;
  region: string;
}): Promise<Commune> {
  const { data, error } = await supabase.from('communes').insert(commune).select('*').single();
  if (error) throw error;
  return data;
}
