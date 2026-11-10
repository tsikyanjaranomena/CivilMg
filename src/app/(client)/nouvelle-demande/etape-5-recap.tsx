import { formaterDateFr } from '@/domain/dates';
import { Alert } from '@/lib/alerte';
import { Redirect, router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BarreProgression } from '@/components/nouvelle-demande/BarreProgression';
import { Bouton } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import { calculerMontant, type Tarif } from '@/domain/tarifs';
import { useTheme } from '@/hooks/use-theme';
import { useParametre } from '@/hooks/queries/useParametre';
import { useTarifs } from '@/hooks/queries/useReferentiels';
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
  const etape4 = useNouvelleDemandeStore((s) => s.etape4);
  const reinitialiser = useNouvelleDemandeStore((s) => s.reinitialiser);
  const { data: tarifsDb = [] } = useTarifs();
  const { data: texteVisite } = useParametre('aide_visite');
  const creerDemande = useCreerDemande();

  const tarifs: Tarif[] = useMemo(
    () => tarifsDb.map((t) => ({ typeActe: t.type_acte, communeId: t.commune_id, montant: Number(t.montant) })),
    [tarifsDb],
  );

  if (!etape1 || !etape2 || !etape3 || !userId) {
    return <Redirect href="/nouvelle-demande/etape-1-type" />;
  }

  const montant = calculerMontant(tarifs, etape1.typeActe, etape3.communeId, etape1.nombreCopies);

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
        documents: etape4.map((d) => ({
          uri: d.uri,
          nomFichier: d.nomFichier,
          mimeType: d.mimeType,
          typePieceId: d.typePieceId,
        })),
      });

      reinitialiser();
      Alert.alert(
        'Demande envoyée',
        `Votre dossier ${resultat.reference} a bien été enregistré. Un agent viendra prochainement vérifier vos informations à domicile.`,
        [{ text: 'OK', onPress: () => router.replace('/accueil') }],
      );
    } catch (erreur) {
      Alert.alert('Erreur', messageErreurGenerique(erreur));
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <BarreProgression etapeActuelle={5} />
      <Text style={[styles.titre, { color: theme.text }]}>Récapitulatif</Text>

      <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitre, { color: theme.text }]}>Demande</Text>
        <Text style={{ color: theme.text }}>
          {etape1.typeActe === 'naissance' ? 'Acte de naissance' : 'Acte de décès'} — {etape1.nombreCopies} copie(s)
        </Text>
        {etape1.motif ? <Text style={{ color: theme.textSecondary }}>{etape1.motif}</Text> : null}
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitre, { color: theme.text }]}>Personne concernée</Text>
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
        <Text style={[styles.sectionTitre, { color: theme.text }]}>Pièces jointes</Text>
        <Text style={{ color: theme.text }}>{etape4.length} pièce(s) jointe(s)</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitre, { color: theme.text }]}>Tarif estimé</Text>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700' }}>
          {montant !== null ? `${montant.toLocaleString('fr-FR')} Ar` : 'À confirmer par le service'}
        </Text>
      </View>

      <Text style={{ color: theme.textSecondary }}>
        {texteVisite ??
          "Préparez les documents originaux mentionnés dans votre dossier. La procuration sera signée sur place, aucun document à envoyer à l'avance."}
      </Text>

      <Bouton
        titre="Confirmer et envoyer ma demande"
        onPress={onConfirmer}
        enChargement={creerDemande.isPending}
      />
      <Bouton titre="Retour" variante="secondaire" onPress={() => router.back()} desactive={creerDemande.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 20, fontWeight: '700' },
  section: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
  sectionTitre: { fontWeight: '700', marginBottom: Spacing.one },
});
