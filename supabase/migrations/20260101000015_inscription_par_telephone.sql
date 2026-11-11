-- Inscription par téléphone (sans e-mail) : Supabase Auth stocke le numéro au
-- format international sans « + » (261341234567). L'app transmet aussi le
-- numéro au format local (0341234567) dans les métadonnées : on garde celui-ci
-- dans le profil, plus lisible pour le notaire et le client.
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
    coalesce(nullif(new.raw_user_meta_data->>'telephone', ''), new.phone),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
