import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { Product, ProductType } from '../types/product';
import { MOCK_PRODUCTS } from './mockData';

const STORE_KEY = '@camcrew_user_products';

const mapProduct = (p: any): Product => ({
  id: String(p.id || 'prod_' + Math.random()),
  name: p.name || 'Equipment item',
  brand: p.brand || 'Sony',
  category: p.category || 'Cameras',
  type: (p.type as ProductType) || (p.rental_price_per_day ? 'rental' : 'sale'),
  price: Number(p.price || 0),
  rentalPricePerDay: p.rental_price_per_day ? Number(p.rental_price_per_day) : (p.rentalPricePerDay || 2500),
  condition: p.condition || 'New',
  image: p.image_url || p.image || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800',
  description: p.description || '',
  specs: p.specs || { Resolution: '4K 120p', Sensor: 'Full Frame' },
  inStock: p.in_stock !== undefined ? Boolean(p.in_stock) : true,
  rating: Number(p.rating || 5.0),
});

export const productApi = {
  getUserProducts: async (): Promise<Product[]> => {
    try {
      const stored = await AsyncStorage.getItem(STORE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const newProduct: Product = {
      id: 'prod_' + Date.now(),
      name: productData.name || 'New Studio Gear',
      brand: productData.brand || 'Sony',
      category: productData.category || 'Cameras',
      type: productData.type || 'rental',
      price: productData.price || 50000,
      rentalPricePerDay: productData.rentalPricePerDay || 2500,
      condition: productData.condition || 'Like New',
      image: productData.image || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800',
      description: productData.description || 'Professional cinema gear ready for shoot rentals.',
      specs: productData.specs || { Resolution: '4K 120fps', Condition: 'Verified' },
      inStock: true,
      rating: 5.0,
    };

    try {
      await apiClient.post('/products', newProduct);
    } catch (e) {
      // Persist in local storage
    }

    const current = await productApi.getUserProducts();
    const updated = [newProduct, ...current];
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(updated));
    return newProduct;
  },

  getProducts: async (type?: ProductType, category?: string, searchQuery?: string): Promise<Product[]> => {
    let dbProducts: Product[] = [];
    try {
      const res = await apiClient.get('/products', { params: { type, category, searchQuery } });
      let rawList: any[] = [];
      if (Array.isArray(res.data)) rawList = res.data;
      else if (res.data && Array.isArray(res.data.products)) rawList = res.data.products;
      else if (res.data && Array.isArray(res.data.data)) rawList = res.data.data;

      dbProducts = rawList.map(mapProduct);
    } catch (e) {
      // fallback
    }

    const userProducts = await productApi.getUserProducts();
    let combined = [...userProducts, ...dbProducts, ...MOCK_PRODUCTS];

    // Remove duplicate IDs
    const map = new Map<string, Product>();
    combined.forEach(p => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    let list: Product[] = Array.from(map.values());

    if (type) list = list.filter(p => p.type === type);
    if (category && category !== 'All') {
      const catClean = category.toLowerCase();
      list = list.filter(p => p.category.toLowerCase().includes(catClean));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    return list;
  },

  getProductById: async (id: string): Promise<Product> => {
    const userProducts = await productApi.getUserProducts();
    const userFound = userProducts.find(p => p.id === id);
    if (userFound) return userFound;

    try {
      const res = await apiClient.get(`/products/${id}`);
      const raw = res.data?.product || res.data;
      if (raw) return mapProduct(raw);
      throw new Error('Not found');
    } catch (e) {
      const found = MOCK_PRODUCTS.find(p => p.id === id);
      return found || MOCK_PRODUCTS[0];
    }
  },
};
