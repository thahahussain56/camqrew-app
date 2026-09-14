import { create } from 'zustand';
import { notificationApi, DBNotification } from '../api/notificationApi';
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
}

const mapDBToAppNotification = (dbn: DBNotification): AppNotification => {
  let targetScreen = undefined;
  let targetParams = undefined;

  if (dbn.target_url) {
    if (dbn.target_url.startsWith('camcrew://chat/')) {
      targetScreen = 'Chat';
      targetParams = { otherUserId: dbn.target_url.replace('camcrew://chat/', '') };
    } else if (dbn.target_url.startsWith('camcrew://booking/')) {
      targetScreen = 'Booking';
      targetParams = { bookingId: dbn.target_url.replace('camcrew://booking/', '') };
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
  }
}));
