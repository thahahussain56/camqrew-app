import { supabase } from './supabaseClient';
import { notificationService } from '../services/notificationService';

export interface ChatMessage {
  id: string;
  threadId: string; // Typically booking_id or other_user_id depending on how it's grouped
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'professional';
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatThread {
  id: string; // Typically the other user's ID
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const chatApi = {
  // Get all threads for the current user
  getThreads: async (): Promise<ChatThread[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];
    const myId = userData.user.id;

    // Fetch all messages where I am sender or receiver
    const { data: msgs, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!sender_id(id, name, avatar),
        receiver:users!receiver_id(id, name, avatar)
      `)
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .order('created_at', { ascending: false });

    if (error || !msgs) {
      console.warn('Error fetching threads:', error);
      return [];
    }

    // Group by the OTHER user
    const threadsMap = new Map<string, ChatThread>();

    msgs.forEach((m: any) => {
      const isSender = m.sender_id === myId;
      const otherUser = isSender ? m.receiver : m.sender;
      
      if (!otherUser) return; // defensive

      const otherUserId = otherUser.id;
      
      if (!threadsMap.has(otherUserId)) {
        threadsMap.set(otherUserId, {
          id: otherUserId,
          otherUserId: otherUserId,
          otherUserName: otherUser.name || 'User',
          otherUserAvatar: otherUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
          lastMessage: m.text,
          lastMessageTime: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unreadCount: (!isSender && !m.is_read) ? 1 : 0,
        });
      } else {
        if (!isSender && !m.is_read) {
          const t = threadsMap.get(otherUserId)!;
          t.unreadCount += 1;
        }
      }
    });

    return Array.from(threadsMap.values());
  },

  getMessages: async (otherUserId: string): Promise<ChatMessage[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];
    const myId = userData.user.id;

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!sender_id(id, name)
      `)
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching messages', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      threadId: otherUserId,
      senderId: row.sender_id,
      senderName: row.sender?.name || 'User',
      senderRole: row.sender_id === myId ? 'customer' : 'professional',
      text: row.text || '',
      isRead: row.is_read,
      timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  },

  sendMessage: async (receiverId: string, text: string): Promise<ChatMessage> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');
    const myId = userData.user.id;

    // Fetch the sender's role from users table
    const { data: senderProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', myId)
      .single();
    const senderRole = (senderProfile?.role || 'customer') as any;

    // Find if there's an active booking between them to link it to
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('id')
      .or(`and(customer_id.eq.${myId},professional_id.eq.${receiverId}),and(customer_id.eq.${receiverId},professional_id.eq.${myId})`)
      .limit(1)
      .single();

    const newRow = {
      sender_id: myId,
      receiver_id: receiverId,
      text: text,
      is_read: false,
      booking_id: bookingData ? bookingData.id : null,
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([newRow])
      .select(`
        *,
        sender:users!sender_id(id, name)
      `)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to send message');
    }
    
    return {
      id: String(data.id),
      threadId: receiverId,
      senderId: data.sender_id,
      senderName: data.sender?.name || 'You',
      senderRole: senderRole,
      text: data.text,
      isRead: false,
      timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  },
  
  markAsRead: async (otherUserId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    const myId = userData.user.id;

    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', myId)
      .eq('is_read', false);
  },

  canChat: async (otherUserId: string): Promise<boolean> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;
    const myId = userData.user.id;

    const { data, error } = await supabase
      .from('bookings')
      .select('status, end_datetime')
      .or(`and(customer_id.eq.${myId},professional_id.eq.${otherUserId}),and(customer_id.eq.${otherUserId},professional_id.eq.${myId})`)
      .not('status', 'in', '(pending,cancelled)');

    if (error || !data) {
      console.warn('Error checking chat permission:', error);
      return false;
    }

    if (data.length === 0) return false;

    const hasActiveBooking = data.some(b => b.status !== 'completed');
    if (hasActiveBooking) return true;

    const now = new Date();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    
    for (const b of data) {
      if (b.end_datetime) {
        const endDate = new Date(b.end_datetime);
        const diffMs = now.getTime() - endDate.getTime();
        if (diffMs <= threeDaysMs) {
          return true;
        }
      }
    }

    return false;
  },

  subscribeToMessages: (
    otherUserId: string,
    onNewMessage: (msg: ChatMessage) => void,
    onTypingStatus?: (isTyping: boolean) => void,
    currentUserId?: string
  ) => {
    let myId = currentUserId || '';
    const sortedIds = [myId || 'anon', otherUserId].sort();
    const channelName = 'chat_' + sortedIds.join('_');

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: myId || otherUserId },
      },
    });

    const checkTyping = () => {
      const state = channel.presenceState();
      let isTyping = false;
      for (const key in state) {
        const presences = state[key] as any[];
        for (const p of presences) {
          if ((p.userId === otherUserId || key === otherUserId) && p.isTyping) {
            isTyping = true;
            break;
          }
        }
        if (isTyping) break;
      }
      onTypingStatus?.(isTyping);
    };

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as any;
          if (
            (row.sender_id === myId && row.receiver_id === otherUserId) ||
            (row.sender_id === otherUserId && row.receiver_id === myId)
          ) {
            onNewMessage({
              id: String(row.id),
              threadId: otherUserId,
              senderId: row.sender_id,
              senderName: row.sender_id === myId ? 'You' : 'User',
              senderRole: row.sender_id === myId ? 'customer' : 'professional',
              text: row.text || '',
              isRead: row.is_read,
              timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        checkTyping();
      })
      .on('presence', { event: 'join' }, () => {
        checkTyping();
      })
      .on('presence', { event: 'leave' }, () => {
        checkTyping();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          if (myId) {
            await channel.track({ userId: myId, isTyping: false });
          }
        }
      });

    if (!myId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          myId = data.user.id;
          channel.track({ userId: myId, isTyping: false });
        }
      });
    }

    const setTyping = async (isTyping: boolean) => {
      if (myId) {
        try {
          await channel.track({ userId: myId, isTyping });
        } catch (e) {
          // Ignore if unmounted
        }
      }
    };

    const unsubscribe = () => {
      supabase.removeChannel(channel);
    };

    return { unsubscribe, setTyping };
  }
};
