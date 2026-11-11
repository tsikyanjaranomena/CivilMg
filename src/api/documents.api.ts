import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { StatutDocumentDb } from '@/types/database.types';

export interface PieceJointeATeleverser {
  uri: string;
  nomFichier: string;
  mimeType: string;
  typePieceId?: string;
}

/**
 * Sur mobile, un Blob obtenu par fetch(uri) part vide vers Supabase Storage
 * (seul l'en-tête multipart est transmis) : on lit donc directement les
 * octets du fichier local. Sur web, l'URI est un blob:/data: que fetch gère.
 */
async function lireContenuFichier(uri: string): Promise<Blob | ArrayBuffer> {
  if (Platform.OS === 'web') {
    const reponse = await fetch(uri);
    return reponse.blob();
  }
  return new File(uri).arrayBuffer();
}

/** Envoie un fichier local vers le bucket "pieces-jointes" puis enregistre la ligne documents correspondante. */
export async function televerserPieceJointe(demandeId: string, piece: PieceJointeATeleverser): Promise<void> {
  const contenu = await lireContenuFichier(piece.uri);
  const cheminFichier = `${demandeId}/${Date.now()}-${piece.nomFichier}`;

  const { error: erreurUpload } = await supabase.storage
    .from('pieces-jointes')
    .upload(cheminFichier, contenu, { contentType: piece.mimeType });
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
