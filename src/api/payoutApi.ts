import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PayoutRecord {
  id: string;
  amount: number;
  method: 'upi' | 'bank_account';
  destination: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  transactionRef: string;
}

export interface CreatorPayoutDetails {
  upiId: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

const ACCOUNT_STORE_KEY = '@camqrew_payout_account';
const LEGACY_ACCOUNT_STORE_KEY = '@camcrew_payout_account';

export const payoutApi = {
  getCreatorAccount: async (): Promise<CreatorPayoutDetails> => {
    try {
      const stored = (await AsyncStorage.getItem(ACCOUNT_STORE_KEY)) || (await AsyncStorage.getItem(LEGACY_ACCOUNT_STORE_KEY));
      return stored
        ? JSON.parse(stored)
        : {
            upiId: 'thaha@okaxis',
            accountNumber: '987654321098',
            ifscCode: 'HDFC0001234',
            accountHolderName: 'Mohammad Thaha Hussain',
          };
    } catch (e) {
      return {
        upiId: 'thaha@okaxis',
        accountNumber: '987654321098',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Mohammad Thaha Hussain',
      };
    }
  },

  saveCreatorAccount: async (details: CreatorPayoutDetails): Promise<void> => {
    await AsyncStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(details));
  },

  getPayoutHistory: async (): Promise<PayoutRecord[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const account = await payoutApi.getCreatorAccount();

    const { data, error } = await supabase
      .from('crew_payouts')
      .select('*')
      .eq('professional_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching payouts', error);
      return [];
    }

    return (data || []).map(row => {
      const parts = (row.reference_id || '').split(':');
      const method = (parts[0] === 'bank_account' ? 'bank_account' : 'upi') as 'upi' | 'bank_account';
      const destination = parts.length >= 3 ? parts[1] : (account.upiId || 'UPI Account');
      const txRef = parts.length >= 3 ? parts.slice(2).join(':') : (row.reference_id || `PO-${String(row.id).slice(0, 8)}`);

      return {
        id: String(row.id),
        amount: Number(row.amount),
        method,
        destination,
        status: (row.status || 'completed') as 'processing' | 'completed' | 'failed',
        createdAt: row.created_at,
        transactionRef: txRef,
      };
    });
  },

  requestInstantPayout: async (amount: number, method: 'upi' | 'bank_account' = 'upi'): Promise<PayoutRecord> => {
    const { data: userData } = await supabase.auth.getUser();
    const professionalId = userData?.user?.id;
    if (!professionalId) throw new Error('Not authenticated');

    const account = await payoutApi.getCreatorAccount();
    const destination = method === 'upi' ? account.upiId : `${account.accountNumber} (${account.ifscCode})`;
    const txRef = `pout_rzp_${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newRow = {
      professional_id: professionalId,
      amount,
      status: 'completed',
      reference_id: `${method}:${destination}:${txRef}`,
    };

    const { data, error } = await supabase
      .from('crew_payouts')
      .insert([newRow])
      .select()
      .single();

    if (error) {
      console.warn('Error recording payout in crew_payouts:', error);
      return {
        id: 'PO-' + Math.floor(1000 + Math.random() * 9000),
        amount,
        method,
        destination,
        status: 'completed',
        createdAt: new Date().toISOString(),
        transactionRef: txRef,
      };
    }

    const parts = (data.reference_id || '').split(':');
    const parsedMethod = (parts[0] === 'bank_account' ? 'bank_account' : 'upi') as 'upi' | 'bank_account';
    const parsedDestination = parts.length >= 3 ? parts[1] : destination;
    const parsedTxRef = parts.length >= 3 ? parts.slice(2).join(':') : txRef;

    return {
      id: String(data.id),
      amount: Number(data.amount),
      method: parsedMethod,
      destination: parsedDestination,
      status: (data.status || 'completed') as 'processing' | 'completed' | 'failed',
      createdAt: data.created_at,
      transactionRef: parsedTxRef,
    };
  },
};
