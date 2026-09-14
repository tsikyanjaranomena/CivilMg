// Edge Function : crée un compte responsable. Appelée depuis l'app
// (Administration > Équipe) via supabase.functions.invoke, qui transmet
// automatiquement le token de l'utilisateur connecté.
//
// Aucune auto-inscription responsable n'existe côté app (par design) : seul
// un compte responsable déjà actif peut en créer un autre, via cette
// fonction qui est la seule à disposer de la clé service_role.
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Non autorisé', { status: 401 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAppelant = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: erreurUtilisateur,
  } = await supabaseAppelant.auth.getUser();
  if (erreurUtilisateur || !user) return new Response('Non autorisé', { status: 401 });

  const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: profilAppelant } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profilAppelant?.role !== 'responsable') {
    return new Response('Réservé aux responsables.', { status: 403 });
  }

  const { email, password, nom } = await req.json();
  if (!email || !password || !nom) {
    return new Response(JSON.stringify({ erreur: 'email, password et nom sont requis.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: nouvelUtilisateur, error: erreurCreation } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (erreurCreation || !nouvelUtilisateur.user) {
    return new Response(JSON.stringify({ erreur: erreurCreation?.message ?? 'Création impossible.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error: erreurProfil } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'responsable', nom })
    .eq('id', nouvelUtilisateur.user.id);
  if (erreurProfil) {
    return new Response(JSON.stringify({ erreur: erreurProfil.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ id: nouvelUtilisateur.user.id, email }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
