import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function retour() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

/** Page hors onglets : en-tête fixe avec un bouton « Retour » bien visible, puis le contenu. */
export function PageAvecRetour({ titre, children }: { titre: string; children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.barre,
          { paddingTop: insets.top + Spacing.two, backgroundColor: theme.backgroundElement, borderBottomColor: theme.border },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={retour}
          hitSlop={12}
          style={({ pressed }) => [styles.boutonRetour, { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.primary} />
          <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '700' }}>Retour</Text>
        </Pressable>
        <Text numberOfLines={1} style={[styles.titre, { color: theme.text }]}>
          {titre}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  boutonRetour: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
  titre: { flex: 1, fontSize: 17, fontWeight: '700' },
});
