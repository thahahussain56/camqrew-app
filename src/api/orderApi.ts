import { apiClient } from './client';
import { Order, CartItem, ShippingAddress } from '../types/order';

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-9821',
    items: [
      {
        product: {
          id: 'prod_1',
          name: 'Sony FX3 Cinema Camera',
          brand: 'Sony',
          category: 'Cameras',
          type: 'rental',
          price: 299900,
          rentalPricePerDay: 2500,
          condition: 'New',
          image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800',
          description: 'Full-frame Cinema Line camera with 4K 120p capability, dual native ISO, and S-Cinetone.',
          specs: { Resolution: '4K 120p', Sensor: 'Full Frame', Mount: 'E-Mount' },
          inStock: true,
          rating: 4.9,
        },
        quantity: 1,
        daysCount: 2,
      },
    ],
    shippingAddress: {
      fullName: 'John Doe',
      phone: '9876543210',
      addressLine1: '123 Main Street',
      state: 'Maharashtra',
      district: 'Mumbai',
      city: 'Mumbai',
      pincode: '400001',
    },
    subtotal: 5000,
    shippingFee: 150,
    tax: 900,
    discount: 0,
    total: 6050,
    status: 'placed',
    createdAt: new Date().toISOString(),
    estimatedDelivery: '3-5 Business Days',
  },
];

export const orderApi = {
  createOrder: async (items: CartItem[], shippingAddress: ShippingAddress, subtotal: number, tax: number, total: number): Promise<Order> => {
    try {
      const res = await apiClient.post('/orders', { items, shippingAddress, subtotal, tax, total });
      return res.data;
    } catch (e) {
      const newOrder: Order = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        items,
        shippingAddress,
        subtotal,
        shippingFee: 150,
        tax,
        discount: 0,
        total,
        status: 'placed',
        createdAt: new Date().toISOString(),
        estimatedDelivery: '3-5 Business Days',
      };
      MOCK_ORDERS.unshift(newOrder);
      return newOrder;
    }
  },

  getOrders: async (): Promise<Order[]> => {
    try {
      const res = await apiClient.get('/orders');
      if (Array.isArray(res.data)) return res.data;
      if (res.data && Array.isArray(res.data.orders)) return res.data.orders;
      if (res.data && Array.isArray(res.data.data)) return res.data.data;
      throw new Error('Not an array');
    } catch (e) {
      return MOCK_ORDERS;
    }
  },
};
