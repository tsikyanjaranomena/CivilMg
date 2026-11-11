import type { AdresseFormValues } from '@/domain/validation/adresseSchema';
import { supabase } from '@/lib/supabase';
import type { Database, StatutDemandeDb, TypeActeDb } from '@/types/database.types';

import { creerAdresse } from './adresses.api';
import { televerserPieceJointe, type PieceJointeATeleverser } from './documents.api';

export type Demande = Database['public']['Tables']['demandes']['Row'];
export type PersonneConcernee = Database['public']['Tables']['personnes_concernees']['Row'];
export type DocumentDemande = Database['public']['Tables']['documents']['Row'];
export type VisiteDemande = Database['public']['Tables']['visites']['Row'];
export type Adresse = Database['public']['Tables']['adresses']['Row'];

export type DemandeResume = Pick<
  Demande,
  'id' | 'reference' | 'type_acte' | 'statut' | 'statut_paiement' | 'updated_at' | 'date_echeance_estimee'
>;

export interface PersonneConcerneeInput {
  nom: string;
  prenoms?: string;
  dateEvenement: string;
  lieuEvenement: string;
  nomPere?: string;
  nomMere?: string;
  numeroActe?: string;
  anneeActe?: number;
  communeEnregistrementId?: string;
  pourSoiMeme: boolean;
}

export type AdresseDemandeInput =
  | { type: 'existante'; idExistant: string; communeId: string }
  | { type: 'nouvelle'; valeurs: AdresseFormValues };

export interface NouvelleDemandeInput {
  demandeurId: string;
  typeActe: TypeActeDb;
  nombreCopies: number;
  motif?: string;
  personne: PersonneConcerneeInput;
  adresse: AdresseDemandeInput;
  documents: PieceJointeATeleverser[];
}

export interface ResultatSoumission {
  demandeId: string;
  reference: string;
}

/**
 * Crée le dossier complet (adresse si nouvelle, demande, personne concernée,
 * pièces jointes) puis le soumet via changer_statut_demande(). Si un échec
 * survient en cours de route, la demande déjà créée reste en BROUILLON côté
 * base — relancer la soumission créera un nouveau dossier plutôt que de
 * reprendre celui-ci (limite connue, traitée avec la file d'envoi hors ligne
 * en Phase 6).
 */
export async function creerEtSoumettreDemande(input: NouvelleDemandeInput): Promise<ResultatSoumission> {
  const adresseInput = input.adresse;
  let adresseId: string;
  let communeId: string;
  if (adresseInput.type === 'existante') {
    adresseId = adresseInput.idExistant;
    communeId = adresseInput.communeId;
  } else {
    const adresse = await creerAdresse(input.demandeurId, adresseInput.valeurs);
    adresseId = adresse.id;
    communeId = adresseInput.valeurs.communeId;
  }

  const { data: demande, error: erreurDemande } = await supabase
    .from('demandes')
    .insert({
      type_acte: input.typeActe,
      demandeur_id: input.demandeurId,
      commune_id: communeId,
      adresse_id: adresseId,
      nombre_copies: input.nombreCopies,
      motif: input.motif,
      pour_soi_meme: input.personne.pourSoiMeme,
    })
    .select('id, reference')
    .single();
  if (erreurDemande) throw erreurDemande;

  const { error: erreurPersonne } = await supabase.from('personnes_concernees').insert({
    demande_id: demande.id,
    nom: input.personne.nom,
    prenoms: input.personne.prenoms,
    date_evenement: input.personne.dateEvenement,
    lieu_evenement: input.personne.lieuEvenement,
    nom_pere: input.personne.nomPere,
    nom_mere: input.personne.nomMere,
    numero_acte: input.personne.numeroActe,
    annee_acte: input.personne.anneeActe,
    commune_enregistrement_id: input.personne.communeEnregistrementId,
  });
  if (erreurPersonne) throw erreurPersonne;

  for (const document of input.documents) {
    await televerserPieceJointe(demande.id, document);
  }

  const { error: erreurTransition } = await supabase.rpc('changer_statut_demande', {
    p_demande_id: demande.id,
    p_nouveau_statut: 'SOUMIS',
  });
  if (erreurTransition) throw erreurTransition;

  return { demandeId: demande.id, reference: demande.reference };
}

export async function listerMesDemandes(demandeurId: string): Promise<DemandeResume[]> {
  const { data, error } = await supabase
    .from('demandes')
    .select('id, reference, type_acte, statut, statut_paiement, updated_at, date_echeance_estimee')
    .eq('demandeur_id', demandeurId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export interface DossierComplet {
  demande: Demande;
  personne: PersonneConcernee | null;
  adresse: Adresse | null;
  visite: VisiteDemande | null;
  documents: DocumentDemande[];
}

/**
 * Récupère un dossier complet via des requêtes séparées plutôt qu'un embed
 * Postgrest : plus simple à garder correctement typé tant que
 * database.types.ts est écrit à la main (sans les Relationships générées).
 */
export async function recupererDossierComplet(demandeId: string): Promise<DossierComplet> {
  const [demandeRes, personneRes, documentsRes, visiteRes] = await Promise.all([
    supabase.from('demandes').select('*').eq('id', demandeId).single(),
    supabase.from('personnes_concernees').select('*').eq('demande_id', demandeId).maybeSingle(),
    supabase.from('documents').select('*').eq('demande_id', demandeId).order('created_at'),
    supabase
      .from('visites')
      .select('*')
      .eq('demande_id', demandeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (demandeRes.error) throw demandeRes.error;
  if (personneRes.error) throw personneRes.error;
  if (documentsRes.error) throw documentsRes.error;
  if (visiteRes.error) throw visiteRes.error;

  let adresse: Adresse | null = null;
  if (demandeRes.data.adresse_id) {
    const { data, error } = await supabase
      .from('adresses')
      .select('*')
      .eq('id', demandeRes.data.adresse_id)
      .maybeSingle();
    if (error) throw error;
    adresse = data;
  }

  return {
    demande: demandeRes.data,
    personne: personneRes.data,
    adresse,
    visite: visiteRes.data,
    documents: documentsRes.data,
  };
}

export async function changerStatutDemande(
  demandeId: string,
  nouveauStatut: StatutDemandeDb,
  commentaireClient?: string,
): Promise<void> {
  const { error } = await supabase.rpc('changer_statut_demande', {
    p_demande_id: demandeId,
    p_nouveau_statut: nouveauStatut,
    p_commentaire_client: commentaireClient,
  });
  if (error) throw error;
}

