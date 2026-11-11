import { PageAvecRetour } from '@/components/ui/PageAvecRetour';
import { FRAIS, FRAIS_TOTAL, formaterAriary } from '@/domain/paiement';
import { formaterDateFr } from '@/domain/dates';
import { Alert } from '@/lib/alerte';
import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BarreProgression } from '@/components/nouvelle-demande/BarreProgression';
import { Bouton } from '@/components/ui/Bouton';
import { CompteurNumerique } from '@/components/ui/CompteurNumerique';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCreerDemande } from '@/hooks/mutations/useCreerDemande';
import { messageErreurGenerique } from '@/lib/erreurs';
import { useNouvelleDemandeStore } from '@/stores/nouvelleDemandeStore';
import { useSessionStore } from '@/stores/sessionStore';

export default function EtapeRecap() {
  const theme = useTheme();
  const userId = useSessionStore((s) => s.session?.user.id);
  const etape1 = useNouvelleDemandeStore((s) => s.etape1);
  const etape2 = useNouvelleDemandeStore((s) => s.etape2);
  const etape3 = useNouvelleDemandeStore((s) => s.etape3);
  const reinitialiser = useNouvelleDemandeStore((s) => s.reinitialiser);
  const definirEtape1 = useNouvelleDemandeStore((s) => s.definirEtape1);
  const creerDemande = useCreerDemande();

  if (!etape1 || !etape2 || !etape3 || !userId) {
    return <Redirect href="/accueil" />;
  }

  async function onConfirmer() {
    if (!etape1 || !etape2 || !etape3 || !userId) return;
    try {
      const resultat = await creerDemande.mutateAsync({
        demandeurId: userId,
        typeActe: etape1.typeActe,
        nombreCopies: etape1.nombreCopies,
        motif: etape1.motif,
        personne: {
          nom: etape2.nom,
          prenoms: etape2.prenoms,
          dateEvenement: etape2.dateEvenement,
          lieuEvenement: etape2.lieuEvenement,
          nomPere: 'nomPere' in etape2 ? etape2.nomPere : undefined,
          nomMere: 'nomMere' in etape2 ? etape2.nomMere : undefined,
          numeroActe: etape2.numeroActe,
          anneeActe: etape2.anneeActe,
          communeEnregistrementId: etape2.communeEnregistrementId,
          pourSoiMeme: etape2.pourSoiMeme,
        },
        adresse: etape3.idExistant
          ? { type: 'existante', idExistant: etape3.idExistant, communeId: etape3.communeId }
          : { type: 'nouvelle', valeurs: etape3 },
        documents: [],
      });

      reinitialiser();
      Alert.alert(
        'Demande envoyée',
        `Votre dossier ${resultat.reference} a bien été enregistré. Le notaire vous contactera pour fixer sa visite.`,
        [{ text: 'OK', onPress: () => router.replace('/accueil') }],
      );
    } catch (erreur) {
      Alert.alert('Erreur', messageErreurGenerique(erreur));
    }
  }

  return (
    <PageAvecRetour titre="Nouvelle demande">
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <BarreProgression etapeActuelle={3} />
      <Text style={[styles.titre, { color: theme.text }]}>Récapitulatif</Text>

      <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitre, { color: theme.text }]}>
          {etape1.typeActe === 'naissance' ? 'Acte de naissance' : 'Acte de décès'}
        </Text>
        <CompteurNumerique
          etiquette="Nombre de copies"
          valeur={etape1.nombreCopies}
          onChangement={(nombreCopies) => definirEtape1({ ...etape1, nombreCopies })}
        />
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitre, { color: theme.text }]}>
          {etape1.typeActe === 'naissance' ? 'Enfant' : 'Personne concernée'}
        </Text>
        <Text style={{ color: theme.text }}>{etape2.nom} {etape2.prenoms ?? ''}</Text>
        <Text style={{ color: theme.textSecondary }}>
          {formaterDateFr(etape2.dateEvenement)} — {etape2.lieuEvenement}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitre, { color: theme.text }]}>Adresse pour la visite</Text>
        <Text style={{ color: theme.text }}>
          {etape3.fokontany}, {etape3.district}
        </Text>
        <Text style={{ color: theme.textSecondary }}>{etape3.pointsDeRepere}</Text>
        <Text style={{ color: theme.textSecondary }}>Tél. sur place : {etape3.telephoneSurPlace}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitre, { color: theme.text }]}>Frais à régler au notaire</Text>
        <LigneFrais libelle="À sa première visite chez vous" montant={FRAIS.visite} theme={theme} />
        <LigneFrais libelle="À la remise de votre acte" montant={FRAIS.remise} theme={theme} />
        <View style={[styles.separateur, { backgroundColor: theme.border }]} />
        <LigneFrais libelle="Total" montant={FRAIS_TOTAL} theme={theme} gras />
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: Spacing.one }}>
          Rien à payer dans l&apos;application : vous réglez directement le notaire, en main propre.
        </Text>
      </View>

      <Text style={{ color: theme.textSecondary }}>
        Le notaire viendra chez vous vérifier les informations. Vous lui remettrez la procuration signée et{' '}
        {formaterAriary(FRAIS.visite)}.
      </Text>

      <Bouton
        titre="Envoyer ma demande"
        icone="send"
        onPress={onConfirmer}
        enChargement={creerDemande.isPending}
      />
      <Bouton titre="Retour" variante="secondaire" onPress={() => router.back()} desactive={creerDemande.isPending} />
    </ScrollView>
    </PageAvecRetour>
  );
}

function LigneFrais({
  libelle,
  montant,
  theme,
  gras,
}: {
  libelle: string;
  montant: number;
  theme: ReturnType<typeof useTheme>;
  gras?: boolean;
}) {
  const poids = gras ? '800' : '500';
  return (
    <View style={styles.ligneFrais}>
      <Text style={{ color: theme.text, fontWeight: poids, flex: 1 }}>{libelle}</Text>
      <Text style={{ color: theme.text, fontWeight: gras ? '800' : '700' }}>{formaterAriary(montant)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ligneFrais: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 2 },
  separateur: { height: 1, marginVertical: Spacing.one },
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 20, fontWeight: '700' },
  section: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
  sectionTitre: { fontWeight: '700', marginBottom: Spacing.one },
});
