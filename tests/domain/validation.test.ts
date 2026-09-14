import { describe, expect, it } from 'vitest';

import { adresseSchema } from '@/domain/validation/adresseSchema';
import { etape1Schema, schemaPersonnePourType } from '@/domain/validation/demandeSchema';
import { estTelephoneMalgacheValide } from '@/domain/validation/telephone';
import { compteRenduVisiteSchema } from '@/domain/validation/visiteSchema';

describe('estTelephoneMalgacheValide', () => {
  it('accepte les formats locaux et internationaux', () => {
    expect(estTelephoneMalgacheValide('034 12 345 67')).toBe(true);
    expect(estTelephoneMalgacheValide('+261341234567')).toBe(true);
  });

  it('rejette un numéro trop court ou mal préfixé', () => {
    expect(estTelephoneMalgacheValide('0341234')).toBe(false);
    expect(estTelephoneMalgacheValide('0123456789')).toBe(false);
  });
});

describe('adresseSchema', () => {
  const base = {
    region: 'Analamanga',
    district: 'Antananarivo Avaradrano',
    communeId: '11111111-1111-1111-1111-111111111111',
    fokontany: 'Ambohipo',
    pointsDeRepere: 'Près du marché, portail bleu',
    telephoneSurPlace: '0341234567',
  };

  it('valide une adresse complète', () => {
    expect(adresseSchema.safeParse(base).success).toBe(true);
  });

  it('refuse une adresse sans points de repère suffisants', () => {
    const result = adresseSchema.safeParse({ ...base, pointsDeRepere: 'ici' });
    expect(result.success).toBe(false);
  });
});

describe('etape1Schema', () => {
  it('refuse plus de 20 copies', () => {
    expect(
      etape1Schema.safeParse({ typeActe: 'naissance', nombreCopies: 21 }).success,
    ).toBe(false);
  });
});

describe('schemaPersonnePourType', () => {
  it('exige les parents pour une naissance', () => {
    const schema = schemaPersonnePourType('naissance');
    const result = schema.safeParse({
      nom: 'Rakoto',
      lieuEvenement: 'Antananarivo',
      dateEvenement: '2000-01-01',
      pourSoiMeme: true,
    });
    expect(result.success).toBe(true); // nomPere/nomMere restent optionnels au niveau schéma
  });

  it('utilise le schéma décès sans champs parents', () => {
    const schema = schemaPersonnePourType('deces');
    expect('nomPere' in schema.shape).toBe(false);
  });
});

describe('compteRenduVisiteSchema', () => {
  it('exige un compte rendu et une conclusion quand la visite est effectuée', () => {
    const result = compteRenduVisiteSchema.safeParse({
      statut: 'effectuee',
      procurationRecuperee: true,
    });
    expect(result.success).toBe(false);
  });

  it('exige un motif quand le client est absent', () => {
    const result = compteRenduVisiteSchema.safeParse({
      statut: 'client_absent',
      procurationRecuperee: false,
    });
    expect(result.success).toBe(false);
  });

  it('accepte un compte rendu complet', () => {
    const result = compteRenduVisiteSchema.safeParse({
      statut: 'effectuee',
      compteRendu: 'Pièces vérifiées, tout est en ordre.',
      verificationConcluante: true,
      procurationRecuperee: true,
    });
    expect(result.success).toBe(true);
  });
});
