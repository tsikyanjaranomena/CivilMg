import { describe, expect, it } from 'vitest';

import { estReferenceValide, formatReference, parserReference } from '@/domain/reference';

describe('formatReference', () => {
  it('formate le compteur sur 6 chiffres', () => {
    expect(formatReference(2026, 142)).toBe('ACT-2026-000142');
  });
});

describe('estReferenceValide', () => {
  it('accepte une référence bien formée', () => {
    expect(estReferenceValide('ACT-2026-000142')).toBe(true);
    expect(estReferenceValide('act-2026-000142')).toBe(true);
  });

  it('rejette un format invalide', () => {
    expect(estReferenceValide('ACT-26-142')).toBe(false);
    expect(estReferenceValide('XYZ-2026-000142')).toBe(false);
  });
});

describe('parserReference', () => {
  it('extrait année et compteur', () => {
    expect(parserReference('ACT-2026-000142')).toEqual({ annee: 2026, compteur: 142 });
  });

  it('retourne null pour un format invalide', () => {
    expect(parserReference('ACT-2026-142')).toBeNull();
  });
});
