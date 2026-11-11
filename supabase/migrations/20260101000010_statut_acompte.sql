-- Paiement en deux temps : 50 % d'acompte remis au notaire lors de la visite,
-- 50 % de solde à la remise de l'acte. Migration séparée car une valeur
-- d'enum ajoutée ne peut pas être utilisée dans la même transaction.
alter type statut_paiement add value if not exists 'acompte_paye' after 'non_paye';
