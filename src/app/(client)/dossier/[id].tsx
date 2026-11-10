import { formaterDateFr } from '@/domain/dates';
import { Alert } from '@/lib/alerte';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { AjouterPieceBouton } from '@/components/dossier/AjouterPieceBouton';
import { Timeline } from '@/components/dossier/Timeline';
import { BadgeStatut } from '@/components/ui/BadgeStatut';
import { Bouton } from '@/components/ui/Bouton';
import { ChargementPleinEcran } from '@/components/ui/ChargementPleinEcran';
import { SectionDepliable } from '@/components/ui/SectionDepliable';
import { Spacing } from '@/constants/theme';
import { etatDelai, joursRestants } from '@/domain/delais';
import { transitionsDisponibles } from '@/domain/statuts/statutMachine';
import type { StatutDemande } from '@/domain/statuts/statutConfig';
import { useDossier } from '@/hooks/queries/useDossier';
import { useHistorique } from '@/hooks/queries/useHistorique';
import { useParametre } from '@/hooks/queries/useParametre';
import { useTypesPieces } from '@/hooks/queries/useReferentiels';
import { useChangerStatutDemandeClient } from '@/hooks/mutations/useChangerStatutDemandeClient';
import { useCreerRequeteClient } from '@/hooks/mutations/useRequeteClient';
import { useTheme } from '@/hooks/use-theme';

const LIBELLES_ACTION: Partial<Record<StatutDemande, string>> = {
  SOUMIS: 'Soumettre / renvoyer ma demande',
  ANNULE: 'Annuler ma demande',
};

const LIBELLES_STATUT_VERIFICATION: Record<string, string> = {
  en_attente: 'En attente de vérification',
  valide: 'Validée',
  refuse: 'Refusée',
};

export default function EcranDetailDossier() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: dossier, isLoading } = useDossier(id);
  const { data: historique = [] } = useHistorique(id);
  const { data: typesPieces = [] } = useTypesPieces(dossier?.demande.type_acte);
  const { data: texteVisite } = useParametre('aide_visite');
  const { data: telephoneContact } = useParametre('contact_telephone');
  const changerStatut = useChangerStatutDemandeClient(id);
  const demanderReport = useCreerRequeteClient(id);

  const libellesPieces = useMemo(
    () => new Map(typesPieces.map((t) => [t.id, t.libelle])),
    [typesPieces],
  );

  if (isLoading || !dossier) return <ChargementPleinEcran />;

  const { demande, personne, adresse, visite, documents } = dossier;
  const statut = demande.statut as StatutDemande;
  const actionsClient = transitionsDisponibles(statut, 'client');

  function onAction(nouveauStatut: StatutDemande) {
    const libelle = LIBELLES_ACTION[nouveauStatut] ?? nouveauStatut;
    Alert.alert(libelle, 'Confirmez-vous cette action ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: nouveauStatut === 'ANNULE' ? 'destructive' : 'default',
        onPress: () => changerStatut.mutate({ nouveauStatut }),
      },
    ]);
  }

  function onPartager() {
    Share.share({ message: `Suivi de ma demande d'acte : référence ${demande.reference}` });
  }

  function onContacter() {
    if (telephoneContact) {
      Linking.openURL(`tel:${telephoneContact}`);
    } else {
      Alert.alert('Contact', 'Coordonnées du service non disponibles pour le moment.');
    }
  }

  function onDemanderReport() {
    Alert.alert('Demander un report', 'Le service sera informé que vous souhaitez reprogrammer la visite.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: () =>
          demanderReport.mutate(
            { type: 'report_visite' },
            { onSuccess: () => Alert.alert('Demande envoyée', 'Le service vous recontactera pour reprogrammer.') },
          ),
      },
    ]);
  }

  const delaiInfo = demande.date_echeance_estimee
    ? {
        etat: etatDelai(new Date(demande.date_echeance_estimee)),
        jours: joursRestants(new Date(demande.date_echeance_estimee)),
      }
    : null;

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <View style={styles.entete}>
        <Text style={[styles.reference, { color: theme.text }]}>{demande.reference}</Text>
        <Text style={{ color: theme.textSecondary }}>
          {demande.type_acte === 'naissance' ? 'Acte de naissance' : 'Acte de décès'} — {demande.nombre_copies} copie(s)
        </Text>
        <BadgeStatut statut={statut} />
        {delaiInfo ? (
          <Text style={{ color: delaiInfo.etat === 'depasse' ? theme.danger : theme.textSecondary, fontSize: 13 }}>
            {delaiInfo.etat === 'depasse'
              ? 'Délai estimé dépassé'
              : `Délai estimé restant : ${Math.max(delaiInfo.jours, 0)} jour(s)`}
          </Text>
        ) : null}
      </View>

      <SectionDepliable titre="Suivi du dossier" ouvertParDefaut>
        <Timeline lignes={historique} />
      </SectionDepliable>

      {visite && visite.statut !== 'a_planifier' ? (
        <View style={[styles.blocVisite, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.titreBloc, { color: theme.text }]}>Visite de vérification</Text>
          {visite.date_planifiee ? (
            <Text style={{ color: theme.text }}>
              {format(new Date(visite.date_planifiee), 'EEEE d MMMM yyyy', { locale: fr })}
              {visite.creneau ? ` — ${visite.creneau}` : ''}
            </Text>
          ) : null}
          <Text style={{ color: theme.textSecondary }}>
            {texteVisite ??
              "Préparez les documents originaux mentionnés dans votre dossier. La procuration sera signée sur place."}
          </Text>
          {visite.statut === 'planifiee' ? (
            <Bouton
              titre="Demander un report"
              variante="secondaire"
              enChargement={demanderReport.isPending}
              onPress={onDemanderReport}
            />
          ) : null}
        </View>
      ) : null}

      {personne ? (
        <SectionDepliable titre="Personne concernée">
          <Text style={{ color: theme.text }}>
            {personne.nom} {personne.prenoms ?? ''}
          </Text>
          <Text style={{ color: theme.textSecondary }}>
            {formaterDateFr(personne.date_evenement)} — {personne.lieu_evenement}
          </Text>
          {personne.nom_pere ? <Text style={{ color: theme.textSecondary }}>Père : {personne.nom_pere}</Text> : null}
          {personne.nom_mere ? <Text style={{ color: theme.textSecondary }}>Mère : {personne.nom_mere}</Text> : null}
        </SectionDepliable>
      ) : null}

      {adresse ? (
        <SectionDepliable titre="Adresse de la visite">
          <Text style={{ color: theme.text }}>
            {adresse.fokontany}, {adresse.district}
          </Text>
          <Text style={{ color: theme.textSecondary }}>{adresse.points_de_repere}</Text>
          <Text style={{ color: theme.textSecondary }}>Tél. sur place : {adresse.telephone_sur_place}</Text>
          {(!visite || visite.statut !== 'effectuee') && (statut === 'SOUMIS' || statut === 'VISITE_PLANIFIEE') ? (
            <Bouton
              titre="Corriger l'adresse"
              variante="secondaire"
              onPress={() => router.push(`/dossier/${id}/adresse`)}
            />
          ) : null}
        </SectionDepliable>
      ) : null}

      <SectionDepliable titre={`Pièces jointes (${documents.length})`}>
        {documents.map((document) => (
          <View key={document.id} style={styles.ligneDocument}>
            <Text style={{ color: theme.text, flex: 1 }}>
              {libellesPieces.get(document.type_piece_id ?? '') ?? 'Pièce'}
            </Text>
            <Text
              style={{
                color:
                  document.statut_verification === 'valide'
                    ? theme.success
                    : document.statut_verification === 'refuse'
                      ? theme.danger
                      : theme.textSecondary,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {LIBELLES_STATUT_VERIFICATION[document.statut_verification]}
            </Text>
          </View>
        ))}
        {statut === 'PIECES_A_COMPLETER' || statut === 'SOUMIS' ? (
          <AjouterPieceBouton demandeId={id} nomFichier="piece-complementaire.jpg" titre="Ajouter une pièce" />
        ) : null}
      </SectionDepliable>

      <View style={styles.actions}>
        {actionsClient.map((cible) => (
          <Bouton
            key={cible}
            titre={LIBELLES_ACTION[cible] ?? cible}
            variante={cible === 'ANNULE' ? 'danger' : 'primaire'}
            enChargement={changerStatut.isPending}
            onPress={() => onAction(cible)}
          />
        ))}
        <Bouton titre="Partager le numéro de référence" variante="secondaire" onPress={onPartager} />
        <Bouton titre="Contacter le service" variante="secondaire" onPress={onContacter} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  entete: { gap: Spacing.two },
  reference: { fontSize: 22, fontWeight: '800' },
  titreBloc: { fontWeight: '700', fontSize: 16 },
  blocVisite: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  ligneDocument: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  actions: { gap: Spacing.two, marginTop: Spacing.two },
});
