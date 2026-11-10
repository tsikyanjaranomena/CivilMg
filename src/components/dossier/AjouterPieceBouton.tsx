import { Alert } from '@/lib/alerte';
import * as ImagePicker from 'expo-image-picker';

import { Bouton } from '@/components/ui/Bouton';
import { useAjouterDocument } from '@/hooks/mutations/useAjouterDocument';
import { compresserImage } from '@/lib/images';

interface AjouterPieceBoutonProps {
  demandeId: string;
  typePieceId?: string;
  nomFichier: string;
  titre?: string;
}

export function AjouterPieceBouton({ demandeId, typePieceId, nomFichier, titre = 'Ajouter une pièce' }: AjouterPieceBoutonProps) {
  const ajouterDocument = useAjouterDocument(demandeId);

  async function choisirEtEnvoyer() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès à vos photos pour continuer.");
      return;
    }
    const resultat = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (resultat.canceled || !resultat.assets[0]) return;

    try {
      const { uri, mimeType } = await compresserImage(resultat.assets[0].uri);
      await ajouterDocument.mutateAsync({ uri, mimeType, nomFichier, typePieceId });
    } catch {
      Alert.alert('Erreur', "Impossible d'ajouter cette pièce. Réessayez.");
    }
  }

  return <Bouton titre={titre} variante="secondaire" enChargement={ajouterDocument.isPending} onPress={choisirEtEnvoyer} />;
}
