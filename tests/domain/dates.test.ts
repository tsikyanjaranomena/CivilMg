import { describe, expect, it } from 'vitest';

import { formaterDateFr } from '@/domain/dates';

describe('formaterDateFr', () => {
  it('convertit AAAA-MM-JJ en JJ/MM/AAAA', () => {
    expect(formaterDateFr('2026-11-17')).toBe('17/11/2026');
  });

  it('ignore la partie heure d\'un timestamp', () => {
    expect(formaterDateFr('2026-11-17T23:30:00Z')).toBe('17/11/2026');
  });

  it('renvoie une chaîne vide pour une valeur absente', () => {
    expect(formaterDateFr(null)).toBe('');
  });
});
