import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { Spacing } from '@/constants/theme';
import { useEquipe } from '@/hooks/queries/useEquipe';
import { useChangerStatutCompte, useCreerCompteResponsable } from '@/hooks/mutations/useEquipeMutations';
import { useTheme } from '@/hooks/use-theme';

const schemaNouveauCompte = z.object({
  nom: z.string().min(2, 'Le nom est requis.'),
  email: z.string().email('Adresse email invalide.'),
  password: z.string().min(8, 'Au moins 8 caractères.'),
});
type NouveauCompteValues = z.infer<typeof schemaNouveauCompte>;

export default function EcranEquipe() {
  const theme = useTheme();
  const { data: equipe = [] } = useEquipe();
  const creerCompte = useCreerCompteResponsable();
  const changerStatut = useChangerStatutCompte();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NouveauCompteValues>({
    resolver: zodResolver(schemaNouveauCompte),
    defaultValues: { nom: '', email: '', password: '' },
  });

  async function onSubmit(valeurs: NouveauCompteValues) {
    try {
      await creerCompte.mutateAsync(valeurs);
      reset();
      Alert.alert('Compte créé', `${valeurs.email} peut maintenant se connecter.`);
    } catch (erreur) {
      Alert.alert('Erreur', erreur instanceof Error ? erreur.message : 'Création impossible.');
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Bouton titre="← Retour" variante="secondaire" onPress={() => router.back()} />
      <Text style={[styles.titre, { color: theme.text }]}>Équipe</Text>

      <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
        <Text style={[styles.sectionTitre, { color: theme.text }]}>Nouveau compte responsable</Text>
        <Controller
          control={control}
          name="nom"
          render={({ field }) => (
            <ChampTexte etiquette="Nom" value={field.value} onChangeText={field.onChange} erreur={errors.nom?.message} />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <ChampTexte
              etiquette="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              erreur={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <ChampTexte
              etiquette="Mot de passe provisoire"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              erreur={errors.password?.message}
            />
          )}
        />
        <Bouton titre="Créer le compte" onPress={handleSubmit(onSubmit)} enChargement={creerCompte.isPending} />
      </View>

      <Text style={[styles.sectionTitre, { color: theme.text }]}>Comptes existants</Text>
      {equipe.map((membre) => (
        <View key={membre.id} style={[styles.ligneMembre, { backgroundColor: theme.backgroundElement }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '600' }}>{membre.nom}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{membre.email}</Text>
            <Text style={{ color: membre.statut_compte === 'actif' ? theme.success : theme.danger, fontSize: 13 }}>
              {membre.statut_compte === 'actif' ? 'Actif' : 'Suspendu'}
            </Text>
          </View>
          <Bouton
            titre={membre.statut_compte === 'actif' ? 'Suspendre' : 'Réactiver'}
            variante={membre.statut_compte === 'actif' ? 'danger' : 'secondaire'}
            enChargement={changerStatut.isPending}
            onPress={() =>
              changerStatut.mutate({ profileId: membre.id, suspendu: membre.statut_compte === 'actif' })
            }
          />
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
  ligneMembre: { borderRadius: 12, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
