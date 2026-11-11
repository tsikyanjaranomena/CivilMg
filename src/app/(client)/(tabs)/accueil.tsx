import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NomIcone } from '@/components/ui/Bouton';
import { ETUDE } from '@/constants/etude';
import { Spacing } from '@/constants/theme';
import { FRAIS, formaterAriary } from '@/domain/paiement';
import type { TypeActe } from '@/domain/validation/demandeSchema';
import { useProfil } from '@/hooks/queries/useProfil';
import { useTheme } from '@/hooks/use-theme';
import { useNouvelleDemandeStore } from '@/stores/nouvelleDemandeStore';

export default function EcranAccueilClient() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: profil } = useProfil();
  const reinitialiser = useNouvelleDemandeStore((s) => s.reinitialiser);
  const definirEtape1 = useNouvelleDemandeStore((s) => s.definirEtape1);

  // Un appui sur une carte démarre directement la demande du bon type :
  // pas d'écran intermédiaire, le nombre de copies se règle au récapitulatif.
  function commencer(typeActe: TypeActe) {
    reinitialiser();
    definirEtape1({ typeActe, nombreCopies: 1 });
    router.push('/nouvelle-demande/etape-2-personne');
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.page}>
      <View style={[styles.bandeau, { backgroundColor: theme.primary, paddingTop: insets.top + Spacing.four }]}>
        <Text style={[styles.salutation, { color: theme.primaryText }]}>Bonjour {profil?.nom || ''}</Text>
        <Text style={{ color: theme.primaryText, opacity: 0.85, fontSize: 15 }}>
          Quel acte souhaitez-vous demander ?
        </Text>
      </View>

      <View style={styles.choix}>
        <CarteActe
          titre="Acte de naissance"
          description="Pour un nouveau-né ou une naissance déjà déclarée"
          icone="baby-carriage"
          couleurIcone="#1E56A0"
          fondIcone="#E3EDFB"
          onPress={() => commencer('naissance')}
          theme={theme}
        />
        <CarteActe
          titre="Acte de décès"
          description="Suite au décès d'un proche"
          icone="flower-tulip-outline"
          couleurIcone="#6B4FA3"
          fondIcone="#EEE8F8"
          onPress={() => commencer('deces')}
          theme={theme}
        />
        <View style={[styles.zone, { backgroundColor: theme.backgroundSelected }]}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={theme.primary} />
          <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>
            Pour l&apos;instant, ce service est disponible uniquement à{' '}
            <Text style={{ fontWeight: '800' }}>Antananarivo</Text>.
          </Text>
        </View>
      </View>

      <View style={[styles.etapes, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={[styles.titreEtapes, { color: theme.text }]}>Comment ça marche ?</Text>
        <Etape
          icone="cellphone-text"
          titre="Vous remplissez la demande"
          detail="Informations de l'enfant et des parents, et votre adresse."
          duree={ETUDE.durees.saisie}
          theme={theme}
        />
        <Fleche theme={theme} />
        <Etape
          icone="phone-in-talk"
          titre="Le notaire vous appelle"
          detail="Pour confirmer avec vous le lieu et l'heure de sa visite."
          duree={ETUDE.durees.appel}
          theme={theme}
        />
        <Fleche theme={theme} />
        <Etape
          icone="home-account"
          titre="Le notaire vient chez vous"
          detail="Il vérifie les informations et vous signez la procuration."
          duree={ETUDE.durees.visite}
          frais={FRAIS.visite}
          theme={theme}
        />
        <Fleche theme={theme} />
        <Etape
          icone="progress-clock"
          titre="Le notaire prépare votre acte"
          detail="Il s'occupe de toutes les démarches auprès de l'état civil."
          duree={ETUDE.durees.traitement}
          theme={theme}
        />
        <Fleche theme={theme} />
        <Etape
          icone="file-certificate-outline"
          titre="Le notaire vous appelle et vous remet la copie"
          detail="Dernière étape : vous recevez votre acte."
          duree={ETUDE.durees.remise}
          frais={FRAIS.remise}
          theme={theme}
        />
      </View>
    </ScrollView>
  );
}

function CarteActe({
  titre,
  description,
  icone,
  couleurIcone,
  fondIcone,
  onPress,
  theme,
}: {
  titre: string;
  description: string;
  icone: NomIcone;
  couleurIcone: string;
  fondIcone: string;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Demander un ${titre.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.carteActe,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.illustration, { backgroundColor: fondIcone }]}>
        <MaterialCommunityIcons name={icone} size={56} color={couleurIcone} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.titreActe, { color: theme.text }]}>{titre}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{description}</Text>
        <Text style={{ color: couleurIcone, fontWeight: '700', marginTop: 4 }}>Commencer ›</Text>
      </View>
    </Pressable>
  );
}

function Etape({
  icone,
  titre,
  detail,
  duree,
  frais,
  theme,
}: {
  icone: NomIcone;
  titre: string;
  detail: string;
  duree: string;
  /** Montant à remettre au notaire à cette étape, en main propre. */
  frais?: number;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.etape}>
      <View style={[styles.cercleEtape, { backgroundColor: theme.backgroundSelected }]}>
        <MaterialCommunityIcons name={icone} size={26} color={theme.primary} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{titre}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{detail}</Text>
        <View style={styles.pastilles}>
          <View style={[styles.duree, { backgroundColor: theme.accent }]}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={theme.accentText} />
            <Text style={{ color: theme.accentText, fontSize: 12, fontWeight: '700' }}>{duree}</Text>
          </View>
          {frais !== undefined ? (
            <View style={[styles.duree, { backgroundColor: '#E2F4E8' }]}>
              <MaterialCommunityIcons name="cash" size={14} color="#1B7A3D" />
              <Text style={{ color: '#1B7A3D', fontSize: 12, fontWeight: '700' }}>
                {formaterAriary(frais)} au notaire
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Fleche({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.fleche}>
      <MaterialCommunityIcons name="arrow-down-bold" size={22} color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: Spacing.five, gap: Spacing.three },
  bandeau: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: Spacing.one,
  },
  salutation: { fontSize: 26, fontWeight: '800' },
  choix: { paddingHorizontal: Spacing.three, gap: Spacing.three, marginTop: -Spacing.six },
  carteActe: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  illustration: { width: 92, height: 92, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  titreActe: { fontSize: 19, fontWeight: '800' },
  etapes: {
    marginHorizontal: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  titreEtapes: { fontSize: 16, fontWeight: '700' },
  etape: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  cercleEtape: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  zone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  duree: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  // Flèche centrée sous le cercle d'icône (52 px de large).
  fleche: { width: 52, alignItems: 'center', marginVertical: -Spacing.one },
});
