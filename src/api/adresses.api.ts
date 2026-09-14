import type { AdresseFormValues } from '@/domain/validation/adresseSchema';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type Adresse = Database['public']['Tables']['adresses']['Row'];

export async function listerAdressesProfil(profileId: string): Promise<Adresse[]> {
  const { data, error } = await supabase
    .from('adresses')
    .select('*')
    .eq('profile_id', profileId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Corrige une adresse existante. Bloqué côté base (trigger) si la visite de
 * vérification associée a déjà été effectuée.
 */
export async function mettreAJourAdresse(adresseId: string, valeurs: AdresseFormValues): Promise<Adresse> {
  const { data, error } = await supabase
    .from('adresses')
    .update({
      region: valeurs.region,
      district: valeurs.district,
      commune_id: valeurs.communeId,
      fokontany: valeurs.fokontany,
      quartier: valeurs.quartier || null,
      lot_numero: valeurs.lotNumero || null,
      points_de_repere: valeurs.pointsDeRepere,
      telephone_sur_place: valeurs.telephoneSurPlace,
      creneaux_disponibilite: valeurs.creneauxDisponibilite || null,
      latitude: valeurs.latitude ?? null,
      longitude: valeurs.longitude ?? null,
    })
    .eq('id', adresseId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function creerAdresse(profileId: string, valeurs: AdresseFormValues): Promise<Adresse> {
  const { data, error } = await supabase
    .from('adresses')
    .insert({
      profile_id: profileId,
      region: valeurs.region,
      district: valeurs.district,
      commune_id: valeurs.communeId,
      fokontany: valeurs.fokontany,
      quartier: valeurs.quartier || null,
      lot_numero: valeurs.lotNumero || null,
      points_de_repere: valeurs.pointsDeRepere,
      telephone_sur_place: valeurs.telephoneSurPlace,
      creneaux_disponibilite: valeurs.creneauxDisponibilite || null,
      latitude: valeurs.latitude ?? null,
      longitude: valeurs.longitude ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
