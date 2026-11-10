import { Alert } from '@/lib/alerte';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { ChargementPleinEcran } from '@/components/ui/ChargementPleinEcran';
import { SelecteurModal } from '@/components/ui/SelecteurModal';
import { Spacing } from '@/constants/theme';
import { adresseSchema, type AdresseFormValues } from '@/domain/validation/adresseSchema';
import { useDossier } from '@/hooks/queries/useDossier';
import { useCommunes } from '@/hooks/queries/useCommunes';
import { useModifierAdresse } from '@/hooks/mutations/useModifierAdresse';
import { messageErreurGenerique } from '@/lib/erreurs';
import { useTheme } from '@/hooks/use-theme';

export default function EcranModifierAdresse() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: dossier, isLoading } = useDossier(id);
  const { data: communes = [] } = useCommunes();
  const modifierAdresse = useModifierAdresse(id, dossier?.adresse?.id ?? '');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AdresseFormValues>({
    resolver: zodResolver(adresseSchema),
    values: dossier?.adresse
      ? {
          region: dossier.adresse.region,
          district: dossier.adresse.district,
          communeId: dossier.adresse.commune_id,
          fokontany: dossier.adresse.fokontany,
          quartier: dossier.adresse.quartier ?? '',
          lotNumero: dossier.adresse.lot_numero ?? '',
          pointsDeRepere: dossier.adresse.points_de_repere,
          telephoneSurPlace: dossier.adresse.telephone_sur_place,
          creneauxDisponibilite: dossier.adresse.creneaux_disponibilite ?? '',
        }
      : undefined,
  });

  if (isLoading || !dossier?.adresse) return <ChargementPleinEcran />;

  async function onSubmit(valeurs: AdresseFormValues) {
    try {
      await modifierAdresse.mutateAsync(valeurs);
      router.back();
    } catch (erreur) {
      Alert.alert('Erreur', messageErreurGenerique(erreur));
    }
  }

  const optionsCommunes = communes.map((c) => ({ id: c.id, libelle: c.nom, sousLibelle: c.district }));

  return (
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.titre, { color: theme.text }]}>{"Corriger l'adresse"}</Text>

      <Controller
        control={control}
        name="region"
        render={({ field }) => (
          <ChampTexte etiquette="Région" value={field.value} onChangeText={field.onChange} erreur={errors.region?.message} />
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
        name="communeId"
        render={({ field }) => (
          <SelecteurModal
            etiquette="Commune"
            options={optionsCommunes}
            valeurId={field.value}
            onSelection={(option) => field.onChange(option.id)}
            erreur={errors.communeId?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="fokontany"
        render={({ field }) => (
          <ChampTexte etiquette="Fokontany" value={field.value} onChangeText={field.onChange} erreur={errors.fokontany?.message} />
        )}
      />
      <Controller
        control={control}
        name="quartier"
        render={({ field }) => <ChampTexte etiquette="Quartier (optionnel)" value={field.value} onChangeText={field.onChange} />}
      />
      <Controller
        control={control}
        name="lotNumero"
        render={({ field }) => <ChampTexte etiquette="Lot / numéro (optionnel)" value={field.value} onChangeText={field.onChange} />}
      />
      <Controller
        control={control}
        name="pointsDeRepere"
        render={({ field }) => (
          <ChampTexte
            etiquette="Points de repère"
            multiline
            numberOfLines={3}
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.pointsDeRepere?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="telephoneSurPlace"
        render={({ field }) => (
          <ChampTexte
            etiquette="Téléphone joignable sur place"
            keyboardType="phone-pad"
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.telephoneSurPlace?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="creneauxDisponibilite"
        render={({ field }) => (
          <ChampTexte etiquette="Créneaux de disponibilité (optionnel)" value={field.value} onChangeText={field.onChange} />
        )}
      />

      <Bouton titre="Enregistrer" onPress={handleSubmit(onSubmit)} enChargement={modifierAdresse.isPending} />
      <Bouton titre="Annuler" variante="secondaire" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 20, fontWeight: '700' },
});
