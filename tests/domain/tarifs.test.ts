import { describe, expect, it } from 'vitest';

import { calculerMontant, trouverTarifApplicable, type Tarif } from '@/domain/tarifs';

const tarifs: Tarif[] = [
  { typeActe: 'naissance', communeId: null, montant: 2000 },
  { typeActe: 'deces', communeId: null, montant: 2500 },
  { typeActe: 'naissance', communeId: 'commune-1', montant: 1500 },
];

describe('trouverTarifApplicable', () => {
  it('utilise le tarif spécifique à la commune quand il existe', () => {
    expect(trouverTarifApplicable(tarifs, 'naissance', 'commune-1')?.montant).toBe(1500);
  });

  it('retombe sur le tarif par défaut si aucun tarif spécifique', () => {
    expect(trouverTarifApplicable(tarifs, 'naissance', 'commune-2')?.montant).toBe(2000);
  });

  it('retourne null si aucun tarif ne correspond', () => {
    expect(trouverTarifApplicable(tarifs, 'deces', 'commune-inconnue')?.montant).toBe(2500);
    expect(trouverTarifApplicable([], 'deces', 'commune-1')).toBeNull();
  });
});

describe('calculerMontant', () => {
  it('multiplie le tarif par le nombre de copies', () => {
    expect(calculerMontant(tarifs, 'naissance', 'commune-1', 3)).toBe(4500);
  });

  it('retourne null si pas de tarif applicable', () => {
    expect(calculerMontant([], 'naissance', 'commune-1', 3)).toBeNull();
  });
});
