import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { InventoryItem, SortOption, StatusFilter } from '../types';

export function useProductList() {
    const [products, setProducts] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');

    // Pagination
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 20;

    const fetchProducts = async (pageIndex: number, isReset = false) => {
        try {
            const start = pageIndex * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('products')
                .select('*, financial_adjustments(*)', { count: 'exact' });

            // Apply Filters
            if (statusFilter !== 'ALL') {
                query = query.eq('status', statusFilter);
            }
            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
            }

            // Sorting
            switch (sortOption) {
                case 'DATE_ASC': query = query.order('created_at', { ascending: true }); break;
                case 'PRICE_DESC': query = query.order('sale_price', { ascending: false }); break;
                case 'PRICE_ASC': query = query.order('sale_price', { ascending: true }); break;
                case 'NAME_ASC': query = query.order('name', { ascending: true }); break;
                default: query = query.order('created_at', { ascending: false });
            }

            query = query.range(start, end);

            const { data, error } = await query;
            if (error) throw error;

            if (data) {
                setProducts(prev => isReset ? data : [...prev, ...data]);
                setHasMore(data.length === ITEMS_PER_PAGE);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reset when filters change
    useEffect(() => {
        setProducts([]);
        setPage(0);
        setHasMore(true);
        setLoading(true);
        fetchProducts(0, true);
    }, [searchTerm, statusFilter, sortOption]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            alert('Error al eliminar');
            console.error(error);
        }
    };

    return {
        products,
        loading,
        hasMore,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        sortOption, setSortOption,
        loadMore,
        handleDelete,
        setProducts // Exposed for optimistic updates from children
    };
}
