import { z } from 'zod';

import { estTelephoneMalgacheValide } from './telephone';

/**
 * Adresse du client, utilisée pour organiser la visite de vérification.
 * `fokontany` et `pointsDeRepere` sont obligatoires : c'est la donnée
 * critique pour retrouver le client sur place (cf. adresseAutoriseVisite
 * dans statutMachine.ts, qui bloque la planification sans ces champs).
 */
export const adresseSchema = z.object({
  region: z.string().min(2, 'La région est requise.'),
  district: z.string().min(2, 'Le district est requis.'),
  communeId: z.string().uuid('Sélectionnez une commune.'),
  fokontany: z.string().min(2, 'Le fokontany est requis pour organiser la visite.'),
  quartier: z.string().optional(),
  lotNumero: z.string().optional(),
  pointsDeRepere: z
    .string()
    .min(10, 'Décrivez des points de repère précis (au moins une phrase).'),
  telephoneSurPlace: z
    .string()
    .refine(estTelephoneMalgacheValide, 'Numéro de téléphone malgache invalide.'),
  creneauxDisponibilite: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type AdresseFormValues = z.infer<typeof adresseSchema>;
