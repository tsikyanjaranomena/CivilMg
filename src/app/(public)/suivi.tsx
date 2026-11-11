import { PageAvecRetour } from '@/components/ui/PageAvecRetour';
import { formaterDateFr } from '@/domain/dates';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { consulterStatutPublic } from '@/api/suivi.api';
import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { Spacing } from '@/constants/theme';
import { CONFIG_STATUTS, type StatutDemande } from '@/domain/statuts/statutConfig';
import { suiviSchema, type SuiviValues } from '@/domain/validation/suiviSchema';
import { useTheme } from '@/hooks/use-theme';

type ResultatSuivi = {
  reference: string;
  type_acte: 'naissance' | 'deces';
  statut: StatutDemande;
  date_echeance_estimee: string | null;
};

export default function EcranSuiviPublic() {
  const theme = useTheme();
  const [resultat, setResultat] = useState<ResultatSuivi | null | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SuiviValues>({
    resolver: zodResolver(suiviSchema),
    defaultValues: { reference: '', derniersChiffresTelephone: '' },
  });

  async function onSubmit(valeurs: SuiviValues) {
    setErreur(null);
    setResultat(undefined);
    try {
      const data = await consulterStatutPublic(valeurs.reference, valeurs.derniersChiffresTelephone);
      setResultat(data as ResultatSuivi | null);
    } catch {
      setErreur('Une erreur est survenue. Veuillez réessayer.');
    }
  }

  return (
    <PageAvecRetour titre="Suivre une demande">
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.titre, { color: theme.text }]}>Suivre une demande</Text>
      <Text style={[styles.soustitre, { color: theme.textSecondary }]}>
        Saisissez le numéro de référence de votre dossier et les 4 derniers chiffres du téléphone
        utilisé lors de la demande.
      </Text>

      <Controller
        control={control}
        name="reference"
        render={({ field }) => (
          <ChampTexte
            etiquette="Numéro de référence"
            placeholder="ACT-2026-12"
            autoCapitalize="characters"
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.reference?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="derniersChiffresTelephone"
        render={({ field }) => (
          <ChampTexte
            etiquette="4 derniers chiffres du téléphone"
            keyboardType="number-pad"
            maxLength={4}
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.derniersChiffresTelephone?.message}
          />
        )}
      />

      {erreur ? <Text style={{ color: theme.danger }}>{erreur}</Text> : null}

      <Bouton titre="Vérifier" onPress={handleSubmit(onSubmit)} enChargement={isSubmitting} />

      {resultat === null ? (
        <Text style={{ color: theme.danger }}>
          Aucun dossier trouvé avec ces informations. Vérifiez la référence et le numéro de téléphone.
        </Text>
      ) : null}

      {resultat ? (
        <View style={[styles.carteResultat, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.reference, { color: theme.text }]}>{resultat.reference}</Text>
          <Text style={{ color: theme.text, fontWeight: '600' }}>
            {CONFIG_STATUTS[resultat.statut].libelle}
          </Text>
          <Text style={{ color: theme.textSecondary }}>{CONFIG_STATUTS[resultat.statut].descriptionClient}</Text>
          {resultat.date_echeance_estimee ? (
            <Text style={{ color: theme.textSecondary }}>
              Échéance estimée : {formaterDateFr(resultat.date_echeance_estimee)}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Link href="/connexion" style={[styles.lien, { color: theme.primary }]}>
        Retour à la connexion
      </Link>
    </ScrollView>
    </PageAvecRetour>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  soustitre: { fontSize: 15, textAlign: 'center' },
  lien: { fontSize: 15, textAlign: 'center', paddingVertical: Spacing.one, fontWeight: '600' },
  carteResultat: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
  reference: { fontSize: 18, fontWeight: '700' },
});
