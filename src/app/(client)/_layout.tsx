import { Redirect, Stack } from 'expo-router';

import { ChargementPleinEcran } from '@/components/ui/ChargementPleinEcran';
import { useProfil } from '@/hooks/queries/useProfil';
import { useEnregistrementPush } from '@/hooks/useEnregistrementPush';
import { useNavigationDepuisNotification } from '@/hooks/useNavigationDepuisNotification';
import { useSessionStore } from '@/stores/sessionStore';

export default function LayoutClient() {
  const session = useSessionStore((s) => s.session);
  const { data: profil, isLoading } = useProfil();

  useEnregistrementPush();
  useNavigationDepuisNotification();

  if (!session) return <Redirect href="/connexion" />;
  if (isLoading || !profil) return <ChargementPleinEcran />;
  if (profil.role !== 'client') return <Redirect href="/dashboard" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
