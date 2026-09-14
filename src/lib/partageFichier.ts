import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Écrit un contenu texte dans le cache et ouvre la feuille de partage native. */
export async function partagerFichierTexte(nomFichier: string, contenu: string): Promise<void> {
  const fichier = new File(Paths.cache, nomFichier);
  if (fichier.exists) fichier.delete();
  fichier.create();
  fichier.write(contenu);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fichier.uri);
  }
}
