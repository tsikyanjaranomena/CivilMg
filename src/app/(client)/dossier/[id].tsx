import { PageAvecRetour } from '@/components/ui/PageAvecRetour';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Timeline } from '@/components/dossier/Timeline';
import { BadgeStatut } from '@/components/ui/BadgeStatut';
import { Bouton } from '@/components/ui/Bouton';
import { ChargementPleinEcran } from '@/components/ui/ChargementPleinEcran';
import { Spacing } from '@/constants/theme';
import { formaterDateFr } from '@/domain/dates';
import { etatDelai, joursRestants } from '@/domain/delais';
import { transitionsDisponibles } from '@/domain/statuts/statutMachine';
import type { StatutDemande } from '@/domain/statuts/statutConfig';
import { useChangerStatutDemandeClient } from '@/hooks/mutations/useChangerStatutDemandeClient';
import { useDossier } from '@/hooks/queries/useDossier';
import { useHistorique } from '@/hooks/queries/useHistorique';
import { useTheme } from '@/hooks/use-theme';
import { Alert } from '@/lib/alerte';

const LIBELLES_ACTION: Partial<Record<StatutDemande, string>> = {
  SOUMIS: 'Envoyer ma demande',
  ANNULE: 'Annuler ma demande',
};

export default function EcranDetailDossier() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: dossier, isLoading } = useDossier(id);
  const { data: historique = [] } = useHistorique(id);
  const changerStatut = useChangerStatutDemandeClient(id);

  if (isLoading || !dossier) return <ChargementPleinEcran />;

  const { demande, personne, adresse, visite } = dossier;
  const statut = demande.statut as StatutDemande;
  const actionsClient = transitionsDisponibles(statut, 'client');
  const estNaissance = demande.type_acte === 'naissance';

  function onAction(nouveauStatut: StatutDemande) {
    Alert.alert(LIBELLES_ACTION[nouveauStatut] ?? nouveauStatut, 'Confirmez-vous cette action ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', onPress: () => changerStatut.mutate({ nouveauStatut }) },
    ]);
  }

  const delaiInfo = demande.date_echeance_estimee
    ? {
        etat: etatDelai(new Date(demande.date_echeance_estimee)),
        jours: joursRestants(new Date(demande.date_echeance_estimee)),
      }
    : null;

  return (
    <PageAvecRetour titre="Mon dossier">
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <View style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
          {estNaissance ? 'Acte de naissance' : 'Acte de décès'} · {demande.nombre_copies} copie(s)
        </Text>
        <Text style={[styles.reference, { color: theme.text }]}>{demande.reference}</Text>
        <BadgeStatut statut={statut} />
        {delaiInfo && statut !== 'LIVRE' ? (
          <Text style={{ color: delaiInfo.etat === 'depasse' ? theme.danger : theme.textSecondary, fontSize: 13 }}>
            {delaiInfo.etat === 'depasse'
              ? 'Délai estimé dépassé'
              : `Délai estimé : encore ${Math.max(delaiInfo.jours, 0)} jour(s)`}
          </Text>
        ) : null}
      </View>

      {visite?.statut === 'planifiee' && visite.date_planifiee ? (
        <View style={[styles.carte, { backgroundColor: theme.primary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color={theme.primaryText} />
            <Text style={{ color: theme.primaryText, fontWeight: '700', fontSize: 16 }}>Visite du notaire</Text>
          </View>
          <Text style={{ color: theme.primaryText, fontSize: 18 }}>
            {format(new Date(visite.date_planifiee), 'EEEE d MMMM', { locale: fr })}
            {visite.creneau ? ` · ${visite.creneau}` : ''}
          </Text>
          <Text style={{ color: theme.primaryText, opacity: 0.9 }}>
            Préparez vos pièces d&apos;identité et le livret de famille. La procuration sera signée sur place.
          </Text>
        </View>
      ) : null}

      <View style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={[styles.titreCarte, { color: theme.text }]}>Suivi</Text>
        <Timeline lignes={historique} />
      </View>

      {personne ? (
        <View style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.titreCarte, { color: theme.text }]}>{estNaissance ? 'Enfant' : 'Personne concernée'}</Text>
          <Text style={{ color: theme.text, fontSize: 16 }}>
            {personne.nom} {personne.prenoms ?? ''}
          </Text>
          <Text style={{ color: theme.textSecondary }}>
            {formaterDateFr(personne.date_evenement)} · {personne.lieu_evenement}
          </Text>
          {personne.nom_pere ? <Text style={{ color: theme.textSecondary }}>Père : {personne.nom_pere}</Text> : null}
          {personne.nom_mere ? <Text style={{ color: theme.textSecondary }}>Mère : {personne.nom_mere}</Text> : null}
        </View>
      ) : null}

      {adresse ? (
        <View style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.titreCarte, { color: theme.text }]}>Adresse</Text>
          <Text style={{ color: theme.text }}>{adresse.fokontany}</Text>
          <Text style={{ color: theme.textSecondary }}>{adresse.points_de_repere}</Text>
          <Text style={{ color: theme.textSecondary }}>Tél. {adresse.telephone_sur_place}</Text>
        </View>
      ) : null}

      {actionsClient.map((cible) => (
        <Bouton
          key={cible}
          titre={LIBELLES_ACTION[cible] ?? cible}
          variante={cible === 'ANNULE' ? 'danger' : 'primaire'}
          enChargement={changerStatut.isPending}
          onPress={() => onAction(cible)}
        />
      ))}
    </ScrollView>
    </PageAvecRetour>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.three, gap: Spacing.three },
  carte: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: 'transparent' },
  reference: { fontSize: 24, fontWeight: '800' },
  titreCarte: { fontWeight: '700', fontSize: 16, marginBottom: Spacing.one },
});
