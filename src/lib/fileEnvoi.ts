import NetInfo from '@react-native-community/netinfo';

import { doitMettreEnFile } from '@/domain/fileEnvoi';
import { useFileEnvoiStore } from '@/stores/fileEnvoiStore';

type Gestionnaire = (payload: never) => Promise<void>;

const gestionnaires = new Map<string, Gestionnaire>();

/** Enregistre le gestionnaire capable de rejouer une action de ce type. À appeler une fois au démarrage de l'app. */
export function enregistrerGestionnaireFileEnvoi<P>(type: string, gestionnaire: (payload: P) => Promise<void>) {
  gestionnaires.set(type, gestionnaire as Gestionnaire);
}

/**
 * Exécute une action tout de suite si le réseau répond ; sinon (ou en cas
 * d'erreur réseau constatée), la met en file pour un envoi différé et
 * résout silencieusement — l'appelant considère l'action comme acceptée
 * (cohérent avec "les brouillons/actions sont conservés hors ligne").
 */
export async function executerAvecRepli<P>(type: string, payload: P, executer: (payload: P) => Promise<void>): Promise<void> {
  const etatReseau = await NetInfo.fetch();
  if (!etatReseau.isConnected) {
    useFileEnvoiStore.getState().ajouter(type, payload);
    return;
  }
  try {
    await executer(payload);
  } catch (erreur) {
    if (doitMettreEnFile(true, erreur)) {
      useFileEnvoiStore.getState().ajouter(type, payload);
      return;
    }
    throw erreur;
  }
}

/** Rejoue les actions en attente, dans l'ordre, en s'arrêtant à la première qui échoue encore. */
export async function traiterFileEnvoi(): Promise<void> {
  const { actions, retirer } = useFileEnvoiStore.getState();
  for (const action of actions) {
    const gestionnaire = gestionnaires.get(action.type);
    if (!gestionnaire) {
      retirer(action.id);
      continue;
    }
    try {
      await gestionnaire(action.payload as never);
      retirer(action.id);
    } catch {
      break;
    }
  }
}
