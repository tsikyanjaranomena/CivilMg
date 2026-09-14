import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { CONFIG_STATUTS, type StatutDemande } from '@/domain/statuts/statutConfig';
import { useTheme } from '@/hooks/use-theme';

export function BadgeStatut({ statut }: { statut: StatutDemande }) {
  const theme = useTheme();
  const config = CONFIG_STATUTS[statut];
  const couleur = {
    neutral: theme.textSecondary,
    info: theme.primary,
    warning: theme.warning,
    success: theme.success,
    danger: theme.danger,
  }[config.couleur];

  return (
    <View style={[styles.badge, { backgroundColor: couleur + '22', borderColor: couleur }]}>
      <Text style={{ color: couleur, fontWeight: '700', fontSize: 13 }}>{config.libelle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
});
