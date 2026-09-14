import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Option<T extends string> {
  valeur: T;
  libelle: string;
}

interface ChoixSegmenteProps<T extends string> {
  etiquette: string;
  options: Option<T>[];
  valeur: T | undefined;
  onChangement: (valeur: T) => void;
}

export function ChoixSegmente<T extends string>({
  etiquette,
  options,
  valeur,
  onChangement,
}: ChoixSegmenteProps<T>) {
  const theme = useTheme();

  return (
    <View style={styles.conteneur}>
      <Text style={[styles.etiquette, { color: theme.text }]}>{etiquette}</Text>
      <View style={styles.rangee}>
        {options.map((option) => {
          const selectionne = option.valeur === valeur;
          return (
            <Pressable
              key={option.valeur}
              accessibilityRole="button"
              accessibilityState={{ selected: selectionne }}
              onPress={() => onChangement(option.valeur)}
              style={[
                styles.option,
                {
                  backgroundColor: selectionne ? theme.primary : theme.backgroundElement,
                  borderColor: selectionne ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={{ color: selectionne ? theme.primaryText : theme.text, fontWeight: '600' }}>
                {option.libelle}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { gap: Spacing.one },
  etiquette: { fontSize: 15, fontWeight: '600' },
  rangee: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  option: {
    minHeight: MinTouchTarget,
    minWidth: 100,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
