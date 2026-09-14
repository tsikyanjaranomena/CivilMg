import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ETAPES = ['Type', 'Personne', 'Adresse', 'Pièces', 'Récapitulatif'];

export function BarreProgression({ etapeActuelle }: { etapeActuelle: number }) {
  const theme = useTheme();

  return (
    <View style={styles.conteneur}>
      <View style={styles.rangeePoints}>
        {ETAPES.map((libelle, index) => {
          const numero = index + 1;
          const atteinte = numero <= etapeActuelle;
          return (
            <View key={libelle} style={styles.point}>
              <View
                style={[
                  styles.cercle,
                  { backgroundColor: atteinte ? theme.primary : theme.backgroundElement, borderColor: theme.border },
                ]}
              >
                <Text style={{ color: atteinte ? theme.primaryText : theme.textSecondary, fontWeight: '700' }}>
                  {numero}
                </Text>
              </View>
              {index < ETAPES.length - 1 ? (
                <View style={[styles.trait, { backgroundColor: numero < etapeActuelle ? theme.primary : theme.border }]} />
              ) : null}
            </View>
          );
        })}
      </View>
      <Text style={[styles.libelleEtape, { color: theme.text }]}>
        Étape {etapeActuelle} sur {ETAPES.length} — {ETAPES[etapeActuelle - 1]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { gap: Spacing.one, paddingVertical: Spacing.two },
  rangeePoints: { flexDirection: 'row', alignItems: 'center' },
  point: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cercle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  trait: { flex: 1, height: 2 },
  libelleEtape: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
