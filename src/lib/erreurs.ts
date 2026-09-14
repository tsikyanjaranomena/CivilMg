/** Traduit une erreur technique (réseau, RLS, contrainte Postgres) en message compréhensible. */
export function messageErreurGenerique(erreur: unknown): string {
  const message = erreur instanceof Error ? erreur.message : String(erreur);

  if (message.includes('Network request failed') || message.includes('fetch failed')) {
    return 'Connexion impossible. Vérifiez votre connexion internet et réessayez. Votre brouillon a été conservé.';
  }
  if (message.includes('row-level security') || message.includes('permission denied')) {
    return "Vous n'avez pas accès à cette action.";
  }
  if (message.includes('violates') && message.includes('constraint')) {
    return 'Certaines informations saisies sont invalides. Vérifiez le formulaire.';
  }

  return 'Une erreur est survenue. Votre brouillon a été conservé, vous pouvez réessayer.';
}
