-- =========================================================================
-- Notifications push : jeton Expo par profil.
-- =========================================================================
alter table public.profiles add column expo_push_token text;

-- =========================================================================
-- Requêtes libres du client sur un dossier (ex : demande de report de
-- visite). Table dédiée plutôt qu'une notification : pas de destinataire
-- unique à choisir côté client (n'importe quel responsable peut la traiter),
-- et le statut "traitee" permet de la faire apparaître dans la fiche de
-- traitement du responsable (Phase 5).
-- =========================================================================
create table public.demandes_requetes_client (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references public.demandes(id) on delete cascade,
  type text not null,
  message text,
  traitee boolean not null default false,
  created_at timestamptz not null default now()
);

create index demandes_requetes_client_demande_idx on public.demandes_requetes_client(demande_id);

alter table public.demandes_requetes_client enable row level security;

create policy requetes_client_select on public.demandes_requetes_client
  for select using (
    exists (
      select 1 from public.demandes d
      where d.id = demandes_requetes_client.demande_id
        and (d.demandeur_id = auth.uid() or public.est_responsable())
    )
  );

create policy requetes_client_insert on public.demandes_requetes_client
  for insert with check (
    exists (
      select 1 from public.demandes d
      where d.id = demande_id and d.demandeur_id = auth.uid()
    )
  );

create policy requetes_client_update on public.demandes_requetes_client
  for update using (public.est_responsable()) with check (public.est_responsable());
