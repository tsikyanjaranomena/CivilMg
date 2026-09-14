import { supabase } from '@/lib/supabase';

export async function recupererNotesInternes(demandeId: string): Promise<string> {
  const { data, error } = await supabase
    .from('demandes_notes_internes')
    .select('notes')
    .eq('demande_id', demandeId)
    .maybeSingle();
  if (error) throw error;
  return data?.notes ?? '';
}

export async function enregistrerNotesInternes(demandeId: string, notes: string, responsableId: string): Promise<void> {
  const { error } = await supabase
    .from('demandes_notes_internes')
    .upsert({ demande_id: demandeId, notes, updated_by: responsableId }, { onConflict: 'demande_id' });
  if (error) throw error;
}
