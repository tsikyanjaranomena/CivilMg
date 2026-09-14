import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { inscrireAvecEmail } from '@/api/auth.api';
import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { Spacing } from '@/constants/theme';
import { inscriptionSchema, type InscriptionValues } from '@/domain/validation/authSchema';
import { useTheme } from '@/hooks/use-theme';
import { messageErreurAuth } from '@/lib/auth/messagesErreur';
import { useSessionStore } from '@/stores/sessionStore';

export default function EcranInscription() {
  const theme = useTheme();
  const session = useSessionStore((s) => s.session);
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [emailAConfirmer, setEmailAConfirmer] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InscriptionValues>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: { nom: '', telephone: '', email: '', motDePasse: '', confirmationMotDePasse: '' },
  });

  if (session) return <Redirect href="/" />;

  async function onSubmit(valeurs: InscriptionValues) {
    setErreurGlobale(null);
    try {
      const resultat = await inscrireAvecEmail({
        email: valeurs.email,
        password: valeurs.motDePasse,
        nom: valeurs.nom,
        telephone: valeurs.telephone,
      });
      if (resultat.session) {
        router.replace('/');
      } else {
        // Confirmation par email activée sur le projet Supabase.
        setEmailAConfirmer(true);
      }
    } catch (erreur) {
      setErreurGlobale(messageErreurAuth(erreur));
    }
  }

  if (emailAConfirmer) {
    return (
      <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
        <Text style={[styles.titre, { color: theme.text }]}>Vérifiez votre email</Text>
        <Text style={[styles.soustitre, { color: theme.textSecondary }]}>
          Un lien de confirmation vous a été envoyé. Confirmez votre email puis connectez-vous.
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
      <Text style={[styles.titre, { color: theme.text }]}>Créer un compte</Text>

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
            etiquette="Téléphone (optionnel)"
            keyboardType="phone-pad"
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.telephone?.message}
          />
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
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  titre: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  soustitre: { fontSize: 15, textAlign: 'center', color: '#5A6069' },
  lien: { fontSize: 15, textAlign: 'center', paddingVertical: Spacing.one, fontWeight: '600' },
});
