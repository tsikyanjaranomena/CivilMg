import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type Profil = Database['public']['Tables']['profiles']['Row'];

export async function recupererProfil(userId: string): Promise<Profil | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
