import { supabase } from '@/lib/supabase';
import type { Profil } from '@/api/profiles.api';

export async function listerEquipe(): Promise<Profil[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'responsable').order('nom');
  if (error) throw error;
  return data;
}

export async function creerCompteResponsable(email: string, password: string, nom: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ erreur?: string }>('creer-compte-responsable', {
    body: { email, password, nom },
  });
  if (error) throw error;
  if (data?.erreur) throw new Error(data.erreur);
}

export async function changerStatutCompte(profileId: string, suspendu: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ statut_compte: suspendu ? 'suspendu' : 'actif' })
    .eq('id', profileId);
  if (error) throw error;
}
