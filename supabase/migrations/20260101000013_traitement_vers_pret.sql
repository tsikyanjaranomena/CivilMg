-- Le notaire instruit et valide lui-même le dossier : on autorise le passage
-- direct EN_TRAITEMENT -> PRET, sans l'étape intermédiaire EN_VALIDATION.
-- (Miroir de TRANSITIONS dans src/domain/statuts/statutMachine.ts.)
insert into public.transitions_autorisees (statut_depart, statut_arrivee, roles, motif_client_obligatoire)
values ('EN_TRAITEMENT', 'PRET', '{responsable}', false)
on conflict (statut_depart, statut_arrivee) do nothing;
