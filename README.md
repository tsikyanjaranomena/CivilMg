# CivilMg

Application mobile (Android/iOS, Expo + React Native) de suivi des demandes d'actes d'état civil
(naissance, décès) à Madagascar. Le client saisit sa demande avec son adresse complète, un
responsable effectue une visite de vérification à domicile (récupération de la procuration papier
sur place — jamais gérée dans l'app), puis instruit et valide le dossier.

Deux rôles seulement : **client** et **responsable** (le responsable cumule traitement des
dossiers, visites à domicile et administration — pas de rôle agent ni admin séparé).

## Stack

- Expo (SDK 57) + React Native + TypeScript strict, Expo Router (`src/app`)
- Supabase : PostgreSQL, Auth, Realtime, Storage, Row Level Security
- TanStack Query (cache/synchro serveur) + Zustand (état local léger)
- react-hook-form + zod (formulaires/validation)
- vitest (tests de la logique métier, `src/domain`)

## Prérequis

- Node.js 20+
- Un projet Supabase (cloud, ou local via `npx supabase start` si Docker Desktop est installé et
  démarré)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npx supabase`, pas d'installation globale
  nécessaire)

## Installation

```bash
npm install
cp .env.example .env.local
```

Renseigner dans `.env.local` :

| Variable | Où la trouver |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Dashboard Supabase > Project Settings > API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Dashboard Supabase > Project Settings > API (clé `anon public`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard Supabase > Project Settings > API (clé `service_role`, **secrète**, jamais dans l'app) — utilisée uniquement par `scripts/create-first-responsable.ts` |

## Base de données

Les migrations SQL vivent dans `supabase/migrations/` (enums, tables, RLS, machine à états,
Realtime) et les données de référence dans `supabase/seed.sql` (communes, tarifs, délais
standards, types de pièces).

Contre un projet Supabase distant :

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push          # applique les migrations
npx supabase db execute -f supabase/seed.sql
```

En local (nécessite Docker Desktop démarré) :

```bash
npx supabase start
npx supabase db reset         # applique migrations + seed.sql
```

Régénérer les types TypeScript depuis la base réelle (remplace le fichier écrit à la main pour
démarrer le projet) :

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.types.ts
# ou, en local :
npx supabase gen types typescript --local > src/types/database.types.ts
```

### Premier compte responsable

Aucune auto-inscription responsable n'existe dans l'app (par design). Créer le tout premier
compte :

```bash
npm run create-first-responsable -- --email=responsable@service.mg --password=... --nom="Rakoto"
```

Les comptes responsable suivants se créent depuis l'espace interne de l'app (Admin > Équipe), via
l'Edge Function `creer-compte-responsable` :

```bash
npx supabase functions deploy creer-compte-responsable
```

Aucun secret supplémentaire à définir : la fonction utilise les variables `SUPABASE_URL` et
`SUPABASE_SERVICE_ROLE_KEY` injectées automatiquement par Supabase, et vérifie elle-même que
l'appelant est déjà un responsable actif avant de créer le nouveau compte.

### Notifications push

Le statut in-app (table `notifications`, écran Notifications, badge) fonctionne dès que la base est
à jour — aucune configuration supplémentaire. Pour que les changements de statut déclenchent aussi
une **vraie notification push** (app en arrière-plan ou fermée) :

```bash
npx supabase functions deploy envoyer-notification-push
npx supabase secrets set WEBHOOK_SECRET=<une-valeur-aleatoire>
```

Puis dans le Dashboard Supabase : **Database > Webhooks > Create a new hook**
- Table : `notifications`, événement : `Insert`
- Type : HTTP Request → POST vers l'URL de la fonction `envoyer-notification-push`
- Header : `x-webhook-secret: <la même valeur que WEBHOOK_SECRET>`

Sans projectId EAS configuré (Phase 6), l'app continue de fonctionner normalement : elle journalise
un avertissement et n'enregistre simplement aucun jeton push.

### Hors ligne

- Les données déjà chargées (dossiers, notifications) restent consultables hors ligne : le cache
  TanStack Query est persisté sur l'appareil (`src/lib/queryPersistence.ts`), 24h de rétention.
- Le formulaire de nouvelle demande fonctionne entièrement hors ligne jusqu'à l'écran de
  confirmation (brouillon persisté, voir `src/stores/nouvelleDemandeStore.ts`).
- Les actions simples côté client (marquer une notification lue, annuler/renvoyer un dossier,
  demander un report de visite) passent par une file d'envoi persistée
  (`src/stores/fileEnvoiStore.ts`, `src/lib/fileEnvoi.ts`) : hors ligne, elles sont mises en
  attente et rejouées automatiquement au retour du réseau, dans l'ordre.
- Un bandeau "Mode hors ligne" s'affiche automatiquement (`src/components/ui/BandeauHorsLigne.tsx`).

### Internationalisation

Architecture prête pour le malgache : tous les textes traduits passent par `t(cle)`
(`src/hooks/useTraduction.ts`), qui lit `src/lib/i18n/fr.json`. Pour ajouter le malgache :

1. Dupliquer `src/lib/i18n/fr.json` en `mg.json` avec les mêmes clés, traduites.
2. L'ajouter à `dictionnaires` dans `src/lib/i18n/index.ts`.
3. Passer `disponible: true` pour `mg` dans `LANGUES_DISPONIBLES`
   (`src/stores/langueStore.ts`) — le sélecteur dans Profil l'active alors automatiquement.

Aujourd'hui, seuls les libellés de statut (`domain/statuts/statutConfig.ts`) et quelques textes
communs passent réellement par ce mécanisme — le reste de l'app est en français en dur. Faire
passer le reste des écrans par `t()` est un travail mécanique à mener progressivement, pas un
prérequis technique : l'architecture est en place.

### Accessibilité

- Cibles tactiles ≥ 44px (`MinTouchTarget` dans `src/constants/theme.ts`), respecté par tous les
  composants UI de base (`Bouton`, `ChampTexte`, `SelecteurModal`, etc.).
- `accessibilityRole`/`accessibilityLabel`/`accessibilityState` posés sur tous les éléments
  pressables (cartes de dossier, filtres, actions de suppression, liens).
- Aucune désactivation de l'agrandissement de police système (`allowFontScaling` jamais mis à
  `false`) : l'app respecte les réglages d'accessibilité du téléphone.

## Lancer l'app

```bash
npm run start      # menu Expo (scanner le QR code, ou touche a/i/w)
npm run android
npm run ios
npm run web
```

## Tests

```bash
npm run test        # logique métier (src/domain) : machine à états, validations, délais, tarifs,
                     # i18n, décision de mise en file hors ligne
npm run test:watch
```

## Builds (EAS)

```bash
npm install -g eas-cli   # ou npx eas-cli
eas login
eas init                 # relie le projet à un compte Expo, écrit extra.eas.projectId dans app.json
                          # (nécessaire pour que les notifications push fonctionnent, cf. plus haut)
```

Profils définis dans `eas.json` :

- `development` — build avec client de développement (`expo-dev-client`), pour tester sur appareil
  avec hot-reload : `eas build --profile development --platform android`
- `preview` — APK Android à distribuer en interne sans passer par le store :
  `eas build --profile preview --platform android`
- `production` — build de soumission aux stores (App Store / Play Store) :
  `eas build --profile production --platform all`

`ios.bundleIdentifier` / `android.package` sont actuellement `com.proxiatech.civilmg`
(`app.json`) — à changer avant une vraie publication si l'organisation porteuse est différente.

## Structure

```
src/
  app/          Écrans (Expo Router) : (public), (client), (interne)
  api/          Seule couche autorisée à appeler Supabase
  domain/       Logique métier pure et testable (statuts, validation, délais, tarifs)
  stores/       État local (Zustand, persisté) : session, brouillons, file d'envoi, langue
  hooks/        Hooks TanStack Query par domaine
  components/   Composants UI réutilisables
  lib/          Client Supabase, i18n, notifications, file hors-ligne
  types/        Types générés depuis la base + types domaine
supabase/
  migrations/   Schéma, RLS, machine à états, Realtime
  functions/    Edge Functions (Deno) — ex: envoyer-notification-push
  seed.sql      Données de référence de développement
scripts/
  create-first-responsable.ts
```

## Sécurité — points clés

- RLS activée sur toutes les tables ; un client ne voit jamais les dossiers d'un autre.
- Les champs sensibles (compte rendu de visite, procuration, notes internes) vivent dans des
  tables séparées lisibles uniquement par un responsable (`visite_comptes_rendus`,
  `demandes_notes_internes`, `historique_statuts_internes`), plutôt que masqués côté app.
- Tout changement de statut de dossier passe obligatoirement par la fonction Postgres
  `changer_statut_demande()` : c'est le seul point d'entrée qui vérifie le rôle, la transition
  autorisée, le motif obligatoire, les verrous adresse/visite, et journalise dans
  `historique_statuts`.
- Le suivi public sans compte (`consulter_statut_public`) ne retourne aucune donnée personnelle,
  uniquement référence, type d'acte, statut et échéance estimée.
