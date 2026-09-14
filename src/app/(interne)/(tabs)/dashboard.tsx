import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CONFIG_STATUTS, type StatutDemande } from '@/domain/statuts/statutConfig';
import { useIndicateurs } from '@/hooks/queries/useIndicateurs';
import { useProfil } from '@/hooks/queries/useProfil';
import { useTheme } from '@/hooks/use-theme';
import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import { useDeconnexion } from '@/hooks/useDeconnexion';

export default function EcranDashboardResponsable() {
  const theme = useTheme();
  const { data: profil } = useProfil();
  const { data: indicateurs, isLoading } = useIndicateurs();
  const deconnexion = useDeconnexion();

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Text style={[styles.titre, { color: theme.text }]}>Bonjour {profil?.nom || ''}</Text>

      {isLoading || !indicateurs ? (
        <Text style={{ color: theme.textSecondary }}>Chargement des indicateurs…</Text>
      ) : (
        <>
          <View style={styles.grille}>
            <Carte libelle="Visites à planifier" valeur={indicateurs.visitesAPlanifier} theme={theme} />
            <Carte libelle="Visites aujourd'hui" valeur={indicateurs.visitesDuJour} theme={theme} />
            <Carte libelle="Dossiers en retard" valeur={indicateurs.enRetard} couleur={theme.danger} theme={theme} />
            <Carte libelle="Livrés (30j)" valeur={indicateurs.volumeTraite30j} couleur={theme.success} theme={theme} />
          </View>

          <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.sectionTitre, { color: theme.text }]}>Dossiers par statut</Text>
            {Object.entries(indicateurs.parStatut).map(([statut, valeur]) => (
              <View key={statut} style={styles.ligne}>
                <Text style={{ color: theme.text }}>{CONFIG_STATUTS[statut as StatutDemande]?.libelle ?? statut}</Text>
                <Text style={{ color: theme.text, fontWeight: '700' }}>{valeur}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.sectionTitre, { color: theme.text }]}>{"Répartition par type d'acte"}</Text>
            <View style={styles.ligne}>
              <Text style={{ color: theme.text }}>Naissance</Text>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{indicateurs.repartitionTypeActe.naissance}</Text>
            </View>
            <View style={styles.ligne}>
              <Text style={{ color: theme.text }}>Décès</Text>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{indicateurs.repartitionTypeActe.deces}</Text>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.sectionTitre, { color: theme.text }]}>Qualité des visites (30 derniers jours)</Text>
            <Text style={{ color: theme.text }}>
              {"Taux d'absence client : "}
              {indicateurs.tauxVisitesEchoueesAbsence !== null
                ? `${Math.round(indicateurs.tauxVisitesEchoueesAbsence * 100)}%`
                : 'Pas encore de donnée'}
            </Text>
            <Text style={{ color: theme.text }}>
              Délai moyen de traitement :{' '}
              {indicateurs.delaiMoyenTraitementJours !== null
                ? `${indicateurs.delaiMoyenTraitementJours.toFixed(1)} jours`
                : 'Pas encore de donnée'}
            </Text>
          </View>
        </>
      )}

      <Bouton titre="Se déconnecter" variante="secondaire" onPress={deconnexion} />
    </ScrollView>
  );
}

function Carte({
  libelle,
  valeur,
  couleur,
  theme,
}: {
  libelle: string;
  valeur: number;
  couleur?: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
      <Text style={{ color: couleur ?? theme.primary, fontSize: 26, fontWeight: '800' }}>{valeur}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center' }}>{libelle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 24, fontWeight: '700' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  carte: { flexBasis: '47%', flexGrow: 1, borderRadius: 12, padding: Spacing.three, alignItems: 'center', gap: 4 },
  section: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  sectionTitre: { fontWeight: '700', fontSize: 16, marginBottom: Spacing.one },
  ligne: { flexDirection: 'row', justifyContent: 'space-between' },
});
