import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { connecterAvecTelephone } from '@/api/auth.api';
import { Bouton } from '@/components/ui/Bouton';
import { ChampTexte } from '@/components/ui/ChampTexte';
import { ETUDE } from '@/constants/etude';
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
    defaultValues: { telephone: '', motDePasse: '' },
  });

  // Déjà connecté (ex: retour arrière) : laisser la porte d'entrée rediriger.
  if (session) return <Redirect href="/" />;

  async function onSubmit(valeurs: ConnexionValues) {
    setErreurGlobale(null);
    try {
      await connecterAvecTelephone({ telephone: valeurs.telephone, password: valeurs.motDePasse });
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
      <View style={[styles.logo, { backgroundColor: theme.primary }]}>
        <MaterialCommunityIcons name="file-certificate-outline" size={46} color={theme.primaryText} />
      </View>
      <Text style={[styles.titre, { color: theme.text }]}>CivilMg</Text>
      <Text style={[styles.soustitre, { color: theme.textSecondary }]}>
        {"Votre acte de naissance ou de décès, sans vous déplacer. Le notaire vient chez vous."}
      </Text>

      <Controller
        control={control}
        name="telephone"
        render={({ field }) => (
          <ChampTexte
            etiquette="Numéro de téléphone"
            placeholder="034 12 345 67"
            autoComplete="tel"
            keyboardType="phone-pad"
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
            autoComplete="password"
            value={field.value}
            onChangeText={field.onChange}
            erreur={errors.motDePasse?.message}
          />
        )}
      />

      {erreurGlobale ? <Text style={{ color: theme.danger }}>{erreurGlobale}</Text> : null}

      <Bouton titre="Se connecter" onPress={handleSubmit(onSubmit)} enChargement={isSubmitting} />

      <Text style={[styles.aide, { color: theme.textSecondary }]}>
        {`Mot de passe oublié ? Appelez l'étude au ${ETUDE.telephone}.`}
      </Text>
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
  logo: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: { fontSize: 32, fontWeight: '800', textAlign: 'center' },
  soustitre: { fontSize: 15, textAlign: 'center', marginBottom: Spacing.three, lineHeight: 21 },
  lien: { fontSize: 15, textAlign: 'center', paddingVertical: Spacing.one, fontWeight: '600' },
  aide: { fontSize: 14, textAlign: 'center' },
});
