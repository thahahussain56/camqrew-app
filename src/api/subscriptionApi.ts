import { supabase } from './supabaseClient';
import { User } from '../types/auth';

export const subscriptionApi = {
  upgradeSubscription: async (
    userId: string, 
    tier: 'pro' | 'prime'
  ): Promise<{ success: boolean; user?: Partial<User>; error?: string }> => {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days subscription

      const { data, error } = await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_end_date: endDate.toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return {
        success: true,
        user: {
          subscription_tier: data.subscription_tier,
          subscription_status: data.subscription_status,
          subscription_end_date: data.subscription_end_date,
        }
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
};
