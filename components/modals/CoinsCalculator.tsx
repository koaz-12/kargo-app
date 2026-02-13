'use client';

import { useState, useEffect } from 'react';
import { X, Coins, Target, Plus, Trash2, ChevronDown, Gift, ShoppingCart, TrendingUp, Star } from 'lucide-react';

interface CoinsCalculatorProps {
    onClose: () => void;
}

interface Pedido {
    id: string;
    nombre: string;
    gasto: number;
    tasaOverride: string; // '' = usar global
}

export const CoinsCalculator: React.FC<CoinsCalculatorProps> = ({ onClose }) => {
    // --- CONFIG GLOBAL ---
    const [recompensa, setRecompensa] = useState<string>('0');
    const [metaMonedas, setMetaMonedas] = useState<string>('0');
    const [bonoInicial, setBonoInicial] = useState<string>('0');
    const [tasaGlobal1, setTasaGlobal1] = useState<string>('1.1');
    const [tasaGlobal2, setTasaGlobal2] = useState<string>('2.1');

    // --- PEDIDOS ---
    const [pedidos, setPedidos] = useState<Pedido[]>([
        { id: '1', nombre: '1er Pedido', gasto: 0, tasaOverride: '' }
    ]);

    // --- PERSISTENCIA ---
    useEffect(() => {
        const saved = localStorage.getItem('coinsCalcState_v1');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.recompensa) setRecompensa(state.recompensa);
                if (state.metaMonedas) setMetaMonedas(state.metaMonedas);
                if (state.bonoInicial) setBonoInicial(state.bonoInicial);
                if (state.tasaGlobal1) setTasaGlobal1(state.tasaGlobal1);
                if (state.tasaGlobal2) setTasaGlobal2(state.tasaGlobal2);
                if (state.pedidos) setPedidos(state.pedidos);
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        const state = { recompensa, metaMonedas, bonoInicial, tasaGlobal1, tasaGlobal2, pedidos };
        localStorage.setItem('coinsCalcState_v1', JSON.stringify(state));
    }, [recompensa, metaMonedas, bonoInicial, tasaGlobal1, tasaGlobal2, pedidos]);

    // --- HELPERS ---
    const agregarPedido = () => {
        setPedidos([...pedidos, {
            id: Date.now().toString(),
            nombre: `Pedido ${pedidos.length + 1}`,
            gasto: 0,
            tasaOverride: ''
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

        let totalMonedas = bono;
        let gastoTotal = 0;
        const desglose: { nombre: string; gasto: number; tasa: number; monedas: number; esPrimero: boolean }[] = [];

        pedidos.forEach((p, index) => {
            const gasto = p.gasto || 0;
            const esPrimero = index === 0;
            // Usar tasa override si existe, si no usar global
            const tasaEfectiva = p.tasaOverride !== '' ? (parseFloat(p.tasaOverride) || 0) : (esPrimero ? t1 : t2);
            const monedas = gasto * tasaEfectiva;

            totalMonedas += monedas;
            gastoTotal += gasto;

            desglose.push({
                nombre: p.nombre,
                gasto,
                tasa: tasaEfectiva,
                monedas,
                esPrimero
            });
        });

        const monedasFaltantes = Math.max(0, target - totalMonedas);
        const ganancia = reward - gastoTotal;
        const progressPercent = target > 0 ? Math.min((totalMonedas / target) * 100, 100) : 0;
        const isComplete = totalMonedas >= target && target > 0;

        // ¿Cuánto más necesita gastar con tasa2 para completar?
        const costoParaCompletar = monedasFaltantes > 0 ? monedasFaltantes / t2 : 0;

        return {
            totalMonedas: totalMonedas.toFixed(1),
            monedasFaltantes: monedasFaltantes.toFixed(1),
            gastoTotal: gastoTotal.toFixed(2),
            ganancia: ganancia.toFixed(2),
            progressPercent,
            isComplete,
            desglose,
            bono,
            costoParaCompletar: costoParaCompletar.toFixed(2),
            gastoTotalConCompletar: (gastoTotal + costoParaCompletar).toFixed(2),
            gananciaProyectada: (reward - gastoTotal - costoParaCompletar).toFixed(2)
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
                            <span className="text-[10px] text-yellow-100/80">Juego de Coins v1.0</span>
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
                        <div className="p-3">
                            {/* Recompensa y Meta */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
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

                            {/* Bono y Tasas Globales */}
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
                        </div>
                    </div>

                    {/* Progreso de Monedas */}
                    <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-3 text-xs">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold text-amber-900/70 uppercase tracking-wider flex items-center gap-1">
                                <Coins size={12} /> Progreso de Monedas
                            </span>
                            <div className={`text-sm font-black ${result.isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {result.isComplete ? '¡META LOGRADA! 🎉' : `Faltan ${result.monedasFaltantes} coins`}
                            </div>
                        </div>
                        <div className="w-full bg-amber-100 rounded-full h-3 mb-1 shadow-inner">
                            <div className={`h-full rounded-full transition-all duration-500 shadow-sm ${result.isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-yellow-500'}`}
                                style={{ width: `${result.progressPercent}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-400">
                            <span>{result.bono > 0 ? `Bono: ${result.bono}` : '0'}</span>
                            <span>Ganadas: {result.totalMonedas} / {metaMonedas}</span>
                            <span>100%</span>
                        </div>
                        {!result.isComplete && parseFloat(result.costoParaCompletar) > 0 && (
                            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 text-[10px] text-amber-800">
                                <span className="font-bold">💡 Para completar:</span> Gastar <span className="font-black">${result.costoParaCompletar}</span> más con tasa {tasaGlobal2}
                                → Gasto total proyectado: <span className="font-black">${result.gastoTotalConCompletar}</span>
                                → Ganancia proyectada: <span className={`font-black ${parseFloat(result.gananciaProyectada) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>${result.gananciaProyectada}</span>
                            </div>
                        )}
                    </div>

                    {/* Pedidos */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-1.5">
                                <ShoppingCart size={14} className="text-amber-500" /> Pedidos
                            </h3>
                            <button onClick={agregarPedido} className="bg-amber-500 text-white rounded-full p-1 hover:bg-amber-600 active:scale-95 transition-all"><Plus size={14} /></button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {pedidos.map((p, index) => {
                                const esPrimero = index === 0;
                                const tasaEfectiva = p.tasaOverride !== '' ? (parseFloat(p.tasaOverride) || 0) : (esPrimero ? parseFloat(tasaGlobal1) || 1.1 : parseFloat(tasaGlobal2) || 2.1);
                                const monedasPedido = (p.gasto || 0) * tasaEfectiva;
                                return (
                                    <div key={p.id} className={`p-3 transition-colors ${esPrimero ? 'bg-emerald-50/30 border-l-4 border-emerald-400' : 'bg-white hover:bg-slate-50 border-l-4 border-blue-300'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {/* Badge 1er/2do Pedido */}
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${esPrimero ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {esPrimero ? '1ER' : `${index + 1}DO`}
                                            </span>
                                            <input
                                                type="text"
                                                value={p.nombre}
                                                onChange={(e) => updatePedido(p.id, 'nombre', e.target.value)}
                                                className="flex-1 font-bold text-slate-800 placeholder-slate-300 outline-none border-b border-transparent focus:border-amber-300 bg-transparent text-xs"
                                            />
                                            {/* Monedas ganadas en este pedido */}
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                                                +{monedasPedido.toFixed(1)} 🪙
                                            </span>
                                            <button onClick={() => eliminarPedido(p.id)} className="text-slate-300 hover:text-rose-500 shrink-0"><Trash2 size={14} /></button>
                                        </div>

                                        <div className="grid grid-cols-12 gap-2">
                                            <div className="col-span-6">
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={p.gasto || ''}
                                                    onChange={(e) => updatePedido(p.id, 'gasto', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 font-bold text-slate-700 outline-none focus:border-amber-400 focus:bg-white transition-colors"
                                                />
                                                <label className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">Gasto ($)</label>
                                            </div>
                                            <div className="col-span-6">
                                                <div className="flex">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder={esPrimero ? tasaGlobal1 : tasaGlobal2}
                                                        value={p.tasaOverride}
                                                        onChange={(e) => updatePedido(p.id, 'tasaOverride', e.target.value)}
                                                        className={`w-full border rounded-l px-2 py-1.5 font-bold outline-none text-center transition-colors ${esPrimero ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:border-emerald-400' : 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-400'}`}
                                                    />
                                                    {p.tasaOverride !== '' && (
                                                        <button
                                                            onClick={() => updatePedido(p.id, 'tasaOverride', '')}
                                                            className="px-1.5 text-[8px] font-black border-y border-r rounded-r bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                                            title="Usar tasa global"
                                                        >
                                                            ↻
                                                        </button>
                                                    )}
                                                </div>
                                                <label className="text-[8px] font-bold uppercase mt-0.5 block flex items-center gap-1 ${esPrimero ? 'text-emerald-500' : 'text-blue-500'}">
                                                    <span className={esPrimero ? 'text-emerald-500' : 'text-blue-500'}>
                                                        Tasa {p.tasaOverride !== '' ? '(custom)' : '(global)'}
                                                    </span>
                                                </label>
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
                                    {d.nombre} (${d.gasto.toFixed(2)} × {d.tasa})
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
                    <div className="bg-slate-100 rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 pb-1 mb-1">
                            <span>Resumen Financiero</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Recompensa</span>
                            <span className="font-mono font-bold text-emerald-700">${recompensa}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Gasto Total Actual</span>
                            <span className="font-mono font-bold text-slate-800">-${result.gastoTotal}</span>
                        </div>

                        <div className="border-t border-slate-300 pt-1 mt-1 flex justify-between items-center">
                            <span className="font-black text-slate-900 uppercase">Ganancia Actual</span>
                            <span className={`font-black text-sm ${parseFloat(result.ganancia) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ${result.ganancia}
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
                        <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Ganancia {result.isComplete ? 'Actual' : 'Proyectada'}</div>
                            <div className={`text-2xl font-black leading-none ${parseFloat(result.isComplete ? result.ganancia : result.gananciaProyectada) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ${result.isComplete ? result.ganancia : result.gananciaProyectada}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
