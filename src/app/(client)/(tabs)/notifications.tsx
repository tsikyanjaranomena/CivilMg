import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import { useNotifications } from '@/hooks/queries/useNotifications';
import { useMarquerNotificationLue, useMarquerToutesLues } from '@/hooks/mutations/useNotificationsMutations';
import { useTheme } from '@/hooks/use-theme';
import type { NotificationDb } from '@/api/notifications.api';

export default function EcranNotifications() {
  const theme = useTheme();
  const { data: notifications = [] } = useNotifications();
  const marquerLue = useMarquerNotificationLue();
  const marquerToutesLues = useMarquerToutesLues();

  function onAppui(notification: NotificationDb) {
    if (!notification.lu) marquerLue.mutate(notification.id);
    if (notification.demande_id) router.push(`/dossier/${notification.demande_id}`);
  }

  const nonLues = notifications.filter((n) => !n.lu).length;

  return (
    <View style={[styles.ecran, { backgroundColor: theme.background }]}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={
          <View style={styles.entete}>
            <Text style={[styles.titre, { color: theme.text }]}>Notifications</Text>
            {nonLues > 0 ? (
              <Bouton
                titre="Tout marquer comme lu"
                variante="secondaire"
                onPress={() => marquerToutesLues.mutate()}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.titre}${item.lu ? '' : ', non lue'}`}
            onPress={() => onAppui(item)}
            style={[
              styles.carte,
              { backgroundColor: item.lu ? theme.backgroundElement : theme.primary + '15', borderColor: theme.border },
            ]}
          >
            {!item.lu ? <View style={[styles.pointNonLu, { backgroundColor: theme.primary }]} /> : null}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: theme.text, fontWeight: item.lu ? '500' : '700' }}>{item.titre}</Text>
              <Text style={{ color: theme.textSecondary }}>{item.contenu}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.six }}>
            Aucune notification pour le moment.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  liste: { padding: Spacing.four, gap: Spacing.two },
  entete: { gap: Spacing.two, marginBottom: Spacing.two, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titre: { fontSize: 24, fontWeight: '700' },
  carte: { borderRadius: 12, padding: Spacing.three, flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  pointNonLu: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
