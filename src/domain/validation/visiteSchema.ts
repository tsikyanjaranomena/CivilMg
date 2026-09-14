import { z } from 'zod';

export const STATUTS_VISITE = [
  'a_planifier',
  'planifiee',
  'effectuee',
  'client_absent',
  'echec',
  'reportee',
] as const;
export type StatutVisite = (typeof STATUTS_VISITE)[number];

/** Planification d'une visite (formulaire responsable). */
export const planificationVisiteSchema = z.object({
  datePlanifiee: z.string().date('Date invalide.'),
  creneau: z.string().min(1, 'Le créneau est requis.'),
});
export type PlanificationVisiteValues = z.infer<typeof planificationVisiteSchema>;

/**
 * Compte rendu de visite saisi par le responsable. Le verrou métier réel
 * (passage à EN_TRAITEMENT impossible sans vérification concluante + la
 * procuration récupérée) est appliqué par visiteAutoriseTraitement().
 */
export const compteRenduVisiteSchema = z
  .object({
    statut: z.enum(STATUTS_VISITE),
    compteRendu: z.string().max(2000).optional(),
    verificationConcluante: z.boolean().optional(),
    procurationRecuperee: z.boolean(),
    motifEchec: z.string().max(500).optional(),
  })
  .superRefine((valeurs, ctx) => {
    if (valeurs.statut === 'effectuee') {
      if (!valeurs.compteRendu?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['compteRendu'],
          message: 'Le compte rendu est requis quand la visite est effectuée.',
        });
      }
      if (valeurs.verificationConcluante === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['verificationConcluante'],
          message: 'Précisez si la vérification est concluante.',
        });
      }
    }
    if ((valeurs.statut === 'client_absent' || valeurs.statut === 'echec') && !valeurs.motifEchec?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['motifEchec'],
        message: 'Le motif est requis.',
      });
    }
  });
export type CompteRenduVisiteValues = z.infer<typeof compteRenduVisiteSchema>;
