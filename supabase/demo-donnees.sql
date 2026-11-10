-- Données de DÉMONSTRATION (jamais en production) : plusieurs dossiers à des
-- étapes différentes pour que les tableaux de bord soient parlants.
-- Prérequis : comptes client.test@example.mg et responsable@service.mg.
-- Usage : docker exec -i supabase_db_CivilMg psql -U postgres -d postgres < supabase/demo-donnees.sql

create or replace function pg_temp.creer_dossier_demo(
  p_type type_acte,
  p_nom text,
  p_prenoms text,
  p_date_evenement date,
  p_lieu text,
  p_statuts statut_demande[],
  p_jours_depuis int,
  p_copies int,
  p_motif_pieces text default null
) returns void
language plpgsql
as $$
declare
  v_client uuid := (select id from public.profiles where email = 'client.test@example.mg');
  v_resp uuid := (select id from public.profiles where email = 'responsable@service.mg');
  v_adresse uuid := (select id from public.adresses where profile_id = v_client order by created_at limit 1);
  v_commune uuid := (select commune_id from public.adresses where id = v_adresse);
  v_demande uuid;
  v_visite uuid;
  v_precedent statut_demande := 'BROUILLON';
  v_statut statut_demande;
  v_instant timestamptz := now() - make_interval(days => p_jours_depuis);
  v_commentaire text;
begin
  insert into public.demandes (type_acte, demandeur_id, commune_id, adresse_id, nombre_copies, pour_soi_meme, created_at)
  values (p_type, v_client, v_commune, v_adresse, p_copies, false, v_instant)
  returning id into v_demande;

  insert into public.personnes_concernees (demande_id, nom, prenoms, date_evenement, lieu_evenement)
  values (v_demande, p_nom, p_prenoms, p_date_evenement, p_lieu);

  perform set_config('app.changement_statut_autorise', 'true', true);

  foreach v_statut in array p_statuts loop
    v_instant := v_instant + interval '1 day 2 hours';
    v_commentaire := case when v_statut = 'PIECES_A_COMPLETER' then p_motif_pieces end;

    if v_statut = 'VISITE_PLANIFIEE' then
      insert into public.visites (demande_id, responsable_id, date_planifiee, creneau, statut)
      values (v_demande, v_resp, greatest(v_instant::date, current_date), 'Matin (8h - 12h)', 'planifiee')
      returning id into v_visite;
    elsif v_statut = 'EN_TRAITEMENT' then
      update public.visites set statut = 'effectuee' where id = v_visite;
      insert into public.visite_comptes_rendus (visite_id, compte_rendu, verification_concluante, procuration_recuperee, date_recuperation_procuration)
      values (v_visite, 'Informations conformes aux pièces originales. Procuration signée récupérée.', true, true, v_instant);
    end if;

    update public.demandes
      set statut = v_statut,
          pris_en_charge_par = case when v_statut <> 'SOUMIS' then v_resp else pris_en_charge_par end,
          date_cloture = case when v_statut in ('LIVRE', 'REJETE', 'ANNULE') then v_instant end
      where id = v_demande;

    insert into public.historique_statuts (demande_id, statut_precedent, statut_nouveau, auteur_id, commentaire_client, created_at)
    values (v_demande, v_precedent, v_statut, case when v_statut = 'SOUMIS' then v_client else v_resp end, v_commentaire, v_instant);

    insert into public.notifications (destinataire_id, demande_id, titre, contenu, created_at, lu)
    values (v_client, v_demande, 'Mise à jour de votre dossier',
            'Le statut de votre dossier est maintenant : ' || v_statut, v_instant, v_statut <> p_statuts[array_length(p_statuts, 1)]);

    v_precedent := v_statut;
  end loop;

  -- Échéance recalée sur la date réelle de création du dossier.
  update public.demandes d
    set date_echeance_estimee = public.ajouter_jours_ouvrables(d.created_at::date, s.jours_ouvrables)
    from public.delais_standards s
    where d.id = v_demande and s.type_acte = d.type_acte;
end;
$$;

select pg_temp.creer_dossier_demo('naissance', 'Rakotomalala', 'Hery Nirina', '1994-03-12', 'Antananarivo',
  array['SOUMIS']::statut_demande[], 1, 1);

select pg_temp.creer_dossier_demo('naissance', 'Rasoanirina', 'Fara', '2001-07-25', 'Antsirabe',
  array['SOUMIS', 'VISITE_PLANIFIEE']::statut_demande[], 2, 2);

select pg_temp.creer_dossier_demo('deces', 'Randriamanana', 'Jean Claude', '2026-10-02', 'Antananarivo',
  array['SOUMIS', 'PIECES_A_COMPLETER']::statut_demande[], 3, 1,
  'La copie de la CIN du demandeur est illisible. Merci de la reprendre en photo, bien éclairée.');

select pg_temp.creer_dossier_demo('naissance', 'Andrianaivo', 'Mialy', '1988-11-30', 'Toamasina',
  array['SOUMIS', 'VISITE_PLANIFIEE', 'EN_TRAITEMENT', 'EN_VALIDATION']::statut_demande[], 7, 3);

select pg_temp.creer_dossier_demo('deces', 'Rabe', 'Paul', '2026-09-14', 'Ambohidratrimo',
  array['SOUMIS', 'VISITE_PLANIFIEE', 'EN_TRAITEMENT', 'EN_VALIDATION', 'PRET']::statut_demande[], 9, 2);

select pg_temp.creer_dossier_demo('naissance', 'Razafindrakoto', 'Lova', '1999-01-05', 'Antananarivo',
  array['SOUMIS', 'VISITE_PLANIFIEE', 'EN_TRAITEMENT', 'EN_VALIDATION', 'PRET', 'LIVRE']::statut_demande[], 16, 1);

-- Un dossier en retard pour l'indicateur « Dossiers en retard ».
update public.demandes d
  set date_echeance_estimee = current_date - 2
  from public.personnes_concernees p
  where p.demande_id = d.id and p.nom = 'Andrianaivo';
