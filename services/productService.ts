import { supabase } from '../lib/supabaseClient';
import { Product, ProductStatus } from '../types';

export const productService = {
    /**
     * Fetch all products ordered by creation date
     */
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Product[];
    },

    /**
     * Get a single product by ID with its adjustments and images
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*, financial_adjustments(*), product_images(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new product (and optionally its adjustments/images)
     * Note: Complex transactions might need RPC or sequential calls
     */
    async create(productData: Partial<Product>) {
        // Strip out non-DB fields or handle relations separately if needed
        // For basic insertion:
        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) throw error;
        return data as Product;
    },

    /**
     * Update an existing product
     */
    async update(id: string, updates: Partial<Product>) {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Product;
    },

    /**
     * Delete a product
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
