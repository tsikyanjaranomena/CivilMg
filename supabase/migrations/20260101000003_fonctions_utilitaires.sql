-- Fonctions utilitaires utilisées par les politiques RLS et les triggers.
-- SECURITY DEFINER + search_path fixe : évite la récursion RLS quand ces
-- fonctions lisent la table profiles depuis une policy définie sur profiles
-- elle-même, et empêche le détournement de search_path.

create or replace function public.role_utilisateur_courant()
returns role_utilisateur
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.est_responsable()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.role_utilisateur_courant() = 'responsable', false)
$$;

create or replace function public.est_client()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.role_utilisateur_courant() = 'client', false)
$$;

-- Crée automatiquement le profil (rôle client) à l'inscription d'un nouvel
-- utilisateur Supabase Auth. Les comptes responsable ne passent jamais par
-- ce chemin : ils sont créés par une Edge Function avec la clé service_role
-- (cf. scripts/create-first-responsable.ts pour le tout premier).
create or replace function public.gerer_nouvel_utilisateur()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, nom, telephone, email)
  values (
    new.id,
    'client',
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.phone, nullif(new.raw_user_meta_data->>'telephone', '')),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.gerer_nouvel_utilisateur();
