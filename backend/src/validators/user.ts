import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().optional(),
}).refine((data) => data.name !== undefined || data.phone !== undefined, {
  message: 'At least one field (name or phone) must be provided',
});

export const createAddressSchema = z.object({
  label: z.string().trim().min(1, 'Address label is required').max(50),
  line1: z.string().trim().min(3, 'Address line 1 must be at least 3 characters').max(200),
  city: z.string().trim().min(2, 'City must be at least 2 characters').max(100),
  notes: z.string().trim().max(200).optional(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password cannot exceed 128 characters'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

