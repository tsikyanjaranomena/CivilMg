import { describe, expect, it } from 'vitest';

import {
  adresseAutoriseVisite,
  estTerminal,
  motifClientObligatoire,
  peutTransitionner,
  transitionsDisponibles,
  visiteAutoriseTraitement,
} from '@/domain/statuts/statutMachine';

describe('peutTransitionner', () => {
  it('autorise le client à soumettre un brouillon', () => {
    expect(peutTransitionner('BROUILLON', 'SOUMIS', 'client')).toBe(true);
  });

  it("refuse au client de passer une demande en EN_VALIDATION", () => {
    expect(peutTransitionner('EN_TRAITEMENT', 'EN_VALIDATION', 'client')).toBe(false);
  });

  it('refuse une transition non prévue par la machine à états', () => {
    expect(peutTransitionner('SOUMIS', 'LIVRE', 'responsable')).toBe(false);
  });

  it('seul le responsable peut atteindre PRET, REJETE, LIVRE', () => {
    expect(peutTransitionner('EN_VALIDATION', 'PRET', 'responsable')).toBe(true);
    expect(peutTransitionner('EN_VALIDATION', 'PRET', 'client')).toBe(false);
    expect(peutTransitionner('PRET', 'LIVRE', 'responsable')).toBe(true);
    expect(peutTransitionner('PRET', 'LIVRE', 'client')).toBe(false);
  });
});

describe('transitionsDisponibles', () => {
  it('liste les transitions responsable depuis SOUMIS', () => {
    expect(transitionsDisponibles('SOUMIS', 'responsable').sort()).toEqual(
      ['ANNULE', 'PIECES_A_COMPLETER', 'VISITE_PLANIFIEE'].sort(),
    );
  });

  it('les statuts terminaux ne proposent aucune transition', () => {
    expect(transitionsDisponibles('LIVRE', 'responsable')).toEqual([]);
  });
});

describe('estTerminal', () => {
  it('LIVRE, REJETE et ANNULE sont terminaux', () => {
    expect(estTerminal('LIVRE')).toBe(true);
    expect(estTerminal('REJETE')).toBe(true);
    expect(estTerminal('ANNULE')).toBe(true);
  });

  it("SOUMIS n'est pas terminal", () => {
    expect(estTerminal('SOUMIS')).toBe(false);
  });
});

describe('motifClientObligatoire', () => {
  it('exige un motif pour un rejet', () => {
    expect(motifClientObligatoire('EN_VALIDATION', 'REJETE')).toBe(true);
  });

  it("n'exige pas de motif pour une mise en traitement", () => {
    expect(motifClientObligatoire('VISITE_PLANIFIEE', 'EN_TRAITEMENT')).toBe(false);
  });
});

describe('visiteAutoriseTraitement', () => {
  it('autorise le traitement si la visite est effectuée, concluante et la procuration récupérée', () => {
    expect(
      visiteAutoriseTraitement({
        statut: 'effectuee',
        verificationConcluante: true,
        procurationRecuperee: true,
      }),
    ).toBe(true);
  });

  it('bloque le traitement si la procuration papier n\'a pas été récupérée', () => {
    expect(
      visiteAutoriseTraitement({
        statut: 'effectuee',
        verificationConcluante: true,
        procurationRecuperee: false,
      }),
    ).toBe(false);
  });

  it('bloque le traitement si la vérification n\'est pas concluante', () => {
    expect(
      visiteAutoriseTraitement({
        statut: 'effectuee',
        verificationConcluante: false,
        procurationRecuperee: true,
      }),
    ).toBe(false);
  });

  it('bloque le traitement si la visite n\'a pas encore eu lieu', () => {
    expect(
      visiteAutoriseTraitement({
        statut: 'planifiee',
        verificationConcluante: null,
        procurationRecuperee: false,
      }),
    ).toBe(false);
  });
});

describe('adresseAutoriseVisite', () => {
  it("refuse une adresse sans fokontany ni points de repère", () => {
    expect(adresseAutoriseVisite({ fokontany: '', pointsDeRepere: '' })).toBe(false);
    expect(adresseAutoriseVisite({ fokontany: undefined, pointsDeRepere: 'près du marché' })).toBe(
      false,
    );
  });

  it('autorise une adresse complète', () => {
    expect(
      adresseAutoriseVisite({ fokontany: 'Ambohipo', pointsDeRepere: 'près du marché' }),
    ).toBe(true);
  });
});

describe('circuit simplifié du notaire', () => {
  it('autorise le notaire à passer directement de EN_TRAITEMENT à PRET', () => {
    expect(peutTransitionner('EN_TRAITEMENT', 'PRET', 'responsable')).toBe(true);
    expect(peutTransitionner('EN_TRAITEMENT', 'PRET', 'client')).toBe(false);
  });
});
