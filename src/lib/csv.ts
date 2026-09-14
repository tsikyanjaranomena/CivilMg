export function versCsv(lignes: Record<string, unknown>[]): string {
  if (lignes.length === 0) return '';
  const entetes = Object.keys(lignes[0]);

  function echapper(valeur: unknown): string {
    const texte = valeur === null || valeur === undefined ? '' : String(valeur);
    return /[",\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
  }

  const lignesCsv = lignes.map((ligne) => entetes.map((entete) => echapper(ligne[entete])).join(','));
  return [entetes.join(','), ...lignesCsv].join('\n');
}
