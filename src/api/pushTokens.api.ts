import { supabase } from '@/lib/supabase';

export async function enregistrerJetonPush(profileId: string, jeton: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ expo_push_token: jeton }).eq('id', profileId);
  if (error) throw error;
}
