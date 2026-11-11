import { PageAvecRetour } from '@/components/ui/PageAvecRetour';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { BarreProgression } from '@/components/nouvelle-demande/BarreProgression';
import { Bouton } from '@/components/ui/Bouton';
import { ChampDate } from '@/components/ui/ChampDate';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { Spacing } from '@/constants/theme';
import { schemaPersonnePourType, type PersonneValues } from '@/domain/validation/demandeSchema';
import { useTheme } from '@/hooks/use-theme';
import { useNouvelleDemandeStore } from '@/stores/nouvelleDemandeStore';

export default function EtapePersonne() {
  const theme = useTheme();
  const etape1 = useNouvelleDemandeStore((s) => s.etape1);
  const etape2 = useNouvelleDemandeStore((s) => s.etape2);
  const definirEtape2 = useNouvelleDemandeStore((s) => s.definirEtape2);

  const schema = useMemo(() => (etape1 ? schemaPersonnePourType(etape1.typeActe) : null), [etape1]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonneValues>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: etape2 ?? {
      nom: '',
      prenoms: '',
      dateEvenement: '',
      lieuEvenement: '',
      pourSoiMeme: false,
      ...(etape1?.typeActe === 'naissance' ? { nomPere: '', nomMere: '' } : {}),
    },
  });

  // Étape 1 non complétée : on ne peut pas savoir quel schéma appliquer.
  if (!etape1) return <Redirect href="/accueil" />;

  const erreursNaissance = errors as Partial<Record<'nomPere' | 'nomMere', { message?: string }>>;

  function onSubmit(valeurs: PersonneValues) {
    definirEtape2(valeurs);
    router.push('/nouvelle-demande/etape-3-adresse');
  }

  return (
    <PageAvecRetour titre="Nouvelle demande">
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <BarreProgression etapeActuelle={1} />
      <Text style={[styles.titre, { color: theme.text }]}>
        {etape1.typeActe === 'naissance' ? 'Informations sur l’enfant et ses parents' : 'Personne décédée concernée'}
      </Text>

      <Controller
        control={control}
        name="nom"
        render={({ field }) => (
          <ChampTexte etiquette={etape1.typeActe === 'naissance' ? "Nom de l'enfant" : 'Nom'} value={field.value} onChangeText={field.onChange} erreur={errors.nom?.message} />
        )}
      />
      <Controller
        control={control}
        name="prenoms"
        render={({ field }) => (
          <ChampTexte etiquette={etape1.typeActe === 'naissance' ? "Prénoms de l'enfant" : 'Prénoms'} value={field.value} onChangeText={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="dateEvenement"
        render={({ field }) => (
          <ChampDate
            etiquette={etape1.typeActe === 'naissance' ? 'Date de naissance' : 'Date de décès'}
            valeur={field.value}
            onChangement={field.onChange}
            dateMaximum={new Date()}
            erreur={errors.dateEvenement?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="lieuEvenement"
        render={({ field }) => (
          <ChampTexte
            etiquette={etape1.typeActe === 'naissance' ? 'Lieu de naissance' : 'Lieu de décès'}
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.lieuEvenement?.message}
          />
        )}
      />

      {etape1.typeActe === 'naissance' ? (
        <>
          <Controller
            control={control}
            name="nomPere"
            render={({ field }) => (
              <ChampTexte
                etiquette="Nom du père"
                value={field.value as string}
                onChangeText={field.onChange}
                erreur={erreursNaissance.nomPere?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="nomMere"
            render={({ field }) => (
              <ChampTexte
                etiquette="Nom de la mère"
                value={field.value as string}
                onChangeText={field.onChange}
                erreur={erreursNaissance.nomMere?.message}
              />
            )}
          />
        </>
      ) : null}

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
