-- Met à jour automatiquement updated_at sur toute table qui porte cette colonne.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- Référentiels
-- =========================================================================

create table public.communes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nom text not null,
  district text not null,
  region text not null,
  created_at timestamptz not null default now()
);

create table public.types_pieces (
  id uuid primary key default gen_random_uuid(),
  type_acte type_acte not null,
  code text not null,
  libelle text not null,
  obligatoire boolean not null default true,
  ordre int not null default 0,
  unique (type_acte, code)
);

create table public.tarifs (
  id uuid primary key default gen_random_uuid(),
  type_acte type_acte not null,
  commune_id uuid references public.communes(id), -- null = tarif par défaut
  montant numeric(12, 2) not null check (montant >= 0),
  updated_at timestamptz not null default now(),
  unique (type_acte, commune_id)
);

create table public.delais_standards (
  type_acte type_acte primary key,
  jours_ouvrables int not null check (jours_ouvrables > 0)
);

create table public.parametres (
  cle text primary key,
  valeur jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.tarifs
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.parametres
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Utilisateurs et adresses
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role role_utilisateur not null default 'client',
  nom text not null default '',
  prenoms text,
  telephone text unique,
  email text unique,
  cin text,
  statut_compte statut_compte not null default 'actif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Adresse client, réutilisable d'une demande à l'autre. fokontany et
-- points_de_repere sont NOT NULL car ce sont les champs critiques pour que
-- le responsable retrouve le client lors de la visite à domicile.
create table public.adresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  region text not null,
  district text not null,
  commune_id uuid not null references public.communes(id),
  fokontany text not null,
  quartier text,
  lot_numero text,
  points_de_repere text not null,
  telephone_sur_place text not null,
  creneaux_disponibilite text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.adresses
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Dossiers
-- =========================================================================

create table public.demandes (
  id uuid primary key default gen_random_uuid(),
  reference text unique, -- généré par trigger (voir migration reference_et_machine_etats)
  type_acte type_acte not null,
  demandeur_id uuid not null references public.profiles(id),
  pris_en_charge_par uuid references public.profiles(id), -- responsable qui a pris le dossier dans la file
  statut statut_demande not null default 'BROUILLON',
  commune_id uuid not null references public.communes(id),
  adresse_id uuid references public.adresses(id),
  nombre_copies int not null default 1 check (nombre_copies between 1 and 20),
  motif text,
  pour_soi_meme boolean not null default true,
  montant numeric(12, 2),
  statut_paiement statut_paiement not null default 'non_paye',
  date_echeance_estimee date,
  date_cloture timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index demandes_demandeur_idx on public.demandes(demandeur_id);
create index demandes_statut_idx on public.demandes(statut);
create index demandes_pris_en_charge_idx on public.demandes(pris_en_charge_par);

create trigger set_updated_at before update on public.demandes
  for each row execute function public.set_updated_at();

-- Notes internes : jamais exposées au client. Table séparée plutôt que
-- colonne sur demandes pour que la confidentialité repose sur une RLS
-- standard (SELECT réservé à est_responsable()) plutôt que sur une vue de
-- masquage ou des droits colonne par colonne.
create table public.demandes_notes_internes (
  demande_id uuid primary key references public.demandes(id) on delete cascade,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create trigger set_updated_at before update on public.demandes_notes_internes
  for each row execute function public.set_updated_at();

create table public.personnes_concernees (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null unique references public.demandes(id) on delete cascade,
  nom text not null,
  prenoms text,
  date_evenement date not null, -- date de naissance ou de décès selon type_acte
  lieu_evenement text not null,
  nom_pere text,
  nom_mere text,
  numero_acte text,
  annee_acte int,
  commune_enregistrement_id uuid references public.communes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.personnes_concernees
  for each row execute function public.set_updated_at();

-- Visite de vérification à domicile — jamais un formulaire de procuration.
-- Champs visibles du client : date_planifiee, creneau, statut. Le compte
-- rendu détaillé (résultat de la vérification, procuration) vit dans
-- visite_comptes_rendus, réservée au responsable.
create table public.visites (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references public.demandes(id) on delete cascade,
  responsable_id uuid references public.profiles(id), -- qui effectue/a effectué la visite
  date_planifiee date,
  creneau text,
  statut statut_visite not null default 'a_planifier',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visites_demande_idx on public.visites(demande_id);

create trigger set_updated_at before update on public.visites
  for each row execute function public.set_updated_at();

create table public.visite_comptes_rendus (
  visite_id uuid primary key references public.visites(id) on delete cascade,
  compte_rendu text,
  verification_concluante boolean,
  procuration_recuperee boolean not null default false,
  procuration_photo_path text, -- Storage, bucket "procurations"
  date_recuperation_procuration timestamptz,
  motif_echec text,
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.visite_comptes_rendus
  for each row execute function public.set_updated_at();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references public.demandes(id) on delete cascade,
  type_piece_id uuid references public.types_pieces(id),
  fichier_path text not null, -- Storage, bucket "pieces-jointes"
  statut_verification statut_document not null default 'en_attente',
  motif_refus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_demande_idx on public.documents(demande_id);

create trigger set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

-- Historique des transitions de statut, alimente la timeline temps réel.
-- N'est jamais rempli directement : uniquement via la fonction RPC
-- changer_statut_demande() (voir migration suivante) qui garantit qu'aucune
-- transition ne se fait sans laisser de trace.
create table public.historique_statuts (
  id uuid primary key default gen_random_uuid(),
  demande_id uuid not null references public.demandes(id) on delete cascade,
  statut_precedent statut_demande,
  statut_nouveau statut_demande not null,
  auteur_id uuid not null references public.profiles(id),
  commentaire_client text,
  created_at timestamptz not null default now()
);

create index historique_statuts_demande_idx on public.historique_statuts(demande_id, created_at);

-- Commentaire interne d'une transition : jamais visible du client, table à
-- part pour la même raison que demandes_notes_internes.
create table public.historique_statuts_internes (
  historique_id uuid primary key references public.historique_statuts(id) on delete cascade,
  commentaire_interne text not null
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  destinataire_id uuid not null references public.profiles(id) on delete cascade,
  demande_id uuid references public.demandes(id) on delete cascade,
  titre text not null,
  contenu text not null,
  canal canal_notification not null default 'in_app',
  lu boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_destinataire_idx on public.notifications(destinataire_id, lu);

-- Journal d'audit : toute consultation d'un dossier par un membre du
-- personnel (responsable) est tracée, exigence transverse de sécurité.
create table public.journal_audit_consultations (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid not null references public.profiles(id),
  demande_id uuid not null references public.demandes(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index journal_audit_demande_idx on public.journal_audit_consultations(demande_id);
