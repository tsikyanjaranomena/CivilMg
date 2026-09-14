import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

function Icone({ symbole }: { symbole: string }) {
  return <Text style={{ fontSize: 20 }}>{symbole}</Text>;
}

export default function LayoutTabsInterne() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Tableau de bord', tabBarIcon: () => <Icone symbole="📊" /> }} />
      <Tabs.Screen name="file-attente" options={{ title: 'File d’attente', tabBarIcon: () => <Icone symbole="📋" /> }} />
      <Tabs.Screen name="planning" options={{ title: 'Visites', tabBarIcon: () => <Icone symbole="🗓️" /> }} />
      <Tabs.Screen name="admin" options={{ title: 'Admin', tabBarIcon: () => <Icone symbole="⚙️" /> }} />
    </Tabs>
  );
}
