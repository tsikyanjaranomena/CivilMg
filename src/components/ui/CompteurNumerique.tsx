import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CompteurNumeriqueProps {
  etiquette: string;
  valeur: number;
  min?: number;
  max?: number;
  onChangement: (valeur: number) => void;
}

export function CompteurNumerique({ etiquette, valeur, min = 1, max = 20, onChangement }: CompteurNumeriqueProps) {
  const theme = useTheme();

  return (
    <View style={styles.conteneur}>
      <Text style={[styles.etiquette, { color: theme.text }]}>{etiquette}</Text>
      <View style={styles.rangee}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Diminuer"
          disabled={valeur <= min}
          onPress={() => onChangement(Math.max(min, valeur - 1))}
          style={[styles.bouton, { borderColor: theme.border, opacity: valeur <= min ? 0.4 : 1 }]}
        >
          <Text style={[styles.symbole, { color: theme.text }]}>−</Text>
        </Pressable>
        <Text style={[styles.valeur, { color: theme.text }]}>{valeur}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Augmenter"
          disabled={valeur >= max}
          onPress={() => onChangement(Math.min(max, valeur + 1))}
          style={[styles.bouton, { borderColor: theme.border, opacity: valeur >= max ? 0.4 : 1 }]}
        >
          <Text style={[styles.symbole, { color: theme.text }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { gap: Spacing.one },
  etiquette: { fontSize: 15, fontWeight: '600' },
  rangee: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  bouton: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbole: { fontSize: 22, fontWeight: '700' },
  valeur: { fontSize: 20, fontWeight: '700', minWidth: 32, textAlign: 'center' },
});
