import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BarreProgression } from '@/components/nouvelle-demande/BarreProgression';
import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTypesPieces } from '@/hooks/queries/useReferentiels';
import { compresserImage } from '@/lib/images';
import { useNouvelleDemandeStore } from '@/stores/nouvelleDemandeStore';
import type { TypePiece } from '@/api/referentiels.api';

export default function EtapePieces() {
  const theme = useTheme();
  const etape1 = useNouvelleDemandeStore((s) => s.etape1);
  const documents = useNouvelleDemandeStore((s) => s.etape4);
  const ajouterDocument = useNouvelleDemandeStore((s) => s.ajouterDocument);
  const retirerDocument = useNouvelleDemandeStore((s) => s.retirerDocument);
  const { data: typesPieces = [] } = useTypesPieces(etape1?.typeActe);
  const [traitementEnCours, setTraitementEnCours] = useState<string | null>(null);

  if (!etape1) return <Redirect href="/nouvelle-demande/etape-1-type" />;

  async function traiterEtAjouter(uri: string, typePiece: TypePiece) {
    setTraitementEnCours(typePiece.id);
    try {
      const { uri: uriCompressee, mimeType } = await compresserImage(uri);
      ajouterDocument({
        typePieceId: typePiece.id,
        typePieceCode: typePiece.code,
        typePieceLibelle: typePiece.libelle,
        uri: uriCompressee,
        nomFichier: `${typePiece.code}.jpg`,
        mimeType,
      });
    } catch {
      Alert.alert('Erreur', "Impossible d'ajouter cette photo. Réessayez.");
    } finally {
      setTraitementEnCours(null);
    }
  }

  async function ajouterDepuisCamera(typePiece: TypePiece) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès à l'appareil photo pour continuer.");
      return;
    }
    const resultat = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!resultat.canceled && resultat.assets[0]) {
      await traiterEtAjouter(resultat.assets[0].uri, typePiece);
    }
  }

  async function ajouterDepuisGalerie(typePiece: TypePiece) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès à vos photos pour continuer.");
      return;
    }
    const resultat = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!resultat.canceled && resultat.assets[0]) {
      await traiterEtAjouter(resultat.assets[0].uri, typePiece);
    }
  }

  function onSubmit() {
    const typesManquants = typesPieces.filter(
      (type) => type.obligatoire && !documents.some((d) => d.typePieceId === type.id),
    );
    if (typesManquants.length > 0) {
      Alert.alert(
        'Pièces manquantes',
        `Merci d'ajouter : ${typesManquants.map((t) => t.libelle).join(', ')}.`,
      );
      return;
    }
    router.push('/nouvelle-demande/etape-5-recap');
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <BarreProgression etapeActuelle={4} />
      <Text style={[styles.titre, { color: theme.text }]}>Pièces jointes</Text>
      <Text style={{ color: theme.textSecondary }}>
        {"La procuration n'est jamais demandée ici : elle sera signée sur place lors de la visite."}
      </Text>

      {typesPieces.map((type) => {
        const documentsDuType = documents.filter((d) => d.typePieceId === type.id);
        return (
          <View key={type.id} style={[styles.carteType, { backgroundColor: theme.backgroundElement }]}>
            <Text style={{ color: theme.text, fontWeight: '600' }}>
              {type.libelle} {type.obligatoire ? <Text style={{ color: theme.danger }}>*</Text> : null}
            </Text>

            {documentsDuType.length > 0 ? (
              <View style={styles.rangeeApercus}>
                {documentsDuType.map((document) => (
                  <View key={document.id} style={styles.apercu}>
                    <Image source={{ uri: document.uri }} style={styles.image} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Supprimer cette pièce"
                      onPress={() => retirerDocument(document.id)}
                      style={[styles.boutonSupprimer, { backgroundColor: theme.danger }]}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.rangeeActions}>
              <Bouton
                titre="Prendre une photo"
                variante="secondaire"
                enChargement={traitementEnCours === type.id}
                onPress={() => ajouterDepuisCamera(type)}
              />
              <Bouton
                titre="Choisir dans la galerie"
                variante="secondaire"
                enChargement={traitementEnCours === type.id}
                onPress={() => ajouterDepuisGalerie(type)}
              />
            </View>
          </View>
        );
      })}

      <Bouton titre="Continuer" onPress={onSubmit} />
      <Bouton titre="Retour" variante="secondaire" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 20, fontWeight: '700' },
  carteType: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  rangeeActions: { gap: Spacing.two },
  rangeeApercus: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  apercu: { position: 'relative' },
  image: { width: 72, height: 72, borderRadius: 8 },
  boutonSupprimer: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
