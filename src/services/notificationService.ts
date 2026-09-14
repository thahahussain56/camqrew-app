import { notificationApi, DBNotification } from '../api/notificationApi';
import { useNotificationStore } from '../store/notificationStore';
import { supabase } from '../api/supabaseClient';

export interface PushNotificationPayload {
  type: string;
  title: string;
  body: string;
  targetUrl?: string; // e.g., 'camcrew://chat/123'
}

export const notificationService = {
  sendPushNotification: async (receiverId: string, payload: PushNotificationPayload) => {
    try {
      // 1. Check receiver's push preferences
      const { data: userData } = await supabase
        .from('users')
        .select('push_token, push_preferences')
        .eq('id', receiverId)
        .single();
        
      if (!userData) return;

      const prefs = userData.push_preferences || { booking: true, chat: true, marketing: true };
      
      // Basic preference check based on type
      if (payload.type === 'chat' && prefs.chat === false) return;
      if (payload.type === 'booking' && prefs.booking === false) return;
      if (payload.type === 'marketing' && prefs.marketing === false) return;

      // 2. Insert into database for persistence
      const dbNotif = await notificationApi.createNotification(receiverId, {
        title: payload.title,
        body: payload.body,
        type: payload.type,
        target_url: payload.targetUrl
      });

      // If the current logged in user is somehow sending it to themselves, update local store
      // Normally they won't, but just in case
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id === receiverId && dbNotif) {
        useNotificationStore.getState().addLocalNotification(dbNotif);
      }

      // 3. Send remote push notification via Expo API
      if (userData.push_token) {
        const expoPayload = {
          to: userData.push_token,
          sound: 'default',
          title: payload.title,
          body: payload.body,
          data: { url: payload.targetUrl },
          badge: 1, // You could calculate exact badge count here if needed
        };

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expoPayload),
        });
      }
    } catch (e) {
      console.warn('Failed to send push notification:', e);
    }
  },

  triggerBookingRequestNotification: async (receiverId: string, creatorName: string, serviceTitle: string, amount: number, bookingId: string) => {
    await notificationService.sendPushNotification(receiverId, {
      type: 'booking',
      title: '🚨 New Shoot Booking Request!',
      body: `You received a new booking request for "${serviceTitle}" (Total: ₹${amount.toLocaleString()}).`,
      targetUrl: `camcrew://booking/${bookingId}`
    });
  },

  triggerChatNotification: async (senderId: string, receiverId: string, senderName: string, text: string) => {
    // Truncate text for push
    const bodyText = text.length > 50 ? text.substring(0, 50) + '...' : text;
    // Don't show raw image tags in push
    const displayBody = bodyText.includes('[IMAGE]') ? '📸 Sent an image' : bodyText;

    await notificationService.sendPushNotification(receiverId, {
      type: 'chat',
      title: senderName,
      body: displayBody,
      targetUrl: `camcrew://chat/${senderId}` // When receiver taps this, they want to chat with the sender
    });
  },

  triggerOrderOutForDeliveryNotification: async (orderId: string, itemName: string) => {
    // We would need the customer ID here, assuming it's called with it eventually
    // For now we can just log or implement a stub if the method was meant to be used like this
    console.log('triggerOrderOutForDeliveryNotification called for', orderId, itemName);
  },
};
