import { PageAvecRetour } from '@/components/ui/PageAvecRetour';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { BarreProgression } from '@/components/nouvelle-demande/BarreProgression';
import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { SelecteurModal } from '@/components/ui/SelecteurModal';
import { Spacing } from '@/constants/theme';
import { adresseSchema, type AdresseFormValues } from '@/domain/validation/adresseSchema';
import { useAdressesProfil } from '@/hooks/queries/useAdressesProfil';
import { useCommunes } from '@/hooks/queries/useCommunes';
import { useTheme } from '@/hooks/use-theme';
import { useNouvelleDemandeStore } from '@/stores/nouvelleDemandeStore';

type AdresseConnue = NonNullable<ReturnType<typeof useAdressesProfil>['data']>[number];

function versFormulaire(adresse: AdresseConnue): AdresseFormValues {
  return {
    region: adresse.region,
    district: adresse.district,
    communeId: adresse.commune_id,
    fokontany: adresse.fokontany,
    pointsDeRepere: adresse.points_de_repere,
    telephoneSurPlace: adresse.telephone_sur_place,
  };
}

const VIDE: AdresseFormValues = {
  region: '',
  district: '',
  communeId: '',
  fokontany: '',
  pointsDeRepere: '',
  telephoneSurPlace: '',
};

/**
 * Adresse où le notaire viendra : 4 champs seulement. Région et district sont
 * déduits de la commune choisie. Si le père a déjà une adresse enregistrée, le
 * formulaire est pré-rempli ; inchangée, elle est réutilisée telle quelle.
 */
export default function EtapeAdresse() {
  const theme = useTheme();
  const etape3 = useNouvelleDemandeStore((s) => s.etape3);
  const definirEtape3 = useNouvelleDemandeStore((s) => s.definirEtape3);
  const { data: adresses = [] } = useAdressesProfil();
  const { data: communes = [] } = useCommunes();
  const adresseConnue = adresses[0];

  // L'adresse connue arrive après le premier rendu (requête réseau). L'option
  // `values` de react-hook-form remplit alors le formulaire sans écraser ce que
  // l'utilisateur a déjà modifié (keepDirtyValues) ; un brouillon a priorité.
  const valeursInitiales = useMemo(
    () => etape3 ?? (adresseConnue ? versFormulaire(adresseConnue) : VIDE),
    [etape3, adresseConnue],
  );
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdresseFormValues>({
    resolver: zodResolver(adresseSchema),
    values: valeursInitiales,
    resetOptions: { keepDirtyValues: true },
  });

  function onSubmit(valeurs: AdresseFormValues) {
    const connue = adresseConnue ? versFormulaire(adresseConnue) : null;
    const inchangee =
      connue !== null &&
      connue.communeId === valeurs.communeId &&
      connue.fokontany === valeurs.fokontany &&
      connue.pointsDeRepere === valeurs.pointsDeRepere &&
      connue.telephoneSurPlace === valeurs.telephoneSurPlace;

    definirEtape3({ ...valeurs, idExistant: inchangee ? adresseConnue?.id : undefined });
    router.push('/nouvelle-demande/etape-5-recap');
  }

  const optionsCommunes = communes.map((c) => ({ id: c.id, libelle: c.nom, sousLibelle: c.district }));

  return (
    <PageAvecRetour titre="Nouvelle demande">
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <BarreProgression etapeActuelle={2} />
      <Text style={[styles.titre, { color: theme.text }]}>Où le notaire peut-il vous rencontrer ?</Text>
      <Text style={{ color: theme.textSecondary }}>
        {'Le notaire viendra chez vous vérifier les informations et récupérer la procuration signée.'}
      </Text>

      <Controller
        control={control}
        name="communeId"
        render={({ field }) => (
          <SelecteurModal
            etiquette="Commune"
            options={optionsCommunes}
            valeurId={field.value}
            onSelection={(option) => {
              field.onChange(option.id);
              const commune = communes.find((c) => c.id === option.id);
              if (commune) {
                setValue('region', commune.region);
                setValue('district', commune.district);
              }
            }}
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
        name="pointsDeRepere"
        render={({ field }) => (
          <ChampTexte
            etiquette="Points de repère"
            placeholder="Ex : portail bleu en face du marché"
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
            etiquette="Téléphone"
            keyboardType="phone-pad"
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.telephoneSurPlace?.message}
          />
        )}
      />

      <Bouton titre="Continuer" icone="arrow-right" onPress={handleSubmit(onSubmit)} />
      <Bouton titre="Retour" variante="secondaire" onPress={() => router.back()} />
    </ScrollView>
    </PageAvecRetour>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 20, fontWeight: '700' },
});
