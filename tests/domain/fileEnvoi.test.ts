import { describe, expect, it } from 'vitest';

import { doitMettreEnFile } from '@/domain/fileEnvoi';

describe('doitMettreEnFile', () => {
  it("met en file dès qu'il n'y a pas de réseau, même sans erreur", () => {
    expect(doitMettreEnFile(false)).toBe(true);
  });

  it('ne met pas en file si connecté et sans erreur', () => {
    expect(doitMettreEnFile(true)).toBe(false);
  });

  it('met en file une erreur réseau alors que connecté (faux positif de détection)', () => {
    expect(doitMettreEnFile(true, new Error('Network request failed'))).toBe(true);
  });

  it("ne met pas en file une erreur métier (ex: transition refusée)", () => {
    expect(doitMettreEnFile(true, new Error('Transition SOUMIS -> PRET non autorisée'))).toBe(false);
  });
});
