// Edge Function appelée par un Database Webhook Supabase (INSERT sur
// public.notifications). Récupère le jeton push Expo du destinataire et
// relaie la notification via l'API push d'Expo.
//
// Configuration requise (Dashboard Supabase) :
//   1. Database > Webhooks > Create a new hook
//      - Table: notifications, Event: Insert
//      - Type: HTTP Request -> POST vers l'URL de cette fonction
//      - Header personnalisé: x-webhook-secret: <valeur de WEBHOOK_SECRET>
//   2. Edge Functions > envoyer-notification-push > Secrets :
//      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (déjà injectées par défaut),
//      WEBHOOK_SECRET (à définir, partagée avec le header du webhook).
import { createClient } from 'npm:@supabase/supabase-js@2';

interface PayloadWebhook {
  type: 'INSERT';
  table: 'notifications';
  record: {
    id: string;
    destinataire_id: string;
    demande_id: string | null;
    titre: string;
    contenu: string;
  };
}

Deno.serve(async (req) => {
  const secretAttendu = Deno.env.get('WEBHOOK_SECRET');
  if (secretAttendu && req.headers.get('x-webhook-secret') !== secretAttendu) {
    return new Response('Non autorisé', { status: 401 });
  }

  const payload: PayloadWebhook = await req.json();
  const { record } = payload;

  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: profil, error } = await supabaseAdmin
    .from('profiles')
    .select('expo_push_token')
    .eq('id', record.destinataire_id)
    .maybeSingle();

  if (error || !profil?.expo_push_token) {
    return new Response(JSON.stringify({ envoye: false, raison: 'pas_de_jeton_push' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const reponsePush = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      to: profil.expo_push_token,
      title: record.titre,
      body: record.contenu,
      data: { demandeId: record.demande_id },
    }),
  });

  const resultat = await reponsePush.json();
  return new Response(JSON.stringify({ envoye: true, resultat }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
