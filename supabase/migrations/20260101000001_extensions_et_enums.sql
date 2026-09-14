-- Extensions nécessaires (gen_random_uuid, etc. — généralement déjà actives sur Supabase).
create extension if not exists pgcrypto;

-- Rôles applicatifs. Uniquement client et responsable : le responsable cumule
-- validation des dossiers et administration du système, il n'y a pas de rôle
-- agent ni admin séparé. Ne jamais ajouter d'autre valeur "au cas où".
create type role_utilisateur as enum ('client', 'responsable');

create type type_acte as enum ('naissance', 'deces');

create type statut_compte as enum ('actif', 'suspendu');

-- Machine à états des dossiers. Voir src/domain/statuts/statutMachine.ts
-- pour le miroir applicatif — les deux doivent rester synchronisés.
create type statut_demande as enum (
  'BROUILLON',
  'SOUMIS',
  'PIECES_A_COMPLETER',
  'VISITE_PLANIFIEE',
  'VISITE_A_REPLANIFIER',
  'EN_TRAITEMENT',
  'EN_VALIDATION',
  'PRET',
  'LIVRE',
  'REJETE',
  'ANNULE'
);

create type statut_visite as enum (
  'a_planifier',
  'planifiee',
  'effectuee',
  'client_absent',
  'echec',
  'reportee'
);

create type statut_document as enum ('en_attente', 'valide', 'refuse');

create type statut_paiement as enum ('non_paye', 'paye');

create type canal_notification as enum ('push', 'sms', 'email', 'in_app');
