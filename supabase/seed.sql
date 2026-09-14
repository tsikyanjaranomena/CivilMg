-- Données de référence pour le développement local.
-- Ne crée aucun compte utilisateur : les comptes client se créent via
-- l'inscription normale de l'app, le premier compte responsable via
-- scripts/create-first-responsable.ts (voir README).

insert into public.communes (code, nom, district, region) values
  ('TNR-I', 'Antananarivo I', 'Antananarivo Renivohitra', 'Analamanga'),
  ('TNR-IV', 'Antananarivo IV', 'Antananarivo Renivohitra', 'Analamanga'),
  ('AVARADRANO', 'Antananarivo Avaradrano', 'Antananarivo Avaradrano', 'Analamanga'),
  ('TOAMASINA-I', 'Toamasina I', 'Toamasina I', 'Atsinanana')
on conflict (code) do nothing;

insert into public.types_pieces (type_acte, code, libelle, obligatoire, ordre) values
  ('naissance', 'cin_demandeur', 'Copie de la CIN du demandeur', true, 1),
  ('naissance', 'ancien_acte', 'Ancienne copie de l''acte (si disponible)', false, 2),
  ('deces', 'cin_demandeur', 'Copie de la CIN du demandeur', true, 1),
  ('deces', 'certificat_medical', 'Certificat médical de décès (si disponible)', false, 2)
on conflict (type_acte, code) do nothing;

insert into public.tarifs (type_acte, commune_id, montant)
  select 'naissance', null, 2000
  where not exists (select 1 from public.tarifs where type_acte = 'naissance' and commune_id is null);

insert into public.tarifs (type_acte, commune_id, montant)
  select 'deces', null, 2000
  where not exists (select 1 from public.tarifs where type_acte = 'deces' and commune_id is null);

insert into public.delais_standards (type_acte, jours_ouvrables) values
  ('naissance', 5),
  ('deces', 5)
on conflict (type_acte) do nothing;

insert into public.parametres (cle, valeur, description) values
  ('aide_pourquoi_adresse', '"Un agent du service viendra vérifier vos informations à votre domicile et récupérer la procuration signée sur place. Une adresse précise nous permet de vous trouver facilement."', 'Texte affiché à l''étape adresse du formulaire de demande.'),
  ('aide_visite', '"Préparez les documents originaux mentionnés dans votre dossier. La procuration sera signée sur place, aucun document à envoyer à l''avance."', 'Texte affiché dans le bloc visite du détail dossier.'),
  ('contact_telephone', '"0340000000"', 'Numéro affiché pour l''action "Contacter le service" côté client.')
on conflict (cle) do nothing;
