import { describe, expect, it } from 'vitest';

import { connexionSchema, inscriptionSchema } from '@/domain/validation/authSchema';
import { suiviSchema } from '@/domain/validation/suiviSchema';
import { messageErreurAuth } from '@/lib/auth/messagesErreur';

describe('inscriptionSchema', () => {
  const base = {
    nom: 'Rakoto',
    email: 'rakoto@example.mg',
    motDePasse: 'motdepasse123',
    confirmationMotDePasse: 'motdepasse123',
  };

  it('accepte une inscription valide sans téléphone', () => {
    expect(inscriptionSchema.safeParse(base).success).toBe(true);
  });

  it('refuse des mots de passe qui ne correspondent pas', () => {
    const result = inscriptionSchema.safeParse({ ...base, confirmationMotDePasse: 'autrechose' });
    expect(result.success).toBe(false);
  });

  it('refuse un téléphone mal formé quand fourni', () => {
    const result = inscriptionSchema.safeParse({ ...base, telephone: '123' });
    expect(result.success).toBe(false);
  });
});

describe('connexionSchema', () => {
  it('refuse un email invalide', () => {
    expect(connexionSchema.safeParse({ email: 'pas-un-email', motDePasse: 'x' }).success).toBe(false);
  });
});

describe('suiviSchema', () => {
  it('valide une référence et 4 chiffres', () => {
    expect(
      suiviSchema.safeParse({ reference: 'ACT-2026-000142', derniersChiffresTelephone: '4567' }).success,
    ).toBe(true);
  });

  it('refuse plus ou moins de 4 chiffres', () => {
    expect(
      suiviSchema.safeParse({ reference: 'ACT-2026-000142', derniersChiffresTelephone: '456' }).success,
    ).toBe(false);
  });
});

describe('messageErreurAuth', () => {
  it('traduit les identifiants invalides', () => {
    expect(messageErreurAuth(new Error('Invalid login credentials'))).toBe(
      'Email ou mot de passe incorrect.',
    );
  });

  it('retombe sur un message générique pour une erreur inconnue', () => {
    expect(messageErreurAuth(new Error('boom'))).toBe('Une erreur est survenue. Veuillez réessayer.');
  });
});
