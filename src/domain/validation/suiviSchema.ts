import { z } from 'zod';

import { estReferenceValide } from '../reference';

export const suiviSchema = z.object({
  reference: z.string().refine(estReferenceValide, 'Format attendu : ACT-2026-12.'),
  derniersChiffresTelephone: z.string().regex(/^\d{4}$/, 'Saisissez les 4 derniers chiffres.'),
});
export type SuiviValues = z.infer<typeof suiviSchema>;
