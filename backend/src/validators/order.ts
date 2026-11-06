import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../types';

export const orderItemInputSchema = z.object({
  menuItem: z.string().trim().min(1, 'MenuItem ID is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

export const deliveryAddressInputSchema = z.object({
  label: z.string().trim().min(1, 'Address label is required'),
  line1: z.string().trim().min(3, 'Address line 1 is required'),
  city: z.string().trim().min(2, 'City is required'),
  notes: z.string().trim().optional(),
});

export const createOrderSchema = z.object({
  restaurant: z.string().trim().min(1, 'Restaurant ID is required'),
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
  deliveryAddress: deliveryAddressInputSchema,
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: z.string().trim().max(500).optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const orderQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;

