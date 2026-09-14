import { supabase } from '../api/supabaseClient';

export interface DeliveryTrackingStep {
  title: string;
  subtitle: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

export interface LiveDeliveryTracking {
  orderId: string;
  courierPartner: 'Dunzo Express' | 'Shiprocket Direct' | 'Camcrew Logistics';
  awbNumber: string;
  riderName: string;
  riderPhone: string;
  riderVehicle: string;
  estimatedArrival: string;
  currentStatus: 'order_confirmed' | 'gear_inspected' | 'out_for_delivery' | 'delivered';
  timeline: DeliveryTrackingStep[];
  trackingUrl: string;
}

export const trackingService = {
  getLiveTracking: async (orderId: string): Promise<LiveDeliveryTracking | null> => {
    try {
      // First, fetch order from Supabase
      const { data, error } = await supabase
        .from('orders')
        .select('awb_code, courier_name, status, created_at')
        .eq('id', orderId)
        .single();

      if (error) {
        console.warn('Error fetching tracking info from Supabase:', error.message);
        return null;
      }

      if (!data || !data.awb_code) {
        return null; // Tracking not yet initiated
      }

      const awbNumber = data.awb_code;
      const courierPartner = data.courier_name || 'Shiprocket Direct';
      
      // Simulate Shiprocket live status based on DB status
      let currentStatus: any = 'order_confirmed';
      let timeline = [];

      timeline.push({
        title: 'Order Confirmed',
        subtitle: 'Payment Verified',
        timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completed: true,
        current: false,
      });

      if (data.status === 'shipped') {
        currentStatus = 'out_for_delivery';
        timeline.push({
          title: 'Picked up by Courier',
          subtitle: `Package handed over to ${courierPartner}`,
          timestamp: 'In Transit',
          completed: true,
          current: false,
        });
        timeline.push({
          title: 'Out for Delivery',
          subtitle: 'Arriving Today',
          timestamp: 'Estimated 2:30 PM',
          completed: true,
          current: true,
        });
        timeline.push({
          title: 'Delivered',
          subtitle: 'Waiting for handover',
          timestamp: 'Pending',
          completed: false,
          current: false,
        });
      } else if (data.status === 'delivered') {
         currentStatus = 'delivered';
         timeline.push({
          title: 'Picked up by Courier',
          subtitle: `Package handed over to ${courierPartner}`,
          timestamp: 'In Transit',
          completed: true,
          current: false,
         });
         timeline.push({
          title: 'Out for Delivery',
          subtitle: 'Arriving Today',
          timestamp: 'Completed',
          completed: true,
          current: false,
         });
         timeline.push({
          title: 'Delivered',
          subtitle: 'Handed over successfully',
          timestamp: 'Completed',
          completed: true,
          current: true,
         });
      }

      return {
        orderId,
        courierPartner: courierPartner as any,
        awbNumber: awbNumber,
        riderName: 'Shiprocket Rider',
        riderPhone: '+91 99999 00000',
        riderVehicle: 'Delivery Van',
        estimatedArrival: 'Today, 2:30 PM',
        currentStatus,
        timeline,
        trackingUrl: `https://shiprocket.co/tracking/${awbNumber}`,
      };
    } catch (e) {
      return null;
    }
  },
};
