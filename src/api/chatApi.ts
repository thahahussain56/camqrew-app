import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'professional';
  text: string;
  timestamp: string;
  isQuote?: boolean;
  quoteAmount?: number;
  quoteTitle?: string;
  locationTag?: string;
}

export interface ChatThread {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  clientId: string;
  clientName: string;
  bookingId?: string;
  isPaidUnlocked: boolean; // Locked until payment/booking confirmation
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const THREADS_KEY = '@camcrew_chat_threads';
const MESSAGES_KEY_PREFIX = '@camcrew_chat_msgs_';

const SAMPLE_THREADS: ChatThread[] = [
  {
    id: 'thread_1',
    creatorId: 'pro_1',
    creatorName: 'Mohammad Thaha Hussain',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
    clientId: 'usr_client',
    clientName: 'Priya Sharma',
    bookingId: 'BK-4092',
    isPaidUnlocked: true,
    lastMessage: 'I have logged the venue location at Bandra Fort. See you at 8:00 AM!',
    lastMessageTime: '10m ago',
    unreadCount: 1,
  },
];

const SAMPLE_MESSAGES: Record<string, ChatMessage[]> = {
  thread_1: [
    {
      id: 'msg_1',
      threadId: 'thread_1',
      senderId: 'pro_1',
      senderName: 'Mohammad Thaha Hussain',
      senderRole: 'professional',
      text: 'Hi Priya! Thank you for confirming the booking payment. Let us finalize the shoot details here.',
      timestamp: '10:15 AM',
    },
    {
      id: 'msg_2',
      threadId: 'thread_1',
      senderId: 'usr_client',
      senderName: 'Priya Sharma',
      senderRole: 'customer',
      text: 'Hello Thaha! We want 4K 60fps slow-motion shots during sunset at Bandra Fort.',
      timestamp: '10:18 AM',
      locationTag: 'Bandra Fort, Mumbai',
    },
    {
      id: 'msg_3',
      threadId: 'thread_1',
      senderId: 'pro_1',
      senderName: 'Mohammad Thaha Hussain',
      senderRole: 'professional',
      text: 'Perfect! I have logged the venue location at Bandra Fort. See you at 8:00 AM!',
      timestamp: '10:25 AM',
    },
  ],
};

export const chatApi = {
  getThreads: async (): Promise<ChatThread[]> => {
    try {
      const stored = await AsyncStorage.getItem(THREADS_KEY);
      return stored ? JSON.parse(stored) : SAMPLE_THREADS;
    } catch (e) {
      return SAMPLE_THREADS;
    }
  },

  getOrCreateThread: async (creatorId: string, creatorName: string, creatorAvatar?: string, isPaidUnlocked: boolean = false, bookingId?: string): Promise<ChatThread> => {
    const threads = await chatApi.getThreads();
    let existing = threads.find(t => t.creatorId === creatorId || t.bookingId === bookingId);
    
    if (existing) {
      if (isPaidUnlocked && !existing.isPaidUnlocked) {
        existing.isPaidUnlocked = true;
        await AsyncStorage.setItem(THREADS_KEY, JSON.stringify(threads));
      }
      return existing;
    }

    const newThread: ChatThread = {
      id: 'thread_' + Date.now(),
      creatorId,
      creatorName,
      creatorAvatar: creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
      clientId: 'usr_client',
      clientName: 'Client User',
      bookingId,
      isPaidUnlocked,
      lastMessage: isPaidUnlocked ? 'Payment Confirmed! Chat is now unlocked.' : 'Payment pending to unlock chat.',
      lastMessageTime: 'Just now',
      unreadCount: 0,
    };

    const updated = [newThread, ...threads];
    await AsyncStorage.setItem(THREADS_KEY, JSON.stringify(updated));
    return newThread;
  },

  getMessages: async (threadId: string): Promise<ChatMessage[]> => {
    try {
      const stored = await AsyncStorage.getItem(MESSAGES_KEY_PREFIX + threadId);
      return stored ? JSON.parse(stored) : (SAMPLE_MESSAGES[threadId] || []);
    } catch (e) {
      return SAMPLE_MESSAGES[threadId] || [];
    }
  },

  sendMessage: async (threadId: string, text: string, senderRole: 'customer' | 'professional' = 'customer'): Promise<ChatMessage> => {
    const newMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      threadId,
      senderId: senderRole === 'customer' ? 'usr_client' : 'pro_1',
      senderName: senderRole === 'customer' ? 'You' : 'Creator',
      senderRole,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const current = await chatApi.getMessages(threadId);
    const updated = [...current, newMessage];
    await AsyncStorage.setItem(MESSAGES_KEY_PREFIX + threadId, JSON.stringify(updated));

    // Update thread last message
    const threads = await chatApi.getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      thread.lastMessage = text;
      thread.lastMessageTime = 'Just now';
      await AsyncStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    }

    try {
      await apiClient.post(`/chats/${threadId}/messages`, { text, senderRole });
    } catch (e) {
      // offline fallback
    }

    return newMessage;
  },
};
