import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { deconnecter } from '@/api/auth.api';
import { Bouton } from '@/components/ui/Bouton';
import { ChargementPleinEcran } from '@/components/ui/ChargementPleinEcran';
import { Spacing } from '@/constants/theme';
import { useProfil } from '@/hooks/queries/useProfil';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Porte d'entrée : redirige selon l'état d'authentification et le rôle.
 *
 * Ne jamais rediriger vers /connexion tant qu'une session existe : l'écran de
 * connexion renvoie lui-même vers "/" dès qu'il voit une session, ce qui
 * créait une boucle de redirection infinie quand le profil ne se chargeait
 * pas (réseau coupé) ou pendant la déconnexion d'un compte suspendu.
 */
export default function Index() {
  const theme = useTheme();
  const session = useSessionStore((s) => s.session);
  const chargementInitial = useSessionStore((s) => s.chargementInitial);
  const { data: profil, isLoading: profilEnChargement, refetch, isRefetching } = useProfil();

  const compteSuspendu = profil?.statut_compte === 'suspendu';

  useEffect(() => {
    if (compteSuspendu) {
      deconnecter();
    }
  }, [compteSuspendu]);

  if (chargementInitial || (session && profilEnChargement) || compteSuspendu) {
    return <ChargementPleinEcran />;
  }

  if (!session) {
    return <Redirect href="/connexion" />;
  }

  if (!profil) {
    return (
      <View style={[styles.conteneur, { backgroundColor: theme.background }]}>
        <Text style={[styles.titre, { color: theme.text }]}>Impossible de charger votre profil</Text>
        <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
          Vérifiez votre connexion internet puis réessayez.
        </Text>
        <Bouton titre="Réessayer" onPress={() => refetch()} enChargement={isRefetching} />
        <Bouton titre="Se déconnecter" variante="secondaire" onPress={() => deconnecter()} />
      </View>
    );
  }

  return <Redirect href={profil.role === 'responsable' ? '/dashboard' : '/accueil'} />;
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
});
