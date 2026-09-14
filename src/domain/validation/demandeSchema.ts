import { z } from 'zod';

export const TYPES_ACTE = ['naissance', 'deces'] as const;
export type TypeActe = (typeof TYPES_ACTE)[number];

/** Étape 1 : type d'acte, nombre de copies, motif. */
export const etape1Schema = z.object({
  typeActe: z.enum(TYPES_ACTE),
  nombreCopies: z.number().int().min(1, 'Au moins une copie.').max(20, 'Maximum 20 copies.'),
  motif: z.string().max(500).optional(),
});
export type Etape1Values = z.infer<typeof etape1Schema>;

/**
 * Étape 2 : personne concernée par l'acte.
 * `pourSoiMeme` informe uniquement l'agent de ce qu'il devra vérifier sur
 * place — elle ne déclenche jamais de formulaire de procuration.
 */
const champsCommunsPersonne = {
  nom: z.string().min(1, 'Le nom est requis.'),
  prenoms: z.string().optional(),
  lieuEvenement: z.string().min(1, 'Le lieu est requis.'),
  numeroActe: z.string().optional(),
  anneeActe: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  communeEnregistrementId: z.string().uuid().optional(),
  pourSoiMeme: z.boolean(),
};

export const personneNaissanceSchema = z.object({
  ...champsCommunsPersonne,
  dateEvenement: z.string().date('Date de naissance invalide.'),
  nomPere: z.string().optional(),
  nomMere: z.string().optional(),
});

export const personneDecesSchema = z.object({
  ...champsCommunsPersonne,
  dateEvenement: z.string().date('Date de décès invalide.'),
});

export function schemaPersonnePourType(typeActe: TypeActe) {
  return typeActe === 'naissance' ? personneNaissanceSchema : personneDecesSchema;
}

export type PersonneNaissanceValues = z.infer<typeof personneNaissanceSchema>;
export type PersonneDecesValues = z.infer<typeof personneDecesSchema>;
export type PersonneValues = PersonneNaissanceValues | PersonneDecesValues;
