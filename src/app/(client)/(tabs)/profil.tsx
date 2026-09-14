import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import { useProfil } from '@/hooks/queries/useProfil';
import { useDeconnexion } from '@/hooks/useDeconnexion';
import { useTraduction } from '@/hooks/useTraduction';
import { useTheme } from '@/hooks/use-theme';
import { LANGUES_DISPONIBLES, useLangueStore } from '@/stores/langueStore';

export default function EcranProfil() {
  const theme = useTheme();
  const { data: profil } = useProfil();
  const deconnexion = useDeconnexion();
  const { t } = useTraduction();
  const langue = useLangueStore((s) => s.langue);
  const definirLangue = useLangueStore((s) => s.definirLangue);

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Text style={[styles.titre, { color: theme.text }]}>Mon profil</Text>

      <View style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
        <Champ etiquette="Nom" valeur={profil?.nom} theme={theme} />
        <Champ etiquette="Email" valeur={profil?.email} theme={theme} />
        <Champ etiquette="Téléphone" valeur={profil?.telephone} theme={theme} />
      </View>

      <View style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{t('profil.langue')}</Text>
        <View style={styles.rangeeLangues}>
          {LANGUES_DISPONIBLES.map((option) => {
            const selectionnee = option.valeur === langue;
            return (
              <Pressable
                key={option.valeur}
                accessibilityRole="button"
                accessibilityState={{ selected: selectionnee, disabled: !option.disponible }}
                disabled={!option.disponible}
                onPress={() => definirLangue(option.valeur)}
                style={[
                  styles.puceLangue,
                  {
                    backgroundColor: selectionnee ? theme.primary : theme.background,
                    borderColor: theme.border,
                    opacity: option.disponible ? 1 : 0.5,
                  },
                ]}
              >
                <Text style={{ color: selectionnee ? theme.primaryText : theme.text, fontWeight: '600' }}>
                  {option.libelle}
                  {!option.disponible ? ` ${t('profil.langueAVenir')}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Bouton titre="Se déconnecter" variante="danger" onPress={deconnexion} />
    </ScrollView>
  );
}

function Champ({ etiquette, valeur, theme }: { etiquette: string; valeur?: string | null; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.champ}>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{etiquette}</Text>
      <Text style={{ color: theme.text, fontSize: 16 }}>{valeur || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 24, fontWeight: '700' },
  carte: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  champ: { gap: 2 },
  rangeeLangues: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  puceLangue: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 10, borderWidth: 1, minHeight: 44, justifyContent: 'center' },
});
