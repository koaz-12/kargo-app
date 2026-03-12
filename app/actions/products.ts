'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { productSchema } from '@/lib/validations/product';
import { z } from 'zod';

// ============================================
// TYPES
// ============================================

type ActionResult<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    errors?: Record<string, string[]>;
};

// ============================================
// PRODUCT ACTIONS
// ============================================

export async function createProductAction(
    formData: FormData
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'No autenticado' };
        }

        // Parse and validate form data
        const rawData = {
            name: formData.get('name'),
            platform_id: formData.get('platform_id'),
            purchase_account_id: formData.get('purchase_account_id') || undefined,
            storage_location_id: formData.get('storage_location_id') || undefined,
            buy_price: parseFloat(formData.get('buy_price') as string) || 0,
            shipping_cost: parseFloat(formData.get('shipping_cost') as string) || 0,
            origin_tax: parseFloat(formData.get('origin_tax') as string) || 0,
            tax_cost: parseFloat(formData.get('tax_cost') as string) || 0,
            sale_price: formData.get('sale_price') ? parseFloat(formData.get('sale_price') as string) : undefined,
            local_shipping_cost: parseFloat(formData.get('local_shipping_cost') as string) || 0,
            exchange_rate: parseFloat(formData.get('exchange_rate') as string) || 58,
            status: formData.get('status') || 'ORDERED',
            sku: formData.get('sku') || undefined,
            product_url: formData.get('product_url') || undefined,
            image_url: formData.get('image_url') || undefined,
            tracking_number: formData.get('tracking_number') || undefined,
            courier_tracking: formData.get('courier_tracking') || undefined,
        };

        // Validate with Zod
        const validatedData = productSchema.parse(rawData);

        // Insert into database
        const { data, error } = await supabase
            .from('products')
            .insert({
                ...validatedData,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return {
                success: false,
                error: 'Error al crear producto en la base de datos'
            };
        }

        // Revalidate pages that show products
        revalidatePath('/');
        revalidatePath('/inventory');

        return { success: true, data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Return validation errors
            const fieldErrors: Record<string, string[]> = {};
            error.errors.forEach(err => {
                const path = err.path.join('.');
                if (!fieldErrors[path]) {
                    fieldErrors[path] = [];
                }
                fieldErrors[path].push(err.message);
            });
            return {
                success: false,
                error: 'Errores de validación',
                errors: fieldErrors
            };
        }

        console.error('Unexpected error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error inesperado'
        };
    }
}

export async function updateProductAction(
    productId: string,
    formData: FormData
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'No autenticado' };
        }

        // Parse form data
        const updates: any = {};

        // Only include fields that were provided
        const fields = [
            'name', 'platform_id', 'purchase_account_id', 'storage_location_id', 'buy_price',
            'shipping_cost', 'origin_tax', 'tax_cost', 'sale_price',
            'local_shipping_cost', 'exchange_rate', 'status', 'sku',
            'product_url', 'image_url', 'tracking_number', 'courier_tracking'
        ];

        fields.forEach(field => {
            const value = formData.get(field);
            if (value !== null) {
                if (['buy_price', 'shipping_cost', 'origin_tax', 'tax_cost', 'sale_price', 'local_shipping_cost', 'exchange_rate'].includes(field)) {
                    updates[field] = parseFloat(value as string);
                } else {
                    updates[field] = value;
                }
            }
        });

        // Update in database (RLS will ensure user owns this product)
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return {
                success: false,
                error: error.message || 'Error al actualizar producto'
            };
        }

        // Revalidate pages
        revalidatePath('/');
        revalidatePath('/inventory');
        revalidatePath('/stats');

        return { success: true, data };
    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error inesperado'
        };
    }
}

export async function deleteProductAction(
    productId: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'No autenticado' };
        }

        // Delete (RLS ensures user owns this)
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            console.error('Database error:', error);
            return {
                success: false,
                error: 'Error al eliminar producto'
            };
        }

        // Revalidate
        revalidatePath('/');
        revalidatePath('/inventory');

        return { success: true };
    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error inesperado'
        };
    }
}

// ============================================
// PLATFORM ACTIONS
// ============================================

export async function createPlatformAction(
    formData: FormData
): Promise<ActionResult> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'No autenticado' };
        }

        const name = formData.get('name') as string;
        const type = formData.get('type') as string;

        const { data, error } = await supabase
            .from('platforms')
            .insert({
                name,
                type,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: 'Error al crear plataforma' };
        }

        revalidatePath('/calculator');

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error inesperado'
        };
    }
}
