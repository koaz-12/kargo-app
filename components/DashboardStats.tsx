import React from 'react';
import { Product } from '../types';
import { Package, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

interface DashboardStatsProps {
    products: Product[];
}

export default function DashboardStats({ products }: DashboardStatsProps) {
    // Lifecycle Counts
    const orderedCount = products.filter(p => p.status === 'ORDERED').length;
    const receivedCount = products.filter(p => p.status === 'RECEIVED').length;
    const soldCount = products.filter(p => p.status === 'SOLD').length;

    // Financials
    // 1. Active Investment (Money tied up in Ordered + Received)
    const activeInvestment = products.reduce((acc, p) => {
        if (p.status === 'SOLD') return acc; // Sold items are not active investment
        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const dopCost = (usdCost * p.exchange_rate) + p.tax_cost + (p.local_shipping_cost || 0);
        return acc + dopCost;
    }, 0);

    // 2. Realized Profit (From Sold items)
    const realizedProfit = products.reduce((acc, p) => {
        if (p.status !== 'SOLD') return acc;
        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const dopCost = (usdCost * p.exchange_rate) + p.tax_cost + (p.local_shipping_cost || 0);
        // Add adjustments? Assuming adjustments are handled or negligible for high-level stats for now
        // OR reuse logic if possible.
        return acc + ((p.sale_price || 0) - dopCost);
    }, 0);

    // 3. Potential Profit (From Received/Ordered items)
    const potentialProfit = products.reduce((acc, p) => {
        if (p.status === 'SOLD') return acc;
        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const dopCost = (usdCost * p.exchange_rate) + p.tax_cost + (p.local_shipping_cost || 0);
        // Estimate sale price? If sale_price is set (target) use it, else ignore?
        // Usually we don't have a sale price yet. So this is hard.
        // Let's stick to Realized Profit for clarity.
        return acc;
    }, 0);

    return (
        <div className="grid grid-cols-2 gap-3 mb-6 animate-in fade-in slide-in-from-top-4">

            {/* Active Investment (Capital en la calle/casa) */}
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

            {/* Total Items (Counts) - Replaced with detailed breakdown above, maybe keep total? 
                Let's use this space for something else or remove if empty. 
                User wants "Adaptar inicio".
                Maybe a simple "Total Movemement"?
            */}
        </div>
    );
}
