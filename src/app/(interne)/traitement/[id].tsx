import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Timeline } from '@/components/dossier/Timeline';
import { ETAPES_NOTAIRE, etapeDuStatut } from '@/components/notaire/etapes';
import { BadgeStatut } from '@/components/ui/BadgeStatut';
import { Bouton, type NomIcone } from '@/components/ui/Bouton';
import { ChampDate } from '@/components/ui/ChampDate';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { ChargementPleinEcran } from '@/components/ui/ChargementPleinEcran';
import { PageAvecRetour } from '@/components/ui/PageAvecRetour';
import { Spacing } from '@/constants/theme';
import { formaterDateFr } from '@/domain/dates';
import { FRAIS, FRAIS_TOTAL, formaterAriary } from '@/domain/paiement';
import { motifClientObligatoire, transitionsDisponibles } from '@/domain/statuts/statutMachine';
import type { StatutDemande } from '@/domain/statuts/statutConfig';
import { useChangerStatutDemande } from '@/hooks/mutations/useChangerStatutDemande';
import { useCreerVisite, useEnregistrerCompteRendu, useReplanifierVisite } from '@/hooks/mutations/useVisitesMutations';
import { useDossier } from '@/hooks/queries/useDossier';
import { useHistorique } from '@/hooks/queries/useHistorique';
import { useTheme } from '@/hooks/use-theme';
import { Alert } from '@/lib/alerte';

type Theme = ReturnType<typeof useTheme>;

interface Visite {
  id: string;
  date_planifiee: string | null;
  creneau: string | null;
}

function messageErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : 'Action impossible.';
}

function appeler(telephone: string | null | undefined) {
  if (!telephone) return;
  Linking.openURL(`tel:${telephone.replace(/\s/g, '')}`).catch(() =>
    Alert.alert('Appel impossible', "Cet appareil ne peut pas passer d'appel."),
  );
}

export default function EcranDossierNotaire() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: dossier, isLoading } = useDossier(id);
  const { data: historique = [] } = useHistorique(id);

  if (isLoading || !dossier) return <ChargementPleinEcran />;

  const { demande, personne, adresse, visite } = dossier;
  const statut = demande.statut as StatutDemande;
  const estNaissance = demande.type_acte === 'naissance';
  const telephone = adresse?.telephone_sur_place;
  const carte = [styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }];

  return (
    <PageAvecRetour titre="Dossier">
      <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
        <View style={[carte, styles.entete]}>
          <View style={[styles.iconeType, { backgroundColor: estNaissance ? '#E3EDFB' : '#EEE8F8' }]}>
            <MaterialCommunityIcons
              name={estNaissance ? 'baby-carriage' : 'flower-tulip-outline'}
              size={30}
              color={estNaissance ? '#1E56A0' : '#6B4FA3'}
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: theme.text, fontSize: 19, fontWeight: '800' }}>
              {personne ? `${personne.nom} ${personne.prenoms ?? ''}`.trim() : demande.reference}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              {estNaissance ? 'Acte de naissance' : 'Acte de décès'} · {demande.reference} · {demande.nombre_copies}{' '}
              copie{demande.nombre_copies > 1 ? 's' : ''}
            </Text>
            <BadgeStatut statut={statut} />
          </View>
        </View>

        <Progression statut={statut} theme={theme} />

        <ProchaineAction demandeId={id} statut={statut} visite={visite} telephone={telephone} theme={theme} />

        {personne ? (
          <View style={carte}>
            <TitreBloc icone="account-outline" titre={estNaissance ? 'Enfant' : 'Personne concernée'} theme={theme} />
            <Ligne libelle={estNaissance ? 'Né(e) le' : 'Décédé(e) le'} valeur={formaterDateFr(personne.date_evenement)} theme={theme} />
            <Ligne libelle="Lieu" valeur={personne.lieu_evenement} theme={theme} />
            {personne.nom_pere ? <Ligne libelle="Père" valeur={personne.nom_pere} theme={theme} /> : null}
            {personne.nom_mere ? <Ligne libelle="Mère" valeur={personne.nom_mere} theme={theme} /> : null}
          </View>
        ) : null}

        {adresse ? (
          <View style={carte}>
            <TitreBloc icone="map-marker-outline" titre="Adresse de la visite" theme={theme} />
            <Text style={{ color: theme.text, fontSize: 15 }}>
              {adresse.fokontany}, {adresse.district}
            </Text>
            {adresse.points_de_repere ? (
              <Text style={{ color: theme.textSecondary }}>{adresse.points_de_repere}</Text>
            ) : null}
            <View style={styles.boutonsLigne}>
              <View style={{ flex: 1 }}>
                <Bouton titre={telephone ?? 'Appeler'} icone="phone" variante="secondaire" onPress={() => appeler(telephone)} />
              </View>
              <View style={{ flex: 1 }}>
                <Bouton
                  titre="Carte"
                  icone="map-outline"
                  variante="secondaire"
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${adresse.fokontany}, ${adresse.district}, Antananarivo`,
                      )}`,
                    )
                  }
                />
              </View>
            </View>
          </View>
        ) : null}

        <View style={carte}>
          <TitreBloc icone="history" titre="Historique" theme={theme} />
          <Timeline lignes={historique} />
        </View>

        <AutresActions demandeId={id} statut={statut} theme={theme} />
      </ScrollView>
    </PageAvecRetour>
  );
}

/** Frise des 4 étapes du notaire, l'étape en cours mise en avant. */
function Progression({ statut, theme }: { statut: StatutDemande; theme: Theme }) {
  const etapes = ETAPES_NOTAIRE.filter((e) => e.cle !== 'termine');
  const courante = etapeDuStatut(statut);
  const indexCourant = courante ? ETAPES_NOTAIRE.indexOf(courante) : -1;
  if (indexCourant < 0) return null;

  return (
    <View style={[styles.carte, styles.progression, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {etapes.map((etape, index) => {
        const faite = index < indexCourant;
        const enCours = index === indexCourant;
        const couleur = faite ? theme.success : enCours ? etape.couleur : theme.textSecondary;
        return (
          <View key={etape.cle} style={styles.pas}>
            <View
              style={[
                styles.pastillePas,
                { backgroundColor: faite ? theme.success : enCours ? etape.fond : theme.backgroundSelected, borderColor: couleur },
              ]}
            >
              <MaterialCommunityIcons name={faite ? 'check' : etape.icone} size={20} color={faite ? '#FFFFFF' : couleur} />
            </View>
            <Text
              style={{ color: enCours ? theme.text : theme.textSecondary, fontSize: 11, fontWeight: enCours ? '800' : '500', textAlign: 'center' }}
              numberOfLines={2}
            >
              {etape.court}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Une seule action principale à la fois, selon l'étape du dossier. */
function ProchaineAction({
  demandeId,
  statut,
  visite,
  telephone,
  theme,
}: {
  demandeId: string;
  statut: StatutDemande;
  visite: Visite | null;
  telephone: string | null | undefined;
  theme: Theme;
}) {
  const changerStatut = useChangerStatutDemande(demandeId);
  const creerVisite = useCreerVisite(demandeId);
  const replanifierVisite = useReplanifierVisite(demandeId, visite?.id ?? '');
  const enregistrerCompteRendu = useEnregistrerCompteRendu(demandeId, visite?.id ?? '');
  // Présélection « demain matin » : le notaire n'a qu'à confirmer si c'est ce qui a été convenu.
  const [datePlanifiee, setDatePlanifiee] = useState(() => choixJours()[1].valeur);
  const [autreDate, setAutreDate] = useState(false);
  const [creneau, setCreneau] = useState<string>(CRENEAUX[0]);
  const [observations, setObservations] = useState('');
  const [coches, setCoches] = useState<Record<string, boolean>>({});
  const [enCours, setEnCours] = useState(false);

  const etape = etapeDuStatut(statut);
  const basculer = (cle: string) => setCoches((c) => ({ ...c, [cle]: !c[cle] }));
  const tout = (cles: string[]) => cles.every((c) => coches[c]);

  async function executer(action: () => Promise<unknown>, succes?: string) {
    setEnCours(true);
    try {
      await action();
      setCoches({});
      if (succes) Alert.alert(succes);
    } catch (erreur) {
      Alert.alert('Action refusée', messageErreur(erreur));
    } finally {
      setEnCours(false);
    }
  }

  function confirmerVisite() {
    if (!datePlanifiee || !creneau.trim()) {
      Alert.alert('Champs requis', "Choisissez la date et l'heure convenues avec le client.");
      return;
    }
    void executer(async () => {
      if (visite) await replanifierVisite.mutateAsync({ datePlanifiee, creneau: creneau.trim() });
      else await creerVisite.mutateAsync({ datePlanifiee, creneau: creneau.trim() });
      await changerStatut.mutateAsync({ nouveauStatut: 'VISITE_PLANIFIEE' });
    }, 'Visite confirmée');
  }

  function visiteTerminee() {
    void executer(async () => {
      await enregistrerCompteRendu.mutateAsync({
        statut: 'effectuee',
        compteRendu: observations.trim() || `Visite effectuée. Procuration signée et ${formaterAriary(FRAIS.visite)} reçus.`,
        verificationConcluante: true,
        procurationRecuperee: true,
      });
      await changerStatut.mutateAsync({ nouveauStatut: 'EN_TRAITEMENT' });
    }, 'Visite enregistrée');
  }

  function clientAbsent() {
    Alert.alert('Client absent', 'Le dossier repassera en « à appeler » pour fixer une nouvelle visite.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: () =>
          void executer(async () => {
            await enregistrerCompteRendu.mutateAsync({
              statut: 'client_absent',
              procurationRecuperee: false,
              motifEchec: observations.trim() || 'Client absent lors de la visite.',
            });
            await changerStatut.mutateAsync({ nouveauStatut: 'VISITE_A_REPLANIFIER' });
          }),
      },
    ]);
  }

  if (!etape) {
    return (
      <CarteAction couleur={theme.danger} fond={theme.danger + '18'} icone="close-circle-outline" titre="Dossier clos" theme={theme}>
        <Text style={{ color: theme.textSecondary }}>Ce dossier a été rejeté ou annulé. Aucune action à faire.</Text>
      </CarteAction>
    );
  }

  const entete = { couleur: etape.couleur, fond: etape.fond, icone: etape.icone, theme };

  // Étape 1 : appeler le client et fixer la visite.
  if (statut === 'SOUMIS' || statut === 'VISITE_A_REPLANIFIER') {
    return (
      <CarteAction {...entete} titre={statut === 'SOUMIS' ? 'Appeler le client' : 'Rappeler le client'} sousTitre={etape.duree}>
        <Text style={{ color: theme.textSecondary }}>
          {statut === 'SOUMIS'
            ? 'Appelez le client pour convenir avec lui du jour et de l’heure de votre visite.'
            : 'La visite n’a pas pu avoir lieu. Rappelez le client pour fixer un nouveau rendez-vous.'}
        </Text>
        <Bouton titre={`Appeler ${telephone ?? ''}`.trim()} icone="phone" onPress={() => appeler(telephone)} desactive={!telephone} />
        <View style={[styles.separateur, { backgroundColor: theme.border }]} />
        <Text style={{ color: theme.text, fontWeight: '700' }}>Rendez-vous convenu</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Jour</Text>
        <Puces
          options={choixJours().map((j) => ({ valeur: j.valeur, libelle: j.libelle }))}
          valeur={choixJours().some((j) => j.valeur === datePlanifiee) ? datePlanifiee : 'autre'}
          onChangement={(v) => {
            if (v === 'autre') setAutreDate(true);
            else {
              setAutreDate(false);
              setDatePlanifiee(v);
            }
          }}
          avecAutre
          theme={theme}
        />
        {autreDate ? <ChampDate etiquette="Autre date" valeur={datePlanifiee} onChangement={setDatePlanifiee} /> : null}
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Heure</Text>
        <Puces
          options={CRENEAUX.map((c) => ({ valeur: c, libelle: c }))}
          valeur={creneau}
          onChangement={setCreneau}
          theme={theme}
        />
        <ChampTexte etiquette="Ou heure précise" placeholder="Ex : 9h30" value={CRENEAUX.includes(creneau) ? '' : creneau} onChangeText={setCreneau} />
        <Bouton titre="Confirmer la visite" icone="calendar-check" variante="accent" onPress={confirmerVisite} enChargement={enCours} />
      </CarteAction>
    );
  }

  // Étape 2 : la visite chez le client.
  if (statut === 'VISITE_PLANIFIEE') {
    const cles = ['infos', 'procuration', 'frais'];
    return (
      <CarteAction {...entete} titre="Visite chez le client" sousTitre={formaterVisite(visite)}>
        <Bouton titre="Appeler le client" icone="phone" variante="secondaire" onPress={() => appeler(telephone)} desactive={!telephone} />
        <Text style={{ color: theme.text, fontWeight: '700', marginTop: Spacing.one }}>Pendant la visite</Text>
        <Case cochee={!!coches.infos} onPress={() => basculer('infos')} texte="Informations vérifiées avec le client" theme={theme} />
        <Case cochee={!!coches.procuration} onPress={() => basculer('procuration')} texte="Procuration signée récupérée" theme={theme} />
        <Case cochee={!!coches.frais} onPress={() => basculer('frais')} texte={`${formaterAriary(FRAIS.visite)} reçus`} theme={theme} />
        <ChampTexte etiquette="Remarques (facultatif)" multiline value={observations} onChangeText={setObservations} />
        <Bouton
          titre="Visite terminée"
          icone="check-circle-outline"
          variante="accent"
          onPress={visiteTerminee}
          enChargement={enCours}
          desactive={!tout(cles)}
        />
        <Bouton titre="Client absent" icone="account-off-outline" variante="secondaire" onPress={clientAbsent} desactive={enCours} />
      </CarteAction>
    );
  }

  // Étape 3 : préparation de l'acte à l'état civil.
  if (statut === 'EN_TRAITEMENT' || statut === 'EN_VALIDATION') {
    return (
      <CarteAction {...entete} titre="Préparer l'acte" sousTitre={etape.duree}>
        <Text style={{ color: theme.textSecondary }}>
          Faites les démarches auprès de l’état civil. Quand l’acte est prêt, le client en est informé.
        </Text>
        <Bouton
          titre="L'acte est prêt"
          icone="file-check-outline"
          variante="accent"
          enChargement={enCours}
          onPress={() =>
            Alert.alert("L'acte est prêt ?", 'Le client verra que son acte est prêt.', [
              { text: 'Non', style: 'cancel' },
              { text: 'Oui', onPress: () => void executer(() => changerStatut.mutateAsync({ nouveauStatut: 'PRET' })) },
            ])
          }
        />
      </CarteAction>
    );
  }

  // Étape 4 : remise de l'acte.
  if (statut === 'PRET') {
    const cles = ['remis', 'solde'];
    return (
      <CarteAction {...entete} titre="Remettre l'acte" sousTitre={etape.duree}>
        <Text style={{ color: theme.textSecondary }}>Appelez le client pour lui remettre sa copie.</Text>
        <Bouton titre="Appeler le client" icone="phone" onPress={() => appeler(telephone)} desactive={!telephone} />
        <Case cochee={!!coches.remis} onPress={() => basculer('remis')} texte="Acte remis au client" theme={theme} />
        <Case cochee={!!coches.solde} onPress={() => basculer('solde')} texte={`${formaterAriary(FRAIS.remise)} reçus`} theme={theme} />
        <Bouton
          titre="Dossier terminé"
          icone="check-decagram"
          variante="accent"
          enChargement={enCours}
          desactive={!tout(cles)}
          onPress={() => void executer(() => changerStatut.mutateAsync({ nouveauStatut: 'LIVRE' }), 'Dossier terminé')}
        />
      </CarteAction>
    );
  }

  if (statut === 'LIVRE') {
    return (
      <CarteAction {...entete} titre="Dossier terminé">
        <Text style={{ color: theme.textSecondary }}>
          Acte remis au client. Frais perçus : {formaterAriary(FRAIS_TOTAL)}.
        </Text>
      </CarteAction>
    );
  }

  // Brouillon ou pièces à compléter : c'est au client d'agir.
  return (
    <CarteAction {...entete} titre="En attente du client">
      <Text style={{ color: theme.textSecondary }}>Le client doit encore compléter sa demande.</Text>
      <Bouton titre="Appeler le client" icone="phone" variante="secondaire" onPress={() => appeler(telephone)} desactive={!telephone} />
    </CarteAction>
  );
}

const CRENEAUX = ['Matin (8h – 12h)', 'Après-midi (14h – 17h)'];

/** Aujourd'hui, demain, après-demain au format AAAA-MM-JJ (date locale). */
function choixJours(): { valeur: string; libelle: string }[] {
  const libelles = ["Aujourd'hui", 'Demain', 'Après-demain'];
  return libelles.map((libelle, i) => ({ valeur: format(addDays(new Date(), i), 'yyyy-MM-dd'), libelle }));
}

function Puces({
  options,
  valeur,
  onChangement,
  avecAutre,
  theme,
}: {
  options: { valeur: string; libelle: string }[];
  valeur: string;
  onChangement: (valeur: string) => void;
  avecAutre?: boolean;
  theme: Theme;
}) {
  const toutes = avecAutre ? [...options, { valeur: 'autre', libelle: 'Autre date' }] : options;
  return (
    <View style={styles.puces}>
      {toutes.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable
            key={o.valeur}
            accessibilityRole="button"
            accessibilityState={{ selected: actif }}
            onPress={() => onChangement(o.valeur)}
            style={[
              styles.puce,
              { backgroundColor: actif ? theme.primary : theme.backgroundElement, borderColor: actif ? theme.primary : theme.border },
            ]}
          >
            <Text style={{ color: actif ? theme.primaryText : theme.text, fontWeight: '600' }}>{o.libelle}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function formaterVisite(visite: Visite | null): string | undefined {
  if (!visite?.date_planifiee) return undefined;
  const date = format(new Date(visite.date_planifiee), 'EEEE d MMMM', { locale: fr });
  return visite.creneau ? `${date} · ${visite.creneau}` : date;
}

/** Rejeter / annuler : discret, en bas de page, avec un motif pour le client. */
function AutresActions({ demandeId, statut, theme }: { demandeId: string; statut: StatutDemande; theme: Theme }) {
  const changerStatut = useChangerStatutDemande(demandeId);
  const [cible, setCible] = useState<StatutDemande | null>(null);
  const [motif, setMotif] = useState('');
  const actions = transitionsDisponibles(statut, 'responsable').filter(
    (s): s is 'REJETE' | 'ANNULE' => s === 'REJETE' || s === 'ANNULE',
  );
  if (actions.length === 0) return null;

  const libelle = { REJETE: 'Rejeter le dossier', ANNULE: 'Annuler le dossier' } as const;

  function confirmer() {
    if (!cible) return;
    const motifRequis = motifClientObligatoire(statut, cible);
    if (motifRequis && !motif.trim()) {
      Alert.alert('Motif requis', 'Expliquez au client pourquoi.');
      return;
    }
    changerStatut.mutate(
      { nouveauStatut: cible, commentaireClient: motif.trim() || undefined },
      {
        onSuccess: () => setCible(null),
        onError: (erreur) => Alert.alert('Action refusée', messageErreur(erreur)),
      },
    );
  }

  return (
    <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
      <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700' }}>AUTRES ACTIONS</Text>
      {cible ? (
        <View style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.danger }]}>
          <Text style={{ color: theme.danger, fontWeight: '700' }}>{libelle[cible as 'REJETE' | 'ANNULE']}</Text>
          <ChampTexte etiquette="Motif (visible par le client)" multiline value={motif} onChangeText={setMotif} />
          <Bouton titre="Confirmer" variante="danger" onPress={confirmer} enChargement={changerStatut.isPending} />
          <Bouton titre="Retour" variante="secondaire" onPress={() => setCible(null)} />
        </View>
      ) : (
        <View style={styles.boutonsLigne}>
          {actions.map((a) => (
            <Pressable
              key={a}
              accessibilityRole="button"
              onPress={() => {
                setCible(a);
                setMotif('');
              }}
              style={[styles.lienDanger, { borderColor: theme.border }]}
            >
              <MaterialCommunityIcons name={a === 'REJETE' ? 'close-octagon-outline' : 'cancel'} size={18} color={theme.danger} />
              <Text style={{ color: theme.danger, fontWeight: '600' }}>{libelle[a]}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function CarteAction({
  couleur,
  fond,
  icone,
  titre,
  sousTitre,
  theme,
  children,
}: {
  couleur: string;
  fond: string;
  icone: NomIcone;
  titre: string;
  sousTitre?: string;
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.carte, styles.carteAction, { backgroundColor: theme.backgroundElement, borderColor: couleur }]}>
      <View style={styles.enteteAction}>
        <View style={[styles.iconeAction, { backgroundColor: fond }]}>
          <MaterialCommunityIcons name={icone} size={26} color={couleur} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>À FAIRE MAINTENANT</Text>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>{titre}</Text>
          {sousTitre ? <Text style={{ color: couleur, fontWeight: '700', marginTop: 2 }}>{sousTitre}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function Case({ cochee, onPress, texte, theme }: { cochee: boolean; onPress: () => void; texte: string; theme: Theme }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: cochee }}
      onPress={onPress}
      style={[styles.case, { borderColor: cochee ? theme.success : theme.border, backgroundColor: cochee ? theme.success + '14' : 'transparent' }]}
    >
      <MaterialCommunityIcons
        name={cochee ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
        size={26}
        color={cochee ? theme.success : theme.textSecondary}
      />
      <Text style={{ color: theme.text, fontSize: 15, flex: 1 }}>{texte}</Text>
    </Pressable>
  );
}

function TitreBloc({ icone, titre, theme }: { icone: NomIcone; titre: string; theme: Theme }) {
  return (
    <View style={styles.titreBloc}>
      <MaterialCommunityIcons name={icone} size={20} color={theme.primary} />
      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{titre}</Text>
    </View>
  );
}

function Ligne({ libelle, valeur, theme }: { libelle: string; valeur: string; theme: Theme }) {
  return (
    <View style={styles.ligne}>
      <Text style={{ color: theme.textSecondary, width: 96 }}>{libelle}</Text>
      <Text style={{ color: theme.text, flex: 1, fontWeight: '600' }}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  carte: { borderRadius: 18, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  entete: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconeType: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  progression: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.one },
  pas: { flex: 1, alignItems: 'center', gap: 6 },
  pastillePas: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  carteAction: { borderWidth: 2, gap: Spacing.three },
  enteteAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconeAction: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  separateur: { height: 1 },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  puce: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999, borderWidth: 1 },
  case: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1, borderRadius: 14, padding: Spacing.two },
  titreBloc: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ligne: { flexDirection: 'row', gap: Spacing.two },
  boutonsLigne: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  lienDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
