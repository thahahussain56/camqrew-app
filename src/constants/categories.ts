export interface CategoryMeta {
  id: string;
  name: string;
  icon: string;
  description: string;
  bgGradient: [string, string];
}

export const PROFESSIONAL_CATEGORIES: CategoryMeta[] = [
  {
    id: 'photographers',
    name: 'Photographers',
    icon: 'camera',
    description: 'Portrait, Wedding, Commercial & Fashion Photography',
    bgGradient: ['#ff416c', '#ff4b2b'],
  },
  {
    id: 'videographers',
    name: 'Videographers',
    icon: 'video',
    description: 'Cinematography, Events, Reels & Documentaries',
    bgGradient: ['#8a2387', '#e94057'],
  },
  {
    id: 'designers',
    name: 'Designers',
    icon: 'palette',
    description: 'UI/UX, Brand Identity, Motion Graphics & 3D',
    bgGradient: ['#4776e6', '#8e54e9'],
  },
  {
    id: 'developers',
    name: 'Developers',
    icon: 'code',
    description: 'Mobile Apps, Web Platforms & Custom Integrations',
    bgGradient: ['#11998e', '#38ef7d'],
  },
  {
    id: 'organisers',
    name: 'Organisers',
    icon: 'calendar',
    description: 'Event Planning, Stage Direction & Logistics',
    bgGradient: ['#f857a6', '#ff5858'],
  },
  {
    id: 'caterers',
    name: 'Caterers',
    icon: 'coffee',
    description: 'Gourmet Catering, Private Chefs & Food Styling',
    bgGradient: ['#ff9966', '#ff5e62'],
  },
];

export const GEAR_CATEGORIES = [
  'All',
  'Camera Bodies',
  'Lenses',
  'Lighting',
  'Audio Gear',
  'Drones & Gimbals',
  'Tripods & Rigging',
  'Accessories',
];

export const PRICING_UNITS = [
  'per day',
  'per hour',
  'per project',
  'per event',
  'custom',
];
