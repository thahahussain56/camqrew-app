export type ProductType = 'sale' | 'rental';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  type: ProductType;
  price: number;
  rentalPricePerDay?: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  image: string;
  gallery?: string[];
  description: string;
  specs?: { [key: string]: string };
  inStock: boolean;
  rating: number;
}
