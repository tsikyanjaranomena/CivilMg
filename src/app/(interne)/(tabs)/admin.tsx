import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import { useDeconnexion } from '@/hooks/useDeconnexion';
import { useTheme } from '@/hooks/use-theme';

export default function EcranAdmin() {
  const theme = useTheme();
  const deconnexion = useDeconnexion();

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Text style={[styles.titre, { color: theme.text }]}>Administration</Text>

      <Bouton titre="Équipe (comptes responsables)" onPress={() => router.push('/admin/equipe')} />
      <Bouton titre="Communes" onPress={() => router.push('/admin/communes')} />
      <Bouton titre="Tarifs et délais" onPress={() => router.push('/admin/parametres')} />
      <Bouton titre="Export CSV" onPress={() => router.push('/admin/export')} />

      <Bouton titre="Se déconnecter" variante="secondaire" onPress={deconnexion} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 24, fontWeight: '700' },
});
