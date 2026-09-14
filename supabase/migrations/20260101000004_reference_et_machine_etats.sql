-- =========================================================================
-- Génération du numéro de référence : ACT-{année}-{compteur global}
-- =========================================================================

create sequence public.demandes_compteur_seq;

create or replace function public.generer_reference_demande()
returns trigger
language plpgsql
as $$
begin
  if new.reference is null then
    new.reference := 'ACT-' || extract(year from now())::int || '-'
      || lpad(nextval('public.demandes_compteur_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger generer_reference before insert on public.demandes
  for each row execute function public.generer_reference_demande();

-- =========================================================================
-- Machine à états : table de transitions autorisées.
-- Miroir SQL de src/domain/statuts/statutMachine.ts (TRANSITIONS) — les deux
-- doivent rester synchronisés à chaque évolution du cycle de vie du dossier.
-- =========================================================================

create table public.transitions_autorisees (
  statut_depart statut_demande not null,
  statut_arrivee statut_demande not null,
  roles role_utilisateur[] not null,
  motif_client_obligatoire boolean not null default false,
  primary key (statut_depart, statut_arrivee)
);

insert into public.transitions_autorisees (statut_depart, statut_arrivee, roles, motif_client_obligatoire) values
  ('BROUILLON', 'SOUMIS', '{client}', false),
  ('BROUILLON', 'ANNULE', '{client,responsable}', false),
  ('SOUMIS', 'PIECES_A_COMPLETER', '{responsable}', true),
  ('SOUMIS', 'VISITE_PLANIFIEE', '{responsable}', false),
  ('SOUMIS', 'ANNULE', '{client,responsable}', false),
  ('PIECES_A_COMPLETER', 'SOUMIS', '{client}', false),
  ('PIECES_A_COMPLETER', 'ANNULE', '{client,responsable}', false),
  ('VISITE_PLANIFIEE', 'VISITE_A_REPLANIFIER', '{responsable}', false),
  ('VISITE_PLANIFIEE', 'REJETE', '{responsable}', true),
  ('VISITE_PLANIFIEE', 'EN_TRAITEMENT', '{responsable}', false),
  ('VISITE_PLANIFIEE', 'ANNULE', '{client,responsable}', false),
  ('VISITE_A_REPLANIFIER', 'VISITE_PLANIFIEE', '{responsable}', false),
  ('EN_TRAITEMENT', 'PIECES_A_COMPLETER', '{responsable}', true),
  ('EN_TRAITEMENT', 'EN_VALIDATION', '{responsable}', false),
  ('EN_VALIDATION', 'EN_TRAITEMENT', '{responsable}', false),
  ('EN_VALIDATION', 'REJETE', '{responsable}', true),
  ('EN_VALIDATION', 'PRET', '{responsable}', false),
  ('PRET', 'LIVRE', '{responsable}', false);

-- Une adresse ne peut servir à planifier une visite que si le fokontany et
-- les points de repère sont renseignés (donnée critique pour la tournée).
create or replace function public.adresse_complete(p_adresse_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.adresses
    where id = p_adresse_id
      and btrim(coalesce(fokontany, '')) <> ''
      and btrim(coalesce(points_de_repere, '')) <> ''
  )
$$;

-- =========================================================================
-- proteger_statut_demande : empêche toute modification du statut ou des
-- colonnes sensibles en dehors de la fonction changer_statut_demande().
-- =========================================================================

create or replace function public.proteger_statut_demande()
returns trigger
language plpgsql
as $$
begin
  if new.statut is distinct from old.statut then
    if coalesce(current_setting('app.changement_statut_autorise', true), 'false') <> 'true' then
      raise exception 'Le statut d''un dossier ne peut être modifié que via changer_statut_demande().';
    end if;
  end if;

  if public.est_client() then
    if new.montant is distinct from old.montant
      or new.statut_paiement is distinct from old.statut_paiement
      or new.pris_en_charge_par is distinct from old.pris_en_charge_par
      or new.demandeur_id is distinct from old.demandeur_id
      or new.reference is distinct from old.reference
      or new.date_echeance_estimee is distinct from old.date_echeance_estimee
      or new.commune_id is distinct from old.commune_id
    then
      raise exception 'Modification non autorisée pour ce rôle.';
    end if;
  end if;

  return new;
end;
$$;

create trigger proteger_statut_demande before update on public.demandes
  for each row execute function public.proteger_statut_demande();

-- =========================================================================
-- changer_statut_demande : seul point d'entrée pour faire évoluer le statut
-- d'un dossier. Vérifie le rôle, la transition autorisée, le motif
-- obligatoire, les verrous adresse/visite, puis journalise dans
-- historique_statuts (et historique_statuts_internes si fourni).
-- =========================================================================

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
begin
  v_role := public.role_utilisateur_courant();
  if v_role is null then
    raise exception 'Utilisateur non reconnu.';
  end if;

  select statut, demandeur_id, adresse_id
    into v_statut_actuel, v_demandeur_id, v_adresse_id
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
