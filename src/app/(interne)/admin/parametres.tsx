import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { Spacing } from '@/constants/theme';
import { useDelaisStandards, useTarifs } from '@/hooks/queries/useReferentiels';
import { useDefinirDelaiStandard, useDefinirTarif } from '@/hooks/mutations/useReferentielsMutations';
import { useTheme } from '@/hooks/use-theme';
import type { TypeActeDb } from '@/types/database.types';

const TYPES: { valeur: TypeActeDb; libelle: string }[] = [
  { valeur: 'naissance', libelle: 'Acte de naissance' },
  { valeur: 'deces', libelle: 'Acte de décès' },
];

export default function EcranParametres() {
  const theme = useTheme();
  const { data: tarifs = [] } = useTarifs();
  const { data: delais = [] } = useDelaisStandards();
  const definirTarif = useDefinirTarif();
  const definirDelai = useDefinirDelaiStandard();

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Bouton titre="← Retour" variante="secondaire" onPress={() => router.back()} />
      <Text style={[styles.titre, { color: theme.text }]}>Tarifs et délais</Text>
      <Text style={{ color: theme.textSecondary }}>
        {"Tarif par défaut (hors commune spécifique) et délai standard, par type d'acte."}
      </Text>

      {TYPES.map((type) => {
        const tarifActuel = tarifs.find((t) => t.type_acte === type.valeur && t.commune_id === null);
        const delaiActuel = delais.find((d) => d.type_acte === type.valeur);
        return (
          <LigneParametre
            key={type.valeur}
            libelle={type.libelle}
            montantInitial={tarifActuel?.montant}
            joursInitial={delaiActuel?.jours_ouvrables}
            theme={theme}
            enregistrementTarif={(montant) =>
              definirTarif.mutate({ typeActe: type.valeur, communeId: null, montant })
            }
            enregistrementDelai={(jours) => definirDelai.mutate({ typeActe: type.valeur, joursOuvrables: jours })}
          />
        );
      })}
    </ScrollView>
  );
}

function LigneParametre({
  libelle,
  montantInitial,
  joursInitial,
  theme,
  enregistrementTarif,
  enregistrementDelai,
}: {
  libelle: string;
  montantInitial?: number;
  joursInitial?: number;
  theme: ReturnType<typeof useTheme>;
  enregistrementTarif: (montant: number) => void;
  enregistrementDelai: (jours: number) => void;
}) {
  const [montantPrecedent, setMontantPrecedent] = useState(montantInitial);
  const [montant, setMontant] = useState(montantInitial?.toString() ?? '');
  if (montantInitial !== montantPrecedent) {
    setMontantPrecedent(montantInitial);
    setMontant(montantInitial?.toString() ?? '');
  }

  const [joursPrecedent, setJoursPrecedent] = useState(joursInitial);
  const [jours, setJours] = useState(joursInitial?.toString() ?? '');
  if (joursInitial !== joursPrecedent) {
    setJoursPrecedent(joursInitial);
    setJours(joursInitial?.toString() ?? '');
  }

  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
      <Text style={[styles.sectionTitre, { color: theme.text }]}>{libelle}</Text>
      <ChampTexte etiquette="Tarif par défaut (Ar)" keyboardType="numeric" value={montant} onChangeText={setMontant} />
      <ChampTexte etiquette="Délai standard (jours ouvrables)" keyboardType="numeric" value={jours} onChangeText={setJours} />
      <Bouton
        titre="Enregistrer"
        onPress={() => {
          const montantNombre = Number(montant);
          const joursNombre = Number(jours);
          if (Number.isFinite(montantNombre) && montantNombre >= 0) enregistrementTarif(montantNombre);
          if (Number.isInteger(joursNombre) && joursNombre > 0) enregistrementDelai(joursNombre);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 24, fontWeight: '700' },
  section: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  sectionTitre: { fontWeight: '700', fontSize: 16 },
});
