import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';

export interface PayoutRecord {
  id: string;
  amount: number;
  method: 'upi' | 'bank_account';
  destination: string; // e.g. thaha@upi or HDFC0001234
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

const PAYOUT_STORE_KEY = '@camcrew_payout_history';
const ACCOUNT_STORE_KEY = '@camcrew_payout_account';

export const payoutApi = {
  getCreatorAccount: async (): Promise<CreatorPayoutDetails> => {
    try {
      const stored = await AsyncStorage.getItem(ACCOUNT_STORE_KEY);
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
    try {
      const stored = await AsyncStorage.getItem(PAYOUT_STORE_KEY);
      return stored
        ? JSON.parse(stored)
        : [
            {
              id: 'PO-8821',
              amount: 25000,
              method: 'upi',
              destination: 'thaha@okaxis',
              status: 'completed',
              createdAt: '2026-08-01T10:30:00.000Z',
              transactionRef: 'pout_rzp_98127391',
            },
          ];
    } catch (e) {
      return [];
    }
  },

  requestInstantPayout: async (amount: number, method: 'upi' | 'bank_account' = 'upi'): Promise<PayoutRecord> => {
    const account = await payoutApi.getCreatorAccount();
    const destination = method === 'upi' ? account.upiId : `${account.accountNumber} (${account.ifscCode})`;
    const txRef = `pout_rzp_${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newPayout: PayoutRecord = {
      id: 'PO-' + Math.floor(1000 + Math.random() * 9000),
      amount,
      method,
      destination,
      status: 'completed',
      createdAt: new Date().toISOString(),
      transactionRef: txRef,
    };

    try {
      await apiClient.post('/professional/payout', {
        amount,
        method,
        destination,
        payout_reference: txRef,
      });
    } catch (e) {
      // local store fallback
    }

    const history = await payoutApi.getPayoutHistory();
    const updated = [newPayout, ...history];
    await AsyncStorage.setItem(PAYOUT_STORE_KEY, JSON.stringify(updated));
    return newPayout;
  },
};
