import { z } from 'zod';

import { estTelephoneMalgacheValide } from './telephone';

export const inscriptionSchema = z
  .object({
    nom: z.string().min(2, 'Le nom est requis.'),
    telephone: z
      .string()
      .optional()
      .refine((v) => !v || estTelephoneMalgacheValide(v), 'Numéro de téléphone malgache invalide.'),
    email: z.string().email('Adresse email invalide.'),
    motDePasse: z.string().min(8, 'Au moins 8 caractères.'),
    confirmationMotDePasse: z.string(),
  })
  .refine((valeurs) => valeurs.motDePasse === valeurs.confirmationMotDePasse, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmationMotDePasse'],
  });
export type InscriptionValues = z.infer<typeof inscriptionSchema>;

export const connexionSchema = z.object({
  email: z.string().email('Adresse email invalide.'),
  motDePasse: z.string().min(1, 'Mot de passe requis.'),
});
export type ConnexionValues = z.infer<typeof connexionSchema>;

export const reinitialisationMotDePasseSchema = z.object({
  email: z.string().email('Adresse email invalide.'),
});
export type ReinitialisationMotDePasseValues = z.infer<typeof reinitialisationMotDePasseSchema>;
