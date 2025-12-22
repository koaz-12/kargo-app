'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Package, AlertTriangle, X } from 'lucide-react';
import { useProductList } from '../../features/inventory/hooks/useProductList';
import InventoryFilterBar from '../../features/inventory/components/InventoryFilterBar';
import InventoryCard from '../../features/inventory/components/InventoryCard';

// Inline Modal for guaranteed visibility
function DeleteModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                    <div className="w-12 h-12 bg-red-100/50 rounded-full flex items-center justify-center mb-3 text-red-600">
                        <AlertTriangle size={24} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">¿Eliminar Producto?</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                        Esta acción no se puede deshacer. Se perderán todos los datos asociados.
                    </p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                    <button onClick={onClose} className="py-2.5 px-4 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={() => { onConfirm(); onClose(); }} className="py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all active:scale-95">
                        Sí, Eliminar
                    </button>
                </div>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <X size={18} />
                </button>
            </div>
        </div>,
        document.body
    );
}

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

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const executeDelete = () => {
        if (deletingId) {
            handleDelete(deletingId);
            setDeletingId(null);
        }
    };

    // CSV LOGIC OMITTED FOR BREVITY (Keep strictly what changes or use ... if possible? No, replace_file_content needs context)
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
                            onDelete={setDeletingId}
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

            {/* Inlined Modal */}
            <DeleteModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={executeDelete}
            />
        </div>
    );
}
