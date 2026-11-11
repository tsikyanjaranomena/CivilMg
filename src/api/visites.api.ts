import { supabase } from '@/lib/supabase';
import type { CompteRenduVisiteValues } from '@/domain/validation/visiteSchema';
import type { Database } from '@/types/database.types';

export type VisiteRow = Database['public']['Tables']['visites']['Row'];
export type VisiteCompteRenduRow = Database['public']['Tables']['visite_comptes_rendus']['Row'];

export interface InfosAdresseTournee {
  commune_id: string;
  fokontany: string;
  points_de_repere: string;
  telephone_sur_place: string;
  creneaux_disponibilite: string | null;
  latitude: number | null;
  longitude: number | null;
}

async function recupererAdressesParId(adresseIds: string[]): Promise<Map<string, InfosAdresseTournee>> {
  if (adresseIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('adresses')
    .select('id, commune_id, fokontany, points_de_repere, telephone_sur_place, creneaux_disponibilite, latitude, longitude')
    .in('id', adresseIds);
  if (error) throw error;
  return new Map(data.map(({ id, ...reste }) => [id, reste]));
}

export interface DemandeAPlanifier {
  id: string;
  reference: string;
  type_acte: string;
  commune_id: string;
  adresse_id: string | null;
  adresse: InfosAdresseTournee | null;
}

/** Dossiers où le notaire doit appeler le client pour fixer (ou refixer) la visite. */
export async function listerDemandesAPlanifier(): Promise<DemandeAPlanifier[]> {
  const { data, error } = await supabase
    .from('demandes')
    .select('id, reference, type_acte, commune_id, adresse_id')
    .in('statut', ['SOUMIS', 'VISITE_A_REPLANIFIER'])
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const adresses = await recupererAdressesParId(
    data.map((d) => d.adresse_id).filter((id): id is string => id !== null),
  );
  return data.map((d) => ({ ...d, adresse: d.adresse_id ? (adresses.get(d.adresse_id) ?? null) : null }));
}

export interface VisitePlanifieeAvecDemande extends VisiteRow {
  demande_reference: string;
  demande_statut: string;
  adresse: InfosAdresseTournee | null;
}

/** Visites planifiées (à venir ou du jour), pour organiser les tournées par commune/fokontany. */
export async function listerVisitesPlanifiees(): Promise<VisitePlanifieeAvecDemande[]> {
  const { data: visites, error } = await supabase
    .from('visites')
    .select('*')
    .in('statut', ['planifiee'])
    .order('date_planifiee', { ascending: true });
  if (error) throw error;
  if (visites.length === 0) return [];

  const { data: demandes, error: erreurDemandes } = await supabase
    .from('demandes')
    .select('id, reference, statut, adresse_id')
    .in(
      'id',
      visites.map((v) => v.demande_id),
    );
  if (erreurDemandes) throw erreurDemandes;

  const parDemande = new Map(demandes.map((d) => [d.id, d]));
  const adresses = await recupererAdressesParId(
    demandes.map((d) => d.adresse_id).filter((id): id is string => id !== null),
  );

  return visites
    .filter((v) => parDemande.get(v.demande_id)?.statut === 'VISITE_PLANIFIEE')
    .map((v) => {
      const demande = parDemande.get(v.demande_id);
      return {
        ...v,
        demande_reference: demande?.reference ?? '',
        demande_statut: demande?.statut ?? '',
        adresse: demande?.adresse_id ? (adresses.get(demande.adresse_id) ?? null) : null,
      };
    });
}

export async function creerVisite(
  demandeId: string,
  responsableId: string,
  datePlanifiee: string,
  creneau: string,
): Promise<VisiteRow> {
  const { data, error } = await supabase
    .from('visites')
    .insert({ demande_id: demandeId, responsable_id: responsableId, date_planifiee: datePlanifiee, creneau, statut: 'planifiee' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function replanifierVisite(
  visiteId: string,
  datePlanifiee: string,
  creneau: string,
): Promise<void> {
  const { error } = await supabase
    .from('visites')
    .update({ date_planifiee: datePlanifiee, creneau, statut: 'planifiee' })
    .eq('id', visiteId);
  if (error) throw error;
}

export async function recupererCompteRendu(visiteId: string): Promise<VisiteCompteRenduRow | null> {
  const { data, error } = await supabase
    .from('visite_comptes_rendus')
    .select('*')
    .eq('visite_id', visiteId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Enregistre le compte rendu d'une visite : met à jour visites.statut et
 * upsert la ligne visite_comptes_rendus (procuration récupérée, résultat de
 * la vérification, photo). C'est cette ligne que changer_statut_demande()
 * consulte pour autoriser (ou non) le passage en EN_TRAITEMENT.
 */
export async function enregistrerCompteRenduVisite(
  visiteId: string,
  valeurs: CompteRenduVisiteValues,
): Promise<void> {
  const { error: erreurVisite } = await supabase.from('visites').update({ statut: valeurs.statut }).eq('id', visiteId);
  if (erreurVisite) throw erreurVisite;

  const { error: erreurCompteRendu } = await supabase.from('visite_comptes_rendus').upsert(
    {
      visite_id: visiteId,
      compte_rendu: valeurs.compteRendu,
      verification_concluante: valeurs.verificationConcluante,
      procuration_recuperee: valeurs.procurationRecuperee,
      motif_echec: valeurs.motifEchec,
      date_recuperation_procuration: valeurs.procurationRecuperee ? new Date().toISOString() : null,
    },
    { onConflict: 'visite_id' },
  );
  if (erreurCompteRendu) throw erreurCompteRendu;
}
