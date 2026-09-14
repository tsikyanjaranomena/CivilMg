import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Compresse une image avant envoi (connexions lentes attendues sur le
 * terrain) : redimensionne à 1600px de large max et réencode en JPEG à 60%.
 */
export async function compresserImage(uri: string): Promise<{ uri: string; mimeType: string }> {
  const contexte = ImageManipulator.manipulate(uri).resize({ width: 1600 });
  const image = await contexte.renderAsync();
  const resultat = await image.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });
  return { uri: resultat.uri, mimeType: 'image/jpeg' };
}
