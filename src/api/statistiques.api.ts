import { supabase } from '@/lib/supabase';
import type { StatutDemandeDb } from '@/types/database.types';

export interface IndicateursDashboard {
  parStatut: Partial<Record<StatutDemandeDb, number>>;
  enRetard: number;
  visitesAPlanifier: number;
  visitesDuJour: number;
  tauxVisitesEchoueesAbsence: number | null;
  delaiMoyenTraitementJours: number | null;
  volumeTraite30j: number;
  repartitionTypeActe: { naissance: number; deces: number };
}

const STATUTS_CLOS: StatutDemandeDb[] = ['LIVRE', 'REJETE', 'ANNULE'];

export async function recupererIndicateurs(): Promise<IndicateursDashboard> {
  const maintenant = new Date();
  const aujourdHui = maintenant.toISOString().slice(0, 10);
  const il30j = new Date(maintenant.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: statutsData, error: erreurStatuts },
    { count: enRetard, error: erreurRetard },
    { count: visitesAPlanifier, error: erreurAPlanifier },
    { count: visitesDuJour, error: erreurDuJour },
    { data: visitesRecentes, error: erreurVisitesRecentes },
    { data: demandesLivrees, error: erreurLivrees },
    { data: repartition, error: erreurRepartition },
  ] = await Promise.all([
    supabase.from('demandes').select('statut').is('deleted_at', null),
    supabase
      .from('demandes')
      .select('id', { count: 'exact', head: true })
      .lt('date_echeance_estimee', aujourdHui)
      .not('statut', 'in', `(${STATUTS_CLOS.join(',')})`),
    supabase.from('demandes').select('id', { count: 'exact', head: true }).eq('statut', 'SOUMIS'),
    supabase.from('visites').select('id', { count: 'exact', head: true }).eq('date_planifiee', aujourdHui),
    supabase
      .from('visites')
      .select('statut')
      .gte('updated_at', il30j)
      .in('statut', ['effectuee', 'client_absent', 'echec']),
    supabase.from('demandes').select('created_at, date_cloture').eq('statut', 'LIVRE').gte('date_cloture', il30j),
    supabase.from('demandes').select('type_acte').is('deleted_at', null),
  ]);

  const premiereErreur =
    erreurStatuts ||
    erreurRetard ||
    erreurAPlanifier ||
    erreurDuJour ||
    erreurVisitesRecentes ||
    erreurLivrees ||
    erreurRepartition;
  if (premiereErreur) throw premiereErreur;

  const parStatut: Partial<Record<StatutDemandeDb, number>> = {};
  for (const ligne of statutsData) {
    const statut = ligne.statut as StatutDemandeDb;
    parStatut[statut] = (parStatut[statut] ?? 0) + 1;
  }

  const totalVisitesRecentes = visitesRecentes.length;
  const visitesAbsence = visitesRecentes.filter((v) => v.statut === 'client_absent').length;

  const delais = demandesLivrees
    .filter((d) => d.date_cloture)
    .map((d) => (new Date(d.date_cloture as string).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const delaiMoyen = delais.length > 0 ? delais.reduce((a, b) => a + b, 0) / delais.length : null;

  return {
    parStatut,
    enRetard: enRetard ?? 0,
    visitesAPlanifier: visitesAPlanifier ?? 0,
    visitesDuJour: visitesDuJour ?? 0,
    tauxVisitesEchoueesAbsence: totalVisitesRecentes > 0 ? visitesAbsence / totalVisitesRecentes : null,
    delaiMoyenTraitementJours: delaiMoyen,
    volumeTraite30j: demandesLivrees.length,
    repartitionTypeActe: {
      naissance: repartition.filter((d) => d.type_acte === 'naissance').length,
      deces: repartition.filter((d) => d.type_acte === 'deces').length,
    },
  };
}
