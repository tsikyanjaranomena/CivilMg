import { Alert as AlertNative, Platform, type AlertButton } from 'react-native';

/**
 * Remplaçant de Alert de react-native : sur web, Alert.alert est un no-op
 * (aucune boîte de dialogue), donc on retombe sur window.alert/confirm.
 * Même signature, pour pouvoir changer uniquement l'import.
 */
export const Alert = {
  alert(titre: string, message?: string, boutons?: AlertButton[]): void {
    if (Platform.OS !== 'web') {
      AlertNative.alert(titre, message, boutons);
      return;
    }

    const texte = message ? `${titre}\n\n${message}` : titre;
    const annulation = boutons?.find((b) => b.style === 'cancel');
    const actions = boutons?.filter((b) => b.style !== 'cancel') ?? [];

    if (boutons && boutons.length > 1) {
      if (window.confirm(texte)) {
        actions[0]?.onPress?.();
      } else {
        annulation?.onPress?.();
      }
      return;
    }

    window.alert(texte);
    boutons?.[0]?.onPress?.();
  },
};
