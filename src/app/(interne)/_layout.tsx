import { Redirect, Stack } from 'expo-router';

import { ChargementPleinEcran } from '@/components/ui/ChargementPleinEcran';
import { useProfil } from '@/hooks/queries/useProfil';
import { useSessionStore } from '@/stores/sessionStore';

export default function LayoutInterne() {
  const session = useSessionStore((s) => s.session);
  const { data: profil, isLoading } = useProfil();

  if (!session) return <Redirect href="/connexion" />;
  if (isLoading || !profil) return <ChargementPleinEcran />;
  if (profil.role !== 'responsable') return <Redirect href="/accueil" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
