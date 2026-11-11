import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChampTexte } from '@/components/ui/ChampTexte';
import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ChampDateProps {
  etiquette: string;
  /** Format AAAA-MM-JJ (ISO), aligné sur la colonne Postgres `date`. */
  valeur: string;
  onChangement: (valeur: string) => void;
  erreur?: string;
  dateMaximum?: Date;
}

/** Date locale → AAAA-MM-JJ (toISOString passerait en UTC et peut reculer d'un jour à Madagascar, UTC+3). */
function versISO(date: Date): string {
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;
}

export function ChampDate({ etiquette, valeur, onChangement, erreur, dateMaximum }: ChampDateProps) {
  const theme = useTheme();
  const [ouvert, setOuvert] = useState(false);

  // Le sélecteur natif n'est pas disponible sur web : saisie texte au format ISO en repli.
  if (Platform.OS === 'web') {
    return (
      <ChampTexte
        etiquette={`${etiquette} (AAAA-MM-JJ)`}
        placeholder="2000-01-31"
        value={valeur}
        onChangeText={onChangement}
        erreur={erreur}
      />
    );
  }

  const dateActuelle = valeur ? new Date(valeur) : new Date();

  return (
    <View style={styles.conteneur}>
      <Text style={[styles.etiquette, { color: theme.text }]}>{etiquette}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOuvert(true)}
        style={[
          styles.champ,
          { borderColor: erreur ? theme.danger : theme.border, backgroundColor: theme.backgroundElement },
        ]}
      >
        <Text style={{ color: valeur ? theme.text : theme.textSecondary, fontSize: 16 }}>
          {valeur || 'Sélectionner une date'}
        </Text>
      </Pressable>
      {erreur ? <Text style={[styles.erreur, { color: theme.danger }]}>{erreur}</Text> : null}

      {ouvert ? (
        <DateTimePicker
          value={dateActuelle}
          mode="date"
          maximumDate={dateMaximum}
          onChange={(evenement, dateSelectionnee) => {
            setOuvert(Platform.OS === 'ios');
            if (evenement.type === 'set' && dateSelectionnee) {
              onChangement(versISO(dateSelectionnee));
            }
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { gap: Spacing.one },
  etiquette: { fontSize: 15, fontWeight: '600' },
  champ: {
    minHeight: MinTouchTarget,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  erreur: { fontSize: 13 },
});
