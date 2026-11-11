import { describe, expect, it } from 'vitest';

import { estReferenceValide, formatReference, normaliserReference, parserReference } from '@/domain/reference';

describe('formatReference', () => {
  it('produit un numéro court, sans zéros de tête', () => {
    expect(formatReference(2026, 1)).toBe('ACT-2026-1');
    expect(formatReference(2026, 142)).toBe('ACT-2026-142');
  });
});

describe('estReferenceValide', () => {
  it('accepte une référence courte, en majuscules ou minuscules', () => {
    expect(estReferenceValide('ACT-2026-1')).toBe(true);
    expect(estReferenceValide('act-2026-142')).toBe(true);
  });

  it("accepte encore l'ancien format à zéros", () => {
    expect(estReferenceValide('ACT-2026-000142')).toBe(true);
  });

  it('rejette un format invalide', () => {
    expect(estReferenceValide('ACT-26-142')).toBe(false);
    expect(estReferenceValide('XYZ-2026-142')).toBe(false);
    expect(estReferenceValide('ACT-2026-')).toBe(false);
  });
});

describe('parserReference', () => {
  it('extrait année et compteur', () => {
    expect(parserReference('ACT-2026-142')).toEqual({ annee: 2026, compteur: 142 });
  });

  it('retourne null pour un format invalide', () => {
    expect(parserReference('ACT-2026')).toBeNull();
  });
});

describe('normaliserReference', () => {
  it("ramène l'ancien format et les minuscules à la forme courte", () => {
    expect(normaliserReference(' act-2026-000012 ')).toBe('ACT-2026-12');
  });
});
