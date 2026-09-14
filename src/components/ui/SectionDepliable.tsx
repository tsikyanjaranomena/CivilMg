import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SectionDepliableProps {
  titre: string;
  ouvertParDefaut?: boolean;
  children: ReactNode;
}

export function SectionDepliable({ titre, ouvertParDefaut = false, children }: SectionDepliableProps) {
  const theme = useTheme();
  const [ouvert, setOuvert] = useState(ouvertParDefaut);

  return (
    <View style={[styles.conteneur, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: ouvert }}
        onPress={() => setOuvert((v) => !v)}
        style={styles.entete}
      >
        <Text style={[styles.titre, { color: theme.text }]}>{titre}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 18 }}>{ouvert ? '−' : '+'}</Text>
      </Pressable>
      {ouvert ? <View style={styles.contenu}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { borderRadius: 12, overflow: 'hidden' },
  entete: {
    minHeight: MinTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  titre: { fontWeight: '700', fontSize: 16 },
  contenu: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.two },
});
