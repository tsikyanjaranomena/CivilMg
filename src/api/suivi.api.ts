import { supabase } from '@/lib/supabase';

export async function consulterStatutPublic(reference: string, derniersChiffresTelephone: string) {
  const { data, error } = await supabase.rpc('consulter_statut_public', {
    p_reference: reference,
    p_derniers_chiffres_telephone: derniersChiffresTelephone,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}
