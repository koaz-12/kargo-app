'use client';

import { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, Target, Package, Gift, Plus, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';

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
    activo: boolean;
}

export const PointsCalculator: React.FC<PointsCalculatorProps> = ({ onClose }) => {
    // --- ESTADO GLOBAL ---
    const [tasaDolar, setTasaDolar] = useState<string>('60.50');
    const [precioPorLibra, setPrecioPorLibra] = useState<string>('193');
    const [taxUSA, setTaxUSA] = useState<string>('7'); // 7%
    const [arancelRD, setArancelRD] = useState<string>('38'); // 38%

    // Meta (Cut Price)
    const [targetCut, setTargetCut] = useState<string>('30.57');
    const [monedaTarget, setMonedaTarget] = useState<Moneda>('USD'); // Default USD

    const [rate1, setRate1] = useState<string>('150');
    const [limitFirst, setLimitFirst] = useState<string>('18.00');
    const [rate2, setRate2] = useState<string>('5');

    const [articulos, setArticulos] = useState<Articulo[]>([
        { id: '1', nombre: 'Item 1', costo: 0, monedaCosto: 'USD', envioUS: 0, aplicarTaxUS: false, pesoLibras: 0, precioVentaRD: 0 }
    ]);

    const [regalos, setRegalos] = useState<Regalo[]>([
        { id: '1', nombre: 'Regalo 1', valorReferencia: 0, monedaValor: 'USD', pesoLibras: 0, precioVentaRD: 0, activo: true }
    ]);

    const [aplicarArancelSiExcede, setAplicarArancelSiExcede] = useState<boolean>(false);
    const [permitirExceso, setPermitirExceso] = useState<boolean>(true); // Por defecto SÍ calcular con ambas tasas

    // --- PERSISTENCIA ---
    useEffect(() => {
        const saved = localStorage.getItem('resellerCalcState_v5_currencies');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.tasaDolar) setTasaDolar(state.tasaDolar);
                if (state.precioPorLibra) setPrecioPorLibra(state.precioPorLibra);
                if (state.taxUSA) setTaxUSA(state.taxUSA);
                if (state.arancelRD) setArancelRD(state.arancelRD);
                if (state.targetCut) setTargetCut(state.targetCut);
                if (state.monedaTarget) setMonedaTarget(state.monedaTarget);
                if (state.rate1) setRate1(state.rate1);
                if (state.limitFirst) setLimitFirst(state.limitFirst);
                if (state.rate2) setRate2(state.rate2);
                if (state.articulos) setArticulos(state.articulos);
                if (state.regalos) setRegalos(state.regalos);
                if (state.aplicarArancelSiExcede !== undefined) setAplicarArancelSiExcede(state.aplicarArancelSiExcede);
                if (state.permitirExceso !== undefined) setPermitirExceso(state.permitirExceso);
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        const state = { tasaDolar, precioPorLibra, taxUSA, arancelRD, targetCut, monedaTarget, rate1, limitFirst, rate2, articulos, regalos, aplicarArancelSiExcede, permitirExceso };
        localStorage.setItem('resellerCalcState_v5_currencies', JSON.stringify(state));
    }, [tasaDolar, precioPorLibra, taxUSA, arancelRD, targetCut, monedaTarget, rate1, limitFirst, rate2, articulos, regalos, aplicarArancelSiExcede, permitirExceso]);

    // --- EFFECT: CAMBIO MASIVO DE MONEDA ---
    const cambiarMonedaGlobal = (nuevaMoneda: Moneda) => {
        setMonedaTarget(nuevaMoneda);
        setArticulos(articulos.map(a => ({ ...a, monedaCosto: nuevaMoneda })));
        setRegalos(regalos.map(r => ({ ...r, monedaValor: nuevaMoneda })));
    };

    // --- HELPERS LISTAS ---
    const agregarArticulo = () => {
        setArticulos([...articulos, {
            id: Date.now().toString(),
            nombre: `Item ${articulos.length + 1}`,
            costo: 0, monedaCosto: monedaTarget, envioUS: 0, aplicarTaxUS: false, pesoLibras: 0, precioVentaRD: 0
        }]);
    };
    const eliminarArticulo = (id: string) => { if (articulos.length > 1) setArticulos(articulos.filter(a => a.id !== id)); };
    const updateArticulo = (id: string, field: keyof Articulo, value: any) => { setArticulos(articulos.map(a => a.id === id ? { ...a, [field]: value } : a)); };

    const agregarRegalo = () => {
        setRegalos([...regalos, {
            id: Date.now().toString(),
            nombre: `Regalo ${regalos.length + 1}`,
            valorReferencia: 0, monedaValor: monedaTarget, pesoLibras: 0, precioVentaRD: 0, activo: true
        }]);
    };
    const eliminarRegalo = (id: string) => { setRegalos(regalos.filter(r => r.id !== id)); };
    const updateRegalo = (id: string, field: keyof Regalo, value: any) => { setRegalos(regalos.map(r => r.id === id ? { ...r, [field]: value } : r)); };

    // --- CÁLCULO CORE ---
    const calcular = () => {
        const rate = parseFloat(tasaDolar) || 60.50;
        const priceLb = parseFloat(precioPorLibra) || 193;
        const taxUSAPercent = parseFloat(taxUSA) || 7;
        const taxRDPercent = parseFloat(arancelRD) || 38;

        // 1. Reglas (Target Cut)
        let rawTarget = parseFloat(targetCut) || 0;
        const targetUSD = monedaTarget === 'USD' ? rawTarget : (rawTarget / rate);

        const limit1 = parseFloat(limitFirst) || 0;
        const r1 = (parseFloat(rate1) || 150) / 100;
        const r2 = (parseFloat(rate2) || 5) / 100;

        const cost1 = r1 > 0 ? limit1 / r1 : 0;

        // --- LOGICA DOBLE: CUT & BUDGET ---
        const remainingTarget = targetUSD - limit1;
        const cost2 = (remainingTarget > 0 && r2 > 0) ? remainingTarget / r2 : 0;
        const requiredBudgetBase = cost1 + cost2; // Presupuesto Necesario Estimado para llegar al Cut

        // 2. Inventario
        let totalBaseCostUS = 0;
        let totalSpendConvertidoUS = 0;
        let totalWeightInv = 0;
        let totalSaleInvRD = 0;

        articulos.forEach(a => {
            let costoBaseEnUSD = a.monedaCosto === 'USD' ? a.costo : (a.costo / rate);
            totalBaseCostUS += costoBaseEnUSD;

            let itemCostUS = costoBaseEnUSD;
            if (a.aplicarTaxUS) itemCostUS *= (1 + (taxUSAPercent / 100));
            itemCostUS += a.envioUS;

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

        // 4. Aduanas & Totales
        const exceeds200 = totalSpendConvertidoUS > 200;
        let taxAmountRD = 0;
        if (exceeds200 && aplicarArancelSiExcede) {
            taxAmountRD = (totalSpendConvertidoUS * rate) * (taxRDPercent / 100);
        }

        const totalWeight = totalWeightInv + totalWeightRewards;
        const totalCourierRD = totalWeight * priceLb;
        const totalMercanciaRD = totalSpendConvertidoUS * rate;

        const inversionTotalRD = totalMercanciaRD + totalCourierRD + taxAmountRD;
        const ventasTotalesRD = totalSaleInvRD + totalSaleRewardsRD;
        const gananciaNetaRD = ventasTotalesRD - inversionTotalRD;

        const roi = inversionTotalRD > 0 ? (gananciaNetaRD / inversionTotalRD) * 100 : 0;
        const giftEfficiency = totalSpendConvertidoUS > 0 ? totalRefValueRewardsUS / totalSpendConvertidoUS : 0;

        // --- PROGRESO 1: CUT PRICE (Meta Principal) ---
        let currentCut = 0;
        if (totalBaseCostUS <= cost1) {
            currentCut = totalBaseCostUS * r1;
        } else {
            if (permitirExceso) {
                currentCut = limit1 + (totalBaseCostUS - cost1) * r2;
            } else {
                currentCut = limit1; // Cap estricto al límite del primer pedido
            }
        }
        const remainingToCutUSD = Math.max(0, targetUSD - currentCut);
        const progressPercentCut = targetUSD > 0 ? (currentCut / targetUSD) * 100 : 0;

        // --- PROGRESO 2: BUDGET (Gasto necesario) ---
        const remainingBudgetUSD = Math.max(0, requiredBudgetBase - totalBaseCostUS);
        const progressPercentSpend = requiredBudgetBase > 0 ? (totalBaseCostUS / requiredBudgetBase) * 100 : 0;


        // Variables de Visualización (Moneda Target)
        const remainingToCutDisplay = monedaTarget === 'USD' ? remainingToCutUSD : (remainingToCutUSD * rate);
        const currentCutDisplay = monedaTarget === 'USD' ? currentCut : (currentCut * rate);

        const remainingBudgetDisplay = monedaTarget === 'USD' ? remainingBudgetUSD : (remainingBudgetUSD * rate);
        const currentSpendDisplay = monedaTarget === 'USD' ? totalBaseCostUS : (totalBaseCostUS * rate);
        const requiredBudgetDisplay = monedaTarget === 'USD' ? requiredBudgetBase : (requiredBudgetBase * rate);


        return {
            game: {
                // Cut Stats
                remainingToCut: remainingToCutDisplay.toFixed(2),
                currentCut: currentCutDisplay.toFixed(2),
                progressPercent: Math.min(progressPercentCut, 100),
                isComplete: remainingToCutUSD <= 0.01,

                // Budget Stats (New)
                remainingBudget: remainingBudgetDisplay.toFixed(2),
                currentSpend: currentSpendDisplay.toFixed(2),
                requiredBudget: requiredBudgetDisplay.toFixed(2),
                progressPercentSpend: Math.min(progressPercentSpend, 100),
                isCapped: !permitirExceso && totalBaseCostUS > cost1
            },
            financial: {
                totalSpendUS: totalSpendConvertidoUS.toFixed(2),
                totalMercanciaRD: totalMercanciaRD,
                totalCourierRD: totalCourierRD,
                taxAmountRD: taxAmountRD,
                inversionTotalRD: inversionTotalRD,
                ventasTotalesRD: ventasTotalesRD,
                gananciaNetaRD: gananciaNetaRD,
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
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 w-full sm:max-w-md md:max-w-xl max-h-[95vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">

                {/* Header */}
                <div className="bg-slate-900 px-4 py-3 flex items-center justify-between shrink-0 z-10">
                    <div className="flex items-center gap-2">
                        <Calculator className="text-orange-500" size={20} />
                        <div>
                            <h2 className="text-sm font-bold text-white leading-none">Calculadora PRO</h2>
                            <span className="text-[10px] text-slate-400">Revendedor v4.4</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-slate-800 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">

                    {/* Configuración (Default Collapsed) */}
                    <details className="group bg-white rounded-lg border border-slate-200 shadow-sm text-xs">
                        <summary className="px-3 py-2 cursor-pointer font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-between select-none">
                            <span className="flex items-center gap-2"><Target size={14} className="text-orange-500" /> Configuración Generales</span>
                            <ChevronDown size={14} className="group-open:rotate-180 transition-transform text-slate-400" />
                        </summary>
                        <div className="p-3 grid grid-cols-2 gap-3 bg-white border-t border-slate-100">
                            <div>
                                <label className="text-[9px] text-slate-500 font-black uppercase mb-1 block">Dólar (RD$)</label>
                                <input type="number" value={tasaDolar} onChange={(e) => setTasaDolar(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-500 font-black uppercase mb-1 block">Courier (RD$/Lb)</label>
                                <input type="number" value={precioPorLibra} onChange={(e) => setPrecioPorLibra(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-orange-500" />
                            </div>
                        </div>
                    </details>

                    {/* Meta (Juego) */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                        <div className="bg-orange-50/50 px-3 py-2 border-b border-orange-100 flex justify-between items-center">
                            <h3 className="font-bold text-orange-900 flex items-center gap-1.5">
                                <Target size={14} className="text-orange-600" /> Meta (Cut Price)
                            </h3>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => cambiarMonedaGlobal('USD')}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${monedaTarget === 'USD' ? 'bg-orange-500 text-white shadow-sm' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                                >USD</button>
                                <button
                                    onClick={() => cambiarMonedaGlobal('DOP')}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${monedaTarget === 'DOP' ? 'bg-orange-500 text-white shadow-sm' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                                >DOP</button>
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="col-span-2">
                                    <label className="text-[9px] text-orange-800/70 font-black uppercase mb-1 block">Falta Recortar ({monedaTarget})</label>
                                    <div className="relative">
                                        <input type="number" value={targetCut} onChange={(e) => setTargetCut(e.target.value)} className="w-full border-2 border-orange-100 bg-orange-50/30 rounded-lg pl-8 pr-3 py-2 text-lg font-black text-orange-600 outline-none focus:border-orange-300 transition-colors" />
                                        <div className="absolute left-2.5 top-3 text-orange-300 font-bold text-sm">{monedaTarget === 'USD' ? '$' : 'RD'}</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 font-black uppercase mb-1 block">Límite 1er Pedido</label>
                                    <input type="number" value={limitFirst} onChange={(e) => setLimitFirst(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-700 outline-none focus:ring-1 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 font-black uppercase mb-1 block">Tasas (%)</label>
                                    <div className="flex gap-1 mb-1">
                                        <input type="number" value={rate1} onChange={(e) => setRate1(e.target.value)} className="w-1/2 bg-emerald-50 border border-emerald-100 rounded px-1 py-1.5 text-center font-bold text-emerald-700" title="Tasa 1" />
                                        <input type="number" value={rate2} onChange={(e) => setRate2(e.target.value)} className="w-1/2 bg-rose-50 border border-rose-100 rounded px-1 py-1.5 text-center font-bold text-rose-700" title="Tasa 2" />
                                    </div>
                                    <div onClick={() => setPermitirExceso(!permitirExceso)} className={`cursor-pointer text-[8px] font-bold uppercase py-0.5 px-1 rounded border text-center select-none ${permitirExceso ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                        {permitirExceso ? 'Con Exceso' : 'Solo 1er Pedido'}
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 1: CUT PROGRESS (The Main Goal) */}
                            <div className="mt-4">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] font-bold text-orange-900/70 uppercase tracking-wider">Meta Recorte (Principal)</span>
                                    <div className={`text-sm font-black ${result.game.isComplete ? 'text-emerald-600' : 'text-orange-600'}`}>
                                        {result.game.isComplete ? '¡LOGRADO! 🎉' : `Faltan ${monedaTarget === 'USD' ? '$' : 'RD$'}${result.game.remainingToCut}`}
                                    </div>
                                </div>
                                <div className="w-full bg-orange-100 rounded-full h-3 mb-1 shadow-inner">
                                    <div className={`h-full rounded-full transition-all duration-500 shadow-sm ${result.game.isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-orange-600'}`} style={{ width: `${result.game.progressPercent}%` }} />
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                    <span>0%</span>
                                    <span>Recortado: {monedaTarget === 'USD' ? '$' : 'RD$'}{result.game.currentCut}</span>
                                    <span>
                                        {result.game.isCapped
                                            ? <span className="text-rose-500 animate-pulse font-black flex items-center gap-1 cursor-pointer" onClick={() => setPermitirExceso(true)}>
                                                <AlertTriangle size={10} /> Límite 1er Pedido (Activar Exceso?)
                                            </span>
                                            : '100%'}
                                    </span>
                                </div>
                            </div>

                            {/* BLOCK 2: BUDGET PROGRESS (How much to spend to get there) */}
                            <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presupuesto (Costo Mercancía)</span>
                                    <div className="text-xs font-bold text-slate-600">
                                        Falta Gastar: {monedaTarget === 'USD' ? '$' : 'RD$'}{result.game.remainingBudget}
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                                    <div className={`h-full rounded-full transition-all duration-500 ${parseFloat(result.game.remainingBudget) <= 0 ? 'bg-emerald-400' : 'bg-blue-400'}`} style={{ width: `${result.game.progressPercentSpend}%` }} />
                                </div>
                                <div className="text-right text-[9px] font-bold text-slate-400">
                                    {monedaTarget === 'USD' ? '$' : 'RD$'}{result.game.currentSpend} / {result.game.requiredBudget}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Inventario */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-1.5">
                                <Package size={14} className="text-blue-500" /> Inventario
                            </h3>
                            <button onClick={agregarArticulo} className="bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700 active:scale-95 transition-all"><Plus size={14} /></button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {articulos.map((art) => (
                                <div key={art.id} className="p-3 bg-white hover:bg-slate-50 transition-colors">
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Nombre Producto"
                                            value={art.nombre}
                                            onChange={(e) => updateArticulo(art.id, 'nombre', e.target.value)}
                                            className="flex-1 font-bold text-slate-800 placeholder-slate-300 outline-none border-b border-transparent focus:border-blue-300 bg-transparent"
                                        />
                                        <button onClick={() => eliminarArticulo(art.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                                    </div>

                                    <div className="grid grid-cols-12 gap-2 mb-2">
                                        <div className="col-span-5 relative">
                                            <div className="flex">
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={art.costo || ''}
                                                    onChange={(e) => updateArticulo(art.id, 'costo', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-l pl-2 pr-1 py-1.5 font-bold text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-colors"
                                                />
                                                <button
                                                    onClick={() => updateArticulo(art.id, 'monedaCosto', art.monedaCosto === 'USD' ? 'DOP' : 'USD')}
                                                    className={`px-1.5 text-[9px] font-black border-y border-r rounded-r flex items-center justify-center min-w-[32px] transition-colors ${art.monedaCosto === 'USD' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
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
                                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-colors"
                                            />
                                            <label className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">Venta RD$</label>
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                placeholder="0.0"
                                                value={art.pesoLibras || ''}
                                                onChange={(e) => updateArticulo(art.id, 'pesoLibras', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-center text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-colors"
                                            />
                                            <label className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block text-center">Libras</label>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 bg-slate-100/50 p-1.5 rounded-lg border border-slate-100">
                                        <label className="flex items-center gap-1.5 cursor-pointer select-none hover:opacity-80">
                                            <input type="checkbox" checked={art.aplicarTaxUS} onChange={(e) => updateArticulo(art.id, 'aplicarTaxUS', e.target.checked)} className="rounded text-orange-500 w-3.5 h-3.5 focus:ring-offset-0 focus:ring-1 focus:ring-orange-500" />
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
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-1.5">
                                <Gift size={14} className="text-purple-500" /> Regalos
                            </h3>
                            <button onClick={agregarRegalo} className="bg-purple-600 text-white rounded-full p-1 hover:bg-purple-700 active:scale-95 transition-all"><Plus size={14} /></button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {regalos.map((r) => (
                                <div key={r.id} className={`p-3 bg-white transition-all ${!r.activo ? 'opacity-60 grayscale-[0.8]' : 'hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" checked={r.activo} onChange={(e) => updateRegalo(r.id, 'activo', e.target.checked)} className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer" />
                                        <input
                                            type="text"
                                            value={r.nombre}
                                            onChange={(e) => updateRegalo(r.id, 'nombre', e.target.value)}
                                            placeholder="Nombre Regalo"
                                            className="flex-1 font-bold text-slate-800 placeholder-slate-300 outline-none border-b border-transparent focus:border-purple-300 disabled:bg-transparent bg-transparent"
                                            disabled={!r.activo}
                                        />
                                        <button onClick={() => eliminarRegalo(r.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                                    </div>

                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-5 flex disabled:opacity-50">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={r.valorReferencia || ''}
                                                onChange={(e) => updateRegalo(r.id, 'valorReferencia', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-l pl-2 pr-1 py-1 outline-none focus:border-purple-300"
                                                disabled={!r.activo}
                                            />
                                            <button
                                                onClick={() => r.activo && updateRegalo(r.id, 'monedaValor', r.monedaValor === 'USD' ? 'DOP' : 'USD')}
                                                className={`px-1 text-[8px] font-black border-y border-r rounded-r flex items-center justify-center min-w-[28px] transition-colors ${r.monedaValor === 'USD' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                                            >
                                                {r.monedaValor}
                                            </button>
                                        </div>
                                        <div className="col-span-4">
                                            <input type="number" placeholder="Venta RD" value={r.precioVentaRD || ''} onChange={(e) => updateRegalo(r.id, 'precioVentaRD', parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none text-center focus:border-purple-300" disabled={!r.activo} />
                                        </div>
                                        <div className="col-span-3">
                                            <input type="number" placeholder="Lb" value={r.pesoLibras || ''} onChange={(e) => updateRegalo(r.id, 'pesoLibras', parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none text-center focus:border-purple-300" disabled={!r.activo} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resumen de Gastos (Detallado) */}
                    <div className="bg-slate-100 rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 pb-1 mb-1">
                            <span>Desglose de Costos</span>
                            <span>Total</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Gasto Mercancia (USD)</span>
                            <span className="font-mono font-bold text-slate-800">${result.financial.totalSpendUS}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Gasto Mercancia (RD$)</span>
                            <span className="font-mono font-bold text-slate-800">RD${result.financial.totalMercanciaRD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Courier ({result.stats.totalWeight} lb)</span>
                            <span className="font-mono font-bold text-slate-800">RD${result.financial.totalCourierRD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>

                        {result.financial.exceeds200 && (aplicarArancelSiExcede ? (
                            <div className="flex justify-between items-center text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                <span className="font-bold">+ Impuestos Aduana</span>
                                <span className="font-mono font-bold">RD${result.financial.taxAmountRD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-2 py-1.5 rounded-lg border border-yellow-200 mt-1 cursor-pointer" onClick={() => setAplicarArancelSiExcede(!aplicarArancelSiExcede)}>
                                <AlertTriangle size={14} />
                                <span className="font-bold underline text-[10px]">Alerta Aduanas (Click para aplicar)</span>
                            </div>
                        ))}

                        <div className="border-t border-slate-300 pt-1 mt-1 flex justify-between items-center">
                            <span className="font-black text-slate-900 uppercase">Inversión Total Real</span>
                            <span className="font-black text-slate-900 text-sm">RD${result.financial.inversionTotalRD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                </div>

                {/* Footer Flotante - ROI y Ganancia */}
                <div className="bg-white border-t border-slate-200 p-3 z-20 shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">ROI Estimado</div>
                            <div className={`text-lg font-black leading-none ${parseFloat(result.financial.roi) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {result.financial.roi}%
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Ganancia Neta</div>
                            <div className={`text-2xl font-black leading-none ${parseFloat(result.financial.gananciaNetaRD) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                RD${result.financial.gananciaNetaRD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
