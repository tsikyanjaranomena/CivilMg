-- Buckets privés : tout accès passe par une URL signée à durée limitée,
-- jamais par une URL publique.
insert into storage.buckets (id, name, public)
values ('pieces-jointes', 'pieces-jointes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('procurations', 'procurations', false)
on conflict (id) do nothing;

-- Convention de chemin : {demande_id}/{nom_fichier}. Le premier segment du
-- chemin permet de retrouver le dossier propriétaire du fichier.

create policy pieces_jointes_select on storage.objects
  for select using (
    bucket_id = 'pieces-jointes'
    and exists (
      select 1 from public.demandes d
      where d.id::text = (storage.foldername(name))[1]
        and (d.demandeur_id = auth.uid() or public.est_responsable())
    )
  );

create policy pieces_jointes_insert on storage.objects
  for insert with check (
    bucket_id = 'pieces-jointes'
    and exists (
      select 1 from public.demandes d
      where d.id::text = (storage.foldername(name))[1]
        and (public.demande_modifiable_client(d.id) or public.est_responsable())
    )
  );

create policy pieces_jointes_delete on storage.objects
  for delete using (
    bucket_id = 'pieces-jointes'
    and exists (
      select 1 from public.demandes d
      where d.id::text = (storage.foldername(name))[1]
        and (public.demande_modifiable_client(d.id) or public.est_responsable())
    )
  );

-- Procurations papier scannées : jamais accessibles au client, quel que soit
-- le statut du dossier (voir contexte métier : la procuration n'est jamais
-- un objet géré par le client dans l'app).
create policy procurations_all on storage.objects
  for all using (
    bucket_id = 'procurations' and public.est_responsable()
  ) with check (
    bucket_id = 'procurations' and public.est_responsable()
  );
