import { create } from 'zustand';
import { notificationApi, DBNotification } from '../api/notificationApi';
import { supabase } from '../api/supabaseClient';
import * as Notifications from 'expo-notifications';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: string;
  targetScreen?: string;
  targetParams?: any;
}

interface NotificationStoreState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  addLocalNotification: (notif: DBNotification) => void;
  subscribeToRealtimeNotifications: (userId: string) => () => void;
}

const mapDBToAppNotification = (dbn: DBNotification): AppNotification => {
  let targetScreen = undefined;
  let targetParams = undefined;

  if (dbn.target_url) {
    const url = dbn.target_url;
    if (url.includes('chat')) {
      const match = url.match(/(?:chat\/|userId=)([^&?]+)/);
      const otherUserId = match ? match[1] : url.replace('camqrew://chat/', '').replace('camcrew://chat/', '');
      targetScreen = 'Chat';
      targetParams = { otherUserId };
    } else if (url.includes('booking')) {
      const match = url.match(/(?:booking\/|bookingId=)([^&?]+)/);
      const bookingId = match ? match[1] : url.replace('camqrew://booking/', '').replace('camcrew://booking/', '');
      targetScreen = 'Booking';
      targetParams = { bookingId };
    } else if (url.includes('job_board') || url.includes('jobboard')) {
      targetScreen = 'JobBoardScreen';
    } else if (url.includes('job_review') || url.includes('jobreview')) {
      const match = url.match(/jobId=([^&?]+)/);
      const jobId = match ? match[1] : undefined;
      targetScreen = 'JobReview';
      targetParams = { jobId };
    }
  }

  return {
    id: dbn.id,
    title: dbn.title,
    body: dbn.body,
    timestamp: new Date(dbn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: dbn.is_read,
    type: dbn.type,
    targetScreen,
    targetParams,
  };
};

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (userId: string) => {
    set({ loading: true });
    const dbNotifs = await notificationApi.getNotifications(userId);
    const appNotifs = dbNotifs.map(mapDBToAppNotification);
    const unreadCount = appNotifs.filter(n => !n.read).length;
    Notifications.setBadgeCountAsync(unreadCount).catch(() => {});
    set({ 
      notifications: appNotifs, 
      unreadCount,
      loading: false 
    });
  },

  markAsRead: async (id) => {
    // Optimistic update
    const list = get().notifications.map(n => n.id === id ? { ...n, read: true } : n);
    const unreadCount = list.filter(n => !n.read).length;
    Notifications.setBadgeCountAsync(unreadCount).catch(() => {});
    set({ notifications: list, unreadCount });
    
    // DB update
    await notificationApi.markAsRead(id);
  },

  markAllAsRead: async (userId) => {
    const list = get().notifications.map(n => ({ ...n, read: true }));
    Notifications.setBadgeCountAsync(0).catch(() => {});
    set({ notifications: list, unreadCount: 0 });
    
    await notificationApi.markAllAsRead(userId);
  },

  dismissNotification: async (id) => {
    const list = get().notifications.filter(n => n.id !== id);
    const unreadCount = list.filter(n => !n.read).length;
    Notifications.setBadgeCountAsync(unreadCount).catch(() => {});
    set({ notifications: list, unreadCount });
    
    await notificationApi.deleteNotification(id);
  },

  addLocalNotification: (dbn: DBNotification) => {
    const newNotif = mapDBToAppNotification(dbn);
    const list = [newNotif, ...get().notifications];
    const unreadCount = list.filter(n => !n.read).length;
    Notifications.setBadgeCountAsync(unreadCount).catch(() => {});
    set({ notifications: list, unreadCount });
  },

  subscribeToRealtimeNotifications: (userId: string) => {
    const channel = supabase
      .channel(`user_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newRow = payload.new as DBNotification;
          get().addLocalNotification(newRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}));
