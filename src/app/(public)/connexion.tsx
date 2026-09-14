import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { connecterAvecEmail } from '@/api/auth.api';
import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { Spacing } from '@/constants/theme';
import { connexionSchema, type ConnexionValues } from '@/domain/validation/authSchema';
import { useTheme } from '@/hooks/use-theme';
import { messageErreurAuth } from '@/lib/auth/messagesErreur';
import { useSessionStore } from '@/stores/sessionStore';

export default function EcranConnexion() {
  const theme = useTheme();
  const session = useSessionStore((s) => s.session);
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConnexionValues>({
    resolver: zodResolver(connexionSchema),
    defaultValues: { email: '', motDePasse: '' },
  });

  // Déjà connecté (ex: retour arrière) : laisser la porte d'entrée rediriger.
  if (session) return <Redirect href="/" />;

  async function onSubmit(valeurs: ConnexionValues) {
    setErreurGlobale(null);
    try {
      await connecterAvecEmail({ email: valeurs.email, password: valeurs.motDePasse });
      router.replace('/');
    } catch (erreur) {
      setErreurGlobale(messageErreurAuth(erreur));
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.titre, { color: theme.text }]}>CivilMg</Text>
      <Text style={[styles.soustitre, { color: theme.textSecondary }]}>
        {"Suivi des demandes d'actes de naissance et de décès"}
      </Text>

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <ChampTexte
            etiquette="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.email?.message}
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
            autoComplete="password"
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.motDePasse?.message}
          />
        )}
      />

      {erreurGlobale ? <Text style={{ color: theme.danger }}>{erreurGlobale}</Text> : null}

      <Bouton titre="Se connecter" onPress={handleSubmit(onSubmit)} enChargement={isSubmitting} />

      <Link href="/mot-de-passe-oublie" style={[styles.lien, { color: theme.primary }]}>
        Mot de passe oublié ?
      </Link>
      <Link href="/inscription" style={[styles.lien, { color: theme.primary }]}>
        Créer un compte
      </Link>
      <Link href="/suivi" style={[styles.lien, { color: theme.textSecondary }]}>
        Suivre une demande sans compte
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 30, fontWeight: '700', textAlign: 'center' },
  soustitre: { fontSize: 15, textAlign: 'center', marginBottom: Spacing.three },
  lien: { fontSize: 15, textAlign: 'center', paddingVertical: Spacing.one, fontWeight: '600' },
});
