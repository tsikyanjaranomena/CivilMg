import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { inscrireAvecTelephone } from '@/api/auth.api';
import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { PageAvecRetour } from '@/components/ui/PageAvecRetour';
import { Spacing } from '@/constants/theme';
import { inscriptionSchema, type InscriptionValues } from '@/domain/validation/authSchema';
import { useTheme } from '@/hooks/use-theme';
import { messageErreurAuth } from '@/lib/auth/messagesErreur';
import { useSessionStore } from '@/stores/sessionStore';

export default function EcranInscription() {
  const theme = useTheme();
  const session = useSessionStore((s) => s.session);
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InscriptionValues>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: { nom: '', telephone: '', motDePasse: '', confirmationMotDePasse: '' },
  });

  if (session) return <Redirect href="/" />;

  async function onSubmit(valeurs: InscriptionValues) {
    setErreurGlobale(null);
    try {
      await inscrireAvecTelephone({ telephone: valeurs.telephone, password: valeurs.motDePasse, nom: valeurs.nom });
      router.replace('/');
    } catch (erreur) {
      setErreurGlobale(messageErreurAuth(erreur));
    }
  }

  return (
    <PageAvecRetour titre="Créer un compte">
      <ScrollView
        contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.titre, { color: theme.text }]}>Créer un compte</Text>
        <Text style={[styles.soustitre, { color: theme.textSecondary }]}>
          Votre numéro de téléphone vous servira à vous connecter.
        </Text>

        <Controller
          control={control}
          name="nom"
          render={({ field }) => (
            <ChampTexte etiquette="Nom complet" value={field.value} onChangeText={field.onChange} erreur={errors.nom?.message} />
          )}
        />
        <Controller
          control={control}
          name="telephone"
          render={({ field }) => (
            <ChampTexte
              etiquette="Numéro de téléphone"
              placeholder="034 12 345 67"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={field.value}
              onChangeText={field.onChange}
              erreur={errors.telephone?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="motDePasse"
          render={({ field }) => (
            <ChampTexte
              etiquette="Mot de passe"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              erreur={errors.motDePasse?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmationMotDePasse"
          render={({ field }) => (
            <ChampTexte
              etiquette="Confirmer le mot de passe"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              erreur={errors.confirmationMotDePasse?.message}
            />
          )}
        />

        {erreurGlobale ? <Text style={{ color: theme.danger }}>{erreurGlobale}</Text> : null}

        <Bouton titre="Créer mon compte" onPress={handleSubmit(onSubmit)} enChargement={isSubmitting} />

        <Link href="/connexion" style={[styles.lien, { color: theme.primary }]}>
          {"J'ai déjà un compte"}
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
});
