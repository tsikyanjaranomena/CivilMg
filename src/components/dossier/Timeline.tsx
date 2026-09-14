import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { CONFIG_STATUTS, type StatutDemande } from '@/domain/statuts/statutConfig';
import { useTheme } from '@/hooks/use-theme';
import type { LigneHistorique } from '@/api/historique.api';

export function Timeline({ lignes }: { lignes: LigneHistorique[] }) {
  const theme = useTheme();

  return (
    <View>
      {lignes.map((ligne, index) => {
        const config = CONFIG_STATUTS[ligne.statut_nouveau as StatutDemande];
        const couleur = {
          neutral: theme.textSecondary,
          info: theme.primary,
          warning: theme.warning,
          success: theme.success,
          danger: theme.danger,
        }[config.couleur];
        const dernier = index === lignes.length - 1;

        return (
          <View key={ligne.id} style={styles.ligne}>
            <View style={styles.colonneIndicateur}>
              <View style={[styles.point, { backgroundColor: couleur }]} />
              {!dernier ? <View style={[styles.trait, { backgroundColor: theme.border }]} /> : null}
            </View>
            <View style={styles.contenu}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{config.libelle}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {format(new Date(ligne.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </Text>
              {ligne.commentaire_client ? (
                <Text style={{ color: theme.text, marginTop: 4 }}>{ligne.commentaire_client}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', gap: Spacing.two },
  colonneIndicateur: { alignItems: 'center', width: 16 },
  point: { width: 14, height: 14, borderRadius: 7 },
  trait: { flex: 1, width: 2, marginVertical: 2 },
  contenu: { flex: 1, paddingBottom: Spacing.three },
});
