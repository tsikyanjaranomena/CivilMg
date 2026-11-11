import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ChampTexteProps extends TextInputProps {
  etiquette: string;
  erreur?: string;
}

export function ChampTexte({ etiquette, erreur, style, multiline, ...props }: ChampTexteProps) {
  const theme = useTheme();

  return (
    <View style={styles.conteneur}>
      <Text style={[styles.etiquette, { color: theme.textSecondary }]}>{etiquette}</Text>
      <TextInput
        accessibilityLabel={etiquette}
        placeholderTextColor={theme.textSecondary}
        multiline={multiline}
        style={[
          styles.champ,
          multiline ? styles.champMultiligne : null,
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
  conteneur: { gap: 6 },
  etiquette: { fontSize: 14, fontWeight: '600' },
  champ: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  champMultiligne: { minHeight: 90, paddingTop: Spacing.three, textAlignVertical: 'top' },
  erreur: { fontSize: 13 },
});
