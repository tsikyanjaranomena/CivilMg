/**
 * Décide si une action doit être mise en file d'attente pour un envoi
 * différé (pas de réseau, ou erreur réseau constatée pendant la tentative)
 * plutôt que remontée comme une erreur définitive à l'utilisateur.
 */
export function doitMettreEnFile(estConnecte: boolean, erreur?: unknown): boolean {
  if (!estConnecte) return true;
  if (!erreur) return false;
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  return /network request failed|fetch failed|Failed to fetch|timeout/i.test(message);
}
