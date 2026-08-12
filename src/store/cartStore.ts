import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../types/order';
import { Product } from '../types/product';

interface CartStoreState {
  items: CartItem[];
  promoCode: string;
  discountPercentage: number;
  addItem: (product: Product, quantity?: number, startDate?: string, endDate?: string, daysCount?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyPromoCode: (code: string) => boolean;
  clearCart: () => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStoreState>((set, get) => ({
  items: [],
  promoCode: '',
  discountPercentage: 0,

  addItem: (product, quantity = 1, startDate, endDate, daysCount = 1) => {
    const items = [...get().items];
    const existingIndex = items.findIndex(i => i.product.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
      if (startDate) items[existingIndex].startDate = startDate;
      if (endDate) items[existingIndex].endDate = endDate;
      if (daysCount) items[existingIndex].daysCount = daysCount;
    } else {
      items.push({ product, quantity, startDate, endDate, daysCount });
    }

    set({ items });
    AsyncStorage.setItem('@camcrew_cart', JSON.stringify(items));
  },

  removeItem: (productId) => {
    const items = get().items.filter(i => i.product.id !== productId);
    set({ items });
    AsyncStorage.setItem('@camcrew_cart', JSON.stringify(items));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const items = get().items.map(i => i.product.id === productId ? { ...i, quantity } : i);
    set({ items });
    AsyncStorage.setItem('@camcrew_cart', JSON.stringify(items));
  },

  applyPromoCode: (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'CAMCREW10') {
      set({ promoCode: cleanCode, discountPercentage: 10 });
      return true;
    } else if (cleanCode === 'PROPROMO20') {
      set({ promoCode: cleanCode, discountPercentage: 20 });
      return true;
    }
    return false;
  },

  clearCart: () => {
    set({ items: [], promoCode: '', discountPercentage: 0 });
    AsyncStorage.removeItem('@camcrew_cart');
  },

  getSubtotal: () => {
    return get().items.reduce((acc, item) => {
      if (item.product.type === 'rental') {
        const dailyRate = item.product.rentalPricePerDay || item.product.price;
        const days = item.daysCount || 1;
        return acc + (dailyRate * days * item.quantity);
      }
      return acc + (item.product.price * item.quantity);
    }, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    return (subtotal * get().discountPercentage) / 100;
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    return Math.round((subtotal - discount) * 0.18); // 18% GST in India
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const tax = get().getTaxAmount();
    const shipping = subtotal > 0 ? 150 : 0;
    return subtotal - discount + tax + shipping;
  },
}));
