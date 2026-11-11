import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type NomIcone = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface BoutonProps {
  titre: string;
  onPress: () => void;
  variante?: 'primaire' | 'secondaire' | 'danger' | 'accent';
  icone?: NomIcone;
  desactive?: boolean;
  enChargement?: boolean;
}

export function Bouton({ titre, onPress, variante = 'primaire', icone, desactive, enChargement }: BoutonProps) {
  const theme = useTheme();
  const indisponible = Boolean(desactive || enChargement);

  // Secondaire = bouton « contour » : lisible sur fond clair comme sur une carte blanche.
  // Accent = action principale posée sur un fond bleu (ex. bandeau d'accueil).
  const couleurFond = {
    primaire: theme.primary,
    danger: theme.danger,
    accent: theme.accent,
    secondaire: 'transparent',
  }[variante];
  const couleurBordure = variante === 'secondaire' ? theme.primary : couleurFond;
  const couleurTexte = {
    primaire: theme.primaryText,
    danger: theme.primaryText,
    accent: theme.accentText,
    secondaire: theme.primary,
  }[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: indisponible }}
      onPress={indisponible ? undefined : onPress}
      style={({ pressed }) => [
        styles.bouton,
        {
          backgroundColor: couleurFond,
          borderColor: couleurBordure,
          opacity: indisponible ? 0.55 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {enChargement ? (
        <ActivityIndicator color={couleurTexte} />
      ) : (
        <>
          {icone ? <MaterialCommunityIcons name={icone} size={22} color={couleurTexte} /> : null}
          <Text style={[styles.texte, { color: couleurTexte }]}>{titre}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  texte: {
    fontSize: 17,
    fontWeight: '700',
  },
});
