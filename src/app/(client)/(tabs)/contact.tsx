import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/ui/Bouton';
import { ETUDE } from '@/constants/etude';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Alert } from '@/lib/alerte';

function ouvrir(url: string) {
  Linking.openURL(url).catch(() => Alert.alert('Action impossible', "Cette action n'est pas disponible sur cet appareil."));
}

export default function EcranContact() {
  const theme = useTheme();
  const telephoneSansEspaces = ETUDE.telephone.replace(/\s/g, '');

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Text style={[styles.titre, { color: theme.text }]}>Contact</Text>

      <View style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sousTitre, { color: theme.text }]}>{ETUDE.nom}</Text>
        <Info etiquette="Siège" valeur={ETUDE.siege} theme={theme} />
        <Info etiquette="Téléphone" valeur={ETUDE.telephone} theme={theme} />
        <Info etiquette="Horaires" valeur={ETUDE.horaires} theme={theme} />
      </View>

      <Bouton titre="Appeler l'étude" icone="phone" onPress={() => ouvrir(`tel:${telephoneSansEspaces}`)} />
      <Bouton
        titre="Faire une réclamation par SMS"
        icone="message-text-outline"
        variante="secondaire"
        onPress={() => ouvrir(`sms:${telephoneSansEspaces}?body=${encodeURIComponent('Réclamation : ')}`)}
      />
      <Bouton
        titre="Voir le siège sur la carte"
        icone="map-marker-outline"
        variante="secondaire"
        onPress={() => ouvrir(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ETUDE.siege)}`)}
      />
    </ScrollView>
  );
}

function Info({ etiquette, valeur, theme }: { etiquette: string; valeur: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.info}>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{etiquette}</Text>
      <Text style={{ color: theme.text, fontSize: 16 }}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 24, fontWeight: '700' },
  sousTitre: { fontSize: 18, fontWeight: '700' },
  carte: { borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
  info: { gap: 2 },
});
