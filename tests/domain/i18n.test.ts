import { describe, expect, it } from 'vitest';

import { traduire } from '@/lib/i18n';

describe('traduire', () => {
  it('résout une clé imbriquée existante', () => {
    expect(traduire('fr', 'commun.annuler')).toBe('Annuler');
  });

  it('retombe sur la clé elle-même si introuvable', () => {
    expect(traduire('fr', 'inconnu.cle')).toBe('inconnu.cle');
  });

  it('retombe sur le français si la langue demandée n\'a pas de dictionnaire', () => {
    expect(traduire('mg', 'commun.annuler')).toBe('Annuler');
  });

  it('interpole les paramètres', () => {
    expect(traduire('fr', 'commun.annuler', { x: 'ignoré' })).toBe('Annuler');
  });
});
