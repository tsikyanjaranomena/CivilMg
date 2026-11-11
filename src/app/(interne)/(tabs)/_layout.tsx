import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import type { NomIcone } from '@/components/ui/Bouton';
import { useTheme } from '@/hooks/use-theme';

function icone(nom: NomIcone) {
  return function IconeOnglet({ color, size }: { color: ColorValue; size: number }) {
    return <MaterialCommunityIcons name={nom} color={color} size={size + 2} />;
  };
}

export default function LayoutTabsInterne() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.backgroundElement, borderTopColor: theme.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', paddingBottom: 6 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Accueil', tabBarIcon: icone('home-variant') }} />
      <Tabs.Screen name="file-attente" options={{ title: 'Dossiers', tabBarIcon: icone('folder-account-outline') }} />
      <Tabs.Screen name="planning" options={{ title: 'Visites', tabBarIcon: icone('calendar-month-outline') }} />
    </Tabs>
  );
}
