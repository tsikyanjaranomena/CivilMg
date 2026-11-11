import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BadgeStatut } from '@/components/ui/BadgeStatut';
import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import type { StatutDemande } from '@/domain/statuts/statutConfig';
import { useMesDemandes } from '@/hooks/queries/useMesDemandes';
import { useTheme } from '@/hooks/use-theme';

export default function EcranDossiers() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: demandes = [], isLoading, isRefetching, refetch } = useMesDemandes();

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      data={demandes}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      contentContainerStyle={[styles.liste, { paddingTop: insets.top + Spacing.four }]}
      ListHeaderComponent={
        <View style={styles.entete}>
          <Text style={[styles.titre, { color: theme.text }]}>Mes dossiers</Text>
          <Text style={{ color: theme.textSecondary }}>
            Suivez l&apos;avancement de vos demandes. Appuyez sur un dossier pour voir le détail.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const naissance = item.type_acte === 'naissance';
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Dossier ${item.reference}`}
            onPress={() => router.push(`/dossier/${item.id}`)}
            style={({ pressed }) => [
              styles.carte,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.pastille, { backgroundColor: naissance ? '#E3EDFB' : '#EEE8F8' }]}>
              <MaterialCommunityIcons
                name={naissance ? 'baby-carriage' : 'flower-tulip-outline'}
                size={26}
                color={naissance ? '#1E56A0' : '#6B4FA3'}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>
                {naissance ? 'Acte de naissance' : 'Acte de décès'}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {item.reference} · {format(new Date(item.updated_at), 'd MMM yyyy', { locale: fr })}
              </Text>
              <BadgeStatut statut={item.statut as StatutDemande} />
            </View>
            <MaterialCommunityIcons name="chevron-right" size={26} color={theme.textSecondary} />
          </Pressable>
        );
      }}
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.vide}>
            <MaterialCommunityIcons name="folder-open-outline" size={56} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
              {"Vous n'avez pas encore de dossier."}
            </Text>
            <Bouton titre="Faire une demande" icone="plus" onPress={() => router.push('/accueil')} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  liste: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.two },
  entete: { gap: Spacing.one, marginBottom: Spacing.two },
  titre: { fontSize: 26, fontWeight: '800' },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  pastille: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  vide: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.six },
});
