import { z } from 'zod';

export const productSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(200, 'Nombre muy largo'),
    platform_id: z.string().uuid('Plataforma inválida'),
    purchase_account_id: z.string().uuid().optional(),
    storage_location_id: z.string().uuid().optional(),
    buy_price: z.number().min(0, 'El precio debe ser positivo').default(0),
    shipping_cost: z.number().min(0, 'El costo de envío debe ser positivo').default(0),
    origin_tax: z.number().min(0, 'El tax debe ser positivo').default(0),
    tax_cost: z.number().min(0, 'El costo aduanal debe ser positivo').default(0),
    sale_price: z.number().min(0, 'El precio de venta debe ser positivo').optional(),
    local_shipping_cost: z.number().min(0, 'El envío local debe ser positivo').default(0),
    exchange_rate: z.number().min(0, 'La tasa debe ser positiva').default(58),
    status: z.enum(['DRAFT', 'ORDERED', 'RECEIVED', 'SOLD']).default('ORDERED'),
    sku: z.string().optional(),
    product_url: z.string().url('URL inválida').optional().or(z.literal('')),
    image_url: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
    tracking_number: z.string().optional(),
    courier_tracking: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

export const financialAdjustmentSchema = z.object({
    product_id: z.string().uuid(),
    type: z.enum(['CREDIT_CLAIM', 'REWARD_BACK', 'PRICE_ADJUSTMENT', 'COUPON', 'PRICE_PROTECTION', 'OTHER']),
    amount: z.number(),
    percentage: z.number().min(0).max(100).optional(),
    description: z.string().optional(),
    date: z.string().optional(),
});

export type FinancialAdjustmentInput = z.infer<typeof financialAdjustmentSchema>;

export const platformSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    type: z.enum(['TEMU', 'AMAZON', 'ALIEXPRESS', 'SHEIN', 'OTHER']),
    fee_structure_type: z.string().default('STANDARD'),
});

export type PlatformInput = z.infer<typeof platformSchema>;
