-- =========================================================================
-- Fonctions d'aide supplémentaires
-- =========================================================================

-- Un dossier reste modifiable par son client tant que la visite n'a pas été
-- effectuée (au-delà, seul le responsable agit dessus).
create or replace function public.demande_modifiable_client(p_demande_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.demandes
    where id = p_demande_id
      and demandeur_id = auth.uid()
      and statut not in ('EN_TRAITEMENT', 'EN_VALIDATION', 'PRET', 'LIVRE', 'REJETE', 'ANNULE')
  )
$$;

-- Journalise une consultation de dossier par un membre du personnel.
-- Appelée explicitement par la couche API (jamais depuis une policy RLS,
-- qui ne doit pas avoir d'effet de bord).
create or replace function public.journaliser_consultation(p_demande_id uuid, p_action text default 'lecture')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.est_responsable() then
    insert into public.journal_audit_consultations (utilisateur_id, demande_id, action)
    values (auth.uid(), p_demande_id, p_action);
  end if;
end;
$$;

grant execute on function public.journaliser_consultation(uuid, text) to authenticated;

-- Suivi public sans compte : référence + 4 derniers chiffres du téléphone.
-- Volontairement minimal (pas de nom, pas d'adresse). À protéger par un
-- rate-limit côté Edge Function/API Gateway en production.
create or replace function public.consulter_statut_public(
  p_reference text,
  p_derniers_chiffres_telephone text
)
returns table (
  reference text,
  type_acte type_acte,
  statut statut_demande,
  date_echeance_estimee date
)
language sql
stable
security definer
set search_path = public
as $$
  select d.reference, d.type_acte, d.statut, d.date_echeance_estimee
  from public.demandes d
  join public.profiles p on p.id = d.demandeur_id
  where d.reference = upper(btrim(p_reference))
    and right(coalesce(p.telephone, ''), 4) = p_derniers_chiffres_telephone
    and d.deleted_at is null
$$;

grant execute on function public.consulter_statut_public(text, text) to anon, authenticated;

-- =========================================================================
-- Activation RLS
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.communes enable row level security;
alter table public.types_pieces enable row level security;
alter table public.tarifs enable row level security;
alter table public.delais_standards enable row level security;
alter table public.parametres enable row level security;
alter table public.adresses enable row level security;
alter table public.demandes enable row level security;
alter table public.demandes_notes_internes enable row level security;
alter table public.personnes_concernees enable row level security;
alter table public.visites enable row level security;
alter table public.visite_comptes_rendus enable row level security;
alter table public.documents enable row level security;
alter table public.historique_statuts enable row level security;
alter table public.historique_statuts_internes enable row level security;
alter table public.notifications enable row level security;
alter table public.journal_audit_consultations enable row level security;
alter table public.transitions_autorisees enable row level security;

-- =========================================================================
-- profiles
-- =========================================================================

create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.est_responsable());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_update_responsable on public.profiles
  for update using (public.est_responsable()) with check (public.est_responsable());

-- Pas de policy insert/delete : la création passe par le trigger
-- gerer_nouvel_utilisateur() (client) ou par une Edge Function service_role
-- (responsable), tous deux hors RLS.

-- =========================================================================
-- Référentiels (lecture pour tout utilisateur connecté, écriture responsable)
-- =========================================================================

create policy referentiel_select on public.communes for select using (auth.uid() is not null);
create policy referentiel_write on public.communes for all
  using (public.est_responsable()) with check (public.est_responsable());

create policy referentiel_select on public.types_pieces for select using (auth.uid() is not null);
create policy referentiel_write on public.types_pieces for all
  using (public.est_responsable()) with check (public.est_responsable());

create policy referentiel_select on public.tarifs for select using (auth.uid() is not null);
create policy referentiel_write on public.tarifs for all
  using (public.est_responsable()) with check (public.est_responsable());

create policy referentiel_select on public.delais_standards for select using (auth.uid() is not null);
create policy referentiel_write on public.delais_standards for all
  using (public.est_responsable()) with check (public.est_responsable());

create policy referentiel_select on public.parametres for select using (auth.uid() is not null);
create policy referentiel_write on public.parametres for all
  using (public.est_responsable()) with check (public.est_responsable());

create policy referentiel_select on public.transitions_autorisees for select using (auth.uid() is not null);

-- =========================================================================
-- adresses
-- =========================================================================

create policy adresses_select on public.adresses
  for select using (profile_id = auth.uid() or public.est_responsable());

create policy adresses_insert on public.adresses
  for insert with check (profile_id = auth.uid());

create policy adresses_update on public.adresses
  for update using (profile_id = auth.uid() or public.est_responsable())
  with check (profile_id = auth.uid() or public.est_responsable());

-- Empêche un client de modifier une adresse une fois la visite associée
-- effectuée (au-delà, seul le responsable peut corriger si besoin).
create or replace function public.empecher_modification_adresse_apres_visite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.est_client() and exists (
    select 1
    from public.demandes d
    join public.visites v on v.demande_id = d.id
    where d.adresse_id = old.id and v.statut = 'effectuee'
  ) then
    raise exception 'Adresse verrouillée : la visite de vérification a déjà eu lieu.';
  end if;
  return new;
end;
$$;

create trigger empecher_modification_adresse_apres_visite
  before update on public.adresses
  for each row execute function public.empecher_modification_adresse_apres_visite();

-- =========================================================================
-- demandes
-- =========================================================================

create policy demandes_select on public.demandes
  for select using (demandeur_id = auth.uid() or public.est_responsable());

create policy demandes_insert on public.demandes
  for insert with check (demandeur_id = auth.uid() and public.est_client());

create policy demandes_update on public.demandes
  for update using (demandeur_id = auth.uid() or public.est_responsable())
  with check (demandeur_id = auth.uid() or public.est_responsable());

-- Pas de policy delete : suppression uniquement logique (deleted_at).

-- =========================================================================
-- demandes_notes_internes — jamais visible du client
-- =========================================================================

create policy notes_internes_all on public.demandes_notes_internes
  for all using (public.est_responsable()) with check (public.est_responsable());

-- =========================================================================
-- personnes_concernees
-- =========================================================================

create policy personnes_select on public.personnes_concernees
  for select using (
    exists (
      select 1 from public.demandes d
      where d.id = personnes_concernees.demande_id
        and (d.demandeur_id = auth.uid() or public.est_responsable())
    )
  );

create policy personnes_insert on public.personnes_concernees
  for insert with check (
    public.est_responsable() or public.demande_modifiable_client(demande_id)
  );

create policy personnes_update on public.personnes_concernees
  for update using (
    public.est_responsable() or public.demande_modifiable_client(demande_id)
  ) with check (
    public.est_responsable() or public.demande_modifiable_client(demande_id)
  );

-- =========================================================================
-- visites — champs visibles du client uniquement (date, créneau, statut) ;
-- planification et gestion réservées au responsable.
-- =========================================================================

create policy visites_select on public.visites
  for select using (
    exists (
      select 1 from public.demandes d
      where d.id = visites.demande_id
        and (d.demandeur_id = auth.uid() or public.est_responsable())
    )
  );

create policy visites_write on public.visites
  for all using (public.est_responsable()) with check (public.est_responsable());

-- =========================================================================
-- visite_comptes_rendus — réservé au responsable, jamais lu par le client
-- =========================================================================

create policy visite_comptes_rendus_all on public.visite_comptes_rendus
  for all using (public.est_responsable()) with check (public.est_responsable());

-- =========================================================================
-- documents
-- =========================================================================

create policy documents_select on public.documents
  for select using (
    exists (
      select 1 from public.demandes d
      where d.id = documents.demande_id
        and (d.demandeur_id = auth.uid() or public.est_responsable())
    )
  );

create policy documents_insert on public.documents
  for insert with check (
    public.est_responsable() or public.demande_modifiable_client(demande_id)
  );

create policy documents_update on public.documents
  for update using (
    public.est_responsable() or public.demande_modifiable_client(demande_id)
  ) with check (
    public.est_responsable() or public.demande_modifiable_client(demande_id)
  );

create policy documents_delete on public.documents
  for delete using (
    public.est_responsable() or public.demande_modifiable_client(demande_id)
  );

-- Seul le responsable peut fixer le statut de vérification et le motif de refus.
create or replace function public.proteger_verification_document()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.est_client() and (
    new.statut_verification is distinct from old.statut_verification
    or new.motif_refus is distinct from old.motif_refus
  ) then
    raise exception 'Seul le responsable peut vérifier une pièce jointe.';
  end if;
  return new;
end;
$$;

create trigger proteger_verification_document
  before update on public.documents
  for each row execute function public.proteger_verification_document();

-- =========================================================================
-- historique_statuts / historique_statuts_internes — écriture uniquement
-- via la fonction changer_statut_demande() (SECURITY DEFINER, bypass RLS
-- car exécutée par le propriétaire de la table). Aucune policy insert/update
-- n'est donc définie ici : c'est volontaire.
-- =========================================================================

create policy historique_select on public.historique_statuts
  for select using (
    exists (
      select 1 from public.demandes d
      where d.id = historique_statuts.demande_id
        and (d.demandeur_id = auth.uid() or public.est_responsable())
    )
  );

create policy historique_internes_select on public.historique_statuts_internes
  for select using (public.est_responsable());

-- =========================================================================
-- notifications
-- =========================================================================

create policy notifications_select on public.notifications
  for select using (destinataire_id = auth.uid());

create policy notifications_update on public.notifications
  for update using (destinataire_id = auth.uid()) with check (destinataire_id = auth.uid());

-- Seul le champ "lu" est modifiable par le destinataire.
create or replace function public.proteger_notification()
returns trigger
language plpgsql
as $$
begin
  if new.titre is distinct from old.titre
    or new.contenu is distinct from old.contenu
    or new.canal is distinct from old.canal
    or new.demande_id is distinct from old.demande_id
    or new.destinataire_id is distinct from old.destinataire_id
  then
    raise exception 'Seul le statut "lu" d''une notification peut être modifié.';
  end if;
  return new;
end;
$$;

create trigger proteger_notification
  before update on public.notifications
  for each row execute function public.proteger_notification();

-- Pas de policy insert pour les utilisateurs : les notifications sont créées
-- par changer_statut_demande() ou par des Edge Functions (service_role).

-- =========================================================================
-- journal_audit_consultations — écrit uniquement via journaliser_consultation()
-- =========================================================================

create policy journal_audit_select on public.journal_audit_consultations
  for select using (public.est_responsable());
