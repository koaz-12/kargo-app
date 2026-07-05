'use client';
import { toast } from 'sonner';
import { useStats } from '../../hooks/useStats';
import { BarChart3, PieChart, TrendingUp, DollarSign, Wallet, ArrowLeft, Layers, Trophy, Target, Calendar, Package, Activity, Timer, Edit2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateProfit } from '../../utils/calculateProfit';
import { getPublicUrl } from '../../utils/imageUrl';

export default function StatsPage() {
    const router = useRouter();
    
    const {
        loading,
        products,
        platforms,
        monthlyGoal,
        tempGoal,
        isEditingGoal,
        selectedDate,
        rentabilityPage,
        RENTABILITY_ITEMS_PER_PAGE,
        currentMonthKey,
        monthNames,
        
        setTempGoal,
        setIsEditingGoal,
        changeMonth,
        setRentabilityPage,
        handleSaveGoal,

        totalItems,
        realizedRevenue,
        realizedCost,
        profitThisMonth,
        profitThisYear,
        monthlyTrend,
        realizedProfit,
        realizedMargin,
        roi,
        avgInventoryDays,
        last6Keys,
        sortedProducts,
        activeInvestment,
        projectedRevenue,
        trueProjectedProfit,
        platformStats,
        totalInvested,
        staleItems,
    } = useStats();

    const onSaveGoal = async () => {
        const res = await handleSaveGoal();
        if (res.success) {
            toast.success("Meta guardada con éxito");
        } else {
            toast.error("No se pudo guardar la meta.");
        }
    };

    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

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
        <div className="min-h-screen bg-slate-50/50 pb-28 max-w-md mx-auto relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 px-4 bg-slate-50/80 backdrop-blur-xl mb-4 border-b border-slate-200/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <BarChart3 size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Data</h1>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Métricas</p>
                    </div>
                </div>

                <div className="flex items-center gap-0.5 bg-white border border-slate-200/60 shadow-sm rounded-lg p-0.5">
                    <button onClick={() => changeMonth(-1)} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-all">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-bold text-slate-700 capitalize w-16 text-center select-none leading-none">
                        {monthNames[currentMonth].substring(0, 3)}-{String(currentYear).slice(2)}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-all">
                        <ChevronRight size={16} />
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
                                                <button onClick={onSaveGoal} className="p-1.5 bg-emerald-500 rounded hover:bg-emerald-600 transition-colors">
                                                    <Save size={14} />
                                                </button>
                                                <button onClick={() => setIsEditingGoal(false)} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingGoal(true)}>
                                                {monthlyGoal === 0 ? (
                                                    <div className="h-6 w-24 bg-slate-700 animate-pulse rounded"></div>
                                                ) : (
                                                    <span className="text-slate-500 text-lg font-bold border-b border-dashed border-slate-700 group-hover:border-slate-400 transition-colors">
                                                        RD${monthlyGoal.toLocaleString('en-US')}
                                                    </span>
                                                )}
                                                <Edit2 size={12} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-emerald-400">{Math.round((profitThisMonth / (monthlyGoal || 1)) * 100)}%</span>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min((profitThisMonth / (monthlyGoal || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
                                {monthlyGoal > 0 ? (
                                    profitThisMonth >= monthlyGoal ? '¡Meta Cumplida! 🎉' : `Faltan RD$${(monthlyGoal - profitThisMonth).toLocaleString('en-US')} para la meta.`
                                ) : 'Cargando meta...'}
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
                            const ex = p.exchange_rate || 58;

                            // 1. Base Product Cost (Price + US Tax) in DOP
                            // Adjustments (Credits) usually reduce the product cost base.
                            let productBaseUsd = p.buy_price + (p.origin_tax || 0);

                            if (p.adjustments) {
                                const totalAdjUsd = p.adjustments.reduce((acc, adj) => acc + adj.amount, 0);
                                productBaseUsd -= totalAdjUsd;
                            }

                            cProduct += (productBaseUsd * ex);

                            // 2. Shipping to Miami (USD)
                            cShipping += (p.shipping_cost * ex);

                            // 3. Courier & Import (DOP)
                            cCourier += p.tax_cost + (p.local_shipping_cost || 0);
                            // Note: calculateProfit puts local_shipping in profit calculation, not net_cost. 
                            // But usually "Inversion" means total cost to get it to customer? 
                            // If unsold, local_shipping might be 0. 
                            // Let's stick to Landing Cost (tax_cost) for Courier segment to be safe, 
                            // or include local_shipping if it's considered part of the expense profile.
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
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Package size={16} className="text-blue-500" />
                            Rentabilidad por Producto
                        </h3>
                        {sortedProducts.length > RENTABILITY_ITEMS_PER_PAGE && (
                            <span className="text-xs text-slate-500">
                                Pág. {rentabilityPage} de {Math.ceil(sortedProducts.length / RENTABILITY_ITEMS_PER_PAGE)}
                            </span>
                        )}
                    </div>
                    {sortedProducts.length === 0 ? (
                        <div className="text-center p-8 text-slate-400 text-sm italic bg-white rounded-xl border border-slate-100">
                            No hay ventas registradas aún.
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {sortedProducts
                                    .slice((rentabilityPage - 1) * RENTABILITY_ITEMS_PER_PAGE, rentabilityPage * RENTABILITY_ITEMS_PER_PAGE)
                                    .map((p, idx) => {
                                        const globalIdx = (rentabilityPage - 1) * RENTABILITY_ITEMS_PER_PAGE + idx;
                                        return (
                                            <div key={globalIdx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                                                {/* Rank */}
                                                <div className="absolute top-0 right-0 bg-slate-100 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-bl-xl">
                                                    #{globalIdx + 1}
                                                </div>

                                                <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                                                    {p.image ? (
                                                        <img src={p.image} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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
                                        );
                                    })}
                            </div>

                            {/* Pagination Controls */}
                            {sortedProducts.length > RENTABILITY_ITEMS_PER_PAGE && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <button
                                        onClick={() => setRentabilityPage(p => Math.max(1, p - 1))}
                                        disabled={rentabilityPage === 1}
                                        className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors bg-white"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm text-slate-600 font-medium min-w-[80px] text-center">
                                        {rentabilityPage} / {Math.ceil(sortedProducts.length / RENTABILITY_ITEMS_PER_PAGE)}
                                    </span>
                                    <button
                                        onClick={() => setRentabilityPage(p => Math.min(Math.ceil(sortedProducts.length / RENTABILITY_ITEMS_PER_PAGE), p + 1))}
                                        disabled={rentabilityPage === Math.ceil(sortedProducts.length / RENTABILITY_ITEMS_PER_PAGE)}
                                        className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors bg-white"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </>
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
                                            {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <Package size={12} />}
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
                                    <div className="text-center text-[10px] text-orange-600 font-bold mt-2">
                                        Ver {staleItems.length - 3} más en inventario...
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
