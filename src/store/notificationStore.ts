import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'booking' | 'payment' | 'order' | 'review' | 'system';
  targetScreen?: string;
}

interface NotificationStoreState {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
}

const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: '🟢 Booking Confirmed',
    body: 'Mohammad Thaha has confirmed your fashion shoot booking for August 15.',
    timestamp: '10m ago',
    read: false,
    type: 'booking',
  },
  {
    id: 'notif_2',
    title: '📦 Gear Order Shipped',
    body: 'Order #ORD-8921 (Sony FX3 Cinema Camera) is on the way!',
    timestamp: '2h ago',
    read: false,
    type: 'order',
  },
  {
    id: 'notif_3',
    title: '💰 Payment Received',
    body: 'You received ₹18,500 for Booking #BK-4092.',
    timestamp: '1d ago',
    read: true,
    type: 'payment',
  },
  {
    id: 'notif_4',
    title: '⭐ New 5-Star Review',
    body: '"Absolute genius behind the camera!" — Priya S.',
    timestamp: '2d ago',
    read: true,
    type: 'review',
  },
];

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: SAMPLE_NOTIFICATIONS,
  unreadCount: SAMPLE_NOTIFICATIONS.filter(n => !n.read).length,

  markAsRead: (id) => {
    const list = get().notifications.map(n => n.id === id ? { ...n, read: true } : n);
    set({ notifications: list, unreadCount: list.filter(n => !n.read).length });
  },

  markAllAsRead: () => {
    const list = get().notifications.map(n => ({ ...n, read: true }));
    set({ notifications: list, unreadCount: 0 });
  },

  dismissNotification: (id) => {
    const list = get().notifications.filter(n => n.id !== id);
    set({ notifications: list, unreadCount: list.filter(n => !n.read).length });
  },
}));
