import { supabase } from '@/lib/supabase';
import type { StatutDemandeDb, TypeActeDb } from '@/types/database.types';

export interface FiltresFileAttente {
  statuts?: StatutDemandeDb[];
  typeActe?: TypeActeDb;
  communeId?: string;
  prisEnCharge?: 'tous' | 'non_pris' | 'moi';
  responsableId?: string;
}

export interface LigneFileAttente {
  id: string;
  reference: string;
  type_acte: TypeActeDb;
  statut: StatutDemandeDb;
  commune_id: string;
  pris_en_charge_par: string | null;
  statut_paiement: string;
  created_at: string;
  updated_at: string;
  nomPersonne: string;
}

const STATUTS_CLOS: StatutDemandeDb[] = ['LIVRE', 'REJETE', 'ANNULE'];

/**
 * Liste bornée (200) des dossiers actifs, filtrable côté serveur, avec le
 * nom de la personne concernée fusionné côté client (recherche par
 * référence ou par nom faite localement sur ce jeu de résultats — volume
 * attendu d'un service d'état civil, pas besoin de recherche plein texte
 * côté base pour le MVP).
 */
export async function listerFileAttente(filtres: FiltresFileAttente): Promise<LigneFileAttente[]> {
  let requete = supabase
    .from('demandes')
    .select('id, reference, type_acte, statut, commune_id, pris_en_charge_par, statut_paiement, created_at, updated_at')
    .is('deleted_at', null);

  if (filtres.statuts && filtres.statuts.length > 0) {
    requete = requete.in('statut', filtres.statuts);
  } else {
    requete = requete.not('statut', 'in', `(${STATUTS_CLOS.join(',')})`);
  }
  if (filtres.typeActe) requete = requete.eq('type_acte', filtres.typeActe);
  if (filtres.communeId) requete = requete.eq('commune_id', filtres.communeId);
  if (filtres.prisEnCharge === 'non_pris') requete = requete.is('pris_en_charge_par', null);
  if (filtres.prisEnCharge === 'moi' && filtres.responsableId) {
    requete = requete.eq('pris_en_charge_par', filtres.responsableId);
  }

  const { data: demandes, error } = await requete.order('created_at', { ascending: true }).limit(200);
  if (error) throw error;
  if (demandes.length === 0) return [];

  const { data: personnes, error: erreurPersonnes } = await supabase
    .from('personnes_concernees')
    .select('demande_id, nom, prenoms')
    .in(
      'demande_id',
      demandes.map((d) => d.id),
    );
  if (erreurPersonnes) throw erreurPersonnes;

  const nomParDemande = new Map(personnes.map((p) => [p.demande_id, `${p.nom} ${p.prenoms ?? ''}`.trim()]));

  return demandes.map((d) => ({ ...d, nomPersonne: nomParDemande.get(d.id) ?? '' }));
}
