import { versFormatInternational, versFormatLocal } from '@/domain/validation/telephone';
import { supabase } from '@/lib/supabase';

interface InscriptionParams {
  telephone: string;
  password: string;
  nom: string;
}

/** Inscription par téléphone + mot de passe (aucune confirmation par SMS). */
export async function inscrireAvecTelephone(params: InscriptionParams) {
  const { data, error } = await supabase.auth.signUp({
    phone: versFormatInternational(params.telephone),
    password: params.password,
    options: {
      // Le profil stocke le numéro au format local, plus lisible.
      data: { nom: params.nom, telephone: versFormatLocal(params.telephone) },
    },
  });
  if (error) throw error;
  return data;
}

export async function connecterAvecTelephone(params: { telephone: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: versFormatInternational(params.telephone),
    password: params.password,
  });
  if (error) throw error;
  return data;
}

export async function deconnecter() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
