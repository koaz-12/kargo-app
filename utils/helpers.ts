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


