/**
 * Crée le tout premier compte responsable, seul moyen de démarrer puisque
 * les comptes responsable ne peuvent normalement être créés que par un
 * responsable existant depuis l'app (aucune auto-inscription).
 *
 * Nécessite SUPABASE_SERVICE_ROLE_KEY (clé secrète, jamais exposée à l'app
 * mobile) — Project Settings > API dans le dashboard Supabase.
 *
 * Usage :
 *   npm run create-first-responsable -- --email=responsable@service.mg --password=... --nom="Rakoto"
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

import type { Database } from '../src/types/database.types';

// Le reste du projet utilise .env.local (convention Expo), pas .env
// (défaut de dotenv) : on le charge explicitement.
config({ path: '.env.local' });

function lireArgument(nom: string): string | undefined {
  const prefixe = `--${nom}=`;
  const arg = process.argv.find((a) => a.startsWith(prefixe));
  return arg?.slice(prefixe.length);
}

async function main() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (.env).');
  }

  const email = lireArgument('email');
  const password = lireArgument('password');
  const nom = lireArgument('nom') ?? 'Responsable';

  if (!email || !password) {
    throw new Error(
      'Usage: npm run create-first-responsable -- --email=... --password=... --nom="..."',
    );
  }

  const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: utilisateur, error: erreurCreation } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (erreurCreation || !utilisateur.user) {
    throw erreurCreation ?? new Error('Création du compte impossible.');
  }

  // Le trigger gerer_nouvel_utilisateur() a déjà créé un profil "client" par
  // défaut : on le promeut immédiatement en "responsable". La clé
  // service_role contourne la RLS (qui interdirait normalement à quiconque
  // de s'auto-attribuer ce rôle), c'est pourquoi ce script ne doit jamais
  // tourner ailleurs qu'en local/CI avec la clé secrète.
  const { error } = await admin
    .from('profiles')
    .update({ nom, role: 'responsable' })
    .eq('id', utilisateur.user.id);

  if (error) throw error;

  console.log(`Compte responsable créé : ${email} (id ${utilisateur.user.id})`);
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
