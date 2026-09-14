-- Active Realtime sur les tables consultées en direct par l'app : timeline
-- du dossier, statut de la visite, notifications in-app.
alter publication supabase_realtime add table public.demandes;
alter publication supabase_realtime add table public.historique_statuts;
alter publication supabase_realtime add table public.visites;
alter publication supabase_realtime add table public.notifications;
