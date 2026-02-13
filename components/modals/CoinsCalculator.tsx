'use client';

import { useState, useEffect } from 'react';
import { X, Coins, Target, Plus, Trash2, Gift, ShoppingCart, Star, DollarSign, Package, TrendingUp } from 'lucide-react';

interface CoinsCalculatorProps {
    onClose: () => void;
}

type Moneda = 'USD' | 'DOP';

interface Pedido {
    id: string;
    nombre: string;
    gasto: number;
    moneda: Moneda;
    tasaOverride: string; // '' = usar global
    precioVentaRD: number;
    pesoLibras: number;
}

export const CoinsCalculator: React.FC<CoinsCalculatorProps> = ({ onClose }) => {
    // --- CONFIG GLOBAL ---
    const [recompensa, setRecompensa] = useState<string>('0');
    const [metaMonedas, setMetaMonedas] = useState<string>('0');
    const [bonoInicial, setBonoInicial] = useState<string>('0');
    const [tasaGlobal1, setTasaGlobal1] = useState<string>('1.1');
    const [tasaGlobal2, setTasaGlobal2] = useState<string>('2.1');
    const [tasaDolar, setTasaDolar] = useState<string>('61');
    const [precioPorLibra, setPrecioPorLibra] = useState<string>('0');
    const [presupuesto, setPresupuesto] = useState<string>('0'); // Presupuesto total en USD

    // --- PEDIDOS ---
    const [pedidos, setPedidos] = useState<Pedido[]>([
        { id: '1', nombre: '1er Pedido', gasto: 0, moneda: 'USD', tasaOverride: '', precioVentaRD: 0, pesoLibras: 0 }
    ]);

    // --- PERSISTENCIA ---
    useEffect(() => {
        const saved = localStorage.getItem('coinsCalcState_v2');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.recompensa !== undefined) setRecompensa(state.recompensa);
                if (state.metaMonedas !== undefined) setMetaMonedas(state.metaMonedas);
                if (state.bonoInicial !== undefined) setBonoInicial(state.bonoInicial);
                if (state.tasaGlobal1 !== undefined) setTasaGlobal1(state.tasaGlobal1);
                if (state.tasaGlobal2 !== undefined) setTasaGlobal2(state.tasaGlobal2);
                if (state.tasaDolar !== undefined) setTasaDolar(state.tasaDolar);
                if (state.precioPorLibra !== undefined) setPrecioPorLibra(state.precioPorLibra);
                if (state.presupuesto !== undefined) setPresupuesto(state.presupuesto);
                if (state.pedidos) setPedidos(state.pedidos);
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        const state = { recompensa, metaMonedas, bonoInicial, tasaGlobal1, tasaGlobal2, tasaDolar, precioPorLibra, presupuesto, pedidos };
        localStorage.setItem('coinsCalcState_v2', JSON.stringify(state));
    }, [recompensa, metaMonedas, bonoInicial, tasaGlobal1, tasaGlobal2, tasaDolar, precioPorLibra, presupuesto, pedidos]);

    // --- HELPERS ---
    const agregarPedido = () => {
        setPedidos([...pedidos, {
            id: Date.now().toString(),
            nombre: `Pedido ${pedidos.length + 1}`,
            gasto: 0,
            moneda: 'USD',
            tasaOverride: '',
            precioVentaRD: 0,
            pesoLibras: 0
        }]);
    };
    const eliminarPedido = (id: string) => { if (pedidos.length > 1) setPedidos(pedidos.filter(p => p.id !== id)); };
    const updatePedido = (id: string, field: keyof Pedido, value: any) => {
        setPedidos(pedidos.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    // --- CÁLCULO ---
    const calcular = () => {
        const reward = parseFloat(recompensa) || 0;
        const target = parseFloat(metaMonedas) || 0;
        const bono = parseFloat(bonoInicial) || 0;
        const t1 = parseFloat(tasaGlobal1) || 1.1;
        const t2 = parseFloat(tasaGlobal2) || 2.1;
        const rate = parseFloat(tasaDolar) || 61;
        const priceLb = parseFloat(precioPorLibra) || 0;
        const budget = parseFloat(presupuesto) || 0;

        let totalMonedas = bono;
        let gastoTotalUS = 0;
        let totalVentasRD = 0;
        let totalPeso = 0;
        const desglose: { nombre: string; gastoUS: number; tasa: number; monedas: number; esPrimero: boolean; ventaRD: number; courierRD: number }[] = [];

        pedidos.forEach((p, index) => {
            const gasto = p.gasto || 0;
            const gastoUS = p.moneda === 'USD' ? gasto : gasto / rate;
            const esPrimero = index === 0;
            const tasaEfectiva = p.tasaOverride !== '' ? (parseFloat(p.tasaOverride) || 0) : (esPrimero ? t1 : t2);
            const monedas = gastoUS * tasaEfectiva;
            const courierRD = (p.pesoLibras || 0) * priceLb;

            totalMonedas += monedas;
            gastoTotalUS += gastoUS;
            totalVentasRD += p.precioVentaRD || 0;
            totalPeso += p.pesoLibras || 0;

            desglose.push({
                nombre: p.nombre,
                gastoUS,
                tasa: tasaEfectiva,
                monedas,
                esPrimero,
                ventaRD: p.precioVentaRD || 0,
                courierRD
            });
        });

        const monedasFaltantes = Math.max(0, target - totalMonedas);
        const progressPercent = target > 0 ? Math.min((totalMonedas / target) * 100, 100) : 0;
        const isComplete = totalMonedas >= target && target > 0;
        const costoParaCompletar = monedasFaltantes > 0 ? monedasFaltantes / t2 : 0;

        // Financiero
        const totalCourierRD = totalPeso * priceLb;
        const totalMercanciaRD = gastoTotalUS * rate;
        const inversionTotalRD = totalMercanciaRD + totalCourierRD;
        const gananciaNetaRD = totalVentasRD - inversionTotalRD;

        // Budget progress
        const budgetSpent = gastoTotalUS;
        const budgetRemaining = Math.max(0, budget - budgetSpent);
        const budgetProgress = budget > 0 ? Math.min((budgetSpent / budget) * 100, 100) : 0;

        return {
            totalMonedas: totalMonedas.toFixed(1),
            monedasFaltantes: monedasFaltantes.toFixed(1),
            gastoTotalUS: gastoTotalUS.toFixed(2),
            progressPercent,
            isComplete,
            desglose,
            bono,
            costoParaCompletar: costoParaCompletar.toFixed(2),
            gastoTotalConCompletar: (gastoTotalUS + costoParaCompletar).toFixed(2),
            gananciaProyectadaUS: (reward - gastoTotalUS - costoParaCompletar).toFixed(2),
            gananciaActualUS: (reward - gastoTotalUS).toFixed(2),
            // Financiero RD
            totalMercanciaRD: totalMercanciaRD.toFixed(2),
            totalCourierRD: totalCourierRD.toFixed(2),
            inversionTotalRD: inversionTotalRD.toFixed(2),
            totalVentasRD: totalVentasRD.toFixed(2),
            gananciaNetaRD: gananciaNetaRD.toFixed(2),
            totalPeso: totalPeso.toFixed(1),
            // Budget
            budgetSpent: budgetSpent.toFixed(2),
            budgetRemaining: budgetRemaining.toFixed(2),
            budgetProgress,
            rate
        };
    };

    const result = calcular();

    return (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 w-full sm:max-w-md md:max-w-xl max-h-[95vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">

                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-yellow-500 px-4 py-3 flex items-center justify-between shrink-0 z-10">
                    <div className="flex items-center gap-2">
                        <Coins className="text-yellow-100" size={20} />
                        <div>
                            <h2 className="text-sm font-bold text-white leading-none">Calculadora de Monedas</h2>
                            <span className="text-[10px] text-yellow-100/80">Juego de Coins v2.0</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-amber-700/50 p-1.5 rounded-full text-yellow-100 hover:text-white hover:bg-amber-700 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">

                    {/* Config Global */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                        <div className="bg-amber-50/50 px-3 py-2 border-b border-amber-100 flex justify-between items-center">
                            <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
                                <Target size={14} className="text-amber-600" /> Configuración del Juego
                            </h3>
                        </div>
                        <div className="p-3 space-y-3">
                            {/* Recompensa y Meta */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] text-amber-800/70 font-black uppercase mb-1 block">
                                        <Gift size={10} className="inline mr-1" />Recompensa ($)
                                    </label>
                                    <input type="number" value={recompensa} onChange={(e) => setRecompensa(e.target.value)}
                                        className="w-full border-2 border-amber-100 bg-amber-50/30 rounded-lg px-3 py-2 text-lg font-black text-amber-600 outline-none focus:border-amber-300 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-amber-800/70 font-black uppercase mb-1 block">
                                        <Star size={10} className="inline mr-1" />Meta Monedas
                                    </label>
                                    <input type="number" value={metaMonedas} onChange={(e) => setMetaMonedas(e.target.value)}
                                        className="w-full border-2 border-amber-100 bg-amber-50/30 rounded-lg px-3 py-2 text-lg font-black text-amber-600 outline-none focus:border-amber-300 transition-colors" />
                                </div>
                            </div>

                            {/* Bono y Tasas */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[9px] text-slate-400 font-black uppercase mb-1 block">Bono Inicial</label>
                                    <input type="number" value={bonoInicial} onChange={(e) => setBonoInicial(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 font-bold text-slate-700 outline-none focus:ring-1 focus:ring-amber-500" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-emerald-600 font-black uppercase mb-1 block">Tasa 1 (1er)</label>
                                    <input type="number" step="0.1" value={tasaGlobal1} onChange={(e) => setTasaGlobal1(e.target.value)}
                                        className="w-full bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5 text-center font-bold text-emerald-700 outline-none focus:ring-1 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-blue-600 font-black uppercase mb-1 block">Tasa 2 (2do+)</label>
                                    <input type="number" step="0.1" value={tasaGlobal2} onChange={(e) => setTasaGlobal2(e.target.value)}
                                        className="w-full bg-blue-50 border border-blue-100 rounded px-2 py-1.5 text-center font-bold text-blue-700 outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                            </div>

                            {/* Divisa, Courier, Presupuesto */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[9px] text-violet-600 font-black uppercase mb-1 block">
                                        <DollarSign size={10} className="inline" /> Tasa USD
                                    </label>
                                    <input type="number" step="0.01" value={tasaDolar} onChange={(e) => setTasaDolar(e.target.value)}
                                        className="w-full bg-violet-50 border border-violet-100 rounded px-2 py-1.5 text-center font-bold text-violet-700 outline-none focus:ring-1 focus:ring-violet-500" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-cyan-600 font-black uppercase mb-1 block">
                                        <Package size={10} className="inline" /> RD$/Lb
                                    </label>
                                    <input type="number" step="0.01" value={precioPorLibra} onChange={(e) => setPrecioPorLibra(e.target.value)}
                                        className="w-full bg-cyan-50 border border-cyan-100 rounded px-2 py-1.5 text-center font-bold text-cyan-700 outline-none focus:ring-1 focus:ring-cyan-500" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-rose-600 font-black uppercase mb-1 block">Presupuesto $</label>
                                    <input type="number" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)}
                                        className="w-full bg-rose-50 border border-rose-100 rounded px-2 py-1.5 text-center font-bold text-rose-700 outline-none focus:ring-1 focus:ring-rose-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progreso de Monedas */}
                    <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-3 text-xs">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold text-amber-900/70 uppercase tracking-wider flex items-center gap-1">
                                <Coins size={12} /> Meta Monedas
                            </span>
                            <div className={`text-sm font-black ${result.isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {result.isComplete ? '¡META LOGRADA! 🎉' : `Faltan ${result.monedasFaltantes}`}
                            </div>
                        </div>
                        <div className="w-full bg-amber-100 rounded-full h-3 mb-1 shadow-inner">
                            <div className={`h-full rounded-full transition-all duration-500 shadow-sm ${result.isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-yellow-500'}`}
                                style={{ width: `${result.progressPercent}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-400">
                            <span>{result.bono > 0 ? `Bono: ${result.bono}` : '0'}</span>
                            <span>{result.totalMonedas} / {metaMonedas}</span>
                        </div>
                        {!result.isComplete && parseFloat(result.costoParaCompletar) > 0 && (
                            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 text-[10px] text-amber-800">
                                <span className="font-bold">💡 Para completar:</span> Gastar <span className="font-black">${result.costoParaCompletar}</span> más
                                → Ganancia proyectada: <span className={`font-black ${parseFloat(result.gananciaProyectadaUS) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>${result.gananciaProyectadaUS}</span>
                            </div>
                        )}
                    </div>

                    {/* Budget Progress */}
                    {parseFloat(presupuesto) > 0 && (
                        <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-3 text-xs">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[10px] font-bold text-rose-900/70 uppercase tracking-wider flex items-center gap-1">
                                    <DollarSign size={12} /> Presupuesto
                                </span>
                                <div className="text-sm font-black text-rose-600">
                                    Falta ${result.budgetRemaining}
                                </div>
                            </div>
                            <div className="w-full bg-rose-100 rounded-full h-3 mb-1 shadow-inner">
                                <div className={`h-full rounded-full transition-all duration-500 shadow-sm ${parseFloat(result.budgetRemaining) <= 0 ? 'bg-emerald-500' : 'bg-gradient-to-r from-rose-400 to-pink-500'}`}
                                    style={{ width: `${result.budgetProgress}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                <span>Gastado: ${result.budgetSpent}</span>
                                <span>${result.budgetSpent} / ${presupuesto}</span>
                            </div>
                        </div>
                    )}

                    {/* Pedidos */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-1.5">
                                <ShoppingCart size={14} className="text-amber-500" /> Pedidos ({pedidos.length})
                            </h3>
                            <button onClick={agregarPedido} className="bg-amber-500 text-white rounded-full p-1 hover:bg-amber-600 active:scale-95 transition-all"><Plus size={14} /></button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {pedidos.map((p, index) => {
                                const esPrimero = index === 0;
                                const rate = parseFloat(tasaDolar) || 61;
                                const gastoUS = p.moneda === 'USD' ? (p.gasto || 0) : (p.gasto || 0) / rate;
                                const tasaEfectiva = p.tasaOverride !== '' ? (parseFloat(p.tasaOverride) || 0) : (esPrimero ? parseFloat(tasaGlobal1) || 1.1 : parseFloat(tasaGlobal2) || 2.1);
                                const monedasPedido = gastoUS * tasaEfectiva;
                                const courierRD = (p.pesoLibras || 0) * (parseFloat(precioPorLibra) || 0);
                                return (
                                    <div key={p.id} className={`p-3 transition-colors ${esPrimero ? 'bg-emerald-50/30 border-l-4 border-emerald-400' : 'bg-white hover:bg-slate-50 border-l-4 border-blue-300'}`}>
                                        {/* Header row */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${esPrimero ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {esPrimero ? '1ER' : `${index + 1}DO`}
                                            </span>
                                            <input type="text" value={p.nombre}
                                                onChange={(e) => updatePedido(p.id, 'nombre', e.target.value)}
                                                className="flex-1 font-bold text-slate-800 outline-none border-b border-transparent focus:border-amber-300 bg-transparent text-xs" />
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                                                +{monedasPedido.toFixed(1)} 🪙
                                            </span>
                                            <button onClick={() => eliminarPedido(p.id)} className="text-slate-300 hover:text-rose-500 shrink-0"><Trash2 size={14} /></button>
                                        </div>

                                        {/* Gasto + Moneda + Tasa */}
                                        <div className="grid grid-cols-12 gap-1.5 mb-1.5">
                                            <div className="col-span-5">
                                                <input type="number" placeholder="0.00" value={p.gasto || ''}
                                                    onChange={(e) => updatePedido(p.id, 'gasto', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 font-bold text-slate-700 outline-none focus:border-amber-400" />
                                                <label className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">Gasto</label>
                                            </div>
                                            <div className="col-span-3">
                                                <div onClick={() => updatePedido(p.id, 'moneda', p.moneda === 'USD' ? 'DOP' : 'USD')}
                                                    className={`cursor-pointer h-[34px] flex items-center justify-center rounded font-black text-[10px] border select-none ${p.moneda === 'USD' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-violet-50 border-violet-200 text-violet-700'}`}>
                                                    {p.moneda === 'USD' ? '🇺🇸 USD' : '🇩🇴 DOP'}
                                                </div>
                                                <label className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block text-center">Moneda</label>
                                            </div>
                                            <div className="col-span-4">
                                                <div className="flex">
                                                    <input type="number" step="0.1"
                                                        placeholder={esPrimero ? tasaGlobal1 : tasaGlobal2}
                                                        value={p.tasaOverride}
                                                        onChange={(e) => updatePedido(p.id, 'tasaOverride', e.target.value)}
                                                        className={`w-full border rounded-l px-2 py-1.5 font-bold outline-none text-center ${esPrimero ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`} />
                                                    {p.tasaOverride !== '' && (
                                                        <button onClick={() => updatePedido(p.id, 'tasaOverride', '')}
                                                            className="px-1.5 text-[8px] font-black border-y border-r rounded-r bg-slate-100 text-slate-500 hover:bg-slate-200">↻</button>
                                                    )}
                                                </div>
                                                <label className={`text-[8px] font-bold uppercase mt-0.5 block text-center ${esPrimero ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                    Tasa {p.tasaOverride !== '' ? '✏️' : '🌐'}
                                                </label>
                                            </div>
                                        </div>

                                        {/* Venta + Peso */}
                                        <div className="grid grid-cols-12 gap-1.5">
                                            <div className="col-span-6">
                                                <input type="number" placeholder="0" value={p.precioVentaRD || ''}
                                                    onChange={(e) => updatePedido(p.id, 'precioVentaRD', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-emerald-50/50 border border-emerald-100 rounded px-2 py-1.5 font-bold text-emerald-700 outline-none focus:border-emerald-400" />
                                                <label className="text-[8px] text-emerald-500 font-bold uppercase mt-0.5 block">Venta RD$</label>
                                            </div>
                                            <div className="col-span-6">
                                                <div className="flex gap-1">
                                                    <input type="number" step="0.1" placeholder="0" value={p.pesoLibras || ''}
                                                        onChange={(e) => updatePedido(p.id, 'pesoLibras', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-cyan-50/50 border border-cyan-100 rounded px-2 py-1.5 font-bold text-cyan-700 outline-none focus:border-cyan-400" />
                                                    {courierRD > 0 && (
                                                        <span className="text-[8px] font-bold text-cyan-600 bg-cyan-50 px-1 py-0.5 rounded self-center shrink-0 whitespace-nowrap">
                                                            RD${courierRD.toFixed(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <label className="text-[8px] text-cyan-500 font-bold uppercase mt-0.5 block">Peso (Lbs)</label>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desglose de Monedas */}
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-amber-700 font-bold uppercase text-[10px] tracking-wider border-b border-amber-200 pb-1 mb-1">
                            <span>Desglose de Monedas</span>
                            <span>Coins</span>
                        </div>

                        {parseFloat(bonoInicial) > 0 && (
                            <div className="flex justify-between items-center text-amber-700">
                                <span>🎁 Bono Inicial</span>
                                <span className="font-mono font-bold">+{parseFloat(bonoInicial).toFixed(1)}</span>
                            </div>
                        )}

                        {result.desglose.map((d, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-slate-600">
                                    <span className={`text-[8px] font-black px-1 py-0.5 rounded mr-1 ${d.esPrimero ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {d.esPrimero ? '1ER' : `${i + 1}DO`}
                                    </span>
                                    {d.nombre} (${d.gastoUS.toFixed(2)} × {d.tasa})
                                </span>
                                <span className="font-mono font-bold text-amber-800">+{d.monedas.toFixed(1)}</span>
                            </div>
                        ))}

                        <div className="border-t border-amber-300 pt-1 mt-1 flex justify-between items-center">
                            <span className="font-black text-amber-900 uppercase">Total Monedas</span>
                            <span className="font-black text-amber-900">{result.totalMonedas} / {metaMonedas}</span>
                        </div>
                    </div>

                    {/* Resumen Financiero */}
                    <div className="bg-slate-100 rounded-xl border border-slate-200 p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 pb-1 mb-1">
                            <span>Resumen Financiero (RD$)</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Mercancía (${result.gastoTotalUS} × {tasaDolar})</span>
                            <span className="font-mono font-bold text-slate-700">RD${result.totalMercanciaRD}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Courier ({result.totalPeso} lbs × RD${precioPorLibra})</span>
                            <span className="font-mono font-bold text-slate-700">RD${result.totalCourierRD}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-200 pt-1">
                            <span className="font-bold text-slate-800">Inversión Total</span>
                            <span className="font-mono font-black text-slate-900">RD${result.inversionTotalRD}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-emerald-700 font-bold">Ventas Totales</span>
                            <span className="font-mono font-bold text-emerald-700">RD${result.totalVentasRD}</span>
                        </div>

                        <div className="border-t border-slate-300 pt-1 mt-1 flex justify-between items-center">
                            <span className="font-black text-slate-900 uppercase">Ganancia Neta</span>
                            <span className={`font-black text-sm ${parseFloat(result.gananciaNetaRD) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                RD${result.gananciaNetaRD}
                            </span>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-white border-t border-slate-200 p-3 z-20 shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Monedas</div>
                            <div className={`text-lg font-black leading-none ${result.isComplete ? 'text-emerald-600' : 'text-amber-500'}`}>
                                {result.totalMonedas} 🪙
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Ganancia RD$</div>
                            <div className={`text-lg font-black leading-none ${parseFloat(result.gananciaNetaRD) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                RD${result.gananciaNetaRD}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Ganancia {result.isComplete ? '' : 'Proy.'} US$</div>
                            <div className={`text-lg font-black leading-none ${parseFloat(result.isComplete ? result.gananciaActualUS : result.gananciaProyectadaUS) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ${result.isComplete ? result.gananciaActualUS : result.gananciaProyectadaUS}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
