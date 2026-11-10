-- Calcule le montant et la date d'échéance estimée au moment où une demande
-- est soumise (BROUILLON -> SOUMIS). Le client ne peut pas écrire ces
-- colonnes lui-même (cf. proteger_statut_demande), c'est donc la base qui les
-- renseigne à partir des tarifs et délais standards.

create or replace function public.ajouter_jours_ouvrables(p_depart date, p_jours int)
returns date
language plpgsql
immutable
as $$
declare
  v_date date := p_depart;
  v_restants int := p_jours;
begin
  while v_restants > 0 loop
    v_date := v_date + 1;
    if extract(isodow from v_date) < 6 then
      v_restants := v_restants - 1;
    end if;
  end loop;
  return v_date;
end;
$$;

create or replace function public.remplir_montant_echeance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tarif numeric;
  v_jours int;
begin
  if new.statut = 'SOUMIS' and old.statut = 'BROUILLON' then
    if new.montant is null then
      select montant into v_tarif from public.tarifs
        where type_acte = new.type_acte and commune_id = new.commune_id;
      if v_tarif is null then
        select montant into v_tarif from public.tarifs
          where type_acte = new.type_acte and commune_id is null;
      end if;
      if v_tarif is not null then
        new.montant := v_tarif * new.nombre_copies;
      end if;
    end if;

    if new.date_echeance_estimee is null then
      select jours_ouvrables into v_jours from public.delais_standards where type_acte = new.type_acte;
      if v_jours is not null then
        new.date_echeance_estimee := public.ajouter_jours_ouvrables(current_date, v_jours);
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Nom choisi pour s'exécuter APRÈS proteger_statut_demande (ordre alphabétique
-- des triggers BEFORE) : ce dernier refuse toute modification de montant par
-- un client, il doit donc voir la ligne avant que nous la complétions.
create trigger remplir_montant_echeance
  before update on public.demandes
  for each row execute function public.remplir_montant_echeance();

-- Rattrapage des demandes déjà soumises avant cette migration.
update public.demandes d
set
  montant = coalesce(d.montant, (
    select t.montant * d.nombre_copies from public.tarifs t
    where t.type_acte = d.type_acte and (t.commune_id = d.commune_id or t.commune_id is null)
    order by t.commune_id nulls last
    limit 1
  )),
  date_echeance_estimee = coalesce(d.date_echeance_estimee, (
    select public.ajouter_jours_ouvrables(d.created_at::date, s.jours_ouvrables)
    from public.delais_standards s where s.type_acte = d.type_acte
  ))
where d.statut <> 'BROUILLON';
