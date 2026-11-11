import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ETAPES_NOTAIRE, type EtapeNotaire } from '@/components/notaire/etapes';
import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import { FRAIS, formaterAriary } from '@/domain/paiement';
import { useIndicateurs } from '@/hooks/queries/useIndicateurs';
import { useProfil } from '@/hooks/queries/useProfil';
import { useDeconnexion } from '@/hooks/useDeconnexion';
import { useTheme } from '@/hooks/use-theme';

export default function EcranAccueilNotaire() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: profil } = useProfil();
  const { data: indicateurs, refetch, isRefetching } = useIndicateurs();
  const deconnexion = useDeconnexion();

  const parStatut = indicateurs?.parStatut ?? {};
  const compter = (etape: EtapeNotaire) => etape.statuts.reduce((total, s) => total + (parStatut[s] ?? 0), 0);

  // Frais perçus : 5 000 Ar pour chaque dossier dont la visite est faite,
  // 15 000 Ar de plus pour chaque acte remis.
  const [, , preparer, remettre, termine] = ETAPES_NOTAIRE;
  const visitesFaites = compter(preparer) + compter(remettre) + compter(termine);
  const fraisPercus = visitesFaites * FRAIS.visite + compter(termine) * FRAIS.remise;
  const etapesActives = ETAPES_NOTAIRE.filter((e) => e.cle !== 'termine');
  const aFaire = etapesActives.reduce((total, e) => total + compter(e), 0);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.page}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={[styles.bandeau, { backgroundColor: theme.primary, paddingTop: insets.top + Spacing.four }]}>
        <Text style={[styles.salutation, { color: theme.primaryText }]}>Bonjour {profil?.nom || ''}</Text>
        <Text style={{ color: theme.primaryText, opacity: 0.85, fontSize: 15 }}>
          {aFaire === 0
            ? 'Aucun dossier en attente.'
            : `${aFaire} dossier${aFaire > 1 ? 's' : ''} en cours`}
        </Text>
      </View>

      <View style={styles.contenu}>
        <Text style={[styles.titreSection, { color: theme.text }]}>À faire</Text>
        {etapesActives.map((etape, index) => (
          <View key={etape.cle}>
            <CarteEtape etape={etape} nombre={compter(etape)} theme={theme} />
            {index < etapesActives.length - 1 ? (
              <View style={styles.fleche}>
                <MaterialCommunityIcons name="arrow-down-bold" size={20} color={theme.textSecondary} />
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.grille}>
          <Resume
            icone="check-decagram"
            libelle="Actes remis"
            valeur={String(compter(termine))}
            couleur="#1B7A3D"
            theme={theme}
          />
          <Resume
            icone="cash-multiple"
            libelle="Frais perçus"
            valeur={formaterAriary(fraisPercus)}
            couleur={theme.primary}
            theme={theme}
          />
        </View>

        <Bouton titre="Se déconnecter" icone="logout" variante="secondaire" onPress={deconnexion} />
      </View>
    </ScrollView>
  );
}

function CarteEtape({ etape, nombre, theme }: { etape: EtapeNotaire; nombre: number; theme: ReturnType<typeof useTheme> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${etape.titre} : ${nombre} dossier(s)`}
      onPress={() => router.push({ pathname: '/file-attente', params: { etape: etape.cle } })}
      style={({ pressed }) => [
        styles.carte,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.icone, { backgroundColor: etape.fond }]}>
        <MaterialCommunityIcons name={etape.icone} size={28} color={etape.couleur} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>{etape.titre}</Text>
        <View style={styles.pastilles}>
          {etape.duree ? <Pastille texte={etape.duree} icone="clock-outline" fond={theme.accent} couleur={theme.accentText} /> : null}
          {etape.frais ? (
            <Pastille texte={`${formaterAriary(etape.frais)} à percevoir`} icone="cash" fond="#E2F4E8" couleur="#1B7A3D" />
          ) : null}
        </View>
      </View>
      <View style={[styles.compteur, { backgroundColor: nombre > 0 ? etape.couleur : theme.backgroundSelected }]}>
        <Text style={{ color: nombre > 0 ? '#FFFFFF' : theme.textSecondary, fontWeight: '800', fontSize: 16 }}>
          {nombre}
        </Text>
      </View>
    </Pressable>
  );
}

function Pastille({
  texte,
  icone,
  fond,
  couleur,
}: {
  texte: string;
  icone: 'clock-outline' | 'cash';
  fond: string;
  couleur: string;
}) {
  return (
    <View style={[styles.pastille, { backgroundColor: fond }]}>
      <MaterialCommunityIcons name={icone} size={13} color={couleur} />
      <Text style={{ color: couleur, fontSize: 12, fontWeight: '700' }}>{texte}</Text>
    </View>
  );
}

function Resume({
  icone,
  libelle,
  valeur,
  couleur,
  theme,
}: {
  icone: 'check-decagram' | 'cash-multiple';
  libelle: string;
  valeur: string;
  couleur: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.resume, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <MaterialCommunityIcons name={icone} size={26} color={couleur} />
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>{valeur}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{libelle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: Spacing.five },
  bandeau: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: Spacing.one,
  },
  salutation: { fontSize: 26, fontWeight: '800' },
  contenu: { padding: Spacing.three, gap: Spacing.two },
  titreSection: { fontSize: 18, fontWeight: '800', marginTop: Spacing.one },
  carte: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icone: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  pastille: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  compteur: { minWidth: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  fleche: { alignItems: 'center', marginVertical: -2 },
  grille: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two, marginBottom: Spacing.two },
  resume: { flex: 1, borderRadius: 18, borderWidth: 1, padding: Spacing.three, gap: 4 },
});
