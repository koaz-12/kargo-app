'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { useProductList } from '../../features/inventory/hooks/useProductList';
import InventoryFilterBar from '../../features/inventory/components/InventoryFilterBar';
import InventoryCard from '../../features/inventory/components/InventoryCard';

export default function ProductList() {
    const {
        products,
        loading,
        hasMore,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        sortOption, setSortOption,
        loadMore,
        handleDelete
    } = useProductList();

    // Re-implement CSV download here or in utils, for now inline to save time as it was in original
    const handleDownloadCSV = () => {
        if (!products.length) return alert("No hay datos cargados para exportar.");

        const headers = ['Nombre', 'Precio Compra (USD)', 'Envío (USD)', 'Tax USA (USD)', 'Aduanas (RD$)', 'Envío Local (RD$)', 'Precio Venta (RD$)', 'Estado', 'Fecha'];
        const csvRows = [headers.join(',')];

        products.forEach(item => {
            const row = [
                `"${item.name.replace(/"/g, '""')}"`,
                item.buy_price,
                item.shipping_cost,
                item.origin_tax || 0,
                item.tax_cost,
                item.local_shipping_cost || 0,
                item.sale_price || 0,
                item.status,
                item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading && products.length === 0) return (
        <div className="max-w-md mx-auto p-4 mb-24 cursor-default space-y-4">
            <div className="h-6 w-32 bg-slate-100 rounded animate-pulse"></div>
            <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
            <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse"></div>)}
            </div>
        </div>
    );

    return (
        <div className="max-w-md mx-auto p-4 mb-24 cursor-default">

            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package size={20} className="text-slate-500" />
                Inventario
            </h2>

            <InventoryFilterBar
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                sortOption={sortOption} setSortOption={setSortOption}
                onExport={handleDownloadCSV}
            />

            <div className="space-y-3">
                {products.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        {searchTerm ? 'Sin resultados para tu búsqueda.' : 'No tienes productos aquí todavía.'}
                    </p>
                ) : (
                    products.map(product => (
                        <InventoryCard
                            key={product.id}
                            product={product}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>

            {hasMore && (
                <div className="mt-6 text-center">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : 'Cargar más'}
                    </button>
                </div>
            )}
        </div>
    );
}
