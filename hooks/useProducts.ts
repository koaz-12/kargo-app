import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';
import { toast } from 'sonner';

// ============================================
// QUERY HOOKS
// ============================================

export const useProducts = () => {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*, financial_adjustments(*), platform:platforms(*), purchase_account:purchase_accounts(*)')
                .order('created_at', { ascending: false });

            if (error) {
                toast.error('Error al cargar productos');
                throw error;
            }

            // Map relations to expected property names
            return data.map((p: any) => ({
                ...p,
                adjustments: p.financial_adjustments,
            })) as Product[];
        },
    });
};

export interface PaginatedProductsParams {
    page: number;
    itemsPerPage: number;
    searchTerm: string;
    statusFilter: string;
    sortOption: string;
    selectedPlatforms: string[];
    selectedAccounts: string[];
}

export const usePaginatedProducts = (params: PaginatedProductsParams) => {
    return useQuery({
        queryKey: ['products', 'paginated', params],
        queryFn: async () => {
            let query = supabase
                .from('products')
                .select('*, financial_adjustments(*), platform:platforms(*), purchase_account:purchase_accounts(*)', { count: 'exact' });

            if (params.statusFilter !== 'ALL') {
                query = query.eq('status', params.statusFilter);
            }

            if (params.selectedPlatforms.length > 0) {
                query = query.in('platform_id', params.selectedPlatforms);
            }

            if (params.selectedAccounts.length > 0) {
                query = query.in('purchase_account_id', params.selectedAccounts);
            }

            if (params.searchTerm) {
                query = query.or(`name.ilike.%${params.searchTerm}%,sku.ilike.%${params.searchTerm}%,tracking_number.ilike.%${params.searchTerm}%,courier_tracking.ilike.%${params.searchTerm}%`);
            }

            switch (params.sortOption) {
                case 'DATE_ASC':
                    query = query.order('created_at', { ascending: true });
                    break;
                case 'DATE_DESC':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'PRICE_DESC':
                    query = query.order('sale_price', { ascending: false, nullsFirst: false });
                    break;
                case 'PRICE_ASC':
                    query = query.order('sale_price', { ascending: true, nullsFirst: false });
                    break;
                case 'NAME_ASC':
                    query = query.order('name', { ascending: true });
                    break;
                default:
                    query = query.order('created_at', { ascending: false });
            }

            const from = (params.page - 1) * params.itemsPerPage;
            const to = from + params.itemsPerPage - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) {
                toast.error('Error al cargar página de productos');
                throw error;
            }

            const products = data.map((p: any) => ({
                ...p,
                adjustments: p.financial_adjustments,
            })) as Product[];

            return { products, count: count || 0 };
        },
    });
};

export const useProduct = (id: string | undefined) => {
    return useQuery({
        queryKey: ['products', id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('products')
                .select('*, financial_adjustments(*), platform:platforms(*), purchase_account:purchase_accounts(*)')
                .eq('id', id)
                .single();

            if (error) {
                toast.error('Error al cargar producto');
                throw error;
            }

            return {
                ...data,
                adjustments: data.financial_adjustments,
            } as Product;
        },
        enabled: !!id,
    });
};

// ============================================
// MUTATION HOOKS
// ============================================

export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (product: Partial<Product>) => {
            // Get authenticated user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            const { data, error } = await supabase
                .from('products')
                .insert({ ...product, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('✅ Producto creado exitosamente');
        },
        onError: (error: Error) => {
            toast.error('❌ Error al crear producto: ' + error.message);
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
            toast.success('✅ Producto actualizado');
        },
        onError: (error: Error) => {
            toast.error('❌ Error al actualizar: ' + error.message);
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('🗑️ Producto eliminado');
        },
        onError: (error: Error) => {
            toast.error('❌ Error al eliminar: ' + error.message);
        },
    });
};

// ============================================
// PLATFORMS HOOKS
// ============================================

export const usePlatforms = () => {
    return useQuery({
        queryKey: ['platforms'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('platforms')
                .select('*')
                .order('name');

            if (error) {
                toast.error('Error al cargar plataformas');
                throw error;
            }

            return data;
        },
    });
};

export const useCreatePlatform = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (platform: { name: string; type: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            const { data, error } = await supabase
                .from('platforms')
                .insert({ ...platform, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platforms'] });
            toast.success('✅ Plataforma creada');
        },
        onError: (error: Error) => {
            toast.error('❌ Error: ' + error.message);
        },
    });
};

// ============================================
// PURCHASE ACCOUNTS HOOKS
// ============================================

export const usePurchaseAccounts = () => {
    return useQuery({
        queryKey: ['purchase_accounts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('purchase_accounts')
                .select('*')
                .order('name');

            if (error) {
                toast.error('Error al cargar cuentas');
                throw error;
            }

            return data;
        },
    });
};
