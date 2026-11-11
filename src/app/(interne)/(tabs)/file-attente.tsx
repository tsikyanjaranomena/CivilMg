import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ETAPES_NOTAIRE, etapeDuStatut, etapeParCle } from '@/components/notaire/etapes';
import { Spacing } from '@/constants/theme';
import { CONFIG_STATUTS, type StatutDemande } from '@/domain/statuts/statutConfig';
import { useFileAttente } from '@/hooks/queries/useFileAttente';
import { useTheme } from '@/hooks/use-theme';

export default function EcranDossiersNotaire() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Le filtre vit dans l'URL : l'accueil peut ouvrir directement « À appeler », etc.
  const { etape: cleEtape } = useLocalSearchParams<{ etape?: string }>();
  const etapeActive = etapeParCle(cleEtape);
  const [recherche, setRecherche] = useState('');
  const { data: demandes = [], isLoading, refetch, isRefetching } = useFileAttente({
    statuts: etapeActive?.statuts,
  });

  const demandesFiltrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return demandes;
    return demandes.filter(
      (d) => d.reference.toLowerCase().includes(terme) || d.nomPersonne.toLowerCase().includes(terme),
    );
  }, [demandes, recherche]);

  const filtres = [{ cle: undefined, court: 'En cours' }, ...ETAPES_NOTAIRE];

  return (
    <View style={[styles.ecran, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <FlatList
        data={demandesFiltrees}
        keyExtractor={(item) => item.id}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={
          <View style={styles.entete}>
            <Text style={[styles.titre, { color: theme.text }]}>Dossiers</Text>
            <View style={[styles.recherche, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <MaterialCommunityIcons name="magnify" size={22} color={theme.textSecondary} />
              <TextInput
                placeholder="Référence ou nom"
                placeholderTextColor={theme.textSecondary}
                value={recherche}
                onChangeText={setRecherche}
                style={[styles.champRecherche, { color: theme.text }]}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtres}>
              {filtres.map((f) => {
                const actif = (f.cle ?? null) === (etapeActive?.cle ?? null);
                return (
                  <Pressable
                    key={f.court}
                    accessibilityRole="button"
                    accessibilityState={{ selected: actif }}
                    onPress={() => router.setParams({ etape: f.cle ?? '' })}
                    style={[
                      styles.puce,
                      { backgroundColor: actif ? theme.primary : theme.backgroundElement, borderColor: actif ? theme.primary : theme.border },
                    ]}
                  >
                    <Text style={{ color: actif ? theme.primaryText : theme.text, fontWeight: '600' }}>{f.court}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => {
          const statut = item.statut as StatutDemande;
          const etape = etapeDuStatut(statut);
          const estNaissance = item.type_acte === 'naissance';
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Dossier ${item.reference}${item.nomPersonne ? `, ${item.nomPersonne}` : ''}`}
              onPress={() => router.push(`/traitement/${item.id}`)}
              style={({ pressed }) => [
                styles.carte,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={[styles.iconeType, { backgroundColor: estNaissance ? '#E3EDFB' : '#EEE8F8' }]}>
                <MaterialCommunityIcons
                  name={estNaissance ? 'baby-carriage' : 'flower-tulip-outline'}
                  size={26}
                  color={estNaissance ? '#1E56A0' : '#6B4FA3'}
                />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
                  {item.nomPersonne || item.reference}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  {item.reference} · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
                </Text>
                {etape ? (
                  <View style={[styles.etiquette, { backgroundColor: etape.fond }]}>
                    <MaterialCommunityIcons name={etape.icone} size={14} color={etape.couleur} />
                    <Text style={{ color: etape.couleur, fontSize: 12, fontWeight: '700' }}>{etape.titre}</Text>
                  </View>
                ) : (
                  <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '700' }}>{CONFIG_STATUTS[statut].libelle}</Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={26} color={theme.textSecondary} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.vide}>
              <MaterialCommunityIcons name="folder-check-outline" size={56} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Aucun dossier ici.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  liste: { padding: Spacing.three, gap: Spacing.two },
  entete: { gap: Spacing.two, marginBottom: Spacing.one },
  titre: { fontSize: 26, fontWeight: '800', marginTop: Spacing.two },
  recherche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
  },
  champRecherche: { flex: 1, fontSize: 16, paddingVertical: Spacing.two },
  filtres: { gap: Spacing.two, paddingVertical: 2 },
  puce: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999, borderWidth: 1 },
  carte: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconeType: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  etiquette: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
  },
  vide: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.six },
});
