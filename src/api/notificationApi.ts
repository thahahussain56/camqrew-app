import { supabase } from './supabaseClient';

export interface DBNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  target_url?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationApi = {
  getNotifications: async (userId: string): Promise<DBNotification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Error fetching notifications:', error);
      return [];
    }
    return data as DBNotification[];
  },

  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) console.warn('Error marking notification read:', error);
  },

  markAllAsRead: async (userId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) console.warn('Error marking all notifications read:', error);
  },

  deleteNotification: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) console.warn('Error deleting notification:', error);
  },

  createNotification: async (userId: string, payload: Omit<DBNotification, 'id' | 'user_id' | 'is_read' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        target_url: payload.target_url
      })
      .select()
      .single();
    
    if (error) {
      console.warn('Error creating notification:', error);
      return null;
    }
    return data as DBNotification;
  },
  
  getPushToken: async (userId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single();
    return data?.push_token || null;
  }
};
