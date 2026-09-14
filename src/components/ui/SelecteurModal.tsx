import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface OptionSelecteur {
  id: string;
  libelle: string;
  sousLibelle?: string;
}

interface SelecteurModalProps {
  etiquette: string;
  options: OptionSelecteur[];
  valeurId: string | undefined;
  onSelection: (option: OptionSelecteur) => void;
  erreur?: string;
  placeholder?: string;
}

/** Sélecteur avec recherche dans une modale — utilisé pour les listes longues (communes). */
export function SelecteurModal({
  etiquette,
  options,
  valeurId,
  onSelection,
  erreur,
  placeholder = 'Sélectionner...',
}: SelecteurModalProps) {
  const theme = useTheme();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState('');

  const optionSelectionnee = options.find((o) => o.id === valeurId);
  const optionsFiltrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return options;
    return options.filter((o) => o.libelle.toLowerCase().includes(terme));
  }, [options, recherche]);

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
        <Text style={{ color: optionSelectionnee ? theme.text : theme.textSecondary, fontSize: 16 }}>
          {optionSelectionnee?.libelle ?? placeholder}
        </Text>
      </Pressable>
      {erreur ? <Text style={[styles.erreur, { color: theme.danger }]}>{erreur}</Text> : null}

      <Modal visible={ouvert} animationType="slide" onRequestClose={() => setOuvert(false)}>
        <View style={[styles.modale, { backgroundColor: theme.background }]}>
          <TextInput
            accessibilityLabel="Rechercher"
            placeholder="Rechercher..."
            placeholderTextColor={theme.textSecondary}
            value={recherche}
            onChangeText={setRecherche}
            style={[styles.champRecherche, { borderColor: theme.border, color: theme.text }]}
            autoFocus
          />
          <FlatList
            data={optionsFiltrees}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.ligneOption}
                onPress={() => {
                  onSelection(item);
                  setOuvert(false);
                  setRecherche('');
                }}
              >
                <Text style={{ color: theme.text, fontSize: 16 }}>{item.libelle}</Text>
                {item.sousLibelle ? (
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{item.sousLibelle}</Text>
                ) : null}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: Spacing.four }}>
                Aucun résultat.
              </Text>
            }
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setOuvert(false)}
            style={[styles.boutonFermer, { borderColor: theme.border }]}
          >
            <Text style={{ color: theme.text, fontWeight: '600' }}>Fermer</Text>
          </Pressable>
        </View>
      </Modal>
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
  modale: { flex: 1, paddingTop: Spacing.six, paddingHorizontal: Spacing.three, gap: Spacing.three },
  champRecherche: {
    minHeight: MinTouchTarget,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  ligneOption: { paddingVertical: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#0002' },
  boutonFermer: { minHeight: MinTouchTarget, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
