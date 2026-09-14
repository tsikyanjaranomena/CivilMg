import { supabase } from '@/lib/supabase';
import type { StatutDocumentDb } from '@/types/database.types';

export interface PieceJointeATeleverser {
  uri: string;
  nomFichier: string;
  mimeType: string;
  typePieceId?: string;
}

/**
 * Envoie un fichier local vers le bucket "pieces-jointes" puis enregistre la
 * ligne documents correspondante. `fetch(uri).blob()` fonctionne aussi bien
 * pour une URI locale (file://) que pour une donnée déjà en mémoire — c'est
 * l'approche standard pour Storage depuis Expo/React Native.
 */
export async function televerserPieceJointe(demandeId: string, piece: PieceJointeATeleverser): Promise<void> {
  const reponse = await fetch(piece.uri);
  const blob = await reponse.blob();
  const cheminFichier = `${demandeId}/${Date.now()}-${piece.nomFichier}`;

  const { error: erreurUpload } = await supabase.storage
    .from('pieces-jointes')
    .upload(cheminFichier, blob, { contentType: piece.mimeType });
  if (erreurUpload) throw erreurUpload;

  const { error: erreurInsert } = await supabase.from('documents').insert({
    demande_id: demandeId,
    type_piece_id: piece.typePieceId,
    fichier_path: cheminFichier,
  });
  if (erreurInsert) throw erreurInsert;
}

export async function verifierDocument(
  documentId: string,
  statutVerification: StatutDocumentDb,
  motifRefus?: string,
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ statut_verification: statutVerification, motif_refus: motifRefus ?? null })
    .eq('id', documentId);
  if (error) throw error;
}

export async function obtenirUrlSigneeDocument(cheminFichier: string): Promise<string> {
  const { data, error } = await supabase.storage.from('pieces-jointes').createSignedUrl(cheminFichier, 300);
  if (error) throw error;
  return data.signedUrl;
}
