import { supabase } from '@/lib/supabase';

export type TypeRequeteClient = 'report_visite' | 'contact';

/**
 * Requête libre d'un client sur son dossier (ex : demande de report de
 * visite). Table dédiée plutôt que notifications : pas de destinataire
 * unique à choisir côté client, et traçable/traitable par n'importe quel
 * responsable (voir demandes_requetes_client en base).
 */
export interface RequeteClient {
  id: string;
  demande_id: string;
  type: string;
  message: string | null;
  traitee: boolean;
  created_at: string;
}

export async function listerRequetesNonTraitees(demandeId: string): Promise<RequeteClient[]> {
  const { data, error } = await supabase
    .from('demandes_requetes_client')
    .select('*')
    .eq('demande_id', demandeId)
    .eq('traitee', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function marquerRequeteTraitee(id: string): Promise<void> {
  const { error } = await supabase.from('demandes_requetes_client').update({ traitee: true }).eq('id', id);
  if (error) throw error;
}

export async function creerRequeteClient(
  demandeId: string,
  type: TypeRequeteClient,
  message?: string,
): Promise<void> {
  const { error } = await supabase.from('demandes_requetes_client').insert({
    demande_id: demandeId,
    type,
    message,
  });
  if (error) throw error;
}
