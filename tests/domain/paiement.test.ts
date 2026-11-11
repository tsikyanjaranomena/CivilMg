import { describe, expect, it } from 'vitest';

import { FRAIS, FRAIS_TOTAL, formaterAriary } from '@/domain/paiement';

describe('frais du notaire', () => {
  it('5 000 Ar à la visite, 15 000 Ar à la remise', () => {
    expect(FRAIS.visite).toBe(5000);
    expect(FRAIS.remise).toBe(15000);
    expect(FRAIS_TOTAL).toBe(20000);
  });

  it('formate les montants en ariary', () => {
    expect(formaterAriary(5000)).toBe('5 000 Ar');
    expect(formaterAriary(15000)).toBe('15 000 Ar');
    expect(formaterAriary(500)).toBe('500 Ar');
  });
});
