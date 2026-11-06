// Single source of truth for domain unions. Using `as const` arrays means
// the runtime list (for validation / Mongoose enums) and the compile-time
// type are derived from the same place and can never drift apart.

export const ROLES = ['customer', 'owner', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['cod', 'card', 'jazzcash', 'easypaisa'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const RESTAURANT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type RestaurantStatus = (typeof RESTAURANT_STATUSES)[number];


// ---- API contract -------------------------------------------------------
// Every endpoint answers with ApiResponse<T>. Clients can narrow on
// `success` and get fully typed data or a typed error.

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---- User & Address DTOs ----------------------------------------------------

export interface UserAddress {
  id: string;
  _id?: string;
  label: string;
  line1: string;
  city: string;
  notes?: string;
  isDefault: boolean;
}

export interface PublicUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  isActive: boolean;
  addresses: UserAddress[];
  createdAt: string;
  updatedAt: string;
}

// ---- Restaurant DTO ---------------------------------------------------------

export interface RestaurantEtaMinutes {
  min: number;
  max: number;
}

export interface RestaurantDTO {
  id: string;
  _id?: string;
  owner: string;
  name: string;
  slug: string;
  description: string;
  cuisine: string;
  categories: string[];
  image: string;
  address: string;
  phone: string;
  deliveryFee: number;
  minOrder: number;
  etaMinutes: RestaurantEtaMinutes;
  isOpen: boolean;
  status: RestaurantStatus;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Menu Item DTO ----------------------------------------------------------

export interface MenuItemDTO {
  id: string;
  _id?: string;
  restaurant: string;
  name: string;
  description: string;
  price: number; // integer rupees
  image: string;
  section: string;
  isAvailable: boolean;
  isVeg: boolean;
  prepTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuSection {
  section: string;
  items: MenuItemDTO[];
}



