import { supabase } from '@/lib/supabase';

interface InscriptionParams {
  email: string;
  password: string;
  nom: string;
  telephone?: string;
}

export async function inscrireAvecEmail(params: InscriptionParams) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { nom: params.nom, telephone: params.telephone || undefined },
    },
  });
  if (error) throw error;
  return data;
}

export async function connecterAvecEmail(params: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(params);
  if (error) throw error;
  return data;
}

export async function deconnecter() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function demanderReinitialisationMotDePasse(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}
