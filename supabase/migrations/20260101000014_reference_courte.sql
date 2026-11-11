-- Numéros de dossier plus courts et plus faciles à dicter au téléphone :
-- ACT-2026-1 au lieu de ACT-2026-000001.
create or replace function public.generer_reference_demande()
returns trigger
language plpgsql
as $$
begin
  if new.reference is null then
    new.reference := 'ACT-' || extract(year from now())::int || '-' || nextval('public.demandes_compteur_seq');
  end if;
  return new;
end;
$$;

-- Les dossiers existants passent au même format (zéros de tête retirés).
update public.demandes
set reference = regexp_replace(reference, '^(ACT-\d{4}-)0*(\d+)$', '\1\2')
where reference ~ '^ACT-\d{4}-0\d*$';
