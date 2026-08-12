import { apiClient } from './client';
import { ProfessionalProfile } from '../types/professional';
import { MOCK_PROFESSIONALS } from './mockData';

export interface GetProfessionalsFilter {
  category?: string;
  location?: string;
  minRate?: number;
  maxRate?: number;
  rating?: number;
  searchQuery?: string;
}

const API_CATEGORIES = ['Photographers', 'Videographers', 'Designers', 'Developers', 'Caterers'];

const mapPro = (p: any): ProfessionalProfile => {
  let rateNum = 15000;
  if (p.rate) {
    const match = String(p.rate).match(/[\d,]+/);
    if (match) {
      rateNum = Number(match[0].replace(/,/g, ''));
    }
  } else if (p.rate_per_day || p.ratePerDay) {
    rateNum = Number(p.rate_per_day || p.ratePerDay);
  }

  let city = 'Mumbai';
  let state = 'Maharashtra';
  if (p.location && typeof p.location === 'string') {
    const parts = p.location.split(',').map((s: string) => s.trim());
    if (parts.length >= 2) {
      city = parts[0];
      state = parts[1];
    } else if (parts.length === 1 && parts[0]) {
      city = parts[0];
    }
  } else {
    if (p.city) city = p.city;
    if (p.state) state = p.state;
  }

  const avatar =
    p.avatarUrl ||
    p.avatar_url ||
    p.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400';

  const banner =
    p.bannerUrl ||
    p.banner_url ||
    p.bannerImage ||
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200';

  const name = p.display_name || p.name || p.username || 'Creative Studio';

  return {
    id: String(p.id || p.username || 'pro_' + Math.random()),
    userId: String(p.user_id || p.userId || 'usr_' + Math.random()),
    name,
    title: p.title || (Array.isArray(p.categories) ? p.categories.join(' • ') : 'Creative Creator'),
    bio: p.bio || `${name} is a verified creative professional on Camcrew Studio.`,
    experienceYears: Number(p.experience_years || p.experienceYears || 5),
    avatar,
    bannerImage: banner,
    verified: p.verified !== undefined ? Boolean(p.verified) : true,
    rating: Number(p.rating || 4.9),
    reviewCount: Number(p.review_count || p.reviewCount || 18),
    city,
    state,
    district: p.district || city,
    locations: Array.isArray(p.locations) ? p.locations : [city],
    categories: Array.isArray(p.categories) && p.categories.length > 0 ? p.categories : ['Photographers'],
    ratePerDay: rateNum,
    equipment: Array.isArray(p.equipment) ? p.equipment : ['Cinema Camera', 'Prime Lenses', 'Lighting Rig'],
    certifications: Array.isArray(p.certifications) ? p.certifications : ['Camcrew Verified Creator'],
    portfolio: Array.isArray(p.portfolio) && p.portfolio.length > 0 ? p.portfolio : [
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800'
    ],
    services: Array.isArray(p.services) ? p.services.map((s: any) => ({
      id: String(s.id || Math.random()),
      title: s.name || s.title || 'Studio Package',
      category: s.category || 'Photography',
      rate: Number(s.price || s.rate || 2000),
      unit: s.unit || 'per day',
      description: s.desc || s.description || ''
    })) : [],
    reviews: Array.isArray(p.reviews) ? p.reviews : [],
    weeklyAvailability: p.weeklyAvailability || { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
    blockedDates: Array.isArray(p.blockedDates) ? p.blockedDates : [],
  };
};

export const professionalApi = {
  getProfessionals: async (filters: GetProfessionalsFilter = {}): Promise<ProfessionalProfile[]> => {
    try {
      const selectedCategory = filters.category && filters.category !== 'All' ? filters.category : null;
      let rawList: any[] = [];

      if (selectedCategory) {
        const res = await apiClient.get('/professionals', { params: { category: selectedCategory } });
        if (Array.isArray(res.data)) rawList = res.data;
        else if (res.data && Array.isArray(res.data.professionals)) rawList = res.data.professionals;
      } else {
        // Fetch all backend categories concurrently
        const responses = await Promise.allSettled(
          API_CATEGORIES.map(cat => apiClient.get('/professionals', { params: { category: cat } }))
        );
        const seenUsernames = new Set<string>();

        responses.forEach(r => {
          if (r.status === 'fulfilled' && r.value.data) {
            const list = Array.isArray(r.value.data) ? r.value.data : r.value.data.professionals || [];
            list.forEach((p: any) => {
              const key = p.username || p.display_name || p.id;
              if (key && !seenUsernames.has(key)) {
                seenUsernames.add(key);
                rawList.push(p);
              }
            });
          }
        });
      }

      if (rawList.length > 0) return rawList.map(mapPro);
      return MOCK_PROFESSIONALS;
    } catch (e) {
      let list = [...MOCK_PROFESSIONALS];
      if (filters.category && filters.category !== 'All') {
        const catClean = filters.category.toLowerCase();
        list = list.filter(p => p.categories.some(c => c.toLowerCase().includes(catClean)));
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.city.toLowerCase().includes(q));
      }
      return list;
    }
  },

  getProfileById: async (id: string): Promise<ProfessionalProfile> => {
    try {
      const allPros = await professionalApi.getProfessionals();
      if (allPros && allPros.length > 0) {
        const targetId = String(id || '').toLowerCase();
        const found = allPros.find(
          p =>
            String(p.id).toLowerCase() === targetId ||
            String(p.name).toLowerCase() === targetId ||
            String(p.userId).toLowerCase() === targetId
        );
        if (found) return found;
        return allPros[0];
      }
      return MOCK_PROFESSIONALS[0];
    } catch (e) {
      const found = MOCK_PROFESSIONALS.find(p => p.id === id);
      return found || MOCK_PROFESSIONALS[0];
    }
  },

  updateProfile: async (data: Partial<ProfessionalProfile>): Promise<ProfessionalProfile> => {
    try {
      const res = await apiClient.patch('/profile', data);
      return res.data;
    } catch (e) {
      return { ...MOCK_PROFESSIONALS[0], ...data };
    }
  },
};
