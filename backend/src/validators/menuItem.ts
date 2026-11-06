import { z } from 'zod';

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().trim().min(5, 'Description must be at least 5 characters').max(1000),
  price: z.coerce.number().int('Price must be an integer (in rupees)').min(0, 'Price cannot be negative'),
  image: z.string().trim().min(1, 'Image is required'),
  section: z.string().trim().min(2, 'Section must be at least 2 characters').max(60),
  isAvailable: z.boolean().default(true),
  isVeg: z.boolean().default(false),
  prepTimeMinutes: z.coerce.number().int().min(1).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const availabilityToggleSchema = z.object({
  isAvailable: z.boolean().optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type AvailabilityToggleInput = z.infer<typeof availabilityToggleSchema>;

