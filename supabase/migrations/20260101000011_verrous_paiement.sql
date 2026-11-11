-- Ajoute à changer_statut_demande() les verrous du paiement en deux temps :
-- pas de passage en traitement sans l'acompte de 50 % (remis au notaire avec
-- la procuration lors de la visite), pas de remise sans le solde.
-- Pièces jointes facultatives : le notaire contrôle les originaux sur place.
update public.types_pieces set obligatoire = false;

create or replace function public.changer_statut_demande(
  p_demande_id uuid,
  p_nouveau_statut statut_demande,
  p_commentaire_client text default null,
  p_commentaire_interne text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_statut_actuel statut_demande;
  v_demandeur_id uuid;
  v_adresse_id uuid;
  v_role role_utilisateur;
  v_autorise boolean;
  v_motif_oblig boolean;
  v_historique_id uuid;
  v_visite_statut statut_visite;
  v_verification_concluante boolean;
  v_procuration_recuperee boolean;
  v_paiement statut_paiement;
begin
  v_role := public.role_utilisateur_courant();
  if v_role is null then
    raise exception 'Utilisateur non reconnu.';
  end if;

  select statut, demandeur_id, adresse_id, statut_paiement
    into v_statut_actuel, v_demandeur_id, v_adresse_id, v_paiement
    from public.demandes
    where id = p_demande_id
    for update;

  if not found then
    raise exception 'Dossier introuvable.';
  end if;

  if v_role = 'client' and v_demandeur_id <> auth.uid() then
    raise exception 'Accès refusé.';
  end if;

  select exists (
    select 1 from public.transitions_autorisees
    where statut_depart = v_statut_actuel
      and statut_arrivee = p_nouveau_statut
      and v_role = any(roles)
  ) into v_autorise;

  if not v_autorise then
    raise exception 'Transition % -> % non autorisée pour le rôle %.', v_statut_actuel, p_nouveau_statut, v_role;
  end if;

  select motif_client_obligatoire into v_motif_oblig
    from public.transitions_autorisees
    where statut_depart = v_statut_actuel and statut_arrivee = p_nouveau_statut;

  if v_motif_oblig and btrim(coalesce(p_commentaire_client, '')) = '' then
    raise exception 'Un motif est obligatoire pour cette transition.';
  end if;

  if p_nouveau_statut = 'VISITE_PLANIFIEE' and not public.adresse_complete(v_adresse_id) then
    raise exception 'Adresse incomplète : fokontany et points de repère sont obligatoires avant de planifier une visite.';
  end if;

  if p_nouveau_statut = 'EN_TRAITEMENT' then
    select v.statut, cr.verification_concluante, cr.procuration_recuperee
      into v_visite_statut, v_verification_concluante, v_procuration_recuperee
      from public.visites v
      join public.visite_comptes_rendus cr on cr.visite_id = v.id
      where v.demande_id = p_demande_id
      order by v.created_at desc
      limit 1;

    if v_visite_statut is distinct from 'effectuee'
      or v_verification_concluante is not true
      or v_procuration_recuperee is not true
    then
      raise exception 'Passage en traitement impossible : la visite doit être effectuée, concluante, et la procuration papier récupérée.';
    end if;

    if v_paiement = 'non_paye' then
      raise exception 'Passage en traitement impossible : l''acompte de 50 %% doit être encaissé lors de la visite.';
    end if;
  end if;

  if p_nouveau_statut = 'LIVRE' and v_paiement is distinct from 'paye' then
    raise exception 'Remise impossible : le solde doit être encaissé avant de remettre l''acte.';
  end if;

  perform set_config('app.changement_statut_autorise', 'true', true);

  update public.demandes
    set statut = p_nouveau_statut,
        date_cloture = case when p_nouveau_statut in ('LIVRE', 'REJETE', 'ANNULE') then now() else date_cloture end
    where id = p_demande_id;

  perform set_config('app.changement_statut_autorise', 'false', true);

  insert into public.historique_statuts (demande_id, statut_precedent, statut_nouveau, auteur_id, commentaire_client)
    values (p_demande_id, v_statut_actuel, p_nouveau_statut, auth.uid(), p_commentaire_client)
    returning id into v_historique_id;

  if btrim(coalesce(p_commentaire_interne, '')) <> '' then
    insert into public.historique_statuts_internes (historique_id, commentaire_interne)
      values (v_historique_id, p_commentaire_interne);
  end if;

  insert into public.notifications (destinataire_id, demande_id, titre, contenu, canal)
    values (
      v_demandeur_id,
      p_demande_id,
      'Mise à jour de votre dossier',
      'Le statut de votre dossier est maintenant : ' || p_nouveau_statut,
      'in_app'
    );
end;
$$;

grant execute on function public.changer_statut_demande(uuid, statut_demande, text, text) to authenticated;
