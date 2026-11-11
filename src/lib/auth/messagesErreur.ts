/**
 * Traduit les messages d'erreur Supabase Auth / Postgres les plus courants
 * en français compréhensible par un utilisateur non technique. Les messages
 * non reconnus retombent sur un texte générique plutôt que d'exposer une
 * erreur brute en anglais.
 */
export function messageErreurAuth(erreur: unknown): string {
  const message = erreur instanceof Error ? erreur.message : String(erreur);

  if (message.includes('Invalid login credentials')) {
    return 'Numéro de téléphone ou mot de passe incorrect.';
  }
  if (
    message.includes('User already registered') ||
    message.includes('already been registered') ||
    message.includes('duplicate key value violates unique constraint')
  ) {
    return 'Un compte existe déjà avec ce numéro de téléphone.';
  }
  if (message.includes('Password should be at least')) {
    return 'Le mot de passe est trop court (8 caractères minimum).';
  }
  if (message.includes('Network request failed') || message.includes('fetch failed')) {
    return 'Connexion impossible. Vérifiez votre connexion internet et réessayez.';
  }

  return 'Une erreur est survenue. Veuillez réessayer.';
}
