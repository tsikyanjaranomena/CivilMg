import { Alert } from '@/lib/alerte';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BarreProgression } from '@/components/nouvelle-demande/BarreProgression';
import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { SelecteurModal } from '@/components/ui/SelecteurModal';
import { Spacing } from '@/constants/theme';
import { adresseSchema, type AdresseFormValues } from '@/domain/validation/adresseSchema';
import { useTheme } from '@/hooks/use-theme';
import { useAdressesProfil } from '@/hooks/queries/useAdressesProfil';
import { useCommunes } from '@/hooks/queries/useCommunes';
import { useParametre } from '@/hooks/queries/useParametre';
import { obtenirPositionActuelle } from '@/lib/location';
import { useNouvelleDemandeStore, type AdresseBrouillon } from '@/stores/nouvelleDemandeStore';

const ADRESSE_VIDE: AdresseFormValues = {
  region: '',
  district: '',
  communeId: '',
  fokontany: '',
  quartier: '',
  lotNumero: '',
  pointsDeRepere: '',
  telephoneSurPlace: '',
  creneauxDisponibilite: '',
};

export default function EtapeAdresse() {
  const theme = useTheme();
  const etape3 = useNouvelleDemandeStore((s) => s.etape3);
  const definirEtape3 = useNouvelleDemandeStore((s) => s.definirEtape3);
  const { data: adressesProfil = [] } = useAdressesProfil();
  const { data: communes = [] } = useCommunes();
  const { data: texteAide } = useParametre('aide_pourquoi_adresse');

  const [mode, setMode] = useState<'liste' | 'formulaire'>(
    etape3?.idExistant || adressesProfil.length === 0 ? (adressesProfil.length === 0 ? 'formulaire' : 'liste') : 'liste',
  );
  const [obtentionPosition, setObtentionPosition] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdresseFormValues>({
    resolver: zodResolver(adresseSchema),
    defaultValues: etape3 ?? ADRESSE_VIDE,
  });

  function continuerAvec(valeurs: AdresseBrouillon) {
    definirEtape3(valeurs);
    router.push('/nouvelle-demande/etape-4-pieces');
  }

  function utiliserAdresseExistante(adresse: (typeof adressesProfil)[number]) {
    continuerAvec({
      idExistant: adresse.id,
      region: adresse.region,
      district: adresse.district,
      communeId: adresse.commune_id,
      fokontany: adresse.fokontany,
      quartier: adresse.quartier ?? '',
      lotNumero: adresse.lot_numero ?? '',
      pointsDeRepere: adresse.points_de_repere,
      telephoneSurPlace: adresse.telephone_sur_place,
      creneauxDisponibilite: adresse.creneaux_disponibilite ?? '',
      latitude: adresse.latitude ?? undefined,
      longitude: adresse.longitude ?? undefined,
    });
  }

  function modifierAdresseExistante(adresse: (typeof adressesProfil)[number]) {
    setValue('region', adresse.region);
    setValue('district', adresse.district);
    setValue('communeId', adresse.commune_id);
    setValue('fokontany', adresse.fokontany);
    setValue('quartier', adresse.quartier ?? '');
    setValue('lotNumero', adresse.lot_numero ?? '');
    setValue('pointsDeRepere', adresse.points_de_repere);
    setValue('telephoneSurPlace', adresse.telephone_sur_place);
    setValue('creneauxDisponibilite', adresse.creneaux_disponibilite ?? '');
    setMode('formulaire');
  }

  async function utiliserPositionActuelle() {
    setObtentionPosition(true);
    try {
      const { latitude, longitude } = await obtenirPositionActuelle();
      setValue('latitude', latitude);
      setValue('longitude', longitude);
      Alert.alert('Position enregistrée', 'Vos coordonnées GPS ont été ajoutées à l’adresse.');
    } catch {
      Alert.alert(
        'Position indisponible',
        'Impossible de récupérer votre position. Vous pouvez continuer sans coordonnées GPS.',
      );
    } finally {
      setObtentionPosition(false);
    }
  }

  const onSubmit = (valeurs: AdresseFormValues) => continuerAvec(valeurs);

  const optionsCommunes = communes.map((c) => ({ id: c.id, libelle: c.nom, sousLibelle: c.district }));

  return (
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <BarreProgression etapeActuelle={3} />
      <Text style={[styles.titre, { color: theme.text }]}>Adresse pour la visite à domicile</Text>
      <Text style={{ color: theme.textSecondary }}>
        {texteAide ??
          'Un agent du service viendra vérifier vos informations à votre domicile et récupérer la procuration signée sur place. Une adresse précise nous permet de vous trouver facilement.'}
      </Text>

      {mode === 'liste' ? (
        <View style={styles.listeAdresses}>
          {adressesProfil.map((adresse) => (
            <View key={adresse.id} style={[styles.carteAdresse, { backgroundColor: theme.backgroundElement }]}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>
                {adresse.fokontany}, {adresse.district}
              </Text>
              <Text style={{ color: theme.textSecondary }} numberOfLines={2}>
                {adresse.points_de_repere}
              </Text>
              <View style={styles.rangeeActions}>
                <Bouton titre="Utiliser cette adresse" onPress={() => utiliserAdresseExistante(adresse)} />
                <Bouton
                  titre="Modifier avant d'utiliser"
                  variante="secondaire"
                  onPress={() => modifierAdresseExistante(adresse)}
                />
              </View>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode('formulaire')}
            style={styles.lienNouvelleAdresse}
          >
            <Text style={{ color: theme.primary, fontWeight: '600' }}>+ Utiliser une nouvelle adresse</Text>
          </Pressable>
        </View>
      ) : (
        <>
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
              <ChampTexte
                etiquette="District"
                value={field.value}
                onChangeText={field.onChange}
                erreur={errors.district?.message}
              />
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
              <ChampTexte
                etiquette="Fokontany"
                value={field.value}
                onChangeText={field.onChange}
                erreur={errors.fokontany?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="quartier"
            render={({ field }) => (
              <ChampTexte etiquette="Quartier (optionnel)" value={field.value} onChangeText={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="lotNumero"
            render={({ field }) => (
              <ChampTexte etiquette="Lot / numéro (optionnel)" value={field.value} onChangeText={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="pointsDeRepere"
            render={({ field }) => (
              <ChampTexte
                etiquette="Points de repère"
                placeholder="Ex : portail bleu en face du marché, après l'épicerie Rasoa"
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
              <ChampTexte
                etiquette="Créneaux de disponibilité (optionnel)"
                placeholder="Ex : en semaine après 15h"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />

          <Bouton
            titre="Utiliser ma position actuelle"
            variante="secondaire"
            enChargement={obtentionPosition}
            onPress={utiliserPositionActuelle}
          />

          <Bouton titre="Continuer" onPress={handleSubmit(onSubmit)} />
          {adressesProfil.length > 0 ? (
            <Bouton titre="Revenir à mes adresses" variante="secondaire" onPress={() => setMode('liste')} />
          ) : null}
        </>
      )}

      <Bouton titre="Retour" variante="secondaire" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 20, fontWeight: '700' },
  listeAdresses: { gap: Spacing.three },
  carteAdresse: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  rangeeActions: { gap: Spacing.two },
  lienNouvelleAdresse: { paddingVertical: Spacing.two, alignItems: 'center' },
});
