'use client';
import React, { useMemo } from 'react';
import { Product } from '../types';
import { Package, DollarSign, TrendingUp } from 'lucide-react';
import { useAdjustmentTypes } from '../hooks/useAdjustmentTypes';

interface DashboardStatsProps {
    products: Product[];
}

export default function DashboardStats({ products }: DashboardStatsProps) {
    // Load user's adjustment types to dynamically resolve affects_cost
    const { types: adjTypes, loading: isLoadingTypes } = useAdjustmentTypes();

    // Build a lookup map: type key → category ('CREDIT' | 'DISCOUNT')
    // DISCOUNT = deducts from capital (ya se pagó menos)
    // CREDIT = does NOT deduct from capital (dinero en la plataforma, no recuperado)
    const adjCategoryMap = useMemo(() => {
        const map: Record<string, string> = {};
        adjTypes.forEach(t => {
            map[t.key] = t.category || 'CREDIT';
        });
        return map;
    }, [adjTypes]);

    // Lifecycle Counts
    const orderedCount = products.filter(p => p.status === 'ORDERED').length;
    const receivedCount = products.filter(p => p.status === 'RECEIVED').length;
    const soldCount = products.filter(p => p.status === 'SOLD').length;

    // Helper: sum of discount-type adjustments for a product (in USD)
    // Only DISCOUNT adjustments reduce capital (descuentos aplicados al comprar).
    // CREDIT adjustments do NOT reduce capital (dinero en la plataforma).
    const getDiscountAdjustmentsUSD = (p: Product): number => {
        if (!p.adjustments || p.adjustments.length === 0) return 0;
        return p.adjustments.reduce((sum, adj) => {
            const isDiscount = adjCategoryMap[adj.type] === 'DISCOUNT';
            return isDiscount ? sum + (adj.amount || 0) : sum;
        }, 0);
    };

    // Helper: sum of ALL adjustments (credits + discounts) for sold items
    // Once sold, both credits and discounts are realized profit.
    const getAllAdjustmentsUSD = (p: Product): number => {
        if (!p.adjustments || p.adjustments.length === 0) return 0;
        return p.adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0);
    };

    // 1. Capital Activo — Inversión real en artículos no vendidos
    //    = Costo total DOP − descuentos (category=DISCOUNT) en DOP
    //    Créditos NO se descuentan porque el dinero está en la plataforma, no recuperado.
    const activeInvestment = products.reduce((acc, p) => {
        if (p.status === 'SOLD') return acc;

        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const dopCost = (usdCost * (p.exchange_rate || 58)) + (p.tax_cost || 0) + (p.local_shipping_cost || 0);

        const adjustmentsUSD = getDiscountAdjustmentsUSD(p);
        const adjustmentsDOP = adjustmentsUSD * (p.exchange_rate || 58);

        return acc + (dopCost - adjustmentsDOP);
    }, 0);

    // 2. Ganancia Real — De artículos vendidos
    //    = Precio venta − Costo total DOP + TODOS los ajustes (créditos + descuentos)
    //    Al estar vendido, tanto créditos como descuentos son ganancia realizada.
    const realizedProfit = products.reduce((acc, p) => {
        if (p.status !== 'SOLD') return acc;

        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const dopCost = (usdCost * (p.exchange_rate || 58)) + (p.tax_cost || 0) + (p.local_shipping_cost || 0);

        const adjustmentsUSD = getAllAdjustmentsUSD(p);
        const adjustmentsDOP = adjustmentsUSD * (p.exchange_rate || 58);

        return acc + ((p.sale_price || 0) - dopCost + adjustmentsDOP);
    }, 0);

    return (
        <div className="grid grid-cols-2 gap-3 mb-6 animate-in fade-in slide-in-from-top-4">

            {/* Active Investment (Capital Activo) */}
            <div className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <DollarSign size={64} strokeWidth={3} />
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Capital Activo</p>
                <div className="flex items-baseline gap-1 relative z-10">
                    <span className="text-sm font-bold text-slate-400">RD$</span>
                    {isLoadingTypes ? (
                        <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
                    ) : (
                        <span className="text-2xl font-black text-slate-800 tracking-tight">{Math.round(activeInvestment).toLocaleString()}</span>
                    )}
                </div>
                <div className="flex gap-3 mt-4 relative z-10">
                    <div className="flex flex-col bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100/50 flex-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Por Recibir</span>
                        <span className="text-sm font-black text-blue-600">{orderedCount}</span>
                    </div>
                    <div className="flex flex-col bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100/50 flex-1">
                        <span className="text-[9px] text-emerald-600/70 font-bold uppercase tracking-wide">En Stock</span>
                        <span className="text-sm font-black text-emerald-600">{receivedCount}</span>
                    </div>
                </div>
            </div>

            {/* Realized Profit */}
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-200/50 relative overflow-hidden group hover:-translate-y-0.5 transition-transform text-white">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-110 transition-transform">
                    <TrendingUp size={72} strokeWidth={2.5} />
                </div>
                <p className="text-[10px] uppercase font-bold text-emerald-50 tracking-widest mb-1">Beneficio Total</p>
                <div className="flex items-baseline gap-1 relative z-10">
                    <span className="text-sm font-bold text-emerald-100">RD$</span>
                    {isLoadingTypes ? (
                        <div className="h-8 w-24 bg-emerald-500 rounded animate-pulse" />
                    ) : (
                        <span className="text-2xl font-black text-white tracking-tight">{Math.round(realizedProfit).toLocaleString()}</span>
                    )}
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-black/10 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10 relative z-10">
                    <Package size={14} className="text-emerald-100" />
                    <span className="text-xs font-bold text-white">{soldCount} Vendidos</span>
                </div>
            </div>
        </div>
    );
}
