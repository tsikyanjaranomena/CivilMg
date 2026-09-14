/**
 * Types générés à la main pour démarrer le développement (Phase 1).
 * À régénérer depuis le vrai projet Supabase dès qu'il existe :
 *   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 * Garder la forme (Database.public.Tables.*) identique pour ne pas casser
 * les imports dans src/api/*.
 */

export type RoleUtilisateur = 'client' | 'responsable';
export type TypeActeDb = 'naissance' | 'deces';
export type StatutCompte = 'actif' | 'suspendu';
export type StatutDemandeDb =
  | 'BROUILLON'
  | 'SOUMIS'
  | 'PIECES_A_COMPLETER'
  | 'VISITE_PLANIFIEE'
  | 'VISITE_A_REPLANIFIER'
  | 'EN_TRAITEMENT'
  | 'EN_VALIDATION'
  | 'PRET'
  | 'LIVRE'
  | 'REJETE'
  | 'ANNULE';
export type StatutVisiteDb =
  | 'a_planifier'
  | 'planifiee'
  | 'effectuee'
  | 'client_absent'
  | 'echec'
  | 'reportee';
export type StatutDocumentDb = 'en_attente' | 'valide' | 'refuse';
export type StatutPaiementDb = 'non_paye' | 'paye';
export type CanalNotificationDb = 'push' | 'sms' | 'email' | 'in_app';

interface TableDef<Row, Insert, Update> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<
        {
          id: string;
          role: RoleUtilisateur;
          nom: string;
          prenoms: string | null;
          telephone: string | null;
          email: string | null;
          cin: string | null;
          statut_compte: StatutCompte;
          expo_push_token: string | null;
          created_at: string;
          updated_at: string;
        },
        { id: string; role?: RoleUtilisateur; nom?: string; telephone?: string | null; email?: string | null },
        Partial<{
          role: RoleUtilisateur;
          nom: string;
          prenoms: string | null;
          telephone: string | null;
          email: string | null;
          cin: string | null;
          statut_compte: StatutCompte;
          expo_push_token: string | null;
        }>
      >;
      communes: TableDef<
        { id: string; code: string; nom: string; district: string; region: string; created_at: string },
        { code: string; nom: string; district: string; region: string },
        Partial<{ code: string; nom: string; district: string; region: string }>
      >;
      types_pieces: TableDef<
        {
          id: string;
          type_acte: TypeActeDb;
          code: string;
          libelle: string;
          obligatoire: boolean;
          ordre: number;
        },
        { type_acte: TypeActeDb; code: string; libelle: string; obligatoire?: boolean; ordre?: number },
        Partial<{ libelle: string; obligatoire: boolean; ordre: number }>
      >;
      tarifs: TableDef<
        { id: string; type_acte: TypeActeDb; commune_id: string | null; montant: number; updated_at: string },
        { type_acte: TypeActeDb; commune_id?: string | null; montant: number },
        Partial<{ montant: number }>
      >;
      delais_standards: TableDef<
        { type_acte: TypeActeDb; jours_ouvrables: number },
        { type_acte: TypeActeDb; jours_ouvrables: number },
        Partial<{ jours_ouvrables: number }>
      >;
      parametres: TableDef<
        { cle: string; valeur: unknown; description: string | null; updated_at: string },
        { cle: string; valeur: unknown; description?: string | null },
        Partial<{ valeur: unknown; description: string | null }>
      >;
      adresses: TableDef<
        {
          id: string;
          profile_id: string;
          region: string;
          district: string;
          commune_id: string;
          fokontany: string;
          quartier: string | null;
          lot_numero: string | null;
          points_de_repere: string;
          telephone_sur_place: string;
          creneaux_disponibilite: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        },
        {
          profile_id: string;
          region: string;
          district: string;
          commune_id: string;
          fokontany: string;
          quartier?: string | null;
          lot_numero?: string | null;
          points_de_repere: string;
          telephone_sur_place: string;
          creneaux_disponibilite?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        },
        Partial<{
          region: string;
          district: string;
          commune_id: string;
          fokontany: string;
          quartier: string | null;
          lot_numero: string | null;
          points_de_repere: string;
          telephone_sur_place: string;
          creneaux_disponibilite: string | null;
          latitude: number | null;
          longitude: number | null;
        }>
      >;
      demandes: TableDef<
        {
          id: string;
          reference: string;
          type_acte: TypeActeDb;
          demandeur_id: string;
          pris_en_charge_par: string | null;
          statut: StatutDemandeDb;
          commune_id: string;
          adresse_id: string | null;
          nombre_copies: number;
          motif: string | null;
          pour_soi_meme: boolean;
          montant: number | null;
          statut_paiement: StatutPaiementDb;
          date_echeance_estimee: string | null;
          date_cloture: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          type_acte: TypeActeDb;
          demandeur_id: string;
          commune_id: string;
          adresse_id?: string | null;
          nombre_copies?: number;
          motif?: string | null;
          pour_soi_meme: boolean;
        },
        Partial<{
          pris_en_charge_par: string | null;
          adresse_id: string | null;
          nombre_copies: number;
          motif: string | null;
          pour_soi_meme: boolean;
        }>
      >;
      demandes_notes_internes: TableDef<
        { demande_id: string; notes: string; updated_at: string; updated_by: string | null },
        { demande_id: string; notes: string; updated_by?: string | null },
        Partial<{ notes: string; updated_by: string | null }>
      >;
      personnes_concernees: TableDef<
        {
          id: string;
          demande_id: string;
          nom: string;
          prenoms: string | null;
          date_evenement: string;
          lieu_evenement: string;
          nom_pere: string | null;
          nom_mere: string | null;
          numero_acte: string | null;
          annee_acte: number | null;
          commune_enregistrement_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          demande_id: string;
          nom: string;
          prenoms?: string | null;
          date_evenement: string;
          lieu_evenement: string;
          nom_pere?: string | null;
          nom_mere?: string | null;
          numero_acte?: string | null;
          annee_acte?: number | null;
          commune_enregistrement_id?: string | null;
        },
        Partial<{
          nom: string;
          prenoms: string | null;
          date_evenement: string;
          lieu_evenement: string;
          nom_pere: string | null;
          nom_mere: string | null;
          numero_acte: string | null;
          annee_acte: number | null;
          commune_enregistrement_id: string | null;
        }>
      >;
      visites: TableDef<
        {
          id: string;
          demande_id: string;
          responsable_id: string | null;
          date_planifiee: string | null;
          creneau: string | null;
          statut: StatutVisiteDb;
          created_at: string;
          updated_at: string;
        },
        {
          demande_id: string;
          responsable_id?: string | null;
          date_planifiee?: string | null;
          creneau?: string | null;
          statut?: StatutVisiteDb;
        },
        Partial<{
          responsable_id: string | null;
          date_planifiee: string | null;
          creneau: string | null;
          statut: StatutVisiteDb;
        }>
      >;
      visite_comptes_rendus: TableDef<
        {
          visite_id: string;
          compte_rendu: string | null;
          verification_concluante: boolean | null;
          procuration_recuperee: boolean;
          procuration_photo_path: string | null;
          date_recuperation_procuration: string | null;
          motif_echec: string | null;
          updated_at: string;
        },
        {
          visite_id: string;
          compte_rendu?: string | null;
          verification_concluante?: boolean | null;
          procuration_recuperee?: boolean;
          procuration_photo_path?: string | null;
          date_recuperation_procuration?: string | null;
          motif_echec?: string | null;
        },
        Partial<{
          compte_rendu: string | null;
          verification_concluante: boolean | null;
          procuration_recuperee: boolean;
          procuration_photo_path: string | null;
          date_recuperation_procuration: string | null;
          motif_echec: string | null;
        }>
      >;
      documents: TableDef<
        {
          id: string;
          demande_id: string;
          type_piece_id: string | null;
          fichier_path: string;
          statut_verification: StatutDocumentDb;
          motif_refus: string | null;
          created_at: string;
          updated_at: string;
        },
        { demande_id: string; type_piece_id?: string | null; fichier_path: string },
        Partial<{ statut_verification: StatutDocumentDb; motif_refus: string | null }>
      >;
      historique_statuts: TableDef<
        {
          id: string;
          demande_id: string;
          statut_precedent: StatutDemandeDb | null;
          statut_nouveau: StatutDemandeDb;
          auteur_id: string;
          commentaire_client: string | null;
          created_at: string;
        },
        never,
        never
      >;
      historique_statuts_internes: TableDef<
        { historique_id: string; commentaire_interne: string },
        never,
        never
      >;
      notifications: TableDef<
        {
          id: string;
          destinataire_id: string;
          demande_id: string | null;
          titre: string;
          contenu: string;
          canal: CanalNotificationDb;
          lu: boolean;
          created_at: string;
        },
        never,
        { lu: boolean }
      >;
      journal_audit_consultations: TableDef<
        { id: string; utilisateur_id: string; demande_id: string; action: string; created_at: string },
        never,
        never
      >;
      transitions_autorisees: TableDef<
        {
          statut_depart: StatutDemandeDb;
          statut_arrivee: StatutDemandeDb;
          roles: RoleUtilisateur[];
          motif_client_obligatoire: boolean;
        },
        never,
        never
      >;
      demandes_requetes_client: TableDef<
        {
          id: string;
          demande_id: string;
          type: string;
          message: string | null;
          traitee: boolean;
          created_at: string;
        },
        { demande_id: string; type: string; message?: string | null },
        Partial<{ traitee: boolean }>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      changer_statut_demande: {
        Args: {
          p_demande_id: string;
          p_nouveau_statut: StatutDemandeDb;
          p_commentaire_client?: string | null;
          p_commentaire_interne?: string | null;
        };
        Returns: void;
      };
      consulter_statut_public: {
        Args: { p_reference: string; p_derniers_chiffres_telephone: string };
        Returns: {
          reference: string;
          type_acte: TypeActeDb;
          statut: StatutDemandeDb;
          date_echeance_estimee: string | null;
        }[];
      };
      journaliser_consultation: {
        Args: { p_demande_id: string; p_action?: string };
        Returns: void;
      };
    };
  };
}
