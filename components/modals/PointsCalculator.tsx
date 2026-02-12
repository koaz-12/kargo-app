'use client';

import { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, TrendingUp, Package, Gift, Target, Sparkles, Plus, Trash2, ChevronDown, ChevronUp, Weight } from 'lucide-react';

interface PointsCalculatorProps {
    onClose: () => void;
}

interface Articulo {
    id: string;
    nombre: string;
    costo: number;
    moneda: 'USD' | 'DOP';
    porcentajeRetorno: number;
    precioVentaDOP: number;
    pesoLibras?: number; // Para cálculo de courier
    collapsed?: boolean;
}

interface Regalo {
    activo: boolean;
    nombre: string;
    precioVentaDOP: number;
    costoCourierDOP: number;
    pesoLibras?: number;
}

export const PointsCalculator: React.FC<PointsCalculatorProps> = ({ onClose }) => {
    // A. Config Global
    const [tasaDolar, setTasaDolar] = useState<string>('65');
    const [metaPuntos, setMetaPuntos] = useState<string>('170');
    const [puntosActuales, setPuntosActuales] = useState<string>('163.2');
    const [tasaRellenoPorcentaje, setTasaRellenoPorcentaje] = useState<string>('0.20');

    // Courier config
    const [modoCourier, setModoCourier] = useState<'fijo' | 'libra'>('fijo');
    const [costoCourierFijo, setCostoCourierFijo] = useState<string>('250');
    const [precioPorLibraBase, setPrecioPorLibraBase] = useState<string>('193');
    const [precioPorLibraMejorado, setPrecioPorLibraMejorado] = useState<string>('140');
    const [pesoMinimoMejorado, setPesoMinimoMejorado] = useState<string>('0.05');

    const [impuestosDOP, setImpuestosDOP] = useState<string>('0');

    // B. Artículos (múltiples pedidos)
    const [articulos, setArticulos] = useState<Articulo[]>([
        { id: '1', nombre: 'Primer Artículo', costo: 30, moneda: 'USD', porcentajeRetorno: 120, precioVentaDOP: 2500, pesoLibras: 0.5 }
    ]);

    // D. Regalos (siempre habilitados)
    const [regalos, setRegalos] = useState<Regalo[]>([
        { activo: false, nombre: 'Regalo 1', precioVentaDOP: 500, costoCourierDOP: 50, pesoLibras: 0.1 },
        { activo: false, nombre: 'Regalo 2', precioVentaDOP: 500, costoCourierDOP: 50, pesoLibras: 0.1 },
        { activo: false, nombre: 'Regalo 3', precioVentaDOP: 500, costoCourierDOP: 50, pesoLibras: 0.1 },
    ]);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('pointsCalculator3x1State_v2');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.tasaDolar) setTasaDolar(state.tasaDolar);
                if (state.metaPuntos) setMetaPuntos(state.metaPuntos);
                if (state.puntosActuales) setPuntosActuales(state.puntosActuales);
                if (state.tasaRellenoPorcentaje) setTasaRellenoPorcentaje(state.tasaRellenoPorcentaje);
                if (state.modoCourier) setModoCourier(state.modoCourier);
                if (state.costoCourierFijo) setCostoCourierFijo(state.costoCourierFijo);
                if (state.precioPorLibraBase) setPrecioPorLibraBase(state.precioPorLibraBase);
                if (state.precioPorLibraMejorado) setPrecioPorLibraMejorado(state.precioPorLibraMejorado);
                if (state.pesoMinimoMejorado) setPesoMinimoMejorado(state.pesoMinimoMejorado);
                if (state.impuestosDOP) setImpuestosDOP(state.impuestosDOP);
                if (state.articulos) setArticulos(state.articulos);
                if (state.regalos) setRegalos(state.regalos);
            } catch (e) {
                console.error('Error loading calculator state:', e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        const state = {
            tasaDolar,
            metaPuntos,
            puntosActuales,
            tasaRellenoPorcentaje,
            modoCourier,
            costoCourierFijo,
            precioPorLibraBase,
            precioPorLibraMejorado,
            pesoMinimoMejorado,
            impuestosDOP,
            articulos,
            regalos,
        };
        localStorage.setItem('pointsCalculator3x1State_v2', JSON.stringify(state));
    }, [tasaDolar, metaPuntos, puntosActuales, tasaRellenoPorcentaje, modoCourier, costoCourierFijo, precioPorLibraBase, precioPorLibraMejorado, pesoMinimoMejorado, impuestosDOP, articulos, regalos]);

    const agregarArticulo = () => {
        const nuevoId = Date.now().toString();
        const esPrimero = articulos.length === 0;
        setArticulos([...articulos, {
            id: nuevoId,
            nombre: esPrimero ? 'Primer Artículo' : `Artículo ${articulos.length + 1}`,
            costo: 0,
            moneda: 'USD',
            porcentajeRetorno: esPrimero ? 120 : 5,
            precioVentaDOP: 0,
            pesoLibras: 0.5,
        }]);
    };

    const eliminarArticulo = (id: string) => {
        if (articulos.length > 1) {
            const nuevosArticulos = articulos.filter(a => a.id !== id);

            // Si solo queda 1 artículo, marcarlo como primer pedido con 120%
            if (nuevosArticulos.length === 1) {
                nuevosArticulos[0] = {
                    ...nuevosArticulos[0],
                    porcentajeRetorno: 120
                };
            }

            setArticulos(nuevosArticulos);
        }
    };

    const updateArticulo = (id: string, field: keyof Articulo, value: any) => {
        setArticulos(articulos.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const toggleCollapse = (id: string) => {
        setArticulos(articulos.map(a => a.id === id ? { ...a, collapsed: !a.collapsed } : a));
    };

    const updateRegalo = (index: number, field: keyof Regalo, value: any) => {
        setRegalos(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    };

    // ALGORITMO
    const calcular = () => {
        const meta = parseFloat(metaPuntos) || 0;
        const actual = parseFloat(puntosActuales) || 0;
        const tasaRelleno = parseFloat(tasaRellenoPorcentaje) || 0;
        const tasa = parseFloat(tasaDolar) || 60;
        const impuestos = parseFloat(impuestosDOP) || 0;

        // 1. Calcular puntos y costos de artículos
        let puntosDeArticulos = 0;
        let costoTotalUSD = 0;
        let pesoTotalLibras = 0;

        articulos.forEach(art => {
            const costoEnUSD = art.moneda === 'USD' ? art.costo : art.costo / tasa;
            costoTotalUSD += costoEnUSD;
            puntosDeArticulos += costoEnUSD * (art.porcentajeRetorno / 100);
            pesoTotalLibras += art.pesoLibras || 0;
        });

        // Agregar peso de regalos activos
        regalos.forEach(r => {
            if (r.activo && modoCourier === 'libra') {
                pesoTotalLibras += r.pesoLibras || 0;
            }
        });

        // 2. Calcular courier
        let costoCourier = 0;
        let costoCourierRegalos = 0;

        if (modoCourier === 'fijo') {
            costoCourier = parseFloat(costoCourierFijo) || 0;
            // Sumar courier de regalos activos
            costoCourierRegalos = regalos.reduce((sum, r) => r.activo ? sum + r.costoCourierDOP : sum, 0);
        } else {
            // Por libra - incluye artículos + regalos activos
            const precioBase = parseFloat(precioPorLibraBase) || 193;
            const precioMejorado = parseFloat(precioPorLibraMejorado) || 140;
            const minimoMejorado = parseFloat(pesoMinimoMejorado) || 0.05;

            const precioPorLibra = pesoTotalLibras > minimoMejorado ? precioMejorado : precioBase;
            costoCourier = pesoTotalLibras * precioPorLibra;
            costoCourierRegalos = 0; // Ya está incluido en el peso total
        }

        // 3. Puntos
        const faltanteInicial = meta - actual;
        const nuevoFaltante = Math.max(0, faltanteInicial - puntosDeArticulos);
        const gastoExtraUSD = nuevoFaltante > 0 && tasaRelleno > 0
            ? nuevoFaltante / (tasaRelleno / 100)
            : 0;

        // 4. Financiero
        const costoMercancia = (costoTotalUSD + gastoExtraUSD) * tasa;
        const costosOperativos = costoCourier + impuestos + costoCourierRegalos;
        const inversionTotal = costoMercancia + costosOperativos;

        const ingresosArticulos = articulos.reduce((sum, art) => sum + art.precioVentaDOP, 0);
        const ingresosRegalos = regalos.reduce((sum, r) => r.activo ? sum + r.precioVentaDOP : sum, 0);
        const ingresosVentas = ingresosArticulos + ingresosRegalos;

        const gananciaNeta = ingresosVentas - inversionTotal;
        const margenPorcentaje = inversionTotal > 0 ? ((gananciaNeta / inversionTotal) * 100) : 0;

        // 5. Cuánto necesito gastar
        const totalGastoUSD = costoTotalUSD + gastoExtraUSD;
        const totalGastoDOP = costoMercancia + costoCourier + costoCourierRegalos + impuestos;

        return {
            puntos: {
                faltanteInicial: faltanteInicial.toFixed(2),
                puntosDeArticulos: puntosDeArticulos.toFixed(2),
                nuevoFaltante: nuevoFaltante.toFixed(2),
                gastoExtraUSD: gastoExtraUSD.toFixed(2),
            },
            financiero: {
                costoMercancia: costoMercancia.toFixed(2),
                costoCourier: costoCourier.toFixed(2),
                costoCourierRegalos: costoCourierRegalos.toFixed(2),
                costosOperativos: costosOperativos.toFixed(2),
                inversionTotal: inversionTotal.toFixed(2),
                ingresosVentas: ingresosVentas.toFixed(2),
                gananciaNeta: gananciaNeta.toFixed(2),
                margenPorcentaje: margenPorcentaje.toFixed(1),
            },
            gasto: {
                totalUSD: totalGastoUSD.toFixed(2),
                totalDOP: totalGastoDOP.toFixed(2),
                courier: (costoCourier + costoCourierRegalos).toFixed(2),
            },
            info: {
                pesoTotalLibras: pesoTotalLibras.toFixed(2),
                regalosActivos: regalos.filter(r => r.activo).length,
            }
        };
    };

    const resultado = calcular();

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <Calculator className="text-white" size={20} />
                        <h2 className="text-base font-bold text-white">Calculadora de 3 por $1</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/20 transition-colors active:scale-95"
                    >
                        <X className="text-white" size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {/* Config Global */}
                    <details className="mb-4 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                        <summary className="px-4 py-3 cursor-pointer font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2">
                            <Target size={16} className="text-slate-400" />
                            Configuración Global
                        </summary>
                        <div className="p-4 space-y-3 border-t border-slate-200">
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">Tasa Dólar</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={tasaDolar}
                                        onChange={(e) => setTasaDolar(e.target.value)}
                                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">Meta Puntos</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={metaPuntos}
                                        onChange={(e) => setMetaPuntos(e.target.value)}
                                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-1">Puntos Actuales</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={puntosActuales}
                                        onChange={(e) => setPuntosActuales(e.target.value)}
                                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Retorno Relleno (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={tasaRellenoPorcentaje}
                                    onChange={(e) => setTasaRellenoPorcentaje(e.target.value)}
                                    className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="20"
                                    title="Qué porcentaje de puntos dan los artículos de relleno"
                                />
                            </div>

                            {/* Courier Config */}
                            <div className="border-t border-slate-300 pt-3 mt-3">
                                <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1">
                                    <Weight size={14} />
                                    Configuración de Courier
                                </label>
                                <div className="flex gap-2 mb-3">
                                    <button
                                        onClick={() => setModoCourier('fijo')}
                                        className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all ${modoCourier === 'fijo'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                            }`}
                                    >
                                        Precio Fijo
                                    </button>
                                    <button
                                        onClick={() => setModoCourier('libra')}
                                        className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all ${modoCourier === 'libra'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                            }`}
                                    >
                                        Por Libra
                                    </button>
                                </div>

                                {modoCourier === 'fijo' ? (
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">Costo Courier (DOP)</label>
                                        <input
                                            type="number"
                                            step="1"
                                            value={costoCourierFijo}
                                            onChange={(e) => setCostoCourierFijo(e.target.value)}
                                            className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 block mb-1">Precio/lb Base</label>
                                            <input
                                                type="number"
                                                step="1"
                                                value={precioPorLibraBase}
                                                onChange={(e) => setPrecioPorLibraBase(e.target.value)}
                                                className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="193"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 block mb-1">Peso Mínimo (lb)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={pesoMinimoMejorado}
                                                onChange={(e) => setPesoMinimoMejorado(e.target.value)}
                                                className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="0.05"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-bold text-slate-600 block mb-1">Precio/lb Mejorado (&gt;{pesoMinimoMejorado}lb)</label>
                                            <input
                                                type="number"
                                                step="1"
                                                value={precioPorLibraMejorado}
                                                onChange={(e) => setPrecioPorLibraMejorado(e.target.value)}
                                                className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="140"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Impuestos (DOP)</label>
                                <input
                                    type="number"
                                    step="1"
                                    value={impuestosDOP}
                                    onChange={(e) => setImpuestosDOP(e.target.value)}
                                    className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>
                    </details>

                    {/* Artículos/Pedidos */}
                    <div className="mb-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                <Package size={16} className="text-blue-600" />
                                Artículos a Comprar
                            </h3>
                            <button
                                onClick={agregarArticulo}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1"
                            >
                                <Plus size={14} />
                                Agregar
                            </button>
                        </div>
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {articulos.length === 0 && (
                                <p className="text-sm text-slate-400 italic text-center py-4">No hay artículos. Agrega uno para empezar.</p>
                            )}
                            {articulos.map((art, idx) => (
                                <div key={art.id} className="bg-slate-50 rounded-lg border border-slate-200">
                                    {/* Header - Always Visible */}
                                    <div className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1">
                                            <button
                                                onClick={() => toggleCollapse(art.id)}
                                                className="text-slate-600 hover:bg-slate-200 p-1 rounded transition-colors"
                                            >
                                                {art.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                            </button>
                                            <span className={`text-xs font-black px-2 py-0.5 rounded ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {idx === 0 ? '1ER PEDIDO' : `PEDIDO ${idx + 1}`}
                                            </span>

                                            {/* Compact info when collapsed */}
                                            {art.collapsed && (
                                                <div className="flex items-center gap-2 text-xs text-slate-600 flex-1">
                                                    <span className="font-bold truncate max-w-[100px]">{art.nombre || 'Sin nombre'}</span>
                                                    <span className="text-blue-600 font-bold">{art.costo} {art.moneda}</span>
                                                    <span className="text-purple-600">→{art.porcentajeRetorno}%</span>
                                                    <span className="text-emerald-600 font-bold">RD${art.precioVentaDOP.toLocaleString()}</span>
                                                    {modoCourier === 'libra' && <span className="text-orange-600">{art.pesoLibras}lb</span>}
                                                </div>
                                            )}

                                            {/* Expanded info header */}
                                            {!art.collapsed && (
                                                <span className="text-xs text-slate-500">{art.porcentajeRetorno}% retorno</span>
                                            )}
                                        </div>
                                        {articulos.length > 1 && (
                                            <button
                                                onClick={() => eliminarArticulo(art.id)}
                                                className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Expanded Form */}
                                    {!art.collapsed && (
                                        <div className="px-3 pb-3 space-y-2 border-t border-slate-200 pt-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="col-span-2">
                                                    <label className="text-xs font-bold text-slate-600 block mb-1">Nombre</label>
                                                    <input
                                                        type="text"
                                                        value={art.nombre}
                                                        onChange={(e) => updateArticulo(art.id, 'nombre', e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="Ej. iPhone 15 Pro"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 block mb-1">Costo</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={art.costo}
                                                        onChange={(e) => updateArticulo(art.id, 'costo', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 block mb-1">Moneda</label>
                                                    <select
                                                        value={art.moneda}
                                                        onChange={(e) => updateArticulo(art.id, 'moneda', e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    >
                                                        <option value="USD">USD</option>
                                                        <option value="DOP">DOP</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 block mb-1">Retorno (%)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={art.porcentajeRetorno}
                                                        onChange={(e) => updateArticulo(art.id, 'porcentajeRetorno', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                {modoCourier === 'libra' && (
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-600 block mb-1">Peso (lb)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={art.pesoLibras || 0}
                                                            onChange={(e) => updateArticulo(art.id, 'pesoLibras', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                )}
                                                <div className="col-span-2">
                                                    <label className="text-xs font-bold text-slate-600 block mb-1">Precio Venta (DOP)</label>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        value={art.precioVentaDOP}
                                                        onChange={(e) => updateArticulo(art.id, 'precioVentaDOP', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Regalos */}
                    <div className="mb-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-slate-200">
                            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                <Gift size={16} className="text-pink-600" />
                                Regalos (3 por $1) - Opcionales
                            </h3>
                        </div>
                        <div className="p-4 space-y-2">
                            {/* Headers */}
                            <div className={`grid gap-2 px-2 ${modoCourier === 'libra' ? 'grid-cols-5' : 'grid-cols-4'}`}>
                                <div className="text-[10px] font-black text-slate-500 uppercase">✓</div>
                                <div className="text-[10px] font-black text-slate-500 uppercase">Nombre</div>
                                <div className="text-[10px] font-black text-slate-500 uppercase">Venta (DOP)</div>
                                {modoCourier === 'fijo' ? (
                                    <div className="text-[10px] font-black text-slate-500 uppercase">Courier (DOP)</div>
                                ) : (
                                    <>
                                        <div className="text-[10px] font-black text-slate-500 uppercase">Peso (lb)</div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase text-slate-400">Auto</div>
                                    </>
                                )}
                            </div>
                            {/* Regalos */}
                            {regalos.map((regalo, idx) => (
                                <div key={idx} className={`grid gap-2 p-2 rounded-lg border ${regalo.activo ? 'bg-pink-50 border-pink-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`${modoCourier === 'libra' ? 'grid-cols-5' : 'grid-cols-4'} grid gap-2 items-center`}>
                                        <input
                                            type="checkbox"
                                            checked={regalo.activo}
                                            onChange={(e) => updateRegalo(idx, 'activo', e.target.checked)}
                                            className="w-4 h-4 text-pink-600 focus:ring-2 focus:ring-pink-500 rounded"
                                        />
                                        <input
                                            type="text"
                                            value={regalo.nombre}
                                            onChange={(e) => updateRegalo(idx, 'nombre', e.target.value)}
                                            disabled={!regalo.activo}
                                            className={`px-2 py-1.5 border rounded text-xs focus:ring-2 focus:ring-pink-500 outline-none ${!regalo.activo ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
                                            placeholder="Nombre"
                                        />
                                        <input
                                            type="number"
                                            value={regalo.precioVentaDOP}
                                            onChange={(e) => updateRegalo(idx, 'precioVentaDOP', parseFloat(e.target.value) || 0)}
                                            disabled={!regalo.activo}
                                            className={`px-2 py-1.5 border rounded text-xs focus:ring-2 focus:ring-pink-500 outline-none ${!regalo.activo ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
                                        />
                                        {modoCourier === 'fijo' ? (
                                            <input
                                                type="number"
                                                value={regalo.costoCourierDOP}
                                                onChange={(e) => updateRegalo(idx, 'costoCourierDOP', parseFloat(e.target.value) || 0)}
                                                disabled={!regalo.activo}
                                                className={`px-2 py-1.5 border rounded text-xs focus:ring-2 focus:ring-pink-500 outline-none ${!regalo.activo ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
                                            />
                                        ) : (
                                            <>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={regalo.pesoLibras || 0}
                                                    onChange={(e) => updateRegalo(idx, 'pesoLibras', parseFloat(e.target.value) || 0)}
                                                    disabled={!regalo.activo}
                                                    className={`px-2 py-1.5 border rounded text-xs focus:ring-2 focus:ring-pink-500 outline-none ${!regalo.activo ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
                                                />
                                                <div className="text-[10px] text-slate-400 italic">por peso</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cuánto Necesito Gastar */}
                    <div className="mb-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-orange-100 to-yellow-100 border-b border-orange-200">
                            <h3 className="font-bold text-sm text-orange-900 flex items-center gap-2">
                                <Target size={16} className="text-orange-600" />
                                💰 Cuánto Necesito Gastar
                            </h3>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white p-3 rounded-lg border border-orange-200 text-center overflow-hidden">
                                    <div className="text-[10px] font-bold text-orange-600 mb-1">TOTAL USD</div>
                                    <div className="text-lg font-black text-orange-900 break-words">${resultado.gasto.totalUSD}</div>
                                    <div className="text-[9px] text-orange-500 mt-1">Artículos + Relleno</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-orange-200 text-center overflow-hidden">
                                    <div className="text-[10px] font-bold text-orange-600 mb-1">TOTAL DOP</div>
                                    <div className="text-lg font-black text-orange-900 break-words">RD${parseFloat(resultado.gasto.totalDOP).toLocaleString()}</div>
                                    <div className="text-[9px] text-orange-500 mt-1">Todo incluido</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-orange-200 text-center overflow-hidden">
                                    <div className="text-[10px] font-bold text-orange-600 mb-1">COURIER</div>
                                    <div className="text-lg font-black text-orange-900 break-words">RD${parseFloat(resultado.gasto.courier).toLocaleString()}</div>
                                    <div className="text-[9px] text-orange-500 mt-1 truncate">
                                        {modoCourier === 'libra' ? `${resultado.info.pesoTotalLibras}lb total` : 'Fijo'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resultados */}
                    <div className="space-y-3">
                        {/* Puntos */}
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-4 rounded-xl shadow-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={18} />
                                <h3 className="font-bold text-sm">Análisis de Puntos</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <div className="opacity-80 mb-0.5">Faltan (Inicial)</div>
                                    <div className="text-xl font-black">{resultado.puntos.faltanteInicial}</div>
                                </div>
                                <div>
                                    <div className="opacity-80 mb-0.5">Puntos de Artículos</div>
                                    <div className="text-xl font-black">{resultado.puntos.puntosDeArticulos}</div>
                                </div>
                                <div>
                                    <div className="opacity-80 mb-0.5">Nuevo Faltante</div>
                                    <div className="text-lg font-bold">{resultado.puntos.nuevoFaltante}</div>
                                </div>
                                <div>
                                    <div className="opacity-80 mb-0.5">Gasto Extra (USD)</div>
                                    <div className="text-lg font-bold">${resultado.puntos.gastoExtraUSD}</div>
                                </div>
                            </div>
                        </div>

                        {/* Financiero */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                                <div className="text-xs text-blue-600 font-bold mb-1 flex items-center gap-1">
                                    <DollarSign size={14} />
                                    Inversión Total
                                </div>
                                <div className="text-2xl font-black text-blue-900">RD${parseFloat(resultado.financiero.inversionTotal).toLocaleString()}</div>
                                <div className="text-[10px] text-blue-600 mt-1">
                                    Mercancía: {parseFloat(resultado.financiero.costoMercancia).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-blue-600">
                                    Courier: {parseFloat(resultado.financiero.costoCourier).toLocaleString()}
                                    {modoCourier === 'libra' && ` (${resultado.info.pesoTotalLibras}lb)`}
                                </div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                                <div className="text-xs text-emerald-600 font-bold mb-1 flex items-center gap-1">
                                    <TrendingUp size={14} />
                                    Ingresos Ventas
                                </div>
                                <div className="text-2xl font-black text-emerald-900">RD${parseFloat(resultado.financiero.ingresosVentas).toLocaleString()}</div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl shadow-lg ${parseFloat(resultado.financiero.gananciaNeta) >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-red-500 to-orange-500'} text-white`}>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={20} />
                                <h3 className="font-bold">Ganancia Neta</h3>
                            </div>
                            <div className="text-4xl font-black mb-1">
                                {parseFloat(resultado.financiero.gananciaNeta) >= 0 ? '+' : ''}RD${parseFloat(resultado.financiero.gananciaNeta).toLocaleString()}
                            </div>
                            <div className="text-sm opacity-90">
                                Margen: {resultado.financiero.margenPorcentaje}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
