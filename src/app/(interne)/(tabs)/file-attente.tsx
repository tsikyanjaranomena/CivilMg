import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BadgeStatut } from '@/components/ui/BadgeStatut';
import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import type { StatutDemande } from '@/domain/statuts/statutConfig';
import { useFileAttente } from '@/hooks/queries/useFileAttente';
import { usePrendreEnCharge } from '@/hooks/mutations/usePrendreEnCharge';
import { useSessionStore } from '@/stores/sessionStore';
import { useTheme } from '@/hooks/use-theme';

type FiltrePriseEnCharge = 'tous' | 'non_pris' | 'moi';

export default function EcranFileAttente() {
  const theme = useTheme();
  const userId = useSessionStore((s) => s.session?.user.id);
  const [recherche, setRecherche] = useState('');
  const [filtrePriseEnCharge, setFiltrePriseEnCharge] = useState<FiltrePriseEnCharge>('tous');
  const { data: demandes = [], isLoading, refetch, isRefetching } = useFileAttente({
    prisEnCharge: filtrePriseEnCharge,
    responsableId: userId,
  });
  const prendreEnCharge = usePrendreEnCharge();

  const demandesFiltrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return demandes;
    return demandes.filter(
      (d) => d.reference.toLowerCase().includes(terme) || d.nomPersonne.toLowerCase().includes(terme),
    );
  }, [demandes, recherche]);

  return (
    <View style={[styles.ecran, { backgroundColor: theme.background }]}>
      <FlatList
        data={demandesFiltrees}
        keyExtractor={(item) => item.id}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={
          <View style={styles.entete}>
            <Text style={[styles.titre, { color: theme.text }]}>{"File d'attente"}</Text>
            <TextInput
              placeholder="Rechercher par référence ou nom"
              placeholderTextColor={theme.textSecondary}
              value={recherche}
              onChangeText={setRecherche}
              style={[styles.recherche, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <View style={styles.filtres}>
              {(['tous', 'non_pris', 'moi'] as FiltrePriseEnCharge[]).map((valeur) => (
                <Pressable
                  key={valeur}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filtrePriseEnCharge === valeur }}
                  onPress={() => setFiltrePriseEnCharge(valeur)}
                  style={[
                    styles.puce,
                    {
                      backgroundColor: filtrePriseEnCharge === valeur ? theme.primary : theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: filtrePriseEnCharge === valeur ? theme.primaryText : theme.text, fontWeight: '600' }}>
                    {valeur === 'tous' ? 'Tous' : valeur === 'non_pris' ? 'Non pris en charge' : 'Mes dossiers'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Dossier ${item.reference}${item.nomPersonne ? `, ${item.nomPersonne}` : ''}`}
            onPress={() => router.push(`/traitement/${item.id}`)}
            style={[styles.carte, { backgroundColor: theme.backgroundElement }]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{item.reference}</Text>
              {item.nomPersonne ? <Text style={{ color: theme.textSecondary }}>{item.nomPersonne}</Text> : null}
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                Créé {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
              </Text>
              <BadgeStatut statut={item.statut as StatutDemande} />
            </View>
            {!item.pris_en_charge_par ? (
              <Bouton
                titre="Prendre en charge"
                variante="secondaire"
                enChargement={prendreEnCharge.isPending}
                onPress={() => prendreEnCharge.mutate(item.id)}
              />
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.six }}>
              Aucun dossier ne correspond à ces critères.
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  liste: { padding: Spacing.four, gap: Spacing.two },
  entete: { gap: Spacing.two, marginBottom: Spacing.two },
  titre: { fontSize: 24, fontWeight: '700' },
  recherche: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: Spacing.three, fontSize: 16 },
  filtres: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  puce: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: 999, borderWidth: 1 },
  carte: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
});
