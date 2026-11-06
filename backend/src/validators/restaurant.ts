import { z } from 'zod';

export const etaMinutesSchema = z.object({
  min: z.coerce.number().int().min(1, 'Minimum ETA must be at least 1 minute'),
  max: z.coerce.number().int().min(1, 'Maximum ETA must be at least 1 minute'),
}).refine((data) => data.max >= data.min, {
  message: 'Maximum ETA must be greater than or equal to minimum ETA',
  path: ['max'],
});

export const createRestaurantSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  slug: z.string().trim().toLowerCase().optional(),
  description: z.string().trim().min(5, 'Description must be at least 5 characters').max(1000),
  cuisine: z.string().trim().min(2, 'Cuisine is required'),
  categories: z.array(z.string().trim()).default([]),
  image: z.string().trim().min(1, 'Image is required'),
  address: z.string().trim().min(5, 'Address must be at least 5 characters'),
  phone: z.string().trim().min(5, 'Phone number must be at least 5 characters'),
  deliveryFee: z.coerce.number().min(0, 'Delivery fee cannot be negative'),
  minOrder: z.coerce.number().min(0, 'Minimum order cannot be negative').default(0),
  etaMinutes: etaMinutesSchema,
  isOpen: z.boolean().default(true),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const restaurantStatusSchema = z.object({
  status: z.enum(['approved', 'rejected'] as const),
});

export const restaurantQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  sort: z.enum(['rating', 'deliveryFee', 'eta', 'name', 'newest'] as const).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type RestaurantStatusInput = z.infer<typeof restaurantStatusSchema>;
export type RestaurantQueryInput = z.infer<typeof restaurantQuerySchema>;

