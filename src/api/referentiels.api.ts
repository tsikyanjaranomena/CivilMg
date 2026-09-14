import { supabase } from '@/lib/supabase';
import type { Database, TypeActeDb } from '@/types/database.types';

export type TypePiece = Database['public']['Tables']['types_pieces']['Row'];
export type TarifDb = Database['public']['Tables']['tarifs']['Row'];
export type DelaiStandard = Database['public']['Tables']['delais_standards']['Row'];

export async function listerTypesPieces(typeActe: TypeActeDb): Promise<TypePiece[]> {
  const { data, error } = await supabase
    .from('types_pieces')
    .select('*')
    .eq('type_acte', typeActe)
    .order('ordre');
  if (error) throw error;
  return data;
}

export async function listerTarifs(): Promise<TarifDb[]> {
  const { data, error } = await supabase.from('tarifs').select('*');
  if (error) throw error;
  return data;
}

export async function listerDelaisStandards(): Promise<DelaiStandard[]> {
  const { data, error } = await supabase.from('delais_standards').select('*');
  if (error) throw error;
  return data;
}

export async function recupererParametre(cle: string): Promise<string | null> {
  const { data, error } = await supabase.from('parametres').select('valeur').eq('cle', cle).maybeSingle();
  if (error) throw error;
  return typeof data?.valeur === 'string' ? data.valeur : null;
}

export async function definirTarif(typeActe: TypeActeDb, communeId: string | null, montant: number): Promise<void> {
  const { error } = await supabase
    .from('tarifs')
    .upsert({ type_acte: typeActe, commune_id: communeId, montant }, { onConflict: 'type_acte,commune_id' });
  if (error) throw error;
}

export async function definirDelaiStandard(typeActe: TypeActeDb, joursOuvrables: number): Promise<void> {
  const { error } = await supabase
    .from('delais_standards')
    .upsert({ type_acte: typeActe, jours_ouvrables: joursOuvrables }, { onConflict: 'type_acte' });
  if (error) throw error;
}
