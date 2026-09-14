import { useCartStore } from '../cartStore';

describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('should start with an empty cart', () => {
    expect(useCartStore.getState().items.length).toBe(0);
    expect(useCartStore.getState().getTotal()).toBe(0);
  });

  it('should add items to the cart', () => {
    const { addItem } = useCartStore.getState();
    
    addItem({ id: 'gear_1', name: 'Sony A7S III', price: 15000 } as any, 1);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].product.name).toBe('Sony A7S III');
  });

  it('should calculate subtotal correctly', () => {
    const { addItem } = useCartStore.getState();
    
    addItem({ id: 'gear_1', name: 'Sony A7S III', price: 15000 } as any, 1);
    addItem({ id: 'gear_2', name: 'Extra Battery', price: 1000 } as any, 2);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(2);
    // Subtotal should be 15000 + (1000 * 2) = 17000
    expect(state.getSubtotal()).toBe(17000);
  });
});
