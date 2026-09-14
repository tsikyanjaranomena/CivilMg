import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface BoutonProps {
  titre: string;
  onPress: () => void;
  variante?: 'primaire' | 'secondaire' | 'danger';
  desactive?: boolean;
  enChargement?: boolean;
}

export function Bouton({ titre, onPress, variante = 'primaire', desactive, enChargement }: BoutonProps) {
  const theme = useTheme();
  const indisponible = Boolean(desactive || enChargement);

  const couleurFond =
    variante === 'primaire' ? theme.primary : variante === 'danger' ? theme.danger : theme.backgroundElement;
  const couleurTexte = variante === 'secondaire' ? theme.text : theme.primaryText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: indisponible }}
      onPress={indisponible ? undefined : onPress}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: couleurFond, opacity: indisponible ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      {enChargement ? (
        <ActivityIndicator color={couleurTexte} />
      ) : (
        <Text style={[styles.texte, { color: couleurTexte }]}>{titre}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    minHeight: MinTouchTarget,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  texte: {
    fontSize: 17,
    fontWeight: '600',
  },
});
