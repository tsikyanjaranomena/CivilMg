import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { InfosAdresseTournee } from '@/api/visites.api';
import { ETAPES_NOTAIRE } from '@/components/notaire/etapes';
import type { NomIcone } from '@/components/ui/Bouton';
import { Spacing } from '@/constants/theme';
import { useDemandesAPlanifier, useVisitesPlanifiees } from '@/hooks/queries/useVisites';
import { useTheme } from '@/hooks/use-theme';

type Theme = ReturnType<typeof useTheme>;

function libelleJour(date: string | null): string {
  if (!date) return 'Date à fixer';
  const aujourdHui = format(new Date(), 'yyyy-MM-dd');
  if (date === aujourdHui) return "Aujourd'hui";
  if (date === format(addDays(new Date(), 1), 'yyyy-MM-dd')) return 'Demain';
  const libelle = format(new Date(date), 'EEEE d MMMM', { locale: fr });
  return libelle.charAt(0).toUpperCase() + libelle.slice(1);
}

export default function EcranVisites() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const aAppeler = useDemandesAPlanifier();
  const visites = useVisitesPlanifiees();
  const [etapeAppel, etapeVisite] = ETAPES_NOTAIRE;

  // Visites regroupées par jour, dans l'ordre chronologique (déjà trié par l'API).
  const listeVisites = visites.data;
  const parJour = useMemo(() => {
    const groupes = new Map<string, NonNullable<typeof listeVisites>>();
    for (const v of listeVisites ?? []) {
      const cle = libelleJour(v.date_planifiee);
      groupes.set(cle, [...(groupes.get(cle) ?? []), v]);
    }
    return [...groupes.entries()];
  }, [listeVisites]);

  const actualiser = () => {
    void aAppeler.refetch();
    void visites.refetch();
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.conteneur, { paddingTop: insets.top + Spacing.two }]}
      refreshControl={<RefreshControl refreshing={aAppeler.isRefetching || visites.isRefetching} onRefresh={actualiser} />}
    >
      <Text style={[styles.titre, { color: theme.text }]}>Visites</Text>

      <EnteteSection icone={etapeVisite.icone} couleur={etapeVisite.couleur} fond={etapeVisite.fond} titre="Visites prévues" nombre={visites.data?.length ?? 0} theme={theme} />
      {parJour.length === 0 ? <Vide texte="Aucune visite prévue." theme={theme} /> : null}
      {parJour.map(([jour, items]) => (
        <View key={jour} style={styles.groupe}>
          <Text style={[styles.jour, { color: theme.textSecondary }]}>{jour}</Text>
          {(items ?? []).map((v) => (
            <CarteVisite
              key={v.id}
              reference={v.demande_reference}
              heure={v.creneau}
              adresse={v.adresse}
              couleur={etapeVisite.couleur}
              theme={theme}
              onPress={() => router.push(`/traitement/${v.demande_id}`)}
            />
          ))}
        </View>
      ))}

      <EnteteSection icone={etapeAppel.icone} couleur={etapeAppel.couleur} fond={etapeAppel.fond} titre="Clients à appeler" nombre={aAppeler.data?.length ?? 0} theme={theme} />
      {(aAppeler.data ?? []).length === 0 ? <Vide texte="Personne à appeler." theme={theme} /> : null}
      {(aAppeler.data ?? []).map((d) => (
        <CarteVisite
          key={d.id}
          reference={d.reference}
          heure={null}
          adresse={d.adresse}
          couleur={etapeAppel.couleur}
          theme={theme}
          onPress={() => router.push(`/traitement/${d.id}`)}
        />
      ))}
    </ScrollView>
  );
}

function EnteteSection({
  icone,
  couleur,
  fond,
  titre,
  nombre,
  theme,
}: {
  icone: NomIcone;
  couleur: string;
  fond: string;
  titre: string;
  nombre: number;
  theme: Theme;
}) {
  return (
    <View style={styles.enteteSection}>
      <View style={[styles.iconeSection, { backgroundColor: fond }]}>
        <MaterialCommunityIcons name={icone} size={22} color={couleur} />
      </View>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', flex: 1 }}>{titre}</Text>
      <View style={[styles.compteur, { backgroundColor: nombre > 0 ? couleur : theme.backgroundSelected }]}>
        <Text style={{ color: nombre > 0 ? '#FFFFFF' : theme.textSecondary, fontWeight: '800' }}>{nombre}</Text>
      </View>
    </View>
  );
}

function CarteVisite({
  reference,
  heure,
  adresse,
  couleur,
  theme,
  onPress,
}: {
  reference: string;
  heure: string | null;
  adresse: InfosAdresseTournee | null;
  couleur: string;
  theme: Theme;
  onPress: () => void;
}) {
  const telephone = adresse?.telephone_sur_place;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Dossier ${reference}${adresse ? `, ${adresse.fokontany}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.carte,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderLeftColor: couleur, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.ligneHaut}>
          <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>{reference}</Text>
          {heure ? (
            <View style={[styles.heure, { backgroundColor: theme.accent }]}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={theme.accentText} />
              <Text style={{ color: theme.accentText, fontSize: 12, fontWeight: '700' }}>{heure}</Text>
            </View>
          ) : null}
        </View>
        {adresse ? (
          <>
            <Text style={{ color: theme.text }}>{adresse.fokontany}</Text>
            {adresse.points_de_repere ? (
              <Text style={{ color: theme.textSecondary, fontSize: 13 }} numberOfLines={2}>
                {adresse.points_de_repere}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={{ color: theme.textSecondary }}>Adresse non renseignée</Text>
        )}
      </View>
      {telephone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Appeler le ${telephone}`}
          onPress={() => Linking.openURL(`tel:${telephone.replace(/\s/g, '')}`)}
          style={[styles.boutonAppel, { backgroundColor: theme.primary }]}
        >
          <MaterialCommunityIcons name="phone" size={22} color={theme.primaryText} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function Vide({ texte, theme }: { texte: string; theme: Theme }) {
  return <Text style={{ color: theme.textSecondary, marginLeft: Spacing.one }}>{texte}</Text>;
}

const styles = StyleSheet.create({
  conteneur: { flexGrow: 1, padding: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.six },
  titre: { fontSize: 26, fontWeight: '800', marginBottom: Spacing.one },
  enteteSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  iconeSection: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  compteur: { minWidth: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  groupe: { gap: Spacing.two },
  jour: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginTop: Spacing.one },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 5,
    padding: Spacing.three,
  },
  ligneHaut: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  heure: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  boutonAppel: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
