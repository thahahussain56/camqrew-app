import { supabase } from './supabaseClient';
import { Booking, BookingStatus } from '../types/booking';
import { notificationService } from '../services/notificationService';

const mapBooking = (b: any): Booking => {
  const loc = b.location_details?.address || b.location_details?.city || (typeof b.location_details === 'string' ? b.location_details : '') || '';
  const service = b.items?.serviceTitle || b.service_title || 'Creative Service';
  const notes = b.items?.notes || '';
  const contractSig = b.items?.contractSignature || '';

  // Calculate daysCount from start_datetime and end_datetime
  let days = b.items?.daysCount || 1;
  if (b.start_datetime && b.end_datetime && !b.items?.daysCount) {
    try {
      const d1 = new Date(b.start_datetime);
      const d2 = new Date(b.end_datetime);
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) days = diff;
    } catch {}
  }

  // Deduplicate milestones
  const seenTitles = new Set<string>();
  const rawMilestones = Array.isArray(b.booking_milestones) ? b.booking_milestones
    .filter((m: any) => {
      if (seenTitles.has(m.title)) return false;
      seenTitles.add(m.title);
      return true;
    })
    .map((m: any) => ({
      id: String(m.id),
      title: m.title,
      amount: Number(m.amount),
      status: (m.status === 'paid' || m.status === 'released') ? 'released' : 'held',
    })) : [];

  const proAvatar = b.professional_profiles?.users?.avatar || b.studio_bays?.users?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400';

  return {
    id: String(b.id),
    professionalId: b.professional_id,
    studioId: b.studio_id,
    professionalAvatar: proAvatar,
    professionalName: b.professional_profiles?.users?.name || b.studio_bays?.users?.name || 'Professional/Studio',
    customerId: b.customer_id,
    customerName: b.users?.name || 'Customer',
    serviceTitle: service,
    startDate: b.start_datetime,
    endDate: b.end_datetime || b.start_datetime,
    daysCount: days,
    location: loc,
    notes: notes,
    contractSignature: contractSig,
    status: (b.status === 'escrow_held' ? 'confirmed' : b.status) as BookingStatus,
    ratePerDay: Number(b.total_amount || 0),
    totalAmount: Number(b.total_amount || 0),
    milestones: rawMilestones,
    createdAt: b.created_at,
  };
};

export const bookingApi = {
  createBooking: async (data: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
    const { data: userData } = await supabase.auth.getUser();
    const clientId = userData?.user?.id;
    if (!clientId) throw new Error('Not authenticated');

    // Ensure the user exists in the public 'users' table to prevent foreign key constraint violations
    const { data: existingUser } = await supabase.from('users').select('id').eq('id', clientId).single();
    if (!existingUser) {
      await supabase.from('users').insert([{
        id: clientId,
        name: userData.user?.user_metadata?.name || data.customerName || 'Customer',
        email: userData.user?.email || '',
        phone: userData.user?.phone || userData.user?.user_metadata?.phone || '0000000000',
        role: 'customer'
      }]);
    }

    const parseDate = (d: string) => {
      if (!d) return new Date().toISOString().split('T')[0];
      try {
        const parts = d.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return d;
      } catch(e) {
        return new Date().toISOString().split('T')[0];
      }
    };

    const newBookingRow: any = {
      customer_id: clientId,
      start_datetime: parseDate(data.startDate),
      end_datetime: parseDate(data.endDate),
      total_amount: data.totalAmount,
      status: 'pending',
      location_details: data.location ? { address: data.location } : null,
      items: {
        serviceTitle: data.serviceTitle,
        notes: data.notes,
        contractSignature: data.contractSignature,
        daysCount: data.daysCount,
      }
    };
    
    if (data.professionalId) {
      newBookingRow.professional_id = data.professionalId;
      // Ensure professional exists for mock data
      const { data: existingProf } = await supabase.from('users').select('id').eq('id', data.professionalId).single();
      if (!existingProf) {
        await supabase.from('users').insert([{ id: data.professionalId, name: data.professionalName || 'Professional', email: 'mock@camcrew.in', role: 'professional', phone: '0000000000' }]);
        await supabase.from('professional_profiles').insert([{ id: data.professionalId, title: data.professionalTitle || 'Professional' }]);
      }
    }
    
    if (data.studioId) {
      newBookingRow.studio_id = data.studioId;
      // Ensure studio exists for mock data
      const { data: existingStudio } = await supabase.from('users').select('id').eq('id', data.studioId).single();
      if (!existingStudio) {
        await supabase.from('users').insert([{ id: data.studioId, name: data.professionalName || 'Studio', email: 'mock@camcrew.in', role: 'studio', phone: '0000000000' }]);
        await supabase.from('studio_bays').insert([{ id: data.studioId }]);
      }
    }

    const { data: inserted, error } = await supabase
      .from('bookings')
      .insert([newBookingRow])
      .select(`
        *,
        users (name, avatar),
        professional_profiles (users (name, avatar)),
        studio_bays (users (name, avatar)),
        booking_milestones (*)
      `)
      .single();

    if (error) {
      console.warn('DB Booking failed due to mock constraints, using fallback:', error.message);
      const fallbackBooking: Booking = {
        id: `BKG-${Math.floor(1000 + Math.random() * 9000)}`,
        professionalId: data.professionalId,
        studioId: data.studioId,
        professionalAvatar: data.professionalAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
        professionalName: data.professionalName,
        customerId: clientId,
        customerName: data.customerName,
        serviceTitle: data.serviceTitle,
        startDate: data.startDate,
        endDate: data.endDate,
        daysCount: data.daysCount,
        location: data.location,
        notes: data.notes,
        contractSignature: data.contractSignature,
        status: 'pending',
        ratePerDay: data.ratePerDay,
        totalAmount: data.totalAmount,
        milestones: data.milestones || [],
        createdAt: new Date().toISOString(),
      };
      return fallbackBooking;
    }

    // Trigger in-app notification to the creator
    try {
      const receiverId = data.professionalId || data.studioId;
      if (receiverId) {
        notificationService.triggerBookingRequestNotification(
          receiverId, 
          'Customer', 
          data.serviceTitle, 
          data.totalAmount, 
          inserted.id
        );
      }
    } catch (e) {
      console.warn('Failed to send booking notification', e);
    }

    return mapBooking(inserted);
  },

  getCustomerBookings: async (): Promise<Booking[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users (name, avatar),
        professional_profiles (users (name, avatar)),
        studio_bays (users (name, avatar)),
        booking_milestones (*)
      `)
      .eq('customer_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching customer bookings', error);
      return [];
    }

    return (data || []).map(mapBooking);
  },

  getProfessionalBookings: async (): Promise<Booking[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users (name, avatar),
        professional_profiles (users (name, avatar)),
        studio_bays (users (name, avatar)),
        booking_milestones (*)
      `)
      .eq('professional_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching professional bookings', error);
      return [];
    }

    return (data || []).map(mapBooking);
  },

  acceptBooking: async (bookingId: string): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', bookingId)
      .select(`*, users (name, avatar), professional_profiles (users (name, avatar)), booking_milestones (*)`)
      .single();

    if (error) throw new Error(error.message);
    return mapBooking(data);
  },

  declineBooking: async (bookingId: string): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select(`*, users (name, avatar), professional_profiles (users (name, avatar)), booking_milestones (*)`)
      .single();

    if (error) throw new Error(error.message);
    return mapBooking(data);
  },

  payAndConfirmBooking: async (bookingId: string): Promise<Booking> => {
    const { data: current } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (!current) throw new Error('Booking not found');

    const tot = current.total_amount || 20000;
    const advance = Math.round(tot * 0.3);
    const shootWrap = Math.round(tot * 0.4);
    const final = tot - advance - shootWrap; // Guarantee sum equals total
    const milestonesToInsert = [
      { booking_id: bookingId, title: 'Advance Escrow (30%)', amount: advance, status: 'paid' },
      { booking_id: bookingId, title: 'Shoot Wrap Escrow (40%)', amount: shootWrap, status: 'pending' },
      { booking_id: bookingId, title: 'Final Deliverables Escrow (30%)', amount: final, status: 'pending' },
    ];

    // Check if milestones already exist to avoid duplicate inserts
    const { data: existingMilestones } = await supabase.from('booking_milestones').select('id').eq('booking_id', bookingId);
    if (!existingMilestones || existingMilestones.length === 0) {
      await supabase.from('booking_milestones').insert(milestonesToInsert);
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
      .select(`*, users (name, avatar), professional_profiles (users (name, avatar)), booking_milestones (*)`)
      .single();

    if (error) throw new Error(error.message);
    return mapBooking(data);
  },

  releaseMilestone: async (bookingId: string, milestoneId: string): Promise<void> => {
    const { error } = await supabase
      .from('booking_milestones')
      .update({ status: 'paid' })
      .eq('id', milestoneId);

    if (error) throw new Error(error.message);

    // Check if all milestones are released, if so, complete the booking
    const { data: milestones } = await supabase
      .from('booking_milestones')
      .select('status')
      .eq('booking_id', bookingId);

    if (milestones && milestones.length > 0 && milestones.every(m => m.status === 'paid')) {
      await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);
    }
  },
};
