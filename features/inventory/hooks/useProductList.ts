import { useState, useEffect, useMemo } from 'react';
import { SortOption, StatusFilter } from '../types';
import { usePaginatedProducts, useDeleteProduct, usePlatforms, usePurchaseAccounts } from '../../../hooks/useProducts';
import { Product } from '../../../types';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useProductList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');

    // Advanced filters
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]); // NEW
    const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Use React Query hooks
    const { data: paginatedData, isLoading, isFetching } = usePaginatedProducts({
        page: currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        searchTerm: debouncedSearchTerm,
        statusFilter,
        sortOption,
        selectedPlatforms,
        selectedAccounts
    });

    // The server handles the filtering and pagination now.
    const products = paginatedData?.products || [];
    const totalItems = paginatedData?.count || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const { data: platforms = [] } = usePlatforms();
    const { data: accounts = [] } = usePurchaseAccounts(); // NEW
    const deleteProductMutation = useDeleteProduct();
    const queryClient = useQueryClient();

    // Mass Actions State
    const [isMassActing, setIsMassActing] = useState(false);

    // Debounce Logic for Search
    useEffect(() => {
        if (searchTerm === '') {
            setDebouncedSearchTerm('');
            setCurrentPage(1);
            return;
        }

        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Setter overrides to automatically reset page to 1
    const handleSetSearchTerm = (val: string) => {
        setSearchTerm(val);
    };

    const handleSetStatusFilter = (val: StatusFilter) => {
        setStatusFilter(val);
        setCurrentPage(1);
    };

    const handleSetSortOption = (val: SortOption) => {
        setSortOption(val);
        setCurrentPage(1);
    };

    const handleSetSelectedPlatforms = (val: string[]) => {
        setSelectedPlatforms(val);
        setCurrentPage(1);
    };

    const handleSetSelectedAccounts = (val: string[]) => {
        setSelectedAccounts(val);
        setCurrentPage(1);
    };

    // Platform options for multi-select
    const platformOptions = useMemo(() =>
        platforms.map(p => ({
            value: p.id,
            label: p.name
        }))
        , [platforms]);

    // Account options for multi-select
    const accountOptions = useMemo(() =>
        accounts.map(a => ({
            value: a.id,
            label: a.name
        }))
        , [accounts]);

    // We apply client-side filtering ONLY for the tricky 'Price Range' that relies on calculated fields.
    // Note: This only filters the CURRENT page. Full database price filtering requires SQL redesign.
    const paginatedProducts = useMemo(() => {
        let filtered = [...products];

        if (priceRange.min > 0 || priceRange.max < Infinity) {
            filtered = filtered.filter(p => {
                const price = p.sale_price || p.net_cost || 0;
                return price >= priceRange.min && price <= priceRange.max;
            });
        }

        return filtered;
    }, [products, priceRange]);

    const handleDelete = async (id: string) => {
        deleteProductMutation.mutate(id);
    };

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, debouncedSearchTerm, sortOption, selectedPlatforms, selectedAccounts]);

    // ==========================================
    // MASS ACTIONS
    // ==========================================
    const handleMassUpdateStatus = async (productIds: string[], newStatus: 'ORDERED' | 'RECEIVED' | 'SOLD') => {
        if (!productIds.length) return;
        setIsMassActing(true);
        try {
            const updatePayload: any = { status: newStatus };
            if (newStatus === 'SOLD') {
                updatePayload.sold_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('products')
                .update(updatePayload)
                .in('id', productIds);

            if (error) throw error;
            toast.success(`✅ ${productIds.length} productos marcados como ${newStatus}`);
            queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error: any) {
            console.error('Error mass updating status:', error);
            toast.error('❌ Error al actualizar productos masivamente');
        } finally {
            setIsMassActing(false);
        }
    };

    const handleMassDelete = async (productIds: string[]) => {
        if (!productIds.length) return;
        setIsMassActing(true);
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .in('id', productIds);

            if (error) throw error;
            toast.success(`✅ ${productIds.length} productos eliminados`);
            queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error: any) {
            console.error('Error mass deleting:', error);
            toast.error('❌ Error al eliminar productos masivamente');
        } finally {
            setIsMassActing(false);
        }
    };

    const handleMassGenerateSKU = async (productIds: string[]) => {
        if (!productIds.length) return;
        
        const skuToApply = window.prompt('Pega o escribe el SKU que deseas asignar a los artículos seleccionados:');
        if (!skuToApply || !skuToApply.trim()) return; // Canceló o dejó vacío
        
        setIsMassActing(true);
        let updatedCount = 0;

        try {
            // Actualizar todos los productos seleccionados con este SKU
            const productsToUpdate = products.filter(p => productIds.includes(p.id));

            if (productsToUpdate.length === 0) {
                setIsMassActing(false);
                return;
            }

            const updates = productsToUpdate.map(p => ({
                id: p.id,
                sku: skuToApply.trim()
            }));

            // Update in DB
            for (const update of updates) {
                const { error } = await supabase
                    .from('products')
                    .update({ sku: update.sku })
                    .eq('id', update.id);
                if (!error) updatedCount++;
            }

            toast.success(`🪄 ${updatedCount} SKUs generados correctamente`);
            queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error: any) {
            console.error('Error mass generating SKUs:', error);
            toast.error('❌ Error al generar SKUs masivamente');
        } finally {
            setIsMassActing(false);
        }
    };

    return {
        products: paginatedProducts,
        isLoading,
        isFetching,
        searchTerm, setSearchTerm: handleSetSearchTerm,
        statusFilter, setStatusFilter: handleSetStatusFilter,
        sortOption, setSortOption: handleSetSortOption,
        handleDelete,
        itemsPerPage: ITEMS_PER_PAGE,
        handleMassUpdateStatus,
        handleMassGenerateSKU,
        handleMassDelete,
        isMassActing,
        // Advanced filters
        selectedPlatforms,
        setSelectedPlatforms: handleSetSelectedPlatforms,
        platformOptions,
        selectedAccounts,
        setSelectedAccounts: handleSetSelectedAccounts,
        accountOptions,
        priceRange,
        setPriceRange,
        // Pagination
        currentPage,
        setCurrentPage,
        totalItems,
        itemsPerPage: ITEMS_PER_PAGE,
        totalPages,
    };
}
