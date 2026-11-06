// Mirrors the backend unions (backend/src/types). Stage 15 replaces these
// with types shared from the API client so they can never drift apart.
export type Role = 'customer' | 'owner' | 'admin';
export type PaymentMethod = 'cod' | 'card' | 'jazzcash' | 'easypaisa';

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  image: string;
  rating: number;
  reviewCount: number;
  etaMinutes: readonly [number, number];
  deliveryFee: number;
  categories: readonly string[];
  tag?: string;
}

export interface Category {
  id: string;
  label: string;
}

export interface PaymentMethodInfo {
  id: PaymentMethod;
  title: string;
  description: string;
  icon: string;
  note?: string;
}

export interface NavItem {
  to: string;
  label: string;
}
