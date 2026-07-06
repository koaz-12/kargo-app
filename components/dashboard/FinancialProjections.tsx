'use client';

import React, { useMemo } from 'react';
import { TrendingUp, Target, LineChart } from 'lucide-react';
import { Product } from '../../types';

interface FinancialProjectionsProps {
    products: Product[];
    monthlyGoal?: number;
}

export default function FinancialProjections({ products, monthlyGoal = 50000 }: FinancialProjectionsProps) {
    const { totalExpectedProfit, currentProfit, completionPercentage } = useMemo(() => {
        let expected = 0;
        let current = 0;

        products.forEach(p => {
            if (p.status === 'SOLD') {
                // For sold items, use actual profit
                current += p.gross_profit || 0;
            } else if (p.status === 'RECEIVED' || p.status === 'ORDERED') {
                // For unsold items, calculate expected profit
                // If they set a sale_price, use that profit, otherwise assume a 30% margin or their expected_margin
                if (p.sale_price && p.sale_price > 0) {
                    expected += p.gross_profit || 0;
                } else {
                    const expectedMargin = p.expected_margin || 30; // Default 30%
                    const projectedPrice = p.net_cost * (1 + (expectedMargin / 100));
                    const projectedProfit = projectedPrice - p.net_cost;
                    expected += projectedProfit;
                }
            }
        });

        // Current profit is already realized. Total expected includes realized + unsold potential.
        const totalExpected = current + expected;
        const completion = monthlyGoal > 0 ? (current / monthlyGoal) * 100 : 0;

        return {
            totalExpectedProfit: totalExpected,
            currentProfit: current,
            completionPercentage: Math.min(100, Math.max(0, completion))
        };
    }, [products, monthlyGoal]);

    return (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <LineChart size={18} className="text-indigo-500" />
                    Proyecciones
                </h3>
                <div className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    Este Mes
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ganancia Actual</p>
                    <p suppressHydrationWarning className="text-xl font-black text-emerald-600">RD${Math.round(currentProfit).toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Proyección Total</p>
                    <p suppressHydrationWarning className="text-xl font-black text-indigo-600">RD${Math.round(totalExpectedProfit).toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <div suppressHydrationWarning className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <Target size={14} className="text-slate-400" />
                        Meta Mensual: RD${monthlyGoal.toLocaleString()}
                    </div>
                    <span className="text-xs font-black text-indigo-600">{Math.round(completionPercentage)}%</span>
                </div>
                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
