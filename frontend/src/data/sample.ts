import type { Category, PaymentMethodInfo, Restaurant } from '../types';

// Static placeholder data for the design foundation. Stage 17 swaps this
// for real data from the API.
const img = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;

export const categories: Category[] = [
  { id: 'all', label: 'All' },
  { id: 'burgers', label: 'Burgers' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'desi', label: 'Desi' },
  { id: 'bbq', label: 'BBQ' },
  { id: 'healthy', label: 'Healthy' },
  { id: 'dessert', label: 'Dessert' },
];

export const restaurants: Restaurant[] = [
  { id: 'burger-forge', name: 'Burger Forge', cuisine: 'Smash burgers, fries', image: img('photo-1568901346375-23c9450c58cd'), rating: 4.8, reviewCount: 312, etaMinutes: [20, 30], deliveryFee: 99, categories: ['burgers'], tag: 'Popular' },
  { id: 'pizza-pit', name: 'Pizza Pit', cuisine: 'Wood-fired pizza', image: img('photo-1565299624946-b28f40a0ae38'), rating: 4.6, reviewCount: 208, etaMinutes: [25, 40], deliveryFee: 129, categories: ['pizza'] },
  { id: 'tandoor-co', name: 'Tandoor & Co.', cuisine: 'Karahi, naan, biryani', image: img('photo-1504674900247-0877df9cc836'), rating: 4.9, reviewCount: 540, etaMinutes: [30, 45], deliveryFee: 79, categories: ['desi', 'bbq'], tag: 'Top rated' },
  { id: 'green-bowl', name: 'Green Bowl', cuisine: 'Salads, grain bowls', image: img('photo-1546069901-ba9599a7e63c'), rating: 4.5, reviewCount: 127, etaMinutes: [15, 25], deliveryFee: 89, categories: ['healthy'] },
  { id: 'smokehouse', name: 'Smokehouse BBQ', cuisine: 'Grills and skewers', image: img('photo-1555939594-58d7cb561ad1'), rating: 4.7, reviewCount: 266, etaMinutes: [30, 45], deliveryFee: 109, categories: ['bbq', 'desi'] },
  { id: 'sweet-tooth', name: 'Sweet Tooth', cuisine: 'Cakes, shakes, waffles', image: img('photo-1482049016688-2d3e1b311543'), rating: 4.4, reviewCount: 98, etaMinutes: [20, 35], deliveryFee: 69, categories: ['dessert'], tag: 'New' },
];

export const paymentMethods: PaymentMethodInfo[] = [
  { id: 'cod', title: 'Cash on delivery', description: 'Pay the rider when your food arrives.', icon: 'COD' },
  { id: 'card', title: 'Debit / credit card', description: 'Secure card payment.', icon: 'CARD', note: 'Test mode' },
  { id: 'jazzcash', title: 'JazzCash', description: 'Pay from your mobile wallet.', icon: 'JC', note: 'Demo' },
  { id: 'easypaisa', title: 'Easypaisa', description: 'Pay from your mobile wallet.', icon: 'EP', note: 'Demo' },
];

export const howItWorks = [
  { title: 'Pick a place', text: 'Browse restaurants by cuisine, rating, and delivery time.' },
  { title: 'Build your order', text: 'Add dishes to one cart and tweak quantities any time.' },
  { title: 'Choose how to pay', text: 'Cash, card, or a mobile wallet. Your call at checkout.' },
  { title: 'Track it live', text: 'Watch your order move from kitchen to your door.' },
] as const;
