import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import { useProfil } from '@/hooks/queries/useProfil';
import { useDeconnexion } from '@/hooks/useDeconnexion';
import { useTheme } from '@/hooks/use-theme';

export default function EcranProfil() {
  const theme = useTheme();
  const { data: profil } = useProfil();
  const deconnexion = useDeconnexion();

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Text style={[styles.titre, { color: theme.text }]}>Mon profil</Text>

      <View style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Champ etiquette="Nom" valeur={profil?.nom} theme={theme} />
        <Champ etiquette="Téléphone" valeur={profil?.telephone} theme={theme} />
      </View>

      <Bouton titre="Se déconnecter" variante="danger" onPress={deconnexion} />
    </ScrollView>
  );
}

function Champ({ etiquette, valeur, theme }: { etiquette: string; valeur?: string | null; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.champ}>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{etiquette}</Text>
      <Text style={{ color: theme.text, fontSize: 16 }}>{valeur || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, paddingTop: Spacing.six, gap: Spacing.three },
  titre: { fontSize: 26, fontWeight: '800' },
  carte: { borderRadius: 16, borderWidth: 1, padding: Spacing.three, gap: Spacing.three },
  champ: { gap: 2 },
});
