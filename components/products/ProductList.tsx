'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Package, AlertTriangle, X, Trash2 } from 'lucide-react';
import { useProductList } from '../../features/inventory/hooks/useProductList';
import InventoryFilterBar from '../../features/inventory/components/InventoryFilterBar';
import InventoryCard from '../../features/inventory/components/InventoryCard';
import { Pagination } from '../ui/Pagination';

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
        isLoading,
        isFetching,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        sortOption, setSortOption,
        handleDelete,
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
        itemsPerPage,
        handleMassUpdateStatus, // NEW
        handleMassGenerateSKU, // NEW
        isMassActing // NEW
    } = useProductList();

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [isMassDeleting, setIsMassDeleting] = useState(false);

    const executeDelete = () => {
        if (isMassDeleting && selectedProductIds.length > 0) {
            // Eliminar masivamente
            selectedProductIds.forEach(id => handleDelete(id));
            setSelectedProductIds([]);
            setIsMassDeleting(false);
            setDeletingId(null);
        } else if (deletingId) {
            handleDelete(deletingId);
            setDeletingId(null);
        }
    };

    const handleSelectProduct = (id: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedProductIds(prev => [...prev, id]);
        } else {
            setSelectedProductIds(prev => prev.filter(pId => pId !== id));
        }
    };

    const handleSelectAll = () => {
        if (selectedProductIds.length === products.length) {
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(products.map(p => p.id));
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

    return (
        <div className="max-w-md mx-auto p-4 mb-24 cursor-default min-h-[75vh]">

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Package size={20} className="text-slate-500" />
                    Inventario
                </h2>

                {/* Select All Button */}
                {products.length > 0 && (
                    <button
                        onClick={handleSelectAll}
                        className="text-xs font-semibold text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-2 py-1.5 rounded-lg shadow-sm transition-colors"
                    >
                        {selectedProductIds.length === products.length ? 'Desmarcar Todos' : 'Seleccionar Todo (Página)'}
                    </button>
                )}
            </div>

            <InventoryFilterBar
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                sortOption={sortOption} setSortOption={setSortOption}
                onExport={handleDownloadCSV}
                loading={isFetching}
                // Advanced filters
                selectedPlatforms={selectedPlatforms}
                onPlatformsChange={setSelectedPlatforms}
                platformOptions={platformOptions}
                selectedAccounts={selectedAccounts} // NEW
                onAccountsChange={setSelectedAccounts} // NEW
                accountOptions={accountOptions} // NEW
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
            />

            <div className="space-y-3">
                {isLoading && products.length === 0 ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse"></div>)}
                    </div>
                ) : products.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        {searchTerm ? 'Sin resultados para tu búsqueda.' : 'No tienes productos aquí todavía.'}
                    </p>
                ) : (
                    products.map(product => (
                        <InventoryCard
                            key={product.id}
                            product={product}
                            onDelete={setDeletingId}
                            isSelected={selectedProductIds.includes(product.id)}
                            onSelect={handleSelectProduct}
                        />
                    ))
                )}
            </div>

            <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                loading={isFetching}
            />

            {/* Mass Actions Floating Toolbar */}
            {selectedProductIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl p-2 flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-5">
                    <div className="px-3 border-r border-slate-700">
                        <span className="text-sm font-bold">{selectedProductIds.length}</span>
                        <span className="text-[10px] text-slate-400 block -mt-1 uppercase">Sel.</span>
                    </div>

                    <button
                        onClick={() => { handleMassGenerateSKU(selectedProductIds); setSelectedProductIds([]); }}
                        disabled={isMassActing}
                        className={`p-2 rounded-xl transition-colors flex flex-col items-center gap-1 min-w-[60px] ${isMassActing ? 'opacity-50 cursor-not-allowed text-slate-500' : 'hover:bg-slate-800 text-blue-400'}`}
                        title="Generar SKUs"
                    >
                        <span className="text-xl leading-none">🪄</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider">SKUs</span>
                    </button>

                    <div className="w-px h-8 bg-slate-700"></div>

                    <button
                        onClick={() => { handleMassUpdateStatus(selectedProductIds, 'RECEIVED'); setSelectedProductIds([]); }}
                        disabled={isMassActing}
                        className={`p-2 rounded-xl transition-colors flex flex-col items-center gap-1 min-w-[60px] ${isMassActing ? 'opacity-50 cursor-not-allowed text-slate-500' : 'hover:bg-slate-800 text-emerald-400'}`}
                        title="Marcar Recibidos"
                    >
                        <span className="text-xl leading-none">📦</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Recib.</span>
                    </button>

                    <button
                        onClick={() => { handleMassUpdateStatus(selectedProductIds, 'SOLD'); setSelectedProductIds([]); }}
                        disabled={isMassActing}
                        className={`p-2 rounded-xl transition-colors flex flex-col items-center gap-1 min-w-[60px] ${isMassActing ? 'opacity-50 cursor-not-allowed text-slate-500' : 'hover:bg-slate-800 text-slate-300'}`}
                        title="Marcar Vendidos"
                    >
                        <span className="text-xl leading-none">🤝</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Ventas</span>
                    </button>

                    <div className="w-px h-8 bg-slate-700"></div>

                    <button
                        onClick={() => { setIsMassDeleting(true); setDeletingId('mass'); }}
                        className="p-2 hover:bg-red-950/50 rounded-xl transition-colors text-red-400 flex flex-col items-center gap-1 min-w-[60px]" title="Eliminar Seleccionados"
                    >
                        <Trash2 size={18} className="mb-0.5" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Borrar</span>
                    </button>

                    <button onClick={() => setSelectedProductIds([])} className="ml-1 p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Inlined Modal */}
            <DeleteModal
                isOpen={!!deletingId}
                onClose={() => { setDeletingId(null); setIsMassDeleting(false); }}
                onConfirm={executeDelete}
            />
        </div>
    );
}
