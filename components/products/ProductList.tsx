'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Package, Trash2, Pencil, Search, Plus, FileDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation'; // Update import
import { Product, AdjustmentType } from '../../types';
// ProductList Logic

// Extend Product to ensure image_url is optional but present in logic
interface InventoryItem extends Product {
    image_url?: string;
    financial_adjustments?: {
        id: string;
        type: AdjustmentType;
        amount: number;
        percentage?: number;
    }[];
}

export default function ProductList() {
    const [products, setProducts] = useState<InventoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false); // Changed default to false, controled by fetch
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ORDERED' | 'RECEIVED' | 'SOLD'>('ALL');
    const [sortOption, setSortOption] = useState<'DATE_DESC' | 'DATE_ASC' | 'PRICE_DESC' | 'PRICE_ASC' | 'NAME_ASC'>('DATE_DESC');

    // Pagination State
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 20;

    const [quickEditValues, setQuickEditValues] = useState<{
        [key: string]: {
            salePrice: number;
            localShipping: number;
            taxCost: number;
            adjustments: { id: string; type: AdjustmentType; amount: number; percentage?: number }[]
        }
    }>({});
    const router = useRouter();
    const searchParams = useSearchParams();

    // Reset list when filters change
    useEffect(() => {
        setProducts([]);
        setPage(0);
        setHasMore(true);
        setLoading(true);
        fetchProducts(0, true);
    }, [searchTerm, statusFilter, sortOption]);

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
                // Search by Name or SKU
                query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
            }

            // Sorting
            switch (sortOption) {
                case 'DATE_ASC':
                    query = query.order('created_at', { ascending: true });
                    break;
                case 'PRICE_DESC':
                    query = query.order('sale_price', { ascending: false });
                    break;
                case 'PRICE_ASC':
                    query = query.order('sale_price', { ascending: true });
                    break;
                case 'NAME_ASC':
                    query = query.order('name', { ascending: true });
                    break;
                default: // DATE_DESC
                    query = query.order('created_at', { ascending: false });
            }

            // Pagination
            query = query.range(start, end);

            const { data, error, count } = await query;

            if (error) throw error;

            if (data) {
                setProducts(prev => isReset ? data : [...prev, ...data]);
                if (data.length < ITEMS_PER_PAGE) {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage);
    };

    useEffect(() => {
        // Initial load handled by the filter effect above? 
        // Logic: On mount, filter effect runs because state initialized.
        // Wait, check URL params first.

        const q = searchParams.get('search');
        const tab = searchParams.get('tab');

        if (q || tab) {
            // If params exist, update state, which triggers effect.
            if (q) setSearchTerm(q);
            if (tab && ['ORDERED', 'RECEIVED', 'SOLD'].includes(tab)) {
                setStatusFilter(tab as any);
            }
        } else {
            // If no params, ensure effect triggers or manual fetch?
            // Since searchTerm/statusFilter set to default, effect runs once.
        }

        // Realtime
        const channel = supabase
            .channel('realtime_products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                // On change, refresh current view? Or just ignore pagination complexity for now?
                // Simplest: Reload all? No, annoying. 
                // Let's just re-fetch page 0?
                // For now, let's keep it simple: Realtime might break pagination list append.
                // Better: just fetch page 0 and replace? No.
                // Safe: Prompt user or just do nothing for now on big changes.
                // Re-implementation: user said "agilizar". Realtime is nicety.
                // let's stick to manual refresh or simple optimistic updates.
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            // Optimistic update
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            alert('Error al eliminar');
            console.error(error);
        }
    };

    const handleDownloadCSV = async () => {
        try {
            let query = supabase.from('products').select('*');

            // Apply Filters (Same as fetch)
            if (statusFilter !== 'ALL') query = query.eq('status', statusFilter);
            if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);

            const { data, error } = await query;
            if (error) throw error;
            if (!data || data.length === 0) return alert("No hay datos para exportar");

            // Convert to CSV
            const headers = ['Nombre', 'Precio Compra (USD)', 'Costo Envio (USD)', 'Impuestos (USD)', 'Total Costo (DOP)', 'Precio Venta (DOP)', 'Estado', 'Fecha'];
            const csvRows = [headers.join(',')];

            data.forEach(item => {
                const totalCostDOP = (
                    ((item.buy_price + item.shipping_cost + (item.origin_tax || 0)) * item.exchange_rate) +
                    item.tax_cost + (item.local_shipping_cost || 0)
                ).toFixed(2);

                const row = [
                    `"${item.name.replace(/"/g, '""')}"`, // Escape quotes
                    item.buy_price,
                    item.shipping_cost,
                    item.origin_tax || 0,
                    totalCostDOP,
                    item.sale_price || 0,
                    item.status,
                    item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
                ];
                csvRows.push(row.join(','));
            });

            // Trigger Download
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error exporting:", error);
            alert("Error al exportar");
        }
    };

    const handleQuickSave = async (id: string) => {
        const values = quickEditValues[id];
        if (!values) return;

        // Auto-Calculate Status Logic
        let newStatus = 'ORDERED';
        const currentProduct = products.find(p => p.id === id);
        // Logic: 
        // 1. If sale_price > 0 => SOLD
        // 2. If tax_cost (courier) or local_shipping or existing shipping > 0 => RECEIVED
        // 3. Else ORDERED (unless overridden)

        const finalSalePrice = values.salePrice;
        const finalLocalShipping = values.localShipping;
        const finalTaxCost = values.taxCost; // imported/courier
        const existingShippingCost = currentProduct?.shipping_cost || 0;

        if (finalSalePrice > 0) {
            newStatus = 'SOLD';
        } else if (existingShippingCost > 0 || finalLocalShipping > 0 || finalTaxCost > 0) {
            newStatus = 'RECEIVED';
        } else {
            newStatus = 'ORDERED';
        }

        try {
            // 1. Update Product
            const { error: prodError } = await supabase
                .from('products')
                .update({
                    sale_price: values.salePrice,
                    local_shipping_cost: values.localShipping,
                    tax_cost: values.taxCost, // update tax_cost
                    status: newStatus as any
                })
                .eq('id', id);

            if (prodError) throw prodError;

            // 2. Sync Adjustments (Delete All + Insert New)
            await supabase.from('financial_adjustments').delete().eq('product_id', id);

            if (values.adjustments.length > 0) {
                const adjPayload = values.adjustments.map(a => ({
                    product_id: id,
                    type: a.type,
                    amount: a.amount,
                    percentage: a.percentage
                }));
                const { error: adjError } = await supabase.from('financial_adjustments').insert(adjPayload);
                if (adjError) throw adjError;
            }

            // Optimistic update
            setProducts(prev => prev.map(p => p.id === id ? {
                ...p,
                sale_price: values.salePrice,
                local_shipping_cost: values.localShipping,
                tax_cost: values.taxCost,
                financial_adjustments: values.adjustments,
                status: newStatus as any
            } : p));
            setExpandedId(null);
        } catch (error) {
            console.error('Error updating:', error);
            alert('Error al actualizar');
        }
    };

    const toggleExpand = (p: InventoryItem) => {
        if (expandedId === p.id) {
            setExpandedId(null);
        } else {
            setExpandedId(p.id);
            // Init values (Default Shipping 200 if 0/null)
            setQuickEditValues(prev => ({
                ...prev,
                [p.id]: {
                    salePrice: p.sale_price || 0,
                    localShipping: p.local_shipping_cost || 200,
                    taxCost: p.tax_cost || 0, // Load current tax_cost
                    adjustments: p.financial_adjustments ? [...p.financial_adjustments] : []
                }
            }));
        }
    };

    // Helper to modify adjustments in Quick Edit
    const modifyAdjustment = (id: string, action: 'ADD' | 'REMOVE' | 'UPDATE', payload?: any) => {
        setQuickEditValues(prev => {
            const current = prev[id];
            if (!current) return prev;

            let newAdj = [...current.adjustments];

            if (action === 'ADD') {
                newAdj.push({
                    id: crypto.randomUUID(),
                    type: payload.type,
                    amount: 0,
                    percentage: 0
                });
            } else if (action === 'REMOVE') {
                newAdj = newAdj.filter(a => a.id !== payload.adjId);
            } else if (action === 'UPDATE') {
                newAdj = newAdj.map(a => a.id === payload.adjId ? { ...a, [payload.field]: payload.value } : a);
                // Auto-calc amount if percentage changes (basic logic)
                if (payload.field === 'percentage') {
                    // Logic skipped for simplicity
                }
            }

            return {
                ...prev,
                [id]: { ...current, adjustments: newAdj }
            };
        });
    };

    // Filter Logic moved to Server-Side (fetchProducts)
    const filteredProducts = products; // Just pass through for now or rename usages


    // Simple profit estimator for list view matching Dashboard logic
    const getEstProfit = (p: InventoryItem) => {
        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const dopCost = (usdCost * p.exchange_rate) + p.tax_cost + (p.local_shipping_cost || 0);

        // Subtract adjustments logic if needed for display?
        let adjustmentsTotal = 0;
        if (p.financial_adjustments) {
            adjustmentsTotal = p.financial_adjustments.reduce((sum, adj) => {
                if (adj.type === 'CREDIT_CLAIM' || adj.type === 'REWARD_BACK' || adj.type === 'PRICE_PROTECTION') {
                    return sum + (adj.amount || 0);
                }
                return sum;
            }, 0);
        }

        const profit = (p.sale_price || 0) - dopCost + adjustmentsTotal;
        return Math.round(profit);
    };

    if (loading) return (
        <div className="max-w-md mx-auto p-4 mb-24 cursor-default">
            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
                <div className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
            </div>
            {/* Search Skeleton */}
            <h2 className="w-32 h-6 bg-slate-100 rounded-lg animate-pulse mb-4"></h2>
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse mb-4"></div>
            {/* List Skeletons */}
            <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-slate-100 flex items-center p-3 gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-md mx-auto p-4 mb-24 cursor-default">



            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package size={20} className="text-slate-500" />
                Inventario
            </h2>

            {/* NEW: Status Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => setStatusFilter('ORDERED')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === 'ORDERED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}
                >
                    Comprado
                </button>
                <button
                    onClick={() => setStatusFilter('RECEIVED')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                >
                    Recibido
                </button>
                <button
                    onClick={() => setStatusFilter('SOLD')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === 'SOLD' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'}`}
                >
                    Vendido
                </button>
            </div>

            {/* Search Bar & Sort */}
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                >
                    <option value="DATE_DESC">Recientes</option>
                    <option value="DATE_ASC">Antiguos</option>
                    <option value="PRICE_DESC">Mayor Precio</option>
                    <option value="PRICE_ASC">Menor Precio</option>
                    <option value="NAME_ASC">Nombre (A-Z)</option>
                </select>
                <button
                    onClick={handleDownloadCSV}
                    className="bg-white border border-slate-200 text-slate-600 p-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                    title="Exportar a CSV"
                >
                    <FileDown size={20} />
                </button>
            </div>

            <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">
                        {searchTerm ? 'No se encontraron resultados.' : `No hay productos en ${statusFilter}.`}
                    </p>
                ) : (
                    filteredProducts.map((p) => {
                        const profit = getEstProfit(p);
                        return (
                            <div key={p.id} className={`bg-white border text-slate-900 rounded-xl overflow-hidden shadow-sm transition-all ${expandedId === p.id ? 'border-slate-400 ring-1 ring-slate-400' : 'border-slate-100'}`}>
                                <div
                                    onClick={() => toggleExpand(p)}
                                    className="p-3 flex gap-3 items-center cursor-pointer"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 bg-slate-50 rounded-lg shrink-0 overflow-hidden border border-slate-200">
                                        {p.image_url ? (
                                            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Package size={20} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm truncate">{p.name}</p>
                                        <div className="flex gap-2 text-xs text-slate-500 mt-1">
                                            {/* Status Badge (Small) */}
                                            {p.status === 'RECEIVED' && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] uppercase font-bold">Recibido</span>}
                                            {p.status === 'SOLD' && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] uppercase font-bold">Vendido</span>}
                                            {p.status === 'ORDERED' && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] uppercase font-bold">Comprado</span>}

                                            <span className="text-slate-400">•</span>
                                            <span>${p.buy_price}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${profit > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {profit > 0 ? '+' : ''}RD$ {profit.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Edit Section (Expanded) */}
                                {expandedId === p.id && (
                                    <div className="bg-slate-50 p-3 border-t border-slate-200 animate-in slide-in-from-top-2">

                                        {/* Row 1: Import / Courier (Phase 2) */}
                                        <div className="mb-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] uppercase font-bold text-orange-600/80">Importación / Courier (RD$)</label>
                                                {/* Discount Helper */}
                                                <div className="flex items-center gap-1 group">
                                                    <span className="text-[9px] text-slate-400 group-hover:text-emerald-500 transition-colors">Descuento:</span>
                                                    <div className="flex items-stretch shadow-sm rounded-md overflow-hidden bg-white border border-orange-100">
                                                        <input
                                                            type="number"
                                                            defaultValue={10}
                                                            className="w-8 text-[9px] text-center font-bold text-slate-600 outline-none p-0.5 bg-transparent"
                                                            id={`discount-q-${p.id}`}
                                                        />
                                                        <span className="text-[9px] text-slate-400 bg-slate-50 px-0.5 flex items-center border-l border-orange-50">%</span>
                                                        <div className="flex items-center px-1 bg-slate-50 border-l border-orange-50" title="Aplicar automáticamente al salir del campo">
                                                            <input
                                                                type="checkbox"
                                                                id={`auto-check-${p.id}`}
                                                                defaultChecked
                                                                className="w-3 h-3 accent-emerald-500 rounded-sm cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-2 top-2 text-slate-400 text-xs">$</span>
                                                <input
                                                    type="number"
                                                    value={quickEditValues[p.id]?.taxCost || ''}
                                                    onChange={(e) => setQuickEditValues(prev => ({
                                                        ...prev,
                                                        [p.id]: { ...prev[p.id], taxCost: Number(e.target.value) }
                                                    }))}
                                                    onBlur={(e) => {
                                                        const check = document.getElementById(`auto-check-${p.id}`) as HTMLInputElement;
                                                        if (check && check.checked) {
                                                            const input = document.getElementById(`discount-q-${p.id}`) as HTMLInputElement;
                                                            const pct = Number(input.value) || 0;
                                                            const currentVal = Number(e.target.value);
                                                            if (currentVal > 0) {
                                                                // Logic: Input (100) -> Blur -> (90)
                                                                const newVal = Math.round(currentVal * (1 - pct / 100));
                                                                // UX: Only if diff? Yes.
                                                                if (newVal !== currentVal) {
                                                                    setQuickEditValues(prev => ({
                                                                        ...prev,
                                                                        [p.id]: { ...prev[p.id], taxCost: Number(newVal.toFixed(2)) }
                                                                    }));
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className="w-full pl-5 p-2 bg-orange-50 border border-orange-100 rounded-lg font-bold text-slate-700 outline-none focus:border-orange-300"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Basic Prices */}
                                        <div className="flex gap-3 items-end mb-3">
                                            <div className="flex-[1.5]">
                                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Precio Venta (RD$)</label>
                                                <input
                                                    type="number"
                                                    value={quickEditValues[p.id]?.salePrice || ''}
                                                    onChange={(e) => setQuickEditValues(prev => ({
                                                        ...prev,
                                                        [p.id]: { ...prev[p.id], salePrice: Number(e.target.value) }
                                                    }))}
                                                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-blue-500"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Envío Local</label>
                                                <input
                                                    type="number"
                                                    value={quickEditValues[p.id]?.localShipping || ''}
                                                    onChange={(e) => setQuickEditValues(prev => ({
                                                        ...prev,
                                                        [p.id]: { ...prev[p.id], localShipping: Number(e.target.value) }
                                                    }))}
                                                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-600 outline-none focus:border-blue-500"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Row 3: Adjustments */}
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Ajustes / Créditos</span>
                                                <div className="flex gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); modifyAdjustment(p.id, 'ADD', { type: 'CREDIT_CLAIM' }); }} className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold hover:bg-emerald-200">+ Credit</button>
                                                    <button onClick={(e) => { e.stopPropagation(); modifyAdjustment(p.id, 'ADD', { type: 'PRICE_PROTECTION' }); }} className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold hover:bg-amber-200">+ PriceDrop</button>
                                                    <button onClick={(e) => { e.stopPropagation(); modifyAdjustment(p.id, 'ADD', { type: 'REWARD_BACK' }); }} className="text-[9px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold hover:bg-purple-200">+ Reward</button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {(!quickEditValues[p.id]?.adjustments || quickEditValues[p.id]?.adjustments?.length === 0) && (
                                                    <p className="text-[10px] text-slate-300 italic">No hay ajustes aplicados.</p>
                                                )}
                                                {quickEditValues[p.id]?.adjustments?.map((adj, idx) => (
                                                    <div key={idx} className="flex gap-1 items-center">
                                                        <select
                                                            className="text-[10px] w-24 border border-slate-200 rounded px-1 py-1.5 bg-white text-slate-700 outline-none"
                                                            value={adj.type}
                                                            onChange={(e) => modifyAdjustment(p.id, 'UPDATE', { adjId: adj.id, field: 'type', value: e.target.value })}
                                                        >
                                                            <option value="CREDIT_CLAIM">CreditClaim</option>
                                                            <option value="PRICE_PROTECTION">Bajón Precio</option>
                                                            <option value="REWARD_BACK">Reward</option>
                                                        </select>
                                                        <div className="relative w-14">
                                                            <input
                                                                type="number"
                                                                placeholder="%"
                                                                className="w-full px-1 py-1.5 text-xs border border-slate-200 rounded outline-none text-center bg-white"
                                                                value={adj.percentage || ''}
                                                                onChange={(e) => modifyAdjustment(p.id, 'UPDATE', { adjId: adj.id, field: 'percentage', value: Number(e.target.value) })}
                                                            />
                                                            <span className="absolute right-1 top-1.5 text-[9px] text-slate-400">%</span>
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-400">$</span>
                                                            <input
                                                                type="number"
                                                                placeholder="0.00"
                                                                className="w-full pl-3 pr-2 py-1.5 text-xs border border-slate-200 rounded outline-none font-medium"
                                                                value={adj.amount || ''}
                                                                onChange={(e) => modifyAdjustment(p.id, 'UPDATE', { adjId: adj.id, field: 'amount', value: Number(e.target.value) })}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => modifyAdjustment(p.id, 'REMOVE', { adjId: adj.id })}
                                                            className="text-slate-400 hover:text-red-500 p-1 bg-white border border-slate-100 rounded"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleQuickSave(p.id)}
                                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Package size={16} />
                                            Confirmar Cambios
                                        </button>

                                        {/* Actions Footer */}
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                                            <button
                                                onClick={(e) => handleDelete(p.id, e)}
                                                className="text-red-500 text-xs font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                            >
                                                <Trash2 size={14} />
                                                Eliminar
                                            </button>

                                            <button
                                                onClick={() => router.push('/calculator?edit=' + p.id)}
                                                className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                            >
                                                <Pencil size={14} />
                                                Editar Completo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Load More Button */}
            {
                hasMore && !loading && products.length > 0 && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={loadMore}
                            className="bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            Cargar más
                        </button>
                    </div>
                )
            }

            {
                loading && products.length > 0 && (
                    <div className="mt-4 text-center text-xs text-slate-400 font-bold">Cargando...</div>
                )
            }
        </div >
    );
}
