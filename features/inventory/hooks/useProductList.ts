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
    const { data: paginatedData, isLoading: loading } = usePaginatedProducts({
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

    // Debounce Logic
    useEffect(() => {
        if (searchTerm === '') {
            setDebouncedSearchTerm('');
            return;
        }

        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

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

    const handleMassGenerateSKU = async (productIds: string[]) => {
        if (!productIds.length) return;
        setIsMassActing(true);
        let updatedCount = 0;

        try {
            // Only generate SKU for products that don't have one
            const productsToUpdate = products.filter(p => productIds.includes(p.id) && !p.sku);

            if (productsToUpdate.length === 0) {
                toast.info('ℹ️ Todos los productos seleccionados ya tienen SKU.');
                setIsMassActing(false);
                return;
            }

            // We must do this sequentially or in a Promise.all mapped to ensure unique random digits 
            // and avoid duplicate constraints where possible.
            const updates = productsToUpdate.map(p => {
                let finalSku = '';
                if (p.name) {
                    const ignoreWords = ['DE', 'LA', 'EL', 'LOS', 'LAS', 'Y', 'A', 'CON', 'EN', 'POR', 'PARA'];
                    const words = p.name.trim().split(/\s+/).filter(w => w.length > 0 && !ignoreWords.includes(w.toUpperCase()));

                    if (words.length >= 3) {
                        const marca = words[0].substring(0, 4).toUpperCase();
                        const variante = words[words.length - 1].substring(0, 4).toUpperCase();
                        const middleWords = words.slice(1, words.length - 1);
                        let modelo = '';
                        if (middleWords.length === 1) {
                            modelo = middleWords[0].substring(0, 5).toUpperCase();
                        } else {
                            modelo = middleWords.map(w => w[0]).join('').substring(0, 4).toUpperCase();
                        }
                        finalSku = `${marca}-${modelo}-${variante}`;
                    } else if (words.length === 2) {
                        const marca = words[0].substring(0, 4).toUpperCase();
                        const modelo = words[1].substring(0, 5).toUpperCase();
                        const randomNum = Math.random().toString(36).substring(2, 5).toUpperCase();
                        finalSku = `${marca}-${modelo}-${randomNum}`;
                    } else if (words.length === 1) {
                        const marca = words[0].substring(0, 5).toUpperCase();
                        const randomNum = Math.random().toString(36).substring(2, 6).toUpperCase();
                        finalSku = `${marca}-${randomNum}`;
                    }
                }
                if (!finalSku) {
                    const randomNum = Math.random().toString(36).substring(2, 6).toUpperCase();
                    finalSku = `PRD-${randomNum}`;
                }

                return { id: p.id, sku: finalSku };
            });

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
        loading,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        sortOption, setSortOption,
        handleDelete,
        handleMassUpdateStatus,
        handleMassGenerateSKU,
        isMassActing,
        // Advanced filters
        selectedPlatforms,
        setSelectedPlatforms,
        platformOptions,
        selectedAccounts, // NEW
        setSelectedAccounts, // NEW
        accountOptions, // NEW
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
