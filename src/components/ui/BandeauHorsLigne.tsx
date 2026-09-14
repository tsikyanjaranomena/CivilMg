import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useEtatReseau } from '@/hooks/useEtatReseau';
import { useTraduction } from '@/hooks/useTraduction';
import { useTheme } from '@/hooks/use-theme';

export function BandeauHorsLigne() {
  const theme = useTheme();
  const { horsLigne } = useEtatReseau();
  const { t } = useTraduction();

  if (!horsLigne) return null;

  return (
    <View style={[styles.bandeau, { backgroundColor: theme.warning }]} accessibilityRole="alert">
      <Text style={styles.texte}>{t('horsLigne.bandeau')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: { paddingVertical: 6, paddingHorizontal: Spacing.three, alignItems: 'center' },
  texte: { color: '#1A1300', fontWeight: '700', fontSize: 13, textAlign: 'center' },
});
