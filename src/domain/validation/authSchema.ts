import { z } from 'zod';

import { estTelephoneMalgacheValide } from './telephone';

// Le client s'identifie uniquement par son numéro de téléphone (pas d'e-mail).
const champTelephone = z.string().refine(estTelephoneMalgacheValide, 'Numéro de téléphone malgache invalide.');

export const inscriptionSchema = z
  .object({
    nom: z.string().min(2, 'Le nom est requis.'),
    telephone: champTelephone,
    motDePasse: z.string().min(8, 'Au moins 8 caractères.'),
    confirmationMotDePasse: z.string(),
  })
  .refine((valeurs) => valeurs.motDePasse === valeurs.confirmationMotDePasse, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmationMotDePasse'],
  });
export type InscriptionValues = z.infer<typeof inscriptionSchema>;

export const connexionSchema = z.object({
  telephone: champTelephone,
  motDePasse: z.string().min(1, 'Mot de passe requis.'),
});
export type ConnexionValues = z.infer<typeof connexionSchema>;
