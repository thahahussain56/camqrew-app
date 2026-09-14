import { supabase } from './supabaseClient';
import { ProfessionalProfile } from '../types/professional';

export interface GetStudiosFilter {
  searchQuery?: string;
  location?: string;
}

const mapStudioToProfile = (row: any): ProfessionalProfile => {
  const user = row.users || {};
  const ownerName = user.name || 'Studio Owner';
  const ownerAvatar = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400';
  
  const images = Array.isArray(row.images) && row.images.length > 0 ? row.images : [];
  const banner = images[0] || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200'; // Default studio banner

  return {
    id: String(row.id),
    userId: String(row.owner_id),
    name: row.name || 'Creative Studio',
    title: 'Professional Studio Bay',
    bio: row.description || `A premium studio bay hosted by ${ownerName}. Dimensions: ${row.dimensions || 'N/A'}.`,
    experienceYears: 0,
    avatar: ownerAvatar,
    bannerImage: banner,
    verified: true, // Studios can be marked verified by default or based on owner
    rating: 5.0,
    reviewCount: 0,
    city: 'Mumbai', // Since studio_bays table doesn't explicitly store location, assume mapped to owner or default
    state: 'Maharashtra',
    district: 'Mumbai',
    locations: ['Mumbai'],
    categories: ['Studios'],
    ratePerDay: Number(row.hourly_rate || 1000) * 8, // Convert hourly to approximate daily rate for UI display
    equipment: Array.isArray(row.amenities) ? row.amenities : ['AC', 'Lighting', 'Makeup Room'],
    certifications: ['Verified Studio'],
    portfolio: images, // Map images to portfolio array so they can be viewed
    services: [],
    reviews: [],
    weeklyAvailability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
    blockedDates: [],
  };
};

export const studioApi = {
  getStudios: async (filters: GetStudiosFilter = {}): Promise<ProfessionalProfile[]> => {
    let query = supabase.from('studio_bays').select(`
      *,
      users (
        name,
        avatar
      )
    `);

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching studios:', error);
      return [];
    }

    let results = (data || []).map(mapStudioToProfile);

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      results = results.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.bio.toLowerCase().includes(q)
      );
    }

    return results;
  },

  getStudioById: async (id: string): Promise<ProfessionalProfile> => {
    const { data, error } = await supabase.from('studio_bays').select(`
      *,
      users (
        name,
        avatar
      )
    `).eq('id', id).single();

    if (error || !data) {
      throw new Error(error?.message || 'Studio not found');
    }

    return mapStudioToProfile(data);
  }
};
