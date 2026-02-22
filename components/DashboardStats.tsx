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
    const { types: adjTypes } = useAdjustmentTypes();

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
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 opacity-5">
                    <DollarSign size={32} />
                </div>
                <p className="text-[9px] uppercase font-bold text-slate-400">Capital Activo</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-slate-500">RD$</span>
                    <span className="text-lg font-bold text-slate-800">{Math.round(activeInvestment).toLocaleString()}</span>
                </div>
                <div className="flex gap-2 mt-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold">Por Recibir</span>
                        <span className="text-xs font-bold text-blue-600">{orderedCount}</span>
                    </div>
                    <div className="w-px h-full bg-slate-100"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold">En Stock</span>
                        <span className="text-xs font-bold text-emerald-600">{receivedCount}</span>
                    </div>
                </div>
            </div>

            {/* Realized Profit */}
            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 opacity-10 text-emerald-500">
                    <TrendingUp size={32} />
                </div>
                <p className="text-[9px] uppercase font-bold text-emerald-600/70">Ganancia Real (Vendidos)</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-emerald-600">RD$</span>
                    <span className="text-lg font-bold text-emerald-700">{Math.round(realizedProfit).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Package size={12} />
                    <span>{soldCount} Vendidos</span>
                </div>
            </div>
        </div>
    );
}
