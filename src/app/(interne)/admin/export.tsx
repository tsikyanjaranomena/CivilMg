import { Alert } from '@/lib/alerte';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { exporterDemandes } from '@/api/export.api';
import { Bouton } from '@/components/ui/Bouton';
import { ChampDate } from '@/components/ui/ChampDate';
import { Spacing } from '@/constants/theme';
import { versCsv } from '@/lib/csv';
import { partagerFichierTexte } from '@/lib/partageFichier';
import { useTheme } from '@/hooks/use-theme';

export default function EcranExport() {
  const theme = useTheme();
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function onExporter() {
    if (!dateDebut || !dateFin) {
      Alert.alert('Dates requises', 'Choisissez une date de début et une date de fin.');
      return;
    }
    setEnCours(true);
    try {
      const lignes = await exporterDemandes(dateDebut, `${dateFin}T23:59:59`);
      if (lignes.length === 0) {
        Alert.alert('Aucun résultat', 'Aucun dossier sur cette période.');
        return;
      }
      const csv = versCsv(lignes as unknown as Record<string, unknown>[]);
      await partagerFichierTexte(`dossiers-${dateDebut}-au-${dateFin}.csv`, csv);
    } catch (erreur) {
      Alert.alert('Erreur', erreur instanceof Error ? erreur.message : "Export impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Bouton titre="← Retour" variante="secondaire" onPress={() => router.back()} />
      <Text style={[styles.titre, { color: theme.text }]}>Export CSV</Text>
      <Text style={{ color: theme.textSecondary }}>Exporte les dossiers créés sur la période choisie.</Text>

      <ChampDate etiquette="Date de début" valeur={dateDebut} onChangement={setDateDebut} dateMaximum={new Date()} />
      <ChampDate etiquette="Date de fin" valeur={dateFin} onChangement={setDateFin} dateMaximum={new Date()} />

      <Bouton titre="Exporter et partager" onPress={onExporter} enChargement={enCours} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 24, fontWeight: '700' },
});
