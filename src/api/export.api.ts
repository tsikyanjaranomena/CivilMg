import { supabase } from '@/lib/supabase';

export interface LigneExport {
  reference: string;
  type_acte: string;
  statut: string;
  commune: string;
  demandeur: string;
  created_at: string;
  date_cloture: string | null;
  montant: number | null;
  statut_paiement: string;
}

export async function exporterDemandes(dateDebut: string, dateFin: string): Promise<LigneExport[]> {
  const { data: demandes, error } = await supabase
    .from('demandes')
    .select('reference, type_acte, statut, commune_id, demandeur_id, created_at, date_cloture, montant, statut_paiement')
    .gte('created_at', dateDebut)
    .lte('created_at', dateFin)
    .is('deleted_at', null)
    .order('created_at');
  if (error) throw error;
  if (demandes.length === 0) return [];

  const [{ data: communes, error: erreurCommunes }, { data: profils, error: erreurProfils }] = await Promise.all([
    supabase.from('communes').select('id, nom'),
    supabase
      .from('profiles')
      .select('id, nom')
      .in(
        'id',
        demandes.map((d) => d.demandeur_id),
      ),
  ]);
  if (erreurCommunes) throw erreurCommunes;
  if (erreurProfils) throw erreurProfils;

  const communeParId = new Map(communes.map((c) => [c.id, c.nom]));
  const profilParId = new Map(profils.map((p) => [p.id, p.nom]));

  return demandes.map((d) => ({
    reference: d.reference,
    type_acte: d.type_acte,
    statut: d.statut,
    commune: communeParId.get(d.commune_id) ?? '',
    demandeur: profilParId.get(d.demandeur_id) ?? '',
    created_at: d.created_at,
    date_cloture: d.date_cloture,
    montant: d.montant,
    statut_paiement: d.statut_paiement,
  }));
}
