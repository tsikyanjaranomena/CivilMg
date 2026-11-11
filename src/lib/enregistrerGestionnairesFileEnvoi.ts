import { changerStatutDemande } from '@/api/demandes.api';
import { marquerNotificationLue } from '@/api/notifications.api';
import type { StatutDemandeDb } from '@/types/database.types';

import { enregistrerGestionnaireFileEnvoi } from './fileEnvoi';

let dejaEnregistres = false;

/** Associe chaque type d'action de la file d'envoi à sa fonction de rejeu. Idempotent. */
export function enregistrerGestionnairesFileEnvoi() {
  if (dejaEnregistres) return;
  dejaEnregistres = true;

  enregistrerGestionnaireFileEnvoi<{
    demandeId: string;
    nouveauStatut: StatutDemandeDb;
    commentaireClient?: string;
  }>('changer_statut_demande', (p) => changerStatutDemande(p.demandeId, p.nouveauStatut, p.commentaireClient));

  enregistrerGestionnaireFileEnvoi<{ id: string }>('marquer_notification_lue', (p) => marquerNotificationLue(p.id));
}
