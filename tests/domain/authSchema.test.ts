import { describe, expect, it } from 'vitest';

import { connexionSchema, inscriptionSchema } from '@/domain/validation/authSchema';
import { suiviSchema } from '@/domain/validation/suiviSchema';
import { versFormatInternational, versFormatLocal } from '@/domain/validation/telephone';
import { messageErreurAuth } from '@/lib/auth/messagesErreur';

describe('inscriptionSchema', () => {
  const base = {
    nom: 'Rakoto',
    telephone: '034 12 345 67',
    motDePasse: 'motdepasse123',
    confirmationMotDePasse: 'motdepasse123',
  };

  it('accepte une inscription avec téléphone, sans e-mail', () => {
    expect(inscriptionSchema.safeParse(base).success).toBe(true);
  });

  it('exige un numéro de téléphone', () => {
    expect(inscriptionSchema.safeParse({ ...base, telephone: '' }).success).toBe(false);
  });

  it('refuse des mots de passe qui ne correspondent pas', () => {
    expect(inscriptionSchema.safeParse({ ...base, confirmationMotDePasse: 'autrechose' }).success).toBe(false);
  });

  it('refuse un téléphone mal formé', () => {
    expect(inscriptionSchema.safeParse({ ...base, telephone: '123' }).success).toBe(false);
  });
});

describe('connexionSchema', () => {
  it('accepte un numéro malgache et un mot de passe', () => {
    expect(connexionSchema.safeParse({ telephone: '0341234567', motDePasse: 'x' }).success).toBe(true);
  });

  it('refuse un numéro invalide', () => {
    expect(connexionSchema.safeParse({ telephone: '12', motDePasse: 'x' }).success).toBe(false);
  });
});

describe('formats de téléphone', () => {
  it('convertit le format local en format international pour Supabase', () => {
    expect(versFormatInternational('034 12 345 67')).toBe('+261341234567');
    expect(versFormatInternational('+261341234567')).toBe('+261341234567');
  });

  it('convertit le format international en format local pour l’affichage', () => {
    expect(versFormatLocal('261341234567')).toBe('0341234567');
    expect(versFormatLocal('+261341234567')).toBe('0341234567');
  });
});

describe('suiviSchema', () => {
  it('valide une référence et 4 chiffres', () => {
    expect(suiviSchema.safeParse({ reference: 'ACT-2026-12', derniersChiffresTelephone: '4567' }).success).toBe(true);
  });

  it('refuse plus ou moins de 4 chiffres', () => {
    expect(suiviSchema.safeParse({ reference: 'ACT-2026-12', derniersChiffresTelephone: '456' }).success).toBe(false);
  });
});

describe('messageErreurAuth', () => {
  it('traduit les identifiants invalides', () => {
    expect(messageErreurAuth(new Error('Invalid login credentials'))).toBe(
      'Numéro de téléphone ou mot de passe incorrect.',
    );
  });

  it('retombe sur un message générique pour une erreur inconnue', () => {
    expect(messageErreurAuth(new Error('boom'))).toBe('Une erreur est survenue. Veuillez réessayer.');
  });
});
