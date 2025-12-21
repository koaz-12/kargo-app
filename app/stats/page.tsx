'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Product, PurchaseAccount, Platform, MonthlyGoal } from '../../types/index';
import { BarChart3, PieChart, TrendingUp, DollarSign, Wallet, ArrowLeft, Layers, Trophy, Target, Calendar, Package, Activity, Timer, Edit2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StatsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);

    // Goal State
    const [monthlyGoal, setMonthlyGoal] = useState<number>(50000);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState<string>('50000');

    // Date State
    const [selectedDate, setSelectedDate] = useState(new Date());

    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // Derived Controls
    const changeMonth = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setSelectedDate(newDate);
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    useEffect(() => {
        const loadData = async () => {
            // Reset goal when month changes
            setMonthlyGoal(50000); // Default
            setTempGoal('50000');

            const [prodRes, platRes, goalRes] = await Promise.all([
                supabase.from('products').select('*, adjustments:financial_adjustments(*)'),
                supabase.from('platforms').select('*'),
                supabase.from('monthly_goals').select('*').eq('month_key', currentMonthKey).single()
            ]);

            if (prodRes.data) setProducts(prodRes.data);
            if (platRes.data) setPlatforms(platRes.data);

            if (goalRes.data) {
                setMonthlyGoal(goalRes.data.target_amount);
                setTempGoal(String(goalRes.data.target_amount));
            } else {
                // Fallback to localStorage default
                const savedDefault = localStorage.getItem('defaultMonthlyGoal');
                if (savedDefault) {
                    setMonthlyGoal(Number(savedDefault));
                    setTempGoal(savedDefault);
                }
            }

            setLoading(false);
        };
        loadData();
    }, [currentMonthKey]);

    const handleSaveGoal = async () => {
        const amount = parseFloat(tempGoal);
        if (isNaN(amount) || amount <= 0) return;

        try {
            const { error } = await supabase
                .from('monthly_goals')
                .upsert({
                    month_key: currentMonthKey,
                    target_amount: amount
                }, { onConflict: 'month_key' });

            if (error) throw error;

            setMonthlyGoal(amount);
            setIsEditingGoal(false);
        } catch (err) {
            console.error("Error saving goal:", err);
            alert("No se pudo guardar la meta.");
        }
    };

    // --- CALCULATIONS ---
    const totalItems = products.length;

    // 1. Sold Stats (Realized) & Time Analysis
    const soldProducts = products.filter(p => p.status === 'SOLD');

    let realizedRevenue = 0;
    let realizedCost = 0;
    let profitThisMonth = 0;
    let profitThisYear = 0;

    // Trend Chart Data: { '2024-01': profit, '2024-02': profit }
    const monthlyTrend: Record<string, number> = {};

    // Inventory Days
    let totalDaysToSell = 0;
    let productsWithDates = 0;

    // Grouping for "Profit per Product"
    const productPerformance: Record<string, { name: string, count: number, revenue: number, cost: number, profit: number, image?: string }> = {};

    soldProducts.forEach(p => {
        const r = (p.sale_price || 0);
        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const dopCost = (usdCost * p.exchange_rate) + p.tax_cost + (p.local_shipping_cost || 0);
        const profit = r - dopCost;

        // Totals
        realizedRevenue += r;
        realizedCost += dopCost;

        // Time Analysis
        // Logic: Use 'sold_at' if available, otherwise fallback to 'created_at' if it's a recent sale? 
        // Or just map to "Unknown Date".
        // Strict logic: If sold_at exists, use it.
        if (p.sold_at) {
            const saleDate = new Date(p.sold_at);
            const saleMonth = saleDate.getMonth();
            const saleYear = saleDate.getFullYear();
            const monthKey = `${saleYear}-${String(saleMonth + 1).padStart(2, '0')}`; // YYYY-MM

            // Monthly Trend
            monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + profit;

            // Filters
            if (saleYear === currentYear) {
                profitThisYear += profit;
                if (saleMonth === currentMonth) {
                    profitThisMonth += profit;
                }
            }

            // Inventory Days
            if (p.created_at) {
                const createDate = new Date(p.created_at);
                const diffTime = Math.abs(saleDate.getTime() - createDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                totalDaysToSell += diffDays;
                productsWithDates++;
            }
        }

        // Grouping
        const productName = p.name || 'Producto sin nombre';
        if (!productPerformance[productName]) {
            productPerformance[productName] = {
                name: productName,
                count: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
                image: p.image_url
            };
        }
        productPerformance[productName].count += 1;
        productPerformance[productName].revenue += r;
        productPerformance[productName].cost += dopCost;
        productPerformance[productName].profit += profit;
    });

    const realizedProfit = realizedRevenue - realizedCost;
    const realizedMargin = realizedRevenue > 0 ? Math.round((realizedProfit / realizedRevenue) * 100) : 0;
    const roi = realizedCost > 0 ? Math.round((realizedProfit / realizedCost) * 100) : 0;
    const avgInventoryDays = productsWithDates > 0 ? Math.round(totalDaysToSell / productsWithDates) : 0;

    // Process Trend Chart Data (Last 6 months)
    const trendKeys = Object.keys(monthlyTrend).sort();
    const last6Keys = trendKeys.slice(-6);
    // If empty (no dates yet), show generic msg in UI.

    // Sort Grouped Products
    const sortedProducts = Object.values(productPerformance).sort((a, b) => b.profit - a.profit);

    // 2. Unsold Stats (Active Investment + Projected)
    const unsoldProducts = products.filter(p => p.status !== 'SOLD');
    let activeInvestment = 0;
    let projectedRevenue = 0;

    unsoldProducts.forEach(p => {
        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const dopCost = (usdCost * p.exchange_rate) + p.tax_cost + (p.local_shipping_cost || 0);
        activeInvestment += dopCost;
        if (p.sale_price && p.sale_price > 0) {
            projectedRevenue += p.sale_price;
        }
    });

    let activeCostPriced = 0;
    unsoldProducts.forEach(p => {
        if (p.sale_price && p.sale_price > 0) {
            const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
            const dopCost = (usdCost * p.exchange_rate) + p.tax_cost + (p.local_shipping_cost || 0);
            activeCostPriced += dopCost;
        }
    });

    const projectedProfit = projectedRevenue > 0 ? (projectedRevenue - activeInvestment) : 0;
    const trueProjectedProfit = projectedRevenue - activeCostPriced;

    // Platform Aggregation
    const platformStats: Record<string, { count: number, invested: number }> = {};
    let totalInvested = 0;

    products.forEach(p => {
        const usdCost = p.buy_price + p.shipping_cost + (p.origin_tax || 0);
        const dopCost = (usdCost * p.exchange_rate) + p.tax_cost + (p.local_shipping_cost || 0);
        totalInvested += dopCost;

        // Platform
        const pId = p.platform_id || 'unknown';
        if (!platformStats[pId]) platformStats[pId] = { count: 0, invested: 0 };
        platformStats[pId].count += 1;
        platformStats[pId].invested += dopCost;
    });

    const sortedPlatforms = Object.entries(platformStats)
        .map(([id, stats]) => {
            const platform = platforms.find(p => p.id === id);
            const name = platform ? platform.name : 'Otros / Desconocido';
            return { name, ...stats };
        })
        .sort((a, b) => b.invested - a.invested);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold bg-slate-50">Cargando análisis...</div>;

    if (totalItems === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center pb-24">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <BarChart3 className="text-slate-300" size={48} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Sin datos financieros</h2>
                <p className="text-slate-500 mb-6">Comienza a registrar tu inventario para ver la magia.</p>
                <button onClick={() => router.push('/calculator')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                    Registrar Primer Producto
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto shadow-2xl shadow-slate-200">
            <header className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between shadow-sm mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                        <BarChart3 size={18} />
                    </div>
                    <h1 className="text-lg font-black text-slate-800 tracking-tight sm:block">Estadísticas</h1>
                </div>

                <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                    <button onClick={() => changeMonth(-1)} className="p-0.5 text-slate-400 hover:text-slate-900 rounded hover:bg-white transition-all">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[11px] font-bold text-slate-700 capitalize w-16 text-center select-none leading-none">
                        {monthNames[currentMonth].substring(0, 3)}-{String(currentYear).slice(2)}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-0.5 text-slate-400 hover:text-slate-900 rounded hover:bg-white transition-all">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </header>

            <div className="p-4 space-y-6">

                {/* 1. MONTHLY GOAL (Wrapped for Consistency) */}
                <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Trophy size={14} /> Meta Mensual
                    </h3>
                    <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Progreso</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="text-2xl font-black">
                                            RD${Math.round(profitThisMonth).toLocaleString('en-US')}
                                            <span className="text-slate-500 text-lg mx-1">/</span>
                                        </div>

                                        {isEditingGoal ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={tempGoal}
                                                    onChange={(e) => setTempGoal(e.target.value)}
                                                    className="w-24 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-white text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                                <button onClick={handleSaveGoal} className="p-1.5 bg-emerald-500 rounded hover:bg-emerald-600 transition-colors">
                                                    <Save size={14} />
                                                </button>
                                                <button onClick={() => setIsEditingGoal(false)} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingGoal(true)}>
                                                <span className="text-slate-500 text-lg font-bold border-b border-dashed border-slate-700 group-hover:border-slate-400 transition-colors">
                                                    RD${monthlyGoal.toLocaleString('en-US')}
                                                </span>
                                                <Edit2 size={12} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-emerald-400">{Math.round((profitThisMonth / monthlyGoal) * 100)}%</span>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min((profitThisMonth / monthlyGoal) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
                                {profitThisMonth >= monthlyGoal ? '¡Meta Cumplida! 🎉' : `Faltan RD$${(monthlyGoal - profitThisMonth).toLocaleString('en-US')} para la meta.`}
                            </p>
                        </div>
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                            <Trophy size={120} />
                        </div>
                    </div>
                </section>

                {/* 2. TIME BREAKDOWN (Recap) */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wide flex items-center gap-2">
                        <Calendar size={14} /> Resumen de Ganancias
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 bg-slate-900 p-4 rounded-xl text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Histórico</span>
                                <div className="text-3xl font-black">RD${Math.round(realizedProfit).toLocaleString('en-US')}</div>
                                <div className="flex gap-3 mt-2">
                                    <span className="flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-emerald-300">
                                        Margen: {realizedMargin}%
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-blue-300">
                                        <Activity size={10} /> ROI: {roi}%
                                    </span>
                                </div>
                            </div>
                            {/* Sparkline Decor */}
                            <div className="absolute right-0 bottom-0 opacity-20 transform translate-y-4">
                                <TrendingUp size={80} />
                            </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Este Mes</span>
                            <div className="text-lg font-bold text-slate-800">RD${profitThisMonth > 0 ? Math.round(profitThisMonth).toLocaleString('en-US') : '0'}</div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Este Año</span>
                            <div className="text-lg font-bold text-slate-800">RD${Math.round(profitThisYear).toLocaleString('en-US')}</div>
                        </div>
                    </div>
                </section>

                {/* 3. COST BREAKDOWN (Donut Chart) */}
                <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wide flex items-center gap-2">
                        <PieChart size={14} /> Desglose de Inversión
                    </h3>
                    {/* Logic for Breakdown */}
                    {(() => {
                        let cProduct = 0; // buy_price
                        let cShipping = 0; // shipping
                        let cCourier = 0; // tax_cost + local

                        // Calculate from ALL products (Invested capital)


                        // Log adjustments for debugging
                        products.forEach(p => {
                            const ex = p.exchange_rate;
                            let productCost = p.buy_price * ex;

                            // Subtract adjustments from Product Cost
                            if (p.adjustments) {
                                p.adjustments.forEach(adj => {
                                    if (['CREDIT_CLAIM', 'REWARD_BACK'].includes(adj.type)) {
                                        productCost -= (adj.amount * ex); // Assuming amount is in USD if buy_price is USD. But double check if amount is USD or DOP.Usually adjustments match currency. Assuming conversion needed.
                                    }
                                });
                            }

                            cProduct += productCost;
                            cShipping += (p.shipping_cost * ex);
                            cCourier += p.tax_cost + (p.local_shipping_cost || 0) + ((p.origin_tax || 0) * ex);
                        });

                        const total = cProduct + cShipping + cCourier;
                        if (total === 0) return <div className="text-xs text-slate-400 text-center py-4">Sin datos de gastos.</div>

                        const pProduct = (cProduct / total) * 100;
                        const pShipping = (cShipping / total) * 100;
                        const pCourier = (cCourier / total) * 100;

                        return (
                            <div className="flex gap-4 items-center">
                                {/* Donut (CSS Conic Gradient) */}
                                <div className="relative w-24 h-24 shrink-0 rounded-full flex items-center justify-center transform -rotate-90"
                                    style={{
                                        background: `conic-gradient(
                                        #3b82f6 0% ${pProduct}%, 
                                        #f97316 ${pProduct}% ${pProduct + pShipping}%, 
                                        #a855f7 ${pProduct + pShipping}% 100%
                                     )` }}
                                >
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center transform rotate-90">
                                        <div className="text-[10px] font-bold text-slate-500 text-center leading-tight">
                                            Total<br />Inv.
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span className="text-[10px] font-bold text-slate-600">Productos ({Math.round(pProduct)}%)</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">RD${Math.round(cProduct).toLocaleString('en-US')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            <span className="text-[10px] font-bold text-slate-600">Envío USA ({Math.round(pShipping)}%)</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">RD${Math.round(cShipping).toLocaleString('en-US')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                            <span className="text-[10px] font-bold text-slate-600">Courier / Imp ({Math.round(pCourier)}%)</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">RD${Math.round(cCourier).toLocaleString('en-US')}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })()}
                </section>

                {/* 2. EFFICIENCY METRICS */}
                <section className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Timer size={12} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Velocidad</span>
                            </div>
                            <div className="text-xl font-black text-slate-800">
                                {avgInventoryDays} días
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 leading-tight font-medium">
                            Tiempo promedio en venderse.
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Target size={12} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Proyección</span>
                            </div>
                            <div className="text-xl font-black text-slate-800">
                                +${Math.round(trueProjectedProfit).toLocaleString()}
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 leading-tight font-medium">
                            Potencial del stock actual.
                        </p>
                    </div>
                </section>



                {/* 3. PLATFORM SPEND (Moved Higher & Compacted) */}
                <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Layers size={14} className="text-slate-400" />
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Inversión por Plataforma</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {sortedPlatforms.map((p) => {
                            const percent = (p.invested / totalInvested) * 100;
                            return (
                                <div key={p.name} className="flex flex-col">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                                        <span className="truncate">{p.name}</span>
                                        <span>{Math.round(percent)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-0.5">
                                        <div className="h-full bg-slate-800 rounded-full" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <div className="text-[9px] text-slate-400 text-right">
                                        RD${Math.round(p.invested).toLocaleString('en-US')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 4. TREND CHART (Simple Bar Visualization) */}
                {last6Keys.length > 0 && (
                    <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wide flex items-center gap-2">
                            <TrendingUp size={14} /> Tendencia (Últimos 6 meses)
                        </h3>
                        <div className="flex items-end justify-between h-32 gap-2">
                            {last6Keys.map(key => {
                                const val = monthlyTrend[key];
                                const max = Math.max(...Object.values(monthlyTrend));
                                const heightPct = max > 0 ? (val / max) * 100 : 0;
                                const [y, m] = key.split('-');
                                const monthName = new Date(Number(y), Number(m) - 1).toLocaleString('es-ES', { month: 'short' });

                                return (
                                    <div key={key} className="flex-1 flex flex-col items-center gap-1 group">
                                        <div className="text-[9px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-4 bg-white shadow-sm px-1 rounded border border-slate-100 mb-1 z-10 whitespace-nowrap">
                                            RD${Math.round(val).toLocaleString('en-US')}
                                        </div>
                                        <div
                                            className="w-full bg-slate-200 rounded-t-md hover:bg-blue-500 transition-colors cursor-help relative"
                                            style={{ height: `${Math.max(heightPct, 5)}%` }} // Min height 5%
                                        ></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{monthName}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* 4. PROFIT BY PRODUCT (Grouped) */}
                <section>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Package size={16} className="text-blue-500" />
                        Rentabilidad por Producto
                    </h3>
                    {sortedProducts.length === 0 ? (
                        <div className="text-center p-8 text-slate-400 text-sm italic bg-white rounded-xl border border-slate-100">
                            No hay ventas registradas aún.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedProducts.map((p, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                                    {/* Rank */}
                                    <div className="absolute top-0 right-0 bg-slate-100 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-bl-xl">
                                        #{idx + 1}
                                    </div>

                                    <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                                        {p.image ? (
                                            <img src={p.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Layers size={16} /></div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-sm truncate pr-6">{p.count > 1 ? `${p.count}x ` : ''}{p.name}</h4>
                                        <div className="flex gap-3 text-[10px] font-medium text-slate-500 mt-1">
                                            <span>Ingreso: <b className="text-slate-700">${Math.round(p.revenue).toLocaleString()}</b></span>
                                            <span className="text-emerald-600 font-bold">Mg: {Math.round(p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0)}%</span>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Ganancia</span>
                                        <span className="block text-lg font-black text-emerald-600">+${Math.round(p.profit).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 6. ALERTS (Huesos) */}
                {(() => {
                    const staleItems = products.filter(p => p.status !== 'SOLD' && p.created_at && ((new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 3600 * 24) > 60));
                    if (staleItems.length === 0) return null;

                    return (
                        <section className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                            <h3 className="text-xs font-bold text-orange-800 uppercase mb-3 tracking-wide flex items-center gap-2">
                                <Activity size={14} /> Alertas de Stock (+60 días)
                            </h3>
                            <div className="space-y-2">
                                {staleItems.slice(0, 3).map(p => (
                                    <div key={p.id} className="flex gap-3 items-center bg-white p-2 rounded-lg border border-orange-100 shadow-sm">
                                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center shrink-0 text-slate-300">
                                            {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover rounded" /> : <Package size={12} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-slate-700 truncate">{p.name || 'Sin nombre'}</div>
                                            <div className="text-[9px] text-orange-600 font-bold">
                                                {Math.round((new Date().getTime() - new Date(p.created_at!).getTime()) / (1000 * 3600 * 24))} días en stock
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold text-slate-900">${p.sale_price || '?'}</div>
                                    </div>
                                ))}
                                {staleItems.length > 3 && (
                                    <div className="text-center text-[10px] text-orange-600 font-bold cursor-pointer mt-2">
                                        Ver {staleItems.length - 3} más...
                                    </div>
                                )}
                            </div>
                        </section>
                    );
                })()}

            </div>
        </div>
    );
}
