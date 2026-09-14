import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ChampTexteProps extends TextInputProps {
  etiquette: string;
  erreur?: string;
}

export function ChampTexte({ etiquette, erreur, style, ...props }: ChampTexteProps) {
  const theme = useTheme();

  return (
    <View style={styles.conteneur}>
      <Text style={[styles.etiquette, { color: theme.text }]}>{etiquette}</Text>
      <TextInput
        accessibilityLabel={etiquette}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.champ,
          {
            borderColor: erreur ? theme.danger : theme.border,
            color: theme.text,
            backgroundColor: theme.backgroundElement,
          },
          style,
        ]}
        {...props}
      />
      {erreur ? <Text style={[styles.erreur, { color: theme.danger }]}>{erreur}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { gap: Spacing.one },
  etiquette: { fontSize: 15, fontWeight: '600' },
  champ: {
    minHeight: MinTouchTarget,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  erreur: { fontSize: 13 },
});
