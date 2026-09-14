import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { BarreProgression } from '@/components/nouvelle-demande/BarreProgression';
import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { ChoixSegmente } from '@/components/ui/ChoixSegmente';
import { CompteurNumerique } from '@/components/ui/CompteurNumerique';
import { Spacing } from '@/constants/theme';
import { etape1Schema, type Etape1Values } from '@/domain/validation/demandeSchema';
import { useTheme } from '@/hooks/use-theme';
import { useNouvelleDemandeStore } from '@/stores/nouvelleDemandeStore';

export default function EtapeType() {
  const theme = useTheme();
  const etape1 = useNouvelleDemandeStore((s) => s.etape1);
  const definirEtape1 = useNouvelleDemandeStore((s) => s.definirEtape1);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Etape1Values>({
    resolver: zodResolver(etape1Schema),
    defaultValues: etape1 ?? { typeActe: 'naissance', nombreCopies: 1, motif: '' },
  });

  function onSubmit(valeurs: Etape1Values) {
    definirEtape1(valeurs);
    router.push('/nouvelle-demande/etape-2-personne');
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <BarreProgression etapeActuelle={1} />
      <Text style={[styles.titre, { color: theme.text }]}>Quel acte souhaitez-vous demander ?</Text>

      <Controller
        control={control}
        name="typeActe"
        render={({ field }) => (
          <ChoixSegmente
            etiquette="Type d'acte"
            options={[
              { valeur: 'naissance', libelle: 'Acte de naissance' },
              { valeur: 'deces', libelle: 'Acte de décès' },
            ]}
            valeur={field.value}
            onChangement={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="nombreCopies"
        render={({ field }) => (
          <CompteurNumerique etiquette="Nombre de copies" valeur={field.value} onChangement={field.onChange} />
        )}
      />

      <Controller
        control={control}
        name="motif"
        render={({ field }) => (
          <ChampTexte
            etiquette="Motif de la demande (optionnel)"
            multiline
            numberOfLines={3}
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.motif?.message}
          />
        )}
      />

      <Bouton titre="Continuer" onPress={handleSubmit(onSubmit)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 20, fontWeight: '700' },
});
