/**
 * Traduit les messages d'erreur Supabase Auth / Postgres les plus courants
 * en français compréhensible par un utilisateur non technique. Les messages
 * non reconnus retombent sur un texte générique plutôt que d'exposer une
 * erreur brute en anglais.
 */
export function messageErreurAuth(erreur: unknown): string {
  const message = erreur instanceof Error ? erreur.message : String(erreur);

  if (message.includes('Invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (message.includes('User already registered') || message.includes('already been registered')) {
    return 'Un compte existe déjà avec cet email.';
  }
  if (message.includes('duplicate key value violates unique constraint')) {
    return 'Ce numéro de téléphone ou cet email est déjà associé à un compte.';
  }
  if (message.includes('Password should be at least')) {
    return 'Le mot de passe est trop court (8 caractères minimum).';
  }
  if (message.includes('Email not confirmed')) {
    return 'Veuillez confirmer votre email avant de vous connecter.';
  }
  if (message.includes('Network request failed') || message.includes('fetch failed')) {
    return 'Connexion impossible. Vérifiez votre connexion internet et réessayez.';
  }

  return 'Une erreur est survenue. Veuillez réessayer.';
}
