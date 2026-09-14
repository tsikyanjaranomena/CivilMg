import { format } from 'date-fns';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useCommunes } from '@/hooks/queries/useCommunes';
import { useDemandesAPlanifier, useVisitesPlanifiees } from '@/hooks/queries/useVisites';
import { useTheme } from '@/hooks/use-theme';
import type { InfosAdresseTournee } from '@/api/visites.api';

function lienCarte(adresse: InfosAdresseTournee | null): string | null {
  if (!adresse?.latitude || !adresse?.longitude) return null;
  return `https://www.google.com/maps/search/?api=1&query=${adresse.latitude},${adresse.longitude}`;
}

export default function EcranPlanning() {
  const theme = useTheme();
  const { data: demandesAPlanifier = [] } = useDemandesAPlanifier();
  const { data: visitesPlanifiees = [] } = useVisitesPlanifiees();
  const { data: communes = [] } = useCommunes();

  const nomCommune = useMemo(() => new Map(communes.map((c) => [c.id, c.nom])), [communes]);

  const groupesAPlanifier = useMemo(() => grouperParCommune(demandesAPlanifier, nomCommune), [demandesAPlanifier, nomCommune]);
  const aujourdHui = format(new Date(), 'yyyy-MM-dd');
  const visitesDuJour = visitesPlanifiees.filter((v) => v.date_planifiee === aujourdHui);
  const groupesDuJour = useMemo(() => grouperParCommune(visitesDuJour, nomCommune), [visitesDuJour, nomCommune]);

  return (
    <ScrollView contentContainerStyle={[styles.conteneur, { backgroundColor: theme.background }]}>
      <Text style={[styles.titre, { color: theme.text }]}>Visites du jour ({visitesDuJour.length})</Text>
      {Object.entries(groupesDuJour).map(([commune, items]) => (
        <View key={commune} style={styles.groupe}>
          <Text style={[styles.sousTitre, { color: theme.textSecondary }]}>{commune}</Text>
          {items.map((item) => (
            <CarteAdresse
              key={item.id}
              reference={item.demande_reference}
              sousLigne={item.creneau ?? ''}
              adresse={item.adresse}
              theme={theme}
              onPress={() => router.push(`/traitement/${item.demande_id}`)}
            />
          ))}
        </View>
      ))}

      <Text style={[styles.titre, { color: theme.text, marginTop: Spacing.four }]}>
        À planifier ({demandesAPlanifier.length})
      </Text>
      {Object.entries(groupesAPlanifier).map(([commune, items]) => (
        <View key={commune} style={styles.groupe}>
          <Text style={[styles.sousTitre, { color: theme.textSecondary }]}>{commune}</Text>
          {items.map((item) => (
            <CarteAdresse
              key={item.id}
              reference={item.reference}
              sousLigne="En attente de planification"
              adresse={item.adresse}
              theme={theme}
              onPress={() => router.push(`/traitement/${item.id}`)}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function grouperParCommune<T extends { adresse: InfosAdresseTournee | null }>(
  items: T[],
  nomCommune: Map<string, string>,
): Record<string, T[]> {
  const groupes: Record<string, T[]> = {};
  for (const item of items) {
    const nom = item.adresse ? (nomCommune.get(item.adresse.commune_id) ?? 'Commune inconnue') : 'Adresse non renseignée';
    groupes[nom] = groupes[nom] ?? [];
    groupes[nom].push(item);
  }
  return groupes;
}

function CarteAdresse({
  reference,
  sousLigne,
  adresse,
  theme,
  onPress,
}: {
  reference: string;
  sousLigne: string;
  adresse: InfosAdresseTournee | null;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
}) {
  const lien = lienCarte(adresse);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Dossier ${reference}${adresse ? `, ${adresse.fokontany}` : ''}`}
      onPress={onPress}
      style={[styles.carte, { backgroundColor: theme.backgroundElement }]}
    >
      <Text style={{ color: theme.text, fontWeight: '700' }}>{reference}</Text>
      <Text style={{ color: theme.textSecondary }}>{sousLigne}</Text>
      {adresse ? (
        <>
          <Text style={{ color: theme.text }}>{adresse.fokontany}</Text>
          <Text style={{ color: theme.textSecondary }} numberOfLines={2}>
            {adresse.points_de_repere}
          </Text>
          <Text style={{ color: theme.textSecondary }}>
            Tél. {adresse.telephone_sur_place}
            {adresse.creneaux_disponibilite ? ` — ${adresse.creneaux_disponibilite}` : ''}
          </Text>
          {lien ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(lien)}>
              <Text style={{ color: theme.primary, fontWeight: '600' }}>Voir sur la carte</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.four, gap: Spacing.two },
  titre: { fontSize: 20, fontWeight: '700' },
  sousTitre: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginTop: Spacing.two },
  groupe: { gap: Spacing.two },
  carte: { borderRadius: 12, padding: Spacing.three, gap: 4 },
});
