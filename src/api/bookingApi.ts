import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { Booking, BookingStatus } from '../types/booking';
import { MOCK_BOOKINGS } from './mockData';
import { notificationService } from '../services/notificationService';

const ASYNC_BOOKINGS_KEY = '@camcrew_user_bookings';

const getStoredBookings = async (): Promise<Booking[]> => {
  try {
    const raw = await AsyncStorage.getItem(ASYNC_BOOKINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to read stored bookings');
  }
  return [];
};

const saveStoredBookings = async (bookings: Booking[]) => {
  try {
    await AsyncStorage.setItem(ASYNC_BOOKINGS_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.warn('Failed to save bookings to storage');
  }
};

export const bookingApi = {
  createBooking: async (data: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
    const newBooking: Booking = {
      ...data,
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      status: 'pending', // Step 1: Book without payment -> Pending creator acceptance
      createdAt: new Date().toISOString(),
    };

    // Convert DD/MM/YYYY to YYYY-MM-DD for valid website date parsing
    const dateParts = data.startDate ? data.startDate.split('/') : [];
    const isoDateStr = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : data.startDate;
    const timeRange = data.startTime && data.endTime ? `${data.startTime}–${data.endTime}` : (data.startTime || '');
    const bookingDateFormatted = `${isoDateStr} ${timeRange}`.trim();

    const noteLines = [];
    if (data.location) noteLines.push(`Venue: ${data.location}`);
    if (data.notes) noteLines.push(data.notes);
    if (data.contractSignature) noteLines.push(`Signed: ${data.contractSignature}`);

    // Website exact payload format
    const websitePayload = {
      professional_name: data.professionalName,
      professional_username: data.professionalId,
      service: data.serviceTitle,
      booking_date: bookingDateFormatted,
      amount: data.totalAmount,
      note: noteLines.join('\n') || null,
    };

    // Try posting to website backend endpoints
    try {
      await apiClient.post('/customer/bookings', websitePayload);
    } catch (e) {
      try {
        await apiClient.post('/orders', {
          type: 'booking',
          booking: newBooking,
          professionalId: data.professionalId,
          serviceTitle: data.serviceTitle,
          totalAmount: data.totalAmount,
          status: 'pending',
        });
      } catch (e2) {
        console.log('Synced booking locally...');
      }
    }

    // Unshift into live memory MOCK_BOOKINGS so it instantly reflects in memory
    MOCK_BOOKINGS.unshift(newBooking);

    // Trigger instant Expo push notification alert to creator
    notificationService.triggerBookingRequestNotification(data.professionalName, data.serviceTitle, data.totalAmount);

    // Save to persistent AsyncStorage
    const currentStored = await getStoredBookings();
    await saveStoredBookings([newBooking, ...currentStored]);

    return newBooking;
  },

  getCustomerBookings: async (): Promise<Booking[]> => {
    const stored = await getStoredBookings();
    let backendData: Booking[] = [];
    try {
      const res = await apiClient.get('/customer/bookings');
      if (res.data && Array.isArray(res.data.bookings)) {
        backendData = res.data.bookings.map((r: any) => ({
          id: String(r.id || 'BK-' + Math.floor(1000 + Math.random() * 9000)),
          professionalId: r.professional_username || 'mohammad_thaha_hussain_2',
          professionalName: r.professional_name || 'Mohammad Thaha Hussain',
          customerId: r.client_id || 'usr_client',
          customerName: r.client_name || r.client || 'Client Request',
          serviceTitle: r.service || 'Studio Shoot',
          startDate: r.booking_date || r.date || '2026-08-25',
          endDate: r.booking_date || r.date || '2026-08-25',
          daysCount: 1,
          location: r.note || 'Location Details',
          status: (r.status === 'confirmed' ? 'confirmed' : r.status || 'pending') as BookingStatus,
          ratePerDay: Number(r.amount || 20000),
          totalAmount: Number(r.amount || 20000),
          createdAt: r.created_at || new Date().toISOString(),
        }));
      } else if (Array.isArray(res.data)) {
        backendData = res.data;
      }
    } catch (e) {
      try {
        const res2 = await apiClient.get('/orders');
        if (Array.isArray(res2.data)) backendData = res2.data;
      } catch (e2) {}
    }

    // Deduplicate by ID
    const combined = [...backendData, ...stored, ...MOCK_BOOKINGS];
    const unique = Array.from(new Map(combined.map(b => [b.id, b])).values());
    return unique;
  },

  getProfessionalBookings: async (): Promise<Booking[]> => {
    const stored = await getStoredBookings();
    let backendData: Booking[] = [];
    try {
      const res = await apiClient.get('/professional/requests');
      if (res.data && Array.isArray(res.data.requests)) {
        backendData = res.data.requests.map((r: any) => ({
          id: String(r.id || 'BK-' + Math.floor(1000 + Math.random() * 9000)),
          professionalId: r.professional_username || 'mohammad_thaha_hussain_2',
          professionalName: r.professional_name || 'Mohammad Thaha Hussain',
          customerId: r.client_id || 'usr_client',
          customerName: r.client_name || r.client || 'Client Request',
          serviceTitle: r.service || 'Studio Shoot',
          startDate: r.booking_date || r.date || '2026-08-25',
          endDate: r.booking_date || r.date || '2026-08-25',
          daysCount: 1,
          location: r.note || 'Location Details',
          status: (r.status === 'confirmed' ? 'confirmed' : r.status || 'pending') as BookingStatus,
          ratePerDay: Number(r.amount || 20000),
          totalAmount: Number(r.amount || 20000),
          createdAt: r.created_at || new Date().toISOString(),
        }));
      } else if (Array.isArray(res.data)) {
        backendData = res.data;
      }
    } catch (e) {
      try {
        const res2 = await apiClient.get('/professional/orders');
        if (Array.isArray(res2.data)) backendData = res2.data;
      } catch (e2) {}
    }

    // Deduplicate by ID
    const combined = [...backendData, ...stored, ...MOCK_BOOKINGS];
    const unique = Array.from(new Map(combined.map(b => [b.id, b])).values());
    return unique;
  },

  acceptBooking: async (bookingId: string): Promise<Booking> => {
    // Update local memory
    const found = MOCK_BOOKINGS.find(b => b.id === bookingId);
    if (found) found.status = 'accepted';

    // Update persistent storage
    const stored = await getStoredBookings();
    const storedFound = stored.find(b => b.id === bookingId);
    if (storedFound) storedFound.status = 'accepted';
    await saveStoredBookings(stored);

    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status: 'confirmed' });
    } catch (e) {
      try {
        await apiClient.patch(`/orders/${bookingId}/accept`);
      } catch (e2) {}
    }

    return found || storedFound || MOCK_BOOKINGS[0];
  },

  declineBooking: async (bookingId: string): Promise<Booking> => {
    const found = MOCK_BOOKINGS.find(b => b.id === bookingId);
    if (found) found.status = 'cancelled';

    const stored = await getStoredBookings();
    const storedFound = stored.find(b => b.id === bookingId);
    if (storedFound) storedFound.status = 'cancelled';
    await saveStoredBookings(stored);

    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status: 'cancelled' });
    } catch (e) {
      try {
        await apiClient.patch(`/orders/${bookingId}/decline`);
      } catch (e2) {}
    }

    return found || storedFound || MOCK_BOOKINGS[0];
  },

  payAndConfirmBooking: async (bookingId: string): Promise<Booking> => {
    const updateTarget = (b: Booking) => {
      b.status = 'escrow_held';
      if (!b.milestones || b.milestones.length === 0) {
        const tot = b.totalAmount || 20000;
        b.milestones = [
          { id: 'm1', title: 'Advance Escrow (30%)', percentage: 30, amount: Math.round(tot * 0.3), status: 'held' },
          { id: 'm2', title: 'Shoot Wrap Escrow (40%)', percentage: 40, amount: Math.round(tot * 0.4), status: 'held' },
          { id: 'm3', title: 'Final Deliverables Escrow (30%)', percentage: 30, amount: Math.round(tot * 0.3), status: 'held' },
        ];
      }
    };

    const found = MOCK_BOOKINGS.find(b => b.id === bookingId);
    if (found) updateTarget(found);

    const stored = await getStoredBookings();
    const storedFound = stored.find(b => b.id === bookingId);
    if (storedFound) updateTarget(storedFound);
    await saveStoredBookings(stored);

    try {
      await apiClient.post('/payments/checkout', { booking_id: bookingId });
    } catch (e) {
      try {
        await apiClient.post(`/orders/${bookingId}/pay`);
      } catch (e2) {}
    }

    return found || storedFound || MOCK_BOOKINGS[0];
  },

  releaseMilestone: async (bookingId: string, milestoneId: string): Promise<Booking> => {
    const updateTarget = (b: Booking) => {
      if (b.milestones) {
        const m = b.milestones.find(item => item.id === milestoneId);
        if (m) m.status = 'released';
        const allReleased = b.milestones.every(item => item.status === 'released');
        if (allReleased) b.status = 'completed';
      }
    };

    const found = MOCK_BOOKINGS.find(b => b.id === bookingId);
    if (found) updateTarget(found);

    const stored = await getStoredBookings();
    const storedFound = stored.find(b => b.id === bookingId);
    if (storedFound) updateTarget(storedFound);
    await saveStoredBookings(stored);

    try {
      await apiClient.post(`/bookings/${bookingId}/milestones/${milestoneId}/release`);
    } catch (e) {
      // Offline fallback
    }

    return found || storedFound || MOCK_BOOKINGS[0];
  },
};
