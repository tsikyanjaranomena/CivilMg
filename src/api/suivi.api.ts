import { normaliserReference } from '@/domain/reference';
import { supabase } from '@/lib/supabase';

export async function consulterStatutPublic(reference: string, derniersChiffresTelephone: string) {
  const { data, error } = await supabase.rpc('consulter_statut_public', {
    // Accepte « act-2026-0012 » comme « ACT-2026-12 » (format stocké en base).
    p_reference: normaliserReference(reference),
    p_derniers_chiffres_telephone: derniersChiffresTelephone,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}
