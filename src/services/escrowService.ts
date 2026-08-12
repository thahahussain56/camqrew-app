import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EscrowDepositRecord {
  orderId: string;
  depositAmount: number;
  status: 'held_in_escrow' | 'returned_inspecting' | 'refund_scheduled' | 'refunded';
  heldAt: string;
  returnedAt?: string;
  scheduledRefundAt?: string;
  refundedAt?: string;
  refundTxId?: string;
}

const STORE_KEY = '@camcrew_escrow_deposits';

export const escrowService = {
  getEscrowRecords: async (): Promise<EscrowDepositRecord[]> => {
    try {
      const data = await AsyncStorage.getItem(STORE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  holdDeposit: async (orderId: string, amount: number = 5000): Promise<EscrowDepositRecord> => {
    const records = await escrowService.getEscrowRecords();
    const existing = records.find(r => r.orderId === orderId);
    if (existing) return existing;

    const newRecord: EscrowDepositRecord = {
      orderId,
      depositAmount: amount,
      status: 'held_in_escrow',
      heldAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...records];
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  markReturnedAndScheduleRefund: async (orderId: string): Promise<EscrowDepositRecord> => {
    const records = await escrowService.getEscrowRecords();
    let record = records.find(r => r.orderId === orderId);

    const now = new Date();
    const refundTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

    if (!record) {
      record = {
        orderId,
        depositAmount: 5000,
        status: 'refund_scheduled',
        heldAt: now.toISOString(),
        returnedAt: now.toISOString(),
        scheduledRefundAt: refundTime.toISOString(),
      };
      records.unshift(record);
    } else {
      record.status = 'refund_scheduled';
      record.returnedAt = now.toISOString();
      record.scheduledRefundAt = refundTime.toISOString();
    }

    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(records));
    return record;
  },

  processRefundNow: async (orderId: string): Promise<EscrowDepositRecord> => {
    const records = await escrowService.getEscrowRecords();
    let record = records.find(r => r.orderId === orderId);
    const txId = `ref_${Math.floor(1000000 + Math.random() * 9000000)}`;

    if (!record) {
      record = {
        orderId,
        depositAmount: 5000,
        status: 'refunded',
        heldAt: new Date().toISOString(),
        returnedAt: new Date().toISOString(),
        refundedAt: new Date().toISOString(),
        refundTxId: txId,
      };
      records.unshift(record);
    } else {
      record.status = 'refunded';
      record.refundedAt = new Date().toISOString();
      record.refundTxId = txId;
    }

    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(records));
    return record;
  },
};
