import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useNotifications } from '@/hooks/queries/useNotifications';

function Icone({ symbole }: { symbole: string }) {
  return <Text style={{ fontSize: 20 }}>{symbole}</Text>;
}

export default function LayoutTabsClient() {
  const theme = useTheme();
  const { data: notifications = [] } = useNotifications();
  const nonLues = notifications.filter((n) => !n.lu).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen
        name="accueil"
        options={{ title: 'Accueil', tabBarIcon: () => <Icone symbole="🏠" /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: () => <Icone symbole="🔔" />,
          tabBarBadge: nonLues > 0 ? nonLues : undefined,
        }}
      />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: () => <Icone symbole="👤" /> }} />
    </Tabs>
  );
}
