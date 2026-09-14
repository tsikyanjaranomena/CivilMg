import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Demande la permission puis récupère le jeton push Expo. Retourne null sur
 * web, si la permission est refusée, ou si aucun projectId EAS n'est encore
 * configuré (normal avant la Phase 6) — jamais d'exception qui bloquerait le
 * reste de l'app.
 */
export async function demanderJetonPushExpo(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const permissionActuelle = await Notifications.getPermissionsAsync();
  let statut = permissionActuelle.status;
  if (statut !== 'granted') {
    const demande = await Notifications.requestPermissionsAsync();
    statut = demande.status;
  }
  if (statut !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('Aucun projectId EAS configuré : jeton push non récupéré (normal avant la Phase 6).');
    return null;
  }

  try {
    const jeton = await Notifications.getExpoPushTokenAsync({ projectId });
    return jeton.data;
  } catch (erreur) {
    console.warn("Impossible de récupérer le jeton push Expo :", erreur);
    return null;
  }
}
