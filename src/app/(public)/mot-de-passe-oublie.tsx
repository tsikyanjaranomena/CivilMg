import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { demanderReinitialisationMotDePasse } from '@/api/auth.api';
import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { Spacing } from '@/constants/theme';
import {
  reinitialisationMotDePasseSchema,
  type ReinitialisationMotDePasseValues,
} from '@/domain/validation/authSchema';
import { useTheme } from '@/hooks/use-theme';
import { messageErreurAuth } from '@/lib/auth/messagesErreur';

export default function EcranMotDePasseOublie() {
  const theme = useTheme();
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReinitialisationMotDePasseValues>({
    resolver: zodResolver(reinitialisationMotDePasseSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(valeurs: ReinitialisationMotDePasseValues) {
    setErreurGlobale(null);
    try {
      await demanderReinitialisationMotDePasse(valeurs.email);
      setEnvoye(true);
    } catch (erreur) {
      setErreurGlobale(messageErreurAuth(erreur));
    }
  }

  if (envoye) {
    return (
      <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
        <Text style={[styles.titre, { color: theme.text }]}>Email envoyé</Text>
        <Text style={[styles.soustitre, { color: theme.textSecondary }]}>
          Si un compte existe avec cet email, un lien de réinitialisation vient de vous être envoyé.
        </Text>
        <Bouton titre="Retour à la connexion" onPress={() => router.replace('/connexion')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.titre, { color: theme.text }]}>Mot de passe oublié</Text>
      <Text style={[styles.soustitre, { color: theme.textSecondary }]}>
        Saisissez votre email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </Text>

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

      {erreurGlobale ? <Text style={{ color: theme.danger }}>{erreurGlobale}</Text> : null}

      <Bouton titre="Envoyer le lien" onPress={handleSubmit(onSubmit)} enChargement={isSubmitting} />

      <Link href="/connexion" style={[styles.lien, { color: theme.primary }]}>
        Retour à la connexion
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  soustitre: { fontSize: 15, textAlign: 'center' },
  lien: { fontSize: 15, textAlign: 'center', paddingVertical: Spacing.one, fontWeight: '600' },
});
