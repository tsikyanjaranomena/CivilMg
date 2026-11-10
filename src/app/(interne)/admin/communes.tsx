import { Alert } from '@/lib/alerte';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { Spacing } from '@/constants/theme';
import { useCommunes } from '@/hooks/queries/useCommunes';
import { useCreerCommune } from '@/hooks/mutations/useReferentielsMutations';
import { useTheme } from '@/hooks/use-theme';

const schemaCommune = z.object({
  code: z.string().min(1, 'Code requis.'),
  nom: z.string().min(1, 'Nom requis.'),
  district: z.string().min(1, 'District requis.'),
  region: z.string().min(1, 'Région requise.'),
});
type CommuneValues = z.infer<typeof schemaCommune>;

export default function EcranCommunes() {
  const theme = useTheme();
  const { data: communes = [] } = useCommunes();
  const creerCommune = useCreerCommune();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommuneValues>({
    resolver: zodResolver(schemaCommune),
    defaultValues: { code: '', nom: '', district: '', region: '' },
  });

  async function onSubmit(valeurs: CommuneValues) {
    try {
      await creerCommune.mutateAsync(valeurs);
      reset();
    } catch (erreur) {
      Alert.alert('Erreur', erreur instanceof Error ? erreur.message : 'Création impossible.');
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Bouton titre="← Retour" variante="secondaire" onPress={() => router.back()} />
      <Text style={[styles.titre, { color: theme.text }]}>Communes</Text>

      <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitre, { color: theme.text }]}>Ajouter une commune</Text>
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <ChampTexte etiquette="Code" value={field.value} onChangeText={field.onChange} erreur={errors.code?.message} />
          )}
        />
        <Controller
          control={control}
          name="nom"
          render={({ field }) => (
            <ChampTexte etiquette="Nom" value={field.value} onChangeText={field.onChange} erreur={errors.nom?.message} />
          )}
        />
        <Controller
          control={control}
          name="district"
          render={({ field }) => (
            <ChampTexte etiquette="District" value={field.value} onChangeText={field.onChange} erreur={errors.district?.message} />
          )}
        />
        <Controller
          control={control}
          name="region"
          render={({ field }) => (
            <ChampTexte etiquette="Région" value={field.value} onChangeText={field.onChange} erreur={errors.region?.message} />
          )}
        />
        <Bouton titre="Ajouter" onPress={handleSubmit(onSubmit)} enChargement={creerCommune.isPending} />
      </View>

      {communes.map((commune) => (
        <View key={commune.id} style={[styles.ligne, { backgroundColor: theme.backgroundElement }]}>
          <Text style={{ color: theme.text, fontWeight: '600' }}>{commune.nom}</Text>
          <Text style={{ color: theme.textSecondary }}>
            {commune.district} — {commune.region} ({commune.code})
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 24, fontWeight: '700' },
  section: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  sectionTitre: { fontWeight: '700', fontSize: 16 },
  ligne: { borderRadius: 12, padding: Spacing.three, gap: 4 },
});
