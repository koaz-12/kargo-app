'use client';

import { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, TrendingUp, Package, Gift, Target, Sparkles, Plus, Trash2, ChevronDown, ChevronUp, Weight, AlertTriangle } from 'lucide-react';

interface PointsCalculatorProps {
    onClose: () => void;
}

interface Articulo {
    id: string;
    nombre: string;
    costoBaseUS: number;
    envioUS: number;
    aplicarTaxUS: boolean;
    pesoLibras: number;
    precioVentaRD: number;
    collapsed?: boolean;
}

interface Regalo {
    id: string;
    nombre: string;
    valorReferenciaUS: number;
    pesoLibras: number;
    precioVentaRD: number;
}

export const PointsCalculator: React.FC<PointsCalculatorProps> = ({ onClose }) => {
    // --- ESTADO GLOBAL ---

    // 1. Configuración General
    const [tasaDolar, setTasaDolar] = useState<string>('60.50');
    const [precioPorLibra, setPrecioPorLibra] = useState<string>('193');
    const [taxUSA, setTaxUSA] = useState<string>('7'); // 7%
    const [arancelRD, setArancelRD] = useState<string>('38'); // 38%

    // 2. Reglas del Evento (Cut Price)
    const [targetCut, setTargetCut] = useState<string>('30.57'); // Falta Recortar
    const [rate1, setRate1] = useState<string>('150'); // Tasa 1er Pedido
    const [limitFirst, setLimitFirst] = useState<string>('18.00'); // Límite 1er Pedido
    const [rate2, setRate2] = useState<string>('5'); // Tasa 2do Pedido

    // 3. Inventario y Regalos
    const [articulos, setArticulos] = useState<Articulo[]>([
        { id: '1', nombre: 'Artículo Principal', costoBaseUS: 0, envioUS: 0, aplicarTaxUS: false, pesoLibras: 0, precioVentaRD: 0 }
    ]);

    const [regalos, setRegalos] = useState<Regalo[]>([
        { id: '1', nombre: 'Regalo 1', valorReferenciaUS: 0, pesoLibras: 0, precioVentaRD: 0 }
    ]);

    // 4. Configuración Extra
    const [aplicarArancelSiExcede, setAplicarArancelSiExcede] = useState<boolean>(false);


    // --- PERSISTENCIA (LocalStorage) ---
    useEffect(() => {
        const saved = localStorage.getItem('resellerCalcState_v1');
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
            } catch (e) {
                console.error('Error loading calculator state:', e);
            }
        }
    }, []);

    useEffect(() => {
        const state = { tasaDolar, precioPorLibra, taxUSA, arancelRD, targetCut, rate1, limitFirst, rate2, articulos, regalos, aplicarArancelSiExcede };
        localStorage.setItem('resellerCalcState_v1', JSON.stringify(state));
    }, [tasaDolar, precioPorLibra, taxUSA, arancelRD, targetCut, rate1, limitFirst, rate2, articulos, regalos, aplicarArancelSiExcede]);


    // --- HELPERS LISTAS ---
    const agregarArticulo = () => {
        setArticulos([...articulos, {
            id: Date.now().toString(),
            nombre: `Artículo ${articulos.length + 1}`,
            costoBaseUS: 0, envioUS: 0, aplicarTaxUS: false, pesoLibras: 0, precioVentaRD: 0
        }]);
    };

    const eliminarArticulo = (id: string) => {
        if (articulos.length > 1) setArticulos(articulos.filter(a => a.id !== id));
    };

    const updateArticulo = (id: string, field: keyof Articulo, value: any) => {
        setArticulos(articulos.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const toggleCollapse = (id: string) => {
        setArticulos(articulos.map(a => a.id === id ? { ...a, collapsed: !a.collapsed } : a));
    };

    const agregarRegalo = () => {
        setRegalos([...regalos, {
            id: Date.now().toString(),
            nombre: `Regalo ${regalos.length + 1}`,
            valorReferenciaUS: 0, pesoLibras: 0, precioVentaRD: 0
        }]);
    };

    const eliminarRegalo = (id: string) => {
        setRegalos(regalos.filter(r => r.id !== id));
    };

    const updateRegalo = (id: string, field: keyof Regalo, value: any) => {
        setRegalos(regalos.map(r => r.id === id ? { ...r, [field]: value } : r));
    };


    // --- CORE LOGIC (CALCULAR) ---
    const calcular = () => {
        // Conversión de strings a números
        const rate = parseFloat(tasaDolar) || 60.50;
        const priceLb = parseFloat(precioPorLibra) || 193;
        const taxUSAPercent = parseFloat(taxUSA) || 7;
        const taxRDPercent = parseFloat(arancelRD) || 38;

        // 1. Reglas del Juego (Presupuesto Requerido)
        const target = parseFloat(targetCut) || 0;
        const limit1 = parseFloat(limitFirst) || 0;
        const r1 = (parseFloat(rate1) || 150) / 100;
        const r2 = (parseFloat(rate2) || 5) / 100;

        const cost1 = limit1 / r1; // Costo para cubrir el primer tramo
        const remainingTarget = target - limit1; // Cuánto falta después del tramo 1
        const cost2 = remainingTarget > 0 ? remainingTarget / r2 : 0; // Costo para cubrir el resto

        const requiredBudgetBase = cost1 + cost2; // Presupuesto base necesario (Lo que cuenta para la app)

        // Impuestos estimados sobre ese presupuesto requerido (solo referencia)
        const estimatedTaxUS = requiredBudgetBase * (taxUSAPercent / 100);
        const requiredBudgetWithTax = requiredBudgetBase + estimatedTaxUS;


        // 2. Inventario (Realidad)
        let totalBaseCostUS = 0; // Suma de costos base (sin tax, sin envío) -> Para progreso de juego
        let totalSpendUS = 0;    // Gasto real (Base + Tax + Envío) -> Para finanzas
        let totalWeightInv = 0;
        let totalSaleInvRD = 0;

        articulos.forEach(a => {
            totalBaseCostUS += a.costoBaseUS;

            let itemCost = a.costoBaseUS;
            if (a.aplicarTaxUS) {
                itemCost *= (1 + (taxUSAPercent / 100));
            }
            itemCost += a.envioUS;

            totalSpendUS += itemCost;
            totalWeightInv += a.pesoLibras;
            totalSaleInvRD += a.precioVentaRD;
        });

        // 3. Regalos
        let totalWeightRewards = 0;
        let totalSaleRewardsRD = 0;
        let totalRefValueRewardsUS = 0;

        regalos.forEach(r => {
            totalWeightRewards += r.pesoLibras;
            totalSaleRewardsRD += r.precioVentaRD;
            totalRefValueRewardsUS += r.valorReferenciaUS;
        });

        // 4. Aduanas RD
        const exceeds200 = totalSpendUS > 200;
        let taxAmountRD = 0;

        if (exceeds200 && aplicarArancelSiExcede) {
            // Se calcula sobre CIF (Costo + Seguro + Flete), pero simplificaremos: Gasto Total * Tasa
            const taxableAmountRD = totalSpendUS * rate;
            taxAmountRD = taxableAmountRD * (taxRDPercent / 100);
        }

        // 5. Totales Finales
        const totalWeight = totalWeightInv + totalWeightRewards;
        const totalCourierRD = totalWeight * priceLb;
        const totalMercanciaRD = totalSpendUS * rate;

        const inversionTotalRD = totalMercanciaRD + totalCourierRD + taxAmountRD;
        const ventasTotalesRD = totalSaleInvRD + totalSaleRewardsRD;
        const gananciaNetaRD = ventasTotalesRD - inversionTotalRD;

        // ROI
        const roi = inversionTotalRD > 0 ? (gananciaNetaRD / inversionTotalRD) * 100 : 0;

        // Eficiencia de Regalos ("La Pesca") -> Valor Regalos / Gasto Total
        const giftEfficiency = totalSpendUS > 0 ? totalRefValueRewardsUS / totalSpendUS : 0;

        // Progreso de Barra
        const remainingToCut = requiredBudgetBase - totalBaseCostUS;
        const progressPercent = requiredBudgetBase > 0 ? (totalBaseCostUS / requiredBudgetBase) * 100 : 0;

        return {
            game: {
                requiredBudgetBase: requiredBudgetBase.toFixed(2),
                requiredBudgetWithTax: requiredBudgetWithTax.toFixed(2),
                cost1: cost1.toFixed(2),
                cost2: cost2.toFixed(2),
                remainingToCut: remainingToCut.toFixed(2),
                progressPercent: Math.min(progressPercent, 100),
                isComplete: remainingToCut <= 0.01
            },
            financial: {
                totalSpendUS: totalSpendUS.toFixed(2),
                totalMercanciaRD: totalMercanciaRD.toLocaleString(),
                totalCourierRD: totalCourierRD.toLocaleString(),
                taxAmountRD: taxAmountRD.toLocaleString(),
                inversionTotalRD: inversionTotalRD.toLocaleString(),
                ventasTotalesRD: ventasTotalesRD.toLocaleString(),
                gananciaNetaRD: gananciaNetaRD.toLocaleString(),
                roi: roi.toFixed(1),
                exceeds200
            },
            stats: {
                totalWeight: totalWeight.toFixed(2),
                giftEfficiency: giftEfficiency.toFixed(2),
                totalRefValueRewardsUS: totalRefValueRewardsUS.toFixed(2)
            }
        };
    };

    const result = calcular();

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="relative bg-slate-50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-slate-900 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Calculator className="text-orange-500" size={20} />
                        <h2 className="text-base font-bold text-white">Calculadora Revendedor PRO <span className="text-xs bg-slate-700 text-white px-2 py-0.5 rounded ml-2">v3.2</span></h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors active:scale-95">
                        <X className="text-white" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* 1. Configuración Rápida */}
                    <details className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                        <summary className="px-3 py-2 cursor-pointer font-bold text-xs text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2 uppercase tracking-wide">
                            <Target size={14} className="text-orange-500" />
                            Configuración Global
                        </summary>
                        <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/50">
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Tasa Dólar</label>
                                <div className="flex items-center bg-slate-800 rounded border border-slate-600 px-2 h-8">
                                    <span className="text-emerald-500 font-bold mr-1 text-xs">RD$</span>
                                    <input type="number" step="0.1" value={tasaDolar} onChange={(e) => setTasaDolar(e.target.value)} className="w-full bg-transparent text-white font-bold text-sm outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Courier (RD$/Lb)</label>
                                <div className="flex items-center bg-slate-800 rounded border border-slate-600 px-2 h-8">
                                    <span className="text-blue-400 font-bold mr-1 text-xs">Lb</span>
                                    <input type="number" step="1" value={precioPorLibra} onChange={(e) => setPrecioPorLibra(e.target.value)} className="w-full bg-transparent text-white font-bold text-sm outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Tax USA %</label>
                                <div className="flex items-center bg-slate-800 rounded border border-slate-600 px-2 h-8">
                                    <span className="text-slate-400 mr-1 text-xs">🇺🇸</span>
                                    <input type="number" step="0.1" value={taxUSA} onChange={(e) => setTaxUSA(e.target.value)} className="w-full bg-transparent text-white font-bold text-sm outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Aduana RD %</label>
                                <div className="flex items-center bg-slate-800 rounded border border-slate-600 px-2 h-8">
                                    <span className="text-yellow-500 mr-1 text-xs">🇩🇴</span>
                                    <input type="number" step="1" value={arancelRD} onChange={(e) => setArancelRD(e.target.value)} className="w-full bg-transparent text-white font-bold text-sm outline-none" />
                                </div>
                            </div>
                        </div>
                    </details>

                    {/* 2. Reglas del JUEGO (Target) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                        <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-bl uppercase">Auto Guardado</div>

                        <div className="p-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
                                <span className="bg-orange-100 text-orange-600 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold">1</span>
                                Meta del Evento (USD)
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div>
                                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Falta Recortar</label>
                                    <div className="relative">
                                        <input type="number" step="0.01" value={targetCut} onChange={(e) => setTargetCut(e.target.value)} className="w-full border border-emerald-200 bg-emerald-50 rounded px-2 py-1.5 text-sm font-bold text-emerald-800 outline-none focus:ring-1 focus:ring-emerald-400" />
                                        <span className="absolute right-2 top-1.5 text-[10px] font-bold text-emerald-600 pointer-events-none">USD</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Tasa 1er Pedido</label>
                                    <div className="relative">
                                        <input type="number" value={rate1} onChange={(e) => setRate1(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-400" />
                                        <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Límite 1er Pedido</label>
                                    <div className="relative">
                                        <input type="number" step="0.1" value={limitFirst} onChange={(e) => setLimitFirst(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-400" />
                                        <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">USD</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Tasa 2do Pedido</label>
                                    <div className="relative">
                                        <input type="number" value={rate2} onChange={(e) => setRate2(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-400" />
                                        <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Bar */}
                            <div className="flex bg-slate-50 rounded-lg p-2 border border-slate-200 divide-x divide-slate-200">
                                <div className="flex-1 text-center px-1">
                                    <div className="text-[9px] text-slate-400 uppercase font-bold">1er Tramo</div>
                                    <div className="text-sm font-bold text-slate-700">US${result.game.cost1}</div>
                                </div>
                                <div className="flex-1 text-center px-1">
                                    <div className="text-[9px] text-slate-400 uppercase font-bold">2do Tramo</div>
                                    <div className="text-sm font-bold text-rose-500">US${result.game.cost2}</div>
                                </div>
                                <div className="flex-1 text-center px-1 bg-orange-50 rounded text-orange-800">
                                    <div className="text-[9px] uppercase font-bold text-orange-600">Requerido (Base)</div>
                                    <div className="text-base font-black">US${result.game.requiredBudgetBase}</div>
                                    <div className="text-[9px] opacity-70">~US${result.game.requiredBudgetWithTax} c/Tax</div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-slate-600">Llenado de Carrito (Costo Base)</span>
                                <span className={`font-bold ${result.game.isComplete ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {result.game.isComplete ? '¡Meta Cumplida!' : `Falta: US$${result.game.remainingToCut}`}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 rounded-full ${result.game.isComplete ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                    style={{ width: `${result.game.progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Inventario */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold">2</span>
                                Inventario / Relleno
                            </h3>
                            <button onClick={agregarArticulo} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1">
                                <Plus size={12} /> Agregar
                            </button>
                        </div>

                        <div className="p-3 space-y-2">
                            {articulos.map((art, idx) => (
                                <div key={art.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 mr-2">
                                            <input
                                                type="text"
                                                value={art.nombre}
                                                onChange={(e) => updateArticulo(art.id, 'nombre', e.target.value)}
                                                className="w-full bg-transparent font-bold text-slate-700 border-b border-transparent focus:border-blue-400 outline-none text-sm placeholder-slate-400"
                                                placeholder="Nombre del Producto"
                                            />
                                        </div>
                                        <button onClick={() => eliminarArticulo(art.id)} className="text-slate-400 hover:text-rose-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-emerald-700 uppercase block">Costo Temu</label>
                                            <div className="flex items-center">
                                                <DollarSign size={10} className="text-emerald-700 ml-0.5 absolute" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={art.costoBaseUS}
                                                    onChange={(e) => updateArticulo(art.id, 'costoBaseUS', parseFloat(e.target.value) || 0)}
                                                    className="w-full pl-3 pr-1 py-1 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-1 focus:ring-emerald-400 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-blue-700 uppercase block">Venta RD$</label>
                                            <input
                                                type="number"
                                                value={art.precioVentaRD}
                                                onChange={(e) => updateArticulo(art.id, 'precioVentaRD', parseFloat(e.target.value) || 0)}
                                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:ring-1 focus:ring-blue-400 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Advanced Row */}
                                    <div className="flex items-center gap-3 bg-slate-100 rounded p-1.5">
                                        <div className="flex items-center gap-1.5 flex-1 border-r border-slate-200 pr-2">
                                            <label className="flex items-center gap-1 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={art.aplicarTaxUS}
                                                    onChange={(e) => updateArticulo(art.id, 'aplicarTaxUS', e.target.checked)}
                                                    className="rounded text-orange-500 focus:ring-0 w-3 h-3"
                                                />
                                                <span className="text-[10px] text-slate-600 font-bold">+Tax</span>
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-1 flex-1 border-r border-slate-200 px-2">
                                            <span className="text-[10px] text-slate-500">Envío:</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={art.envioUS || ''}
                                                onChange={(e) => updateArticulo(art.id, 'envioUS', parseFloat(e.target.value) || 0)}
                                                className="w-12 bg-transparent text-xs border-b border-slate-300 focus:border-blue-500 outline-none p-0 text-center"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 flex-1 pl-2">
                                            <span className="text-[10px] text-slate-500">Peso:</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={art.pesoLibras || ''}
                                                onChange={(e) => updateArticulo(art.id, 'pesoLibras', parseFloat(e.target.value) || 0)}
                                                className="w-10 bg-transparent text-xs border-b border-slate-300 focus:border-blue-500 outline-none p-0 text-center"
                                            />
                                            <span className="text-[9px] text-slate-400">lb</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Recompensas */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-green-50/50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <span className="bg-green-100 text-green-600 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold">3</span>
                                Recompensas (Regalos)
                            </h3>
                            <button onClick={agregarRegalo} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex items-center gap-1">
                                <Plus size={12} /> Agregar
                            </button>
                        </div>

                        <div className="p-3 space-y-2">
                            {regalos.map((gift) => (
                                <div key={gift.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                    <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-5">
                                            <input
                                                type="text"
                                                value={gift.nombre}
                                                onChange={(e) => updateRegalo(gift.id, 'nombre', e.target.value)}
                                                placeholder="Nombre Regalo"
                                                className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
                                            />
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-[9px] text-slate-400">Ref US$:</span>
                                                <input
                                                    type="number"
                                                    value={gift.valorReferenciaUS || ''}
                                                    onChange={(e) => updateRegalo(gift.id, 'valorReferenciaUS', parseFloat(e.target.value) || 0)}
                                                    className="w-12 text-[9px] bg-slate-100 rounded px-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-3 text-center">
                                            <label className="text-[9px] text-slate-400 block">Peso</label>
                                            <div className="text-xs font-medium">
                                                <input
                                                    type="number"
                                                    value={gift.pesoLibras || ''}
                                                    onChange={(e) => updateRegalo(gift.id, 'pesoLibras', parseFloat(e.target.value) || 0)}
                                                    className="w-10 text-center bg-transparent border-b border-slate-300"
                                                /> lb
                                            </div>
                                        </div>
                                        <div className="col-span-4 text-center">
                                            <label className="text-[9px] text-slate-400 block">Venta RD$</label>
                                            <input
                                                type="number"
                                                value={gift.precioVentaRD || ''}
                                                onChange={(e) => updateRegalo(gift.id, 'precioVentaRD', parseFloat(e.target.value) || 0)}
                                                className="w-full text-center bg-transparent border-b border-blue-200 font-bold text-blue-600 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <button onClick={() => eliminarRegalo(gift.id)} className="text-slate-300 hover:text-rose-400 p-1">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5. Análisis de Eficiencia (Pesca) */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold text-indigo-800 flex items-center gap-1.5 mb-1">
                                <Sparkles size={12} />
                                La Pesca (Eficiencia)
                            </h3>
                            <div className="text-[10px] text-indigo-600/80 max-w-[200px] leading-tight">
                                Por cada $1 invertido, recibes <b>${result.stats.giftEfficiency}</b> en valor de regalos.
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-indigo-600">{result.stats.giftEfficiency}x</div>
                            <div className="text-[9px] font-bold text-indigo-400 uppercase">Ratio</div>
                        </div>
                    </div>

                    {/* 6. Alerta Aduanas */}
                    {result.financial.exceeds200 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-3">
                            <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={16} />
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-yellow-800 mb-0.5">Alerta de Aduanas ($200+)</h4>
                                <p className="text-[10px] text-yellow-700 leading-tight mb-2">
                                    El valor total supera los US$200. ¿Deseas aplicar el {arancelRD}% de impuestos?
                                </p>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={aplicarArancelSiExcede}
                                            onChange={(e) => setAplicarArancelSiExcede(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">Sí, aplicar impuestos</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Resumen */}
                <div className="bg-white border-t-2 border-orange-500 p-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20 shrink-0">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        <div className="px-1 border-r border-slate-100 text-center">
                            <div className="text-[9px] text-slate-400 font-bold uppercase">Inversión US</div>
                            <div className="text-sm font-black text-slate-800">${result.financial.totalSpendUS}</div>
                        </div>
                        <div className="px-1 border-r border-slate-100 text-center">
                            <div className="text-[9px] text-slate-400 font-bold uppercase">Gasto RD$</div>
                            <div className="text-sm font-black text-rose-600 transition-all text-[0.8rem] sm:text-sm leading-tight">
                                ${result.financial.inversionTotalRD}
                            </div>
                        </div>
                        <div className="px-1 border-r border-slate-100 text-center">
                            <div className="text-[9px] text-slate-400 font-bold uppercase">Ventas RD$</div>
                            <div className="text-sm font-black text-blue-600 transition-all text-[0.8rem] sm:text-sm leading-tight">
                                ${result.financial.ventasTotalesRD}
                            </div>
                        </div>
                        <div className="px-1 text-center bg-slate-50 rounded">
                            <div className="text-[9px] text-slate-400 font-bold uppercase">Ganancia</div>
                            <div className={`text-sm font-black transition-all text-[0.8rem] sm:text-sm leading-tight ${parseFloat(result.financial.gananciaNetaRD.replace(/,/g, '')) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ${result.financial.gananciaNetaRD}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
