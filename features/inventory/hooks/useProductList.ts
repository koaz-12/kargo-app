import { useState, useEffect, useMemo } from 'react';
import { SortOption, StatusFilter } from '../types';
import { useProducts, useDeleteProduct, usePlatforms } from '../../../hooks/useProducts';
import { Product } from '../../../types';

export function useProductList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');

    // Advanced filters
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Use React Query hooks
    const { data: allProducts = [], isLoading: loading } = useProducts();
    const { data: platforms = [] } = usePlatforms();
    const deleteProductMutation = useDeleteProduct();

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

    // Client-side filtering and sorting
    const products = useMemo(() => {
        let filtered = [...allProducts];

        // Apply status filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        // Apply platform filter
        if (selectedPlatforms.length > 0) {
            filtered = filtered.filter(p =>
                p.platform_id && selectedPlatforms.includes(p.platform_id)
            );
        }

        // Apply price range filter
        if (priceRange.min > 0 || priceRange.max < Infinity) {
            filtered = filtered.filter(p => {
                const price = p.sale_price || p.net_cost || 0;
                return price >= priceRange.min && price <= priceRange.max;
            });
        }

        // Apply search
        if (debouncedSearchTerm) {
            const searchLower = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(searchLower) ||
                p.sku?.toLowerCase().includes(searchLower) ||
                p.tracking_number?.toLowerCase().includes(searchLower) ||
                p.courier_tracking?.toLowerCase().includes(searchLower)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortOption) {
                case 'DATE_ASC':
                    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                case 'DATE_DESC':
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                case 'PRICE_DESC':
                    return (b.sale_price || 0) - (a.sale_price || 0);
                case 'PRICE_ASC':
                    return (a.sale_price || 0) - (b.sale_price || 0);
                case 'NAME_ASC':
                    return (a.name || '').localeCompare(b.name || '');
                default:
                    return 0;
            }
        });

        return filtered;
    }, [allProducts, statusFilter, debouncedSearchTerm, sortOption, selectedPlatforms, priceRange]);

    const handleDelete = async (id: string) => {
        deleteProductMutation.mutate(id);
    };

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, debouncedSearchTerm, sortOption, selectedPlatforms, priceRange]);

    // Paginated products
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return products.slice(startIndex, endIndex);
    }, [products, currentPage, ITEMS_PER_PAGE]);

    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return {
        products: paginatedProducts,
        loading,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        sortOption, setSortOption,
        handleDelete,
        // Advanced filters
        selectedPlatforms,
        setSelectedPlatforms,
        platformOptions,
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
