'use client';

import { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, TrendingUp, Package, Gift, Target, Sparkles, Plus, Trash2, ChevronDown, ChevronUp, Weight, AlertTriangle, Coins } from 'lucide-react';

interface PointsCalculatorProps {
    onClose: () => void;
}

type Moneda = 'USD' | 'DOP';

interface Articulo {
    id: string;
    nombre: string;
    costo: number;
    monedaCosto: Moneda;
    envioUS: number;
    aplicarTaxUS: boolean;
    pesoLibras: number;
    precioVentaRD: number;
    collapsed?: boolean;
}

interface Regalo {
    id: string;
    nombre: string;
    valorReferencia: number;
    monedaValor: Moneda;
    pesoLibras: number;
    precioVentaRD: number;
    activo: boolean; // Para marcar como opcional/inactivo
}

export const PointsCalculator: React.FC<PointsCalculatorProps> = ({ onClose }) => {
    // --- ESTADO GLOBAL ---
    const [tasaDolar, setTasaDolar] = useState<string>('60.50');
    const [precioPorLibra, setPrecioPorLibra] = useState<string>('193');
    const [taxUSA, setTaxUSA] = useState<string>('7'); // 7%
    const [arancelRD, setArancelRD] = useState<string>('38'); // 38%

    // Reglas del Evento (Cut Price)
    const [targetCut, setTargetCut] = useState<string>('30.57');
    const [rate1, setRate1] = useState<string>('150');
    const [limitFirst, setLimitFirst] = useState<string>('18.00');
    const [rate2, setRate2] = useState<string>('5');

    // Inventario y Regalos
    const [articulos, setArticulos] = useState<Articulo[]>([
        { id: '1', nombre: 'Artículo Principal', costo: 0, monedaCosto: 'USD', envioUS: 0, aplicarTaxUS: false, pesoLibras: 0, precioVentaRD: 0 }
    ]);

    const [regalos, setRegalos] = useState<Regalo[]>([
        { id: '1', nombre: 'Regalo 1', valorReferencia: 0, monedaValor: 'USD', pesoLibras: 0, precioVentaRD: 0, activo: true }
    ]);

    const [aplicarArancelSiExcede, setAplicarArancelSiExcede] = useState<boolean>(false);

    // --- PERSISTENCIA ---
    useEffect(() => {
        const saved = localStorage.getItem('resellerCalcState_v3_mobile');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.tasaDolar) setTasaDolar(state.tasaDolar);
                if (state.precioPorLibra) setPrecioPorLibra(state.precioPorLibra);
                if (state.taxUSA) setTaxUSA(state.taxUSA);
                if (state.arancelRD) setArancelRD(state.arancelRD);
                if (state.targetCut) setTargetCut(state.targetCut);
                if (state.rate1) setRate1(state.rate1);
                if (state.limitFirst) setLimitFirst(state.limitFirst);
                if (state.rate2) setRate2(state.rate2);
                if (state.articulos) setArticulos(state.articulos);
                if (state.regalos) setRegalos(state.regalos);
                if (state.aplicarArancelSiExcede !== undefined) setAplicarArancelSiExcede(state.aplicarArancelSiExcede);
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        const state = { tasaDolar, precioPorLibra, taxUSA, arancelRD, targetCut, rate1, limitFirst, rate2, articulos, regalos, aplicarArancelSiExcede };
        localStorage.setItem('resellerCalcState_v3_mobile', JSON.stringify(state));
    }, [tasaDolar, precioPorLibra, taxUSA, arancelRD, targetCut, rate1, limitFirst, rate2, articulos, regalos, aplicarArancelSiExcede]);

    // --- HELPERS LISTAS ---
    const agregarArticulo = () => {
        setArticulos([...articulos, {
            id: Date.now().toString(),
            nombre: `Item ${articulos.length + 1}`,
            costo: 0, monedaCosto: 'USD', envioUS: 0, aplicarTaxUS: false, pesoLibras: 0, precioVentaRD: 0
        }]);
    };
    const eliminarArticulo = (id: string) => { if (articulos.length > 1) setArticulos(articulos.filter(a => a.id !== id)); };
    const updateArticulo = (id: string, field: keyof Articulo, value: any) => { setArticulos(articulos.map(a => a.id === id ? { ...a, [field]: value } : a)); };

    const agregarRegalo = () => {
        setRegalos([...regalos, {
            id: Date.now().toString(),
            nombre: `Regalo ${regalos.length + 1}`,
            valorReferencia: 0, monedaValor: 'USD', pesoLibras: 0, precioVentaRD: 0, activo: true
        }]);
    };
    const eliminarRegalo = (id: string) => { setRegalos(regalos.filter(r => r.id !== id)); };
    const updateRegalo = (id: string, field: keyof Regalo, value: any) => { setRegalos(regalos.map(r => r.id === id ? { ...r, [field]: value } : r)); };

    // --- CORE LOGIC ---
    const calcular = () => {
        const rate = parseFloat(tasaDolar) || 60.50;
        const priceLb = parseFloat(precioPorLibra) || 193;
        const taxUSAPercent = parseFloat(taxUSA) || 7;
        const taxRDPercent = parseFloat(arancelRD) || 38;

        // 1. Reglas
        const target = parseFloat(targetCut) || 0;
        const limit1 = parseFloat(limitFirst) || 0;
        const r1 = (parseFloat(rate1) || 150) / 100;
        const r2 = (parseFloat(rate2) || 5) / 100;

        const cost1 = r1 > 0 ? limit1 / r1 : 0;
        const remainingTarget = target - limit1;
        const cost2 = (remainingTarget > 0 && r2 > 0) ? remainingTarget / r2 : 0;
        const requiredBudgetBase = cost1 + cost2; // USD

        // 2. Inventario
        let totalBaseCostUS = 0; // Para el juego (USD)
        let totalSpendConvertidoUS = 0; // Gasto real convertido a USD (Base + Tax + Envio)
        let totalWeightInv = 0;
        let totalSaleInvRD = 0;

        articulos.forEach(a => {
            // Conversión a USD para el costo base (lo que cuenta para el juego)
            let costoBaseEnUSD = a.monedaCosto === 'USD' ? a.costo : (a.costo / rate);
            totalBaseCostUS += costoBaseEnUSD;

            // Cálculo Gasto Real Item (En USD siempre para estandarizar internalmente)
            let itemCostUS = costoBaseEnUSD;
            if (a.aplicarTaxUS) itemCostUS *= (1 + (taxUSAPercent / 100)); // Tax se aplica al costo base
            itemCostUS += a.envioUS; // El envío US ya está en US

            totalSpendConvertidoUS += itemCostUS;
            totalWeightInv += a.pesoLibras;
            totalSaleInvRD += a.precioVentaRD;
        });

        // 3. Regalos (Solo activos)
        let totalWeightRewards = 0;
        let totalSaleRewardsRD = 0;
        let totalRefValueRewardsUS = 0;

        regalos.forEach(r => {
            if (r.activo) {
                totalWeightRewards += r.pesoLibras;
                totalSaleRewardsRD += r.precioVentaRD;
                let valRefUS = r.monedaValor === 'USD' ? r.valorReferencia : (r.valorReferencia / rate);
                totalRefValueRewardsUS += valRefUS;
            }
        });

        // 4. Aduanas
        const exceeds200 = totalSpendConvertidoUS > 200;
        let taxAmountRD = 0;
        if (exceeds200 && aplicarArancelSiExcede) {
            // Calculamos sobre el valor CIF estimado (Gasto Total US * Tasa)
            taxAmountRD = (totalSpendConvertidoUS * rate) * (taxRDPercent / 100);
        }

        // 5. Totales
        const totalWeight = totalWeightInv + totalWeightRewards;
        const totalCourierRD = totalWeight * priceLb;
        const totalMercanciaRD = totalSpendConvertidoUS * rate;

        const inversionTotalRD = totalMercanciaRD + totalCourierRD + taxAmountRD;
        const ventasTotalesRD = totalSaleInvRD + totalSaleRewardsRD;
        const gananciaNetaRD = ventasTotalesRD - inversionTotalRD;

        const roi = inversionTotalRD > 0 ? (gananciaNetaRD / inversionTotalRD) * 100 : 0;
        const giftEfficiency = totalSpendConvertidoUS > 0 ? totalRefValueRewardsUS / totalSpendConvertidoUS : 0;

        // Progreso
        const remainingToCut = requiredBudgetBase - totalBaseCostUS;
        const progressPercent = requiredBudgetBase > 0 ? (totalBaseCostUS / requiredBudgetBase) * 100 : 0;

        return {
            game: {
                requiredBudgetBase: requiredBudgetBase.toFixed(2),
                remainingToCut: remainingToCut.toFixed(2),
                progressPercent: Math.min(progressPercent, 100),
                isComplete: remainingToCut <= 0.01
            },
            financial: {
                totalSpendUS: totalSpendConvertidoUS.toFixed(2),
                inversionTotalRD: inversionTotalRD.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                ventasTotalesRD: ventasTotalesRD.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                gananciaNetaRD: gananciaNetaRD.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                roi: roi.toFixed(1),
                exceeds200
            },
            stats: {
                totalWeight: totalWeight.toFixed(2),
                giftEfficiency: giftEfficiency.toFixed(2)
            }
        };
    };

    const result = calcular();

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm sm:p-4">
            <div className="relative bg-slate-50 w-full sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">

                {/* Header Compacto Mobile */}
                <div className="bg-slate-900 px-4 py-3 flex items-center justify-between shrink-0 shadow-md z-10">
                    <div className="flex items-center gap-2">
                        <Calculator className="text-orange-500" size={18} />
                        <div>
                            <h2 className="text-sm font-bold text-white leading-none">Calculadora PRO</h2>
                            <span className="text-[10px] text-slate-400">Revendedor v3.5 Mobile</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-slate-800 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-700">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">

                    {/* Configuración (Colapsable) */}
                    <details className="group bg-white rounded-lg border border-slate-200 shadow-sm">
                        <summary className="px-3 py-2.5 cursor-pointer font-bold text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Target size={14} className="text-orange-500" /> Configuración & Tasas</span>
                            <ChevronDown size={14} className="group-open:rotate-180 transition-transform text-slate-400" />
                        </summary>
                        <div className="p-3 grid grid-cols-2 gap-3 bg-white border-t border-slate-100">
                            <div>
                                <label className="text-[9px] text-slate-500 font-black uppercase mb-1 block">Dólar (RD$)</label>
                                <input type="number" value={tasaDolar} onChange={(e) => setTasaDolar(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-500 font-black uppercase mb-1 block">Courier (RD$/Lb)</label>
                                <input type="number" value={precioPorLibra} onChange={(e) => setPrecioPorLibra(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-orange-500" />
                            </div>
                        </div>
                    </details>

                    {/* Meta (Juego) */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-3 py-2 border-b border-orange-200 flex justify-between items-center">
                            <h3 className="font-bold text-orange-900 text-xs flex items-center gap-1.5">
                                <Target size={14} className="text-orange-600" /> Meta (Cut Price)
                            </h3>
                            <div className="text-[10px] font-bold text-orange-700 bg-white/60 px-1.5 py-0.5 rounded">USD</div>
                        </div>
                        <div className="p-3">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="col-span-2">
                                    <label className="text-[9px] text-orange-800/70 font-black uppercase mb-1 block">Falta Recortar</label>
                                    <div className="relative">
                                        <input type="number" value={targetCut} onChange={(e) => setTargetCut(e.target.value)} className="w-full border-2 border-orange-100 bg-orange-50/50 rounded-lg pl-8 pr-3 py-2 text-lg font-black text-orange-600 outline-none focus:border-orange-300" />
                                        <DollarSign className="absolute left-2.5 top-3 text-orange-300" size={16} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 font-black uppercase mb-1 block">Límite 1er Pedido</label>
                                    <input type="number" value={limitFirst} onChange={(e) => setLimitFirst(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 font-black uppercase mb-1 block">Tasas (%)</label>
                                    <div className="flex gap-1">
                                        <input type="number" value={rate1} onChange={(e) => setRate1(e.target.value)} className="w-1/2 bg-emerald-50 border border-emerald-100 rounded px-1 py-1.5 text-center text-xs font-bold text-emerald-700" title="Tasa 1" />
                                        <input type="number" value={rate2} onChange={(e) => setRate2(e.target.value)} className="w-1/2 bg-rose-50 border border-rose-100 rounded px-1 py-1.5 text-center text-xs font-bold text-rose-700" title="Tasa 2" />
                                    </div>
                                </div>
                            </div>

                            {/* Barra Progreso */}
                            <div className="">
                                <div className="flex justify-between text-[10px] mb-1 font-bold">
                                    <span className="text-slate-500">Progreso Carrito Base</span>
                                    <span className={result.game.isComplete ? 'text-emerald-600' : 'text-rose-500'}>
                                        {result.game.isComplete ? 'COMPLETO' : `Faltan $${result.game.remainingToCut}`}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className={`h-full rounded-full transition-all duration-500 ${result.game.isComplete ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${result.game.progressPercent}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventario */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                                <Package size={14} className="text-blue-500" /> Inventario
                            </h3>
                            <button onClick={agregarArticulo} className="bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700 active:scale-95"><Plus size={14} /></button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {articulos.map((art) => (
                                <div key={art.id} className="p-3 bg-white">
                                    {/* Fila 1: Nombre y Borrar */}
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Nombre Producto"
                                            value={art.nombre}
                                            onChange={(e) => updateArticulo(art.id, 'nombre', e.target.value)}
                                            className="flex-1 text-sm font-bold text-slate-800 placeholder-slate-300 outline-none border-b border-transparent focus:border-blue-300"
                                        />
                                        <button onClick={() => eliminarArticulo(art.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                                    </div>

                                    {/* Fila 2: Inputs Principales */}
                                    <div className="grid grid-cols-12 gap-2 mb-2">
                                        <div className="col-span-5 relative">
                                            <div className="flex">
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={art.costo || ''}
                                                    onChange={(e) => updateArticulo(art.id, 'costo', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-l pl-2 pr-1 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
                                                />
                                                <button
                                                    onClick={() => updateArticulo(art.id, 'monedaCosto', art.monedaCosto === 'USD' ? 'DOP' : 'USD')}
                                                    className={`px-1.5 text-[9px] font-black border-y border-r rounded-r flex items-center justify-center min-w-[32px] ${art.monedaCosto === 'USD' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                                                >
                                                    {art.monedaCosto}
                                                </button>
                                            </div>
                                            <label className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">Costo</label>
                                        </div>
                                        <div className="col-span-4">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={art.precioVentaRD || ''}
                                                onChange={(e) => updateArticulo(art.id, 'precioVentaRD', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                                            />
                                            <label className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">Venta RD$</label>
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                placeholder="0.0"
                                                value={art.pesoLibras || ''}
                                                onChange={(e) => updateArticulo(art.id, 'pesoLibras', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-center text-sm text-slate-700 outline-none focus:border-blue-400"
                                            />
                                            <label className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block text-center">Libras</label>
                                        </div>
                                    </div>

                                    {/* Fila 3: Opciones Extra (Tax/Envio) */}
                                    <div className="flex gap-3 bg-slate-50/80 p-1.5 rounded-lg">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" checked={art.aplicarTaxUS} onChange={(e) => updateArticulo(art.id, 'aplicarTaxUS', e.target.checked)} className="rounded text-orange-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold text-slate-600">+Tax ({taxUSA}%)</span>
                                        </label>
                                        <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                                            <span className="text-[10px] text-slate-500">Envío US:</span>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={art.envioUS || ''}
                                                onChange={(e) => updateArticulo(art.id, 'envioUS', parseFloat(e.target.value) || 0)}
                                                className="w-12 bg-transparent border-b border-slate-300 text-xs text-center font-bold outline-none focus:border-orange-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Regalos */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                                <Gift size={14} className="text-purple-500" /> Regalos (Opcional)
                            </h3>
                            <button onClick={agregarRegalo} className="bg-purple-600 text-white rounded-full p-1 hover:bg-purple-700 active:scale-95"><Plus size={14} /></button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {regalos.map((r) => (
                                <div key={r.id} className={`p-3 bg-white transition-opacity ${!r.activo ? 'opacity-50 grayscale' : ''}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" checked={r.activo} onChange={(e) => updateRegalo(r.id, 'activo', e.target.checked)} className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500" />
                                        <input
                                            type="text"
                                            value={r.nombre}
                                            onChange={(e) => updateRegalo(r.id, 'nombre', e.target.value)}
                                            placeholder="Nombre Regalo"
                                            className="flex-1 text-sm font-bold text-slate-800 placeholder-slate-300 outline-none border-b border-transparent focus:border-purple-300 disabled:bg-transparent"
                                            disabled={!r.activo}
                                        />
                                        <button onClick={() => eliminarRegalo(r.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                                    </div>

                                    {/* Inputs Regalo */}
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-5 flex disabled:opacity-50">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={r.valorReferencia || ''}
                                                onChange={(e) => updateRegalo(r.id, 'valorReferencia', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-l pl-2 pr-1 py-1 text-xs outline-none"
                                                disabled={!r.activo}
                                            />
                                            <button
                                                onClick={() => r.activo && updateRegalo(r.id, 'monedaValor', r.monedaValor === 'USD' ? 'DOP' : 'USD')}
                                                className={`px-1 text-[8px] font-black border-y border-r rounded-r flex items-center justify-center min-w-[28px] ${r.monedaValor === 'USD' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                                            >
                                                {r.monedaValor}
                                            </button>
                                        </div>
                                        <div className="col-span-4">
                                            <input type="number" placeholder="Venta RD" value={r.precioVentaRD || ''} onChange={(e) => updateRegalo(r.id, 'precioVentaRD', parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none text-center" disabled={!r.activo} />
                                        </div>
                                        <div className="col-span-3">
                                            <input type="number" placeholder="Lb" value={r.pesoLibras || ''} onChange={(e) => updateRegalo(r.id, 'pesoLibras', parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none text-center" disabled={!r.activo} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alerta Aduanas */}
                    {result.financial.exceeds200 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 shadow-sm animate-pulse">
                            <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                            <div>
                                <h4 className="text-xs font-bold text-yellow-800">¡Alerta Aduanas ($200+ USD)!</h4>
                                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                                    <input type="checkbox" checked={aplicarArancelSiExcede} onChange={(e) => setAplicarArancelSiExcede(e.target.checked)} className="rounded text-yellow-600" />
                                    <span className="text-xs text-yellow-700 font-medium">Aplicar {arancelRD}% Impuestos</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Resumen Flotante Mobile-First */}
                <div className="bg-white border-t border-slate-200 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 shrink-0 safe-area-bottom">

                    {/* Fila Totalizadores */}
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Inversión Total</div>
                            <div className="text-lg font-black text-slate-800 leading-none">RD${result.financial.inversionTotalRD}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-medium">Inv. US: ${result.financial.totalSpendUS}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Ganancia Neta</div>
                            <div className={`text-2xl font-black leading-none ${parseFloat(result.financial.gananciaNetaRD.replace(/,/g, '')) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                RD${result.financial.gananciaNetaRD}
                            </div>
                            <div className="flex justify-end gap-2 mt-1">
                                <span className={`text-[10px] font-bold px-1.5 rounded ${parseFloat(result.financial.roi) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>ROI {result.financial.roi}%</span>
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 rounded font-bold">🎁 {result.stats.giftEfficiency}x</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
