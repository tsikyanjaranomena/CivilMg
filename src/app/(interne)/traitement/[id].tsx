import { formaterDateFr } from '@/domain/dates';
import { Alert } from '@/lib/alerte';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Timeline } from '@/components/dossier/Timeline';
import { BadgeStatut } from '@/components/ui/BadgeStatut';
import { Bouton } from '@/components/ui/Bouton';
import { ChampDate } from '@/components/ui/ChampDate';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { ChargementPleinEcran } from '@/components/ui/ChargementPleinEcran';
import { ChoixSegmente } from '@/components/ui/ChoixSegmente';
import { SectionDepliable } from '@/components/ui/SectionDepliable';
import { Spacing } from '@/constants/theme';
import { motifClientObligatoire, transitionsDisponibles } from '@/domain/statuts/statutMachine';
import type { StatutDemande } from '@/domain/statuts/statutConfig';
import {
  STATUTS_VISITE,
  compteRenduVisiteSchema,
  type CompteRenduVisiteValues,
} from '@/domain/validation/visiteSchema';
import { useDossier } from '@/hooks/queries/useDossier';
import { useHistorique } from '@/hooks/queries/useHistorique';
import { useNotesInternes } from '@/hooks/queries/useNotesInternes';
import { useRequetesNonTraitees } from '@/hooks/queries/useRequetesClient';
import { useCompteRenduVisite } from '@/hooks/queries/useVisites';
import { useChangerStatutDemande } from '@/hooks/mutations/useChangerStatutDemande';
import { useEnregistrerNotesInternes } from '@/hooks/mutations/useNotesInternesMutation';
import { useMarquerRequeteTraitee } from '@/hooks/mutations/useRequeteClientMutations';
import { useVerifierDocument } from '@/hooks/mutations/useVerifierDocument';
import { useCreerVisite, useEnregistrerCompteRendu, useReplanifierVisite } from '@/hooks/mutations/useVisitesMutations';
import { useTheme } from '@/hooks/use-theme';

const LIBELLES_ACTION: Partial<Record<StatutDemande, string>> = {
  PIECES_A_COMPLETER: 'Demander des pièces complémentaires',
  EN_TRAITEMENT: 'Passer en traitement',
  EN_VALIDATION: 'Envoyer en validation',
  PRET: 'Marquer prêt à retirer',
  LIVRE: 'Marquer livré',
  REJETE: 'Rejeter le dossier',
  ANNULE: 'Annuler le dossier',
};

const CIBLES_GENERIQUES: StatutDemande[] = [
  'PIECES_A_COMPLETER',
  'EN_TRAITEMENT',
  'EN_VALIDATION',
  'PRET',
  'LIVRE',
  'REJETE',
  'ANNULE',
];

export default function EcranFicheTraitement() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: dossier, isLoading } = useDossier(id);
  const { data: historique = [] } = useHistorique(id);
  const { data: requetes = [] } = useRequetesNonTraitees(id);
  const { data: notes = '' } = useNotesInternes(id);
  const changerStatut = useChangerStatutDemande(id);
  const enregistrerNotes = useEnregistrerNotesInternes(id);
  const marquerRequeteTraitee = useMarquerRequeteTraitee(id);
  const verifierDocument = useVerifierDocument(id);

  const [notesPrecedentes, setNotesPrecedentes] = useState(notes);
  const [notesLocales, setNotesLocales] = useState(notes);
  if (notes !== notesPrecedentes) {
    setNotesPrecedentes(notes);
    setNotesLocales(notes);
  }

  const [motifOuvertPour, setMotifOuvertPour] = useState<StatutDemande | null>(null);
  const [motif, setMotif] = useState('');
  const [documentEnRefus, setDocumentEnRefus] = useState<string | null>(null);
  const [motifRefusDocument, setMotifRefusDocument] = useState('');

  if (isLoading || !dossier) return <ChargementPleinEcran />;

  const { demande, personne, adresse, visite, documents } = dossier;
  const statut = demande.statut as StatutDemande;
  const actionsGeneriques = transitionsDisponibles(statut, 'responsable').filter((c) => CIBLES_GENERIQUES.includes(c));

  function ouvrirAction(cible: StatutDemande) {
    if (motifClientObligatoire(statut, cible)) {
      setMotifOuvertPour(cible);
      setMotif('');
      return;
    }
    Alert.alert(LIBELLES_ACTION[cible] ?? cible, 'Confirmez-vous cette action ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: () => changerStatut.mutate({ nouveauStatut: cible }) },
    ]);
  }

  function confirmerActionAvecMotif() {
    if (!motifOuvertPour) return;
    if (!motif.trim()) {
      Alert.alert('Motif requis', 'Un motif est obligatoire pour cette action.');
      return;
    }
    changerStatut.mutate(
      { nouveauStatut: motifOuvertPour, commentaireClient: motif.trim() },
      {
        onSuccess: () => setMotifOuvertPour(null),
        onError: (erreur) => Alert.alert('Erreur', erreur instanceof Error ? erreur.message : 'Action impossible.'),
      },
    );
  }

  function onEnregistrerNotes() {
    enregistrerNotes.mutate(notesLocales);
  }

  function onValiderDocument(documentId: string) {
    verifierDocument.mutate({ documentId, statut: 'valide' });
  }

  function onConfirmerRefusDocument(documentId: string) {
    if (!motifRefusDocument.trim()) {
      Alert.alert('Motif requis', 'Indiquez pourquoi cette pièce est refusée.');
      return;
    }
    verifierDocument.mutate(
      { documentId, statut: 'refuse', motifRefus: motifRefusDocument.trim() },
      { onSuccess: () => setDocumentEnRefus(null) },
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Bouton titre="← Retour" variante="secondaire" onPress={() => router.back()} />

      <View style={styles.entete}>
        <Text style={[styles.reference, { color: theme.text }]}>{demande.reference}</Text>
        <Text style={{ color: theme.textSecondary }}>
          {demande.type_acte === 'naissance' ? 'Acte de naissance' : 'Acte de décès'} — {demande.nombre_copies} copie(s)
        </Text>
        <BadgeStatut statut={statut} />
      </View>

      {requetes.length > 0 ? (
        <View style={[styles.alerte, { backgroundColor: theme.warning + '22', borderColor: theme.warning }]}>
          {requetes.map((r) => (
            <View key={r.id} style={styles.ligneRequete}>
              <Text style={{ color: theme.warning, flex: 1, fontWeight: '600' }}>
                {r.type === 'report_visite' ? 'Le client demande un report de visite' : r.type}
              </Text>
              <Bouton titre="Traité" variante="secondaire" onPress={() => marquerRequeteTraitee.mutate(r.id)} />
            </View>
          ))}
        </View>
      ) : null}

      <SectionDepliable titre="Suivi du dossier">
        <Timeline lignes={historique} />
      </SectionDepliable>

      <BlocVisite
        demandeId={id}
        statut={statut}
        visite={visite}
        adresse={adresse}
        theme={theme}
      />

      {personne ? (
        <SectionDepliable titre="Personne concernée" ouvertParDefaut>
          <Text style={{ color: theme.text }}>
            {personne.nom} {personne.prenoms ?? ''}
          </Text>
          <Text style={{ color: theme.textSecondary }}>
            {formaterDateFr(personne.date_evenement)} — {personne.lieu_evenement}
          </Text>
          {personne.nom_pere ? <Text style={{ color: theme.textSecondary }}>Père : {personne.nom_pere}</Text> : null}
          {personne.nom_mere ? <Text style={{ color: theme.textSecondary }}>Mère : {personne.nom_mere}</Text> : null}
          {personne.numero_acte ? (
            <Text style={{ color: theme.textSecondary }}>N° acte : {personne.numero_acte}</Text>
          ) : null}
        </SectionDepliable>
      ) : null}

      {adresse ? (
        <SectionDepliable titre="Adresse">
          <Text style={{ color: theme.text }}>
            {adresse.fokontany}, {adresse.district}, {adresse.region}
          </Text>
          <Text style={{ color: theme.textSecondary }}>{adresse.points_de_repere}</Text>
          <Text style={{ color: theme.textSecondary }}>Tél. sur place : {adresse.telephone_sur_place}</Text>
          {adresse.creneaux_disponibilite ? (
            <Text style={{ color: theme.textSecondary }}>Créneaux : {adresse.creneaux_disponibilite}</Text>
          ) : null}
        </SectionDepliable>
      ) : null}

      <SectionDepliable titre={`Pièces jointes (${documents.length})`} ouvertParDefaut>
        {documents.map((document) => (
          <View key={document.id} style={[styles.carteDocument, { borderColor: theme.border }]}>
            <Text style={{ color: theme.text, fontWeight: '600' }}>Pièce jointe</Text>
            <Text
              style={{
                color:
                  document.statut_verification === 'valide'
                    ? theme.success
                    : document.statut_verification === 'refuse'
                      ? theme.danger
                      : theme.textSecondary,
                fontSize: 13,
              }}
            >
              {document.statut_verification === 'valide'
                ? 'Validée'
                : document.statut_verification === 'refuse'
                  ? `Refusée — ${document.motif_refus}`
                  : 'En attente de vérification'}
            </Text>
            {document.statut_verification === 'en_attente' ? (
              <View style={styles.rangeeActions}>
                <Bouton titre="Valider" onPress={() => onValiderDocument(document.id)} />
                <Bouton titre="Refuser" variante="danger" onPress={() => setDocumentEnRefus(document.id)} />
              </View>
            ) : null}
            {documentEnRefus === document.id ? (
              <View style={styles.rangeeActions}>
                <ChampTexte etiquette="Motif du refus" value={motifRefusDocument} onChangeText={setMotifRefusDocument} />
                <Bouton titre="Confirmer le refus" variante="danger" onPress={() => onConfirmerRefusDocument(document.id)} />
              </View>
            ) : null}
          </View>
        ))}
      </SectionDepliable>

      <SectionDepliable titre="Notes internes">
        <ChampTexte
          etiquette="Visible uniquement par l'équipe"
          multiline
          numberOfLines={4}
          value={notesLocales}
          onChangeText={setNotesLocales}
        />
        <Bouton titre="Enregistrer les notes" variante="secondaire" onPress={onEnregistrerNotes} enChargement={enregistrerNotes.isPending} />
      </SectionDepliable>

      <View style={styles.actions}>
        {actionsGeneriques.map((cible) => (
          <View key={cible} style={{ gap: Spacing.one }}>
            <Bouton
              titre={LIBELLES_ACTION[cible] ?? cible}
              variante={cible === 'REJETE' || cible === 'ANNULE' ? 'danger' : 'primaire'}
              enChargement={changerStatut.isPending}
              onPress={() => ouvrirAction(cible)}
            />
            {motifOuvertPour === cible ? (
              <View style={{ gap: Spacing.one }}>
                <ChampTexte etiquette="Motif (visible du client)" multiline value={motif} onChangeText={setMotif} />
                <Bouton titre="Confirmer" onPress={confirmerActionAvecMotif} enChargement={changerStatut.isPending} />
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function BlocVisite({
  demandeId,
  statut,
  visite,
  adresse,
  theme,
}: {
  demandeId: string;
  statut: StatutDemande;
  visite: { id: string; date_planifiee: string | null; creneau: string | null; statut: string } | null;
  adresse: { fokontany: string; points_de_repere: string; telephone_sur_place: string } | null;
  theme: ReturnType<typeof useTheme>;
}) {
  const changerStatut = useChangerStatutDemande(demandeId);
  const creerVisite = useCreerVisite(demandeId);
  const replanifierVisite = useReplanifierVisite(demandeId, visite?.id ?? '');
  const { data: compteRendu } = useCompteRenduVisite(visite?.id);
  const enregistrerCompteRendu = useEnregistrerCompteRendu(demandeId, visite?.id ?? '');
  const [datePlanifiee, setDatePlanifiee] = useState(visite?.date_planifiee ?? '');
  const [creneau, setCreneau] = useState(visite?.creneau ?? '');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CompteRenduVisiteValues>({
    resolver: zodResolver(compteRenduVisiteSchema),
    defaultValues: {
      statut: 'effectuee',
      compteRendu: compteRendu?.compte_rendu ?? '',
      verificationConcluante: compteRendu?.verification_concluante ?? undefined,
      procurationRecuperee: compteRendu?.procuration_recuperee ?? false,
      motifEchec: compteRendu?.motif_echec ?? '',
    },
  });

  async function onEnregistrerCompteRendu(valeurs: CompteRenduVisiteValues) {
    try {
      await enregistrerCompteRendu.mutateAsync(valeurs);
      if (valeurs.statut === 'client_absent' || valeurs.statut === 'echec') {
        await changerStatut.mutateAsync({ nouveauStatut: 'VISITE_A_REPLANIFIER' });
      }
      Alert.alert('Compte rendu enregistré');
    } catch (erreur) {
      Alert.alert('Erreur', erreur instanceof Error ? erreur.message : 'Enregistrement impossible.');
    }
  }

  async function onPlanifier() {
    if (!datePlanifiee || !creneau) {
      Alert.alert('Champs requis', 'Renseignez la date et le créneau.');
      return;
    }
    try {
      await creerVisite.mutateAsync({ datePlanifiee, creneau });
      await changerStatut.mutateAsync({ nouveauStatut: 'VISITE_PLANIFIEE' });
    } catch (erreur) {
      Alert.alert('Erreur', erreur instanceof Error ? erreur.message : 'Planification impossible.');
    }
  }

  async function onReplanifier() {
    if (!datePlanifiee || !creneau) {
      Alert.alert('Champs requis', 'Renseignez la date et le créneau.');
      return;
    }
    try {
      await replanifierVisite.mutateAsync({ datePlanifiee, creneau });
      await changerStatut.mutateAsync({ nouveauStatut: 'VISITE_PLANIFIEE' });
    } catch (erreur) {
      Alert.alert('Erreur', erreur instanceof Error ? erreur.message : 'Replanification impossible.');
    }
  }

  if (statut === 'SOUMIS' && !visite) {
    return (
      <View style={[styles.blocVisite, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.titreBloc, { color: theme.text }]}>Planifier la visite</Text>
        {adresse ? (
          <Text style={{ color: theme.textSecondary }}>
            {adresse.fokontany} — {adresse.points_de_repere} — Tél. {adresse.telephone_sur_place}
          </Text>
        ) : (
          <Text style={{ color: theme.danger }}>Adresse incomplète : impossible de planifier.</Text>
        )}
        <ChampDate etiquette="Date de la visite" valeur={datePlanifiee} onChangement={setDatePlanifiee} />
        <ChampTexte etiquette="Créneau" placeholder="Ex : matin, après 14h..." value={creneau} onChangeText={setCreneau} />
        <Bouton titre="Planifier" onPress={onPlanifier} enChargement={creerVisite.isPending} desactive={!adresse} />
      </View>
    );
  }

  if (statut === 'VISITE_A_REPLANIFIER' && visite) {
    return (
      <View style={[styles.blocVisite, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.titreBloc, { color: theme.text }]}>Replanifier la visite</Text>
        <ChampDate etiquette="Nouvelle date" valeur={datePlanifiee} onChangement={setDatePlanifiee} />
        <ChampTexte etiquette="Créneau" value={creneau} onChangeText={setCreneau} />
        <Bouton titre="Replanifier" onPress={onReplanifier} enChargement={replanifierVisite.isPending} />
      </View>
    );
  }

  if (statut === 'VISITE_PLANIFIEE' && visite) {
    return (
      <View style={[styles.blocVisite, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.titreBloc, { color: theme.text }]}>Visite planifiée</Text>
        {visite.date_planifiee ? (
          <Text style={{ color: theme.text }}>
            {format(new Date(visite.date_planifiee), 'EEEE d MMMM yyyy', { locale: fr })}
            {visite.creneau ? ` — ${visite.creneau}` : ''}
          </Text>
        ) : null}

        <Text style={[styles.sousTitreBloc, { color: theme.text }]}>Compte rendu de visite</Text>
        <Controller
          control={control}
          name="statut"
          render={({ field }) => (
            <ChoixSegmente
              etiquette="Résultat"
              options={STATUTS_VISITE.filter((s) => s !== 'a_planifier' && s !== 'planifiee' && s !== 'reportee').map(
                (s) => ({ valeur: s, libelle: LIBELLES_STATUT_VISITE[s] }),
              )}
              valeur={field.value}
              onChangement={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="compteRendu"
          render={({ field }) => (
            <ChampTexte
              etiquette="Observations"
              multiline
              numberOfLines={3}
              value={field.value}
              onChangeText={field.onChange}
              erreur={errors.compteRendu?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="verificationConcluante"
          render={({ field }) => (
            <View style={styles.ligneSwitch}>
              <Text style={{ color: theme.text }}>Vérification concluante</Text>
              <Switch value={field.value ?? false} onValueChange={field.onChange} />
            </View>
          )}
        />
        <Controller
          control={control}
          name="procurationRecuperee"
          render={({ field }) => (
            <View style={styles.ligneSwitch}>
              <Text style={{ color: theme.text }}>Procuration papier récupérée</Text>
              <Switch value={field.value} onValueChange={field.onChange} />
            </View>
          )}
        />
        <Controller
          control={control}
          name="motifEchec"
          render={({ field }) => (
            <ChampTexte
              etiquette="Motif (si client absent / échec)"
              value={field.value}
              onChangeText={field.onChange}
              erreur={errors.motifEchec?.message}
            />
          )}
        />
        <Bouton
          titre="Enregistrer le compte rendu"
          onPress={handleSubmit(onEnregistrerCompteRendu)}
          enChargement={enregistrerCompteRendu.isPending}
        />
      </View>
    );
  }

  return null;
}

const LIBELLES_STATUT_VISITE: Record<string, string> = {
  effectuee: 'Effectuée',
  client_absent: 'Client absent',
  echec: 'Échec',
};

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  entete: { gap: Spacing.two },
  reference: { fontSize: 22, fontWeight: '800' },
  alerte: { borderRadius: 10, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  ligneRequete: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  titreBloc: { fontWeight: '700', fontSize: 16 },
  sousTitreBloc: { fontWeight: '700', fontSize: 14, marginTop: Spacing.two },
  blocVisite: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  carteDocument: { borderRadius: 10, borderWidth: 1, padding: Spacing.three, gap: Spacing.one },
  rangeeActions: { gap: Spacing.two },
  ligneSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { gap: Spacing.two, marginTop: Spacing.two },
});
