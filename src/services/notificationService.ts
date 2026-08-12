import { useNotificationStore, AppNotification } from '../store/notificationStore';

export interface PushNotificationPayload {
  type: 'booking' | 'order' | 'payment' | 'chat';
  title: string;
  body: string;
  targetId?: string;
}

export const notificationService = {
  triggerPushNotification: (payload: PushNotificationPayload) => {
    const notifType: AppNotification['type'] = payload.type === 'chat' ? 'system' : payload.type;

    const newNotif: AppNotification = {
      id: 'notif_' + Date.now(),
      title: payload.title,
      body: payload.body,
      timestamp: 'Just now',
      read: false,
      type: notifType,
      targetScreen: payload.targetId,
    };

    const store = useNotificationStore.getState();
    useNotificationStore.setState({
      notifications: [newNotif, ...store.notifications],
      unreadCount: store.unreadCount + 1,
    });
  },

  triggerBookingRequestNotification: (creatorName: string, serviceTitle: string, amount: number) => {
    notificationService.triggerPushNotification({
      type: 'booking',
      title: '🚨 New Shoot Booking Request!',
      body: `You received a new booking request for "${serviceTitle}" (Total: ₹${amount.toLocaleString()}).`,
    });
  },

  triggerOrderOutForDeliveryNotification: (orderId: string, itemTitle: string) => {
    notificationService.triggerPushNotification({
      type: 'order',
      title: '🚚 Rental Equipment Out for Delivery!',
      body: `Order #${orderId} (${itemTitle}) has been dispatched and is out for delivery to your location!`,
    });
  },
};
