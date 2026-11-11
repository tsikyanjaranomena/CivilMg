import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ModuleNotifications = typeof import('expo-notifications');

let moduleCharge: ModuleNotifications | null | undefined;

/**
 * Dans Expo Go (Android, SDK 53+), le simple import d'expo-notifications lève
 * une exception, ce qui faisait échouer le chargement de tout layout qui
 * l'importait. On ne charge donc le module qu'à la demande, jamais dans Expo
 * Go ni sur web (push non supporté), et sous try/catch par sécurité.
 */
export function chargerNotifications(): ModuleNotifications | null {
  if (moduleCharge !== undefined) return moduleCharge;
  moduleCharge = null;
  if (Platform.OS === 'web' || isRunningInExpoGo()) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications: ModuleNotifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    moduleCharge = Notifications;
  } catch (erreur) {
    console.warn('Notifications indisponibles dans cet environnement :', erreur);
  }
  return moduleCharge;
}

/**
 * Demande la permission puis récupère le jeton push Expo. Retourne null sur
 * web, dans Expo Go, si la permission est refusée, ou si aucun projectId EAS
 * n'est configuré — jamais d'exception qui bloquerait le reste de l'app.
 */
export async function demanderJetonPushExpo(): Promise<string | null> {
  const Notifications = chargerNotifications();
  if (!Notifications) return null;

  const permissionActuelle = await Notifications.getPermissionsAsync();
  let statut = permissionActuelle.status;
  if (statut !== 'granted') {
    const demande = await Notifications.requestPermissionsAsync();
    statut = demande.status;
  }
  if (statut !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('Aucun projectId EAS configuré : jeton push non récupéré.');
    return null;
  }

  try {
    const jeton = await Notifications.getExpoPushTokenAsync({ projectId });
    return jeton.data;
  } catch (erreur) {
    console.warn('Impossible de récupérer le jeton push Expo :', erreur);
    return null;
  }
}
