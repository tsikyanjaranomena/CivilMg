import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type NotificationDb = Database['public']['Tables']['notifications']['Row'];

export async function listerNotifications(destinataireId: string): Promise<NotificationDb[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('destinataire_id', destinataireId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function marquerNotificationLue(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ lu: true }).eq('id', id);
  if (error) throw error;
}

export async function marquerToutesNotificationsLues(destinataireId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('destinataire_id', destinataireId)
    .eq('lu', false);
  if (error) throw error;
}
