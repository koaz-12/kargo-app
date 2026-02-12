import { Product } from '../types';

/**
 * Format currency in DOP (Dominican Peso)
 */
export const formatCurrency = (amount: number, currency: 'DOP' | 'USD' = 'DOP'): string => {
    const symbol = currency === 'DOP' ? 'RD$' : '$';
    return `${symbol}${amount.toLocaleString('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
};

/**
 * Get status badge color
 */
export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'DRAFT':
            return 'bg-slate-100 text-slate-700';
        case 'ORDERED':
            return 'bg-blue-100 text-blue-700';
        case 'RECEIVED':
            return 'bg-emerald-100 text-emerald-700';
        case 'SOLD':
            return 'bg-purple-100 text-purple-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

/**
 * Get status label in Spanish
 */
export const getStatusLabel = (status: string): string => {
    switch (status) {
        case 'DRAFT':
            return 'Borrador';
        case 'ORDERED':
            return 'Ordenado';
        case 'RECEIVED':
            return 'Recibido';
        case 'SOLD':
            return 'Vendido';
        default:
            return status;
    }
};

/**
 * Calculate days since date
 */
export const daysSince = (date: string | Date): number => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * Format relative time
 */
export const formatRelativeTime = (date: string | Date): string => {
    const days = daysSince(date);

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
    return `Hace ${Math.floor(days / 365)} años`;
};

/**
 * Format date for display
 */
export const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Export products to CSV
 */
export const exportToCSV = (products: Product[], filename: string = 'productos') => {
    if (!products.length) {
        throw new Error('No hay productos para exportar');
    }

    const headers = [
        'Nombre',
        'SKU',
        'Estado',
        'Precio Compra (USD)',
        'Envío (USD)',
        'Tax USA (USD)',
        'Tasa Cambio',
        'Costo Neto (DOP)',
        'Aduanas (DOP)',
        'Envío Local (DOP)',
        'Precio Venta (DOP)',
        'Ganancia (DOP)',
        'Margen (%)',
        'ROI (%)',
        'Fecha Creación',
        'Fecha Venta',
        'Tracking',
    ];

    const rows = products.map(p => [
        p.name,
        p.sku || '',
        getStatusLabel(p.status),
        p.buy_price,
        p.shipping_cost,
        p.origin_tax || 0,
        p.exchange_rate,
        p.net_cost || 0,
        p.tax_cost,
        p.local_shipping_cost || 0,
        p.sale_price || 0,
        p.gross_profit || 0,
        p.margin || 0,
        p.roi || 0,
        p.created_at ? formatDate(p.created_at) : '',
        p.sold_at ? formatDate(p.sold_at) : '',
        p.tracking_number || '',
    ]);

    // Generate CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row =>
            row.map(cell => {
                // Escape cells with commas or quotes
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',')
        ),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
};

/**
 * Calculate statistics from products
 */
export const calculateStats = (products: Product[]) => {
    const total = products.length;
    const sold = products.filter(p => p.status === 'SOLD').length;
    const received = products.filter(p => p.status === 'RECEIVED').length;
    const ordered = products.filter(p => p.status === 'ORDERED').length;

    const totalRevenue = products
        .filter(p => p.status === 'SOLD')
        .reduce((sum, p) => sum + (p.sale_price || 0), 0);

    const totalProfit = products
        .filter(p => p.status === 'SOLD')
        .reduce((sum, p) => sum + (p.gross_profit || 0), 0);

    const totalInvestment = products
        .reduce((sum, p) => sum + (p.net_cost || 0), 0);

    const averageMargin = sold > 0
        ? products
            .filter(p => p.status === 'SOLD' && p.margin)
            .reduce((sum, p) => sum + (p.margin || 0), 0) / sold
        : 0;

    return {
        total,
        sold,
        received,
        ordered,
        totalRevenue,
        totalProfit,
        totalInvestment,
        averageMargin,
        conversionRate: total > 0 ? (sold / total) * 100 : 0,
    };
};

/**
 * Group products by month
 */
export const groupByMonth = (products: Product[], dateField: 'created_at' | 'sold_at' = 'sold_at') => {
    const grouped: Record<string, Product[]> = {};

    products.forEach(product => {
        const date = product[dateField];
        if (!date) return;

        const monthKey = new Date(date).toISOString().slice(0, 7); // YYYY-MM
        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        grouped[monthKey].push(product);
    });

    return grouped;
};
