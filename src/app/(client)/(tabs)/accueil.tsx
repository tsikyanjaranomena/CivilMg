import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BadgeStatut } from '@/components/ui/BadgeStatut';
import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import { categorieTableauDeBord, type StatutDemande } from '@/domain/statuts/statutConfig';
import { useMesDemandes } from '@/hooks/queries/useMesDemandes';
import { useProfil } from '@/hooks/queries/useProfil';
import { useTheme } from '@/hooks/use-theme';

export default function EcranAccueilClient() {
  const theme = useTheme();
  const { data: profil } = useProfil();
  const { data: demandes = [], isLoading, isRefetching, refetch } = useMesDemandes();

  const compteurs = {
    en_cours: 0,
    pieces_a_completer: 0,
    pret: 0,
    termine: 0,
  };
  for (const demande of demandes) {
    compteurs[categorieTableauDeBord(demande.statut as StatutDemande)] += 1;
  }

  const dossiersAction = demandes.filter(
    (d) => d.statut === 'PIECES_A_COMPLETER' || (d.statut === 'PRET' && d.statut_paiement === 'non_paye'),
  );

  return (
    <View style={[styles.ecran, { backgroundColor: theme.background }]}>
      <FlatList
        data={demandes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={
          <View style={styles.entete}>
            <Text style={[styles.titre, { color: theme.text }]}>Bonjour {profil?.nom || ''}</Text>

            {dossiersAction.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/dossier/${dossiersAction[0].id}`)}
                style={[styles.alerte, { backgroundColor: theme.warning + '22', borderColor: theme.warning }]}
              >
                <Text style={{ color: theme.warning, fontWeight: '700' }}>
                  {dossiersAction.length === 1
                    ? 'Une action est attendue sur votre dossier'
                    : `${dossiersAction.length} dossiers attendent une action de votre part`}
                </Text>
              </Pressable>
            ) : null}

            <View style={styles.cartes}>
              <CarteSynthese libelle="En cours" valeur={compteurs.en_cours} couleur={theme.primary} theme={theme} />
              <CarteSynthese
                libelle="Pièces à compléter"
                valeur={compteurs.pieces_a_completer}
                couleur={theme.warning}
                theme={theme}
              />
              <CarteSynthese libelle="Prêts à retirer" valeur={compteurs.pret} couleur={theme.success} theme={theme} />
              <CarteSynthese libelle="Terminés" valeur={compteurs.termine} couleur={theme.textSecondary} theme={theme} />
            </View>

            <Bouton titre="Nouvelle demande" onPress={() => router.push('/nouvelle-demande')} />

            <Text style={[styles.sousTitre, { color: theme.text }]}>Mes dossiers</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Dossier ${item.reference}`}
            onPress={() => router.push(`/dossier/${item.id}`)}
            style={[styles.carteDossier, { backgroundColor: theme.backgroundElement }]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{item.reference}</Text>
              <Text style={{ color: theme.textSecondary }}>
                {item.type_acte === 'naissance' ? 'Acte de naissance' : 'Acte de décès'}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                Mis à jour le {format(new Date(item.updated_at), 'd MMMM yyyy', { locale: fr })}
              </Text>
            </View>
            <BadgeStatut statut={item.statut as StatutDemande} />
          </Pressable>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <ScrollView contentContainerStyle={styles.vide}>
              <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
                {"Vous n'avez pas encore de dossier. Créez votre première demande."}
              </Text>
            </ScrollView>
          ) : null
        }
      />
    </View>
  );
}

function CarteSynthese({
  libelle,
  valeur,
  couleur,
  theme,
}: {
  libelle: string;
  valeur: number;
  couleur: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.carteSynthese, { backgroundColor: theme.backgroundElement }]}>
      <Text style={{ color: couleur, fontSize: 26, fontWeight: '800' }}>{valeur}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center' }}>{libelle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  liste: { padding: Spacing.four, gap: Spacing.three },
  entete: { gap: Spacing.three, marginBottom: Spacing.two },
  titre: { fontSize: 24, fontWeight: '700' },
  sousTitre: { fontSize: 18, fontWeight: '700', marginTop: Spacing.two },
  alerte: { borderRadius: 10, borderWidth: 1, padding: Spacing.three },
  cartes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  carteSynthese: { flexBasis: '47%', flexGrow: 1, borderRadius: 12, padding: Spacing.three, alignItems: 'center', gap: 4 },
  carteDossier: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  vide: { paddingVertical: Spacing.six },
});
