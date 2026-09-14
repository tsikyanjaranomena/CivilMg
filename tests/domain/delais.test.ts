import { describe, expect, it } from 'vitest';

import { calculerDateEcheanceEstimee, etatDelai, joursRestants } from '@/domain/delais';

describe('calculerDateEcheanceEstimee', () => {
  it('ajoute des jours ouvrables en sautant le week-end', () => {
    // Lundi 5 janvier 2026 + 5 jours ouvrables -> lundi 12 janvier 2026
    const depart = new Date(2026, 0, 5);
    const echeance = calculerDateEcheanceEstimee(depart, 5);
    expect(echeance.getFullYear()).toBe(2026);
    expect(echeance.getMonth()).toBe(0);
    expect(echeance.getDate()).toBe(12);
  });
});

describe('joursRestants / etatDelai', () => {
  const maintenant = new Date(2026, 0, 10);

  it('détecte un délai dépassé', () => {
    const echeance = new Date(2026, 0, 5);
    expect(etatDelai(echeance, maintenant)).toBe('depasse');
  });

  it('détecte une échéance proche', () => {
    const echeance = new Date(2026, 0, 11);
    expect(etatDelai(echeance, maintenant)).toBe('proche_echeance');
  });

  it('détecte un dossier dans les temps', () => {
    const echeance = new Date(2026, 0, 20);
    expect(etatDelai(echeance, maintenant)).toBe('dans_les_temps');
    expect(joursRestants(echeance, maintenant)).toBe(10);
  });
});
