import { z } from 'zod';

export const ItemCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  sku: z.string().min(1, 'SKU is required').max(50).toUpperCase(),
  category: z.string().min(1, 'Category is required').max(100),
  quantity: z.number().int().min(0, 'Quantity cannot be negative').default(0),
  unit_price: z.number().positive('Price must be positive'),
  supplier: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  low_stock_threshold: z.number().int().min(0).default(10),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
});

export const ItemUpdateSchema = ItemCreateSchema.partial();

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'discontinued', '']).optional(),
  sort: z.enum(['name', 'sku', 'category', 'quantity', 'unit_price', 'created_at', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  lowStock: z.coerce.boolean().optional(),
});

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type ItemCreate = z.infer<typeof ItemCreateSchema>;
export type ItemUpdate = z.infer<typeof ItemUpdateSchema>;
export type PaginationQuery = z.infer<typeof PaginationSchema>;
