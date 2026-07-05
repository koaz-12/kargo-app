import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Calculator, Zap, CheckCircle, Loader2, ScanBarcode, Wand2 } from 'lucide-react';
import { BarcodeScanner } from '../../../components/ui/BarcodeScanner';
import { FormState, FormSetters } from '../../../types';
import { useHistoricalSkus } from '../../../hooks/useProducts';

interface CostInputsProps {
    formState: FormState;
    setters: FormSetters;
    onApplyDiscount?: (percent: number) => void;
    selectedPlatformName?: string;
    courierDiscount?: number;
}

export default function CostInputs({ formState, setters, onApplyDiscount, selectedPlatformName, courierDiscount = 0 }: CostInputsProps) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeScanner, setActiveScanner] = useState<'SKU' | 'TRACKING_USA' | 'TRACKING_RD' | null>(null);
    const [isDiscountApplied, setIsDiscountApplied] = useState(false);
    const [showSkuDropdown, setShowSkuDropdown] = useState(false);
    
    // Weight Calculation States
    const [weightLbs, setWeightLbs] = useState<string>('');
    const [ratePerLb, setRatePerLb] = useState<string>(formState.defaultPoundRate || '280');

    useEffect(() => {
        if (formState.defaultPoundRate) {
            setRatePerLb(formState.defaultPoundRate);
        }
    }, [formState.defaultPoundRate]);

    // Fetch historical SKUs based on the current product name
    const { data: historicalSkus = [], isLoading: isLoadingSkus } = useHistoricalSkus(formState.name);

    const handleSuggestSku = () => {
        let finalSku = '';
        if (formState.name) {
            // Eliminar algunas preposiciones comunes para las iniciales
            const ignoreWords = ['DE', 'LA', 'EL', 'LOS', 'LAS', 'Y', 'A', 'CON', 'EN', 'POR', 'PARA'];
            const words = formState.name.trim().split(/\s+/).filter(w => w.length > 0 && !ignoreWords.includes(w.toUpperCase()));

            if (words.length >= 3) {
                // [MARCA] - [MODELO] - [VARIANTE/CONECTOR]
                const marca = words[0].substring(0, 4).toUpperCase();
                const variante = words[words.length - 1].substring(0, 4).toUpperCase();

                // Modelo (todo lo del medio)
                const middleWords = words.slice(1, words.length - 1);
                let modelo = '';
                if (middleWords.length === 1) {
                    modelo = middleWords[0].substring(0, 5).toUpperCase();
                } else {
                    modelo = middleWords.map(w => w[0]).join('').substring(0, 4).toUpperCase();
                }

                finalSku = `${marca}-${modelo}-${variante}`;
            } else if (words.length === 2) {
                // [MARCA] - [MODELO] - [RANDOM]
                const marca = words[0].substring(0, 4).toUpperCase();
                const modelo = words[1].substring(0, 5).toUpperCase();
                const randomNum = Math.random().toString(36).substring(2, 5).toUpperCase();
                finalSku = `${marca}-${modelo}-${randomNum}`;
            } else if (words.length === 1) {
                // [MARCA] - [RANDOM]
                const marca = words[0].substring(0, 5).toUpperCase();
                const randomNum = Math.random().toString(36).substring(2, 6).toUpperCase();
                finalSku = `${marca}-${randomNum}`;
            }
        }

        // Fallback
        if (!finalSku) {
            const randomNum = Math.random().toString(36).substring(2, 6).toUpperCase();
            finalSku = `PRD-${randomNum}`;
        }

        setters.setSku(finalSku);
    };

    const extractUrl = (text: string) => {
        // More robust URL extraction: Find http/https and grab everything until whitespace
        const match = text.match(/(https?:\/\/[^\s]+)/i);
        return match ? match[0] : null;
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text');
        const url = extractUrl(text);
        if (url) {
            // Show loading immediately? handled by isScraping
            const success = await setters.fetchMetadata(url);
            if (success) {
                if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([50, 50]);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
            }
        }
    };

    const handleManualFetch = async () => {
        const url = extractUrl(formState.productUrl);
        if (url) {
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
            const success = await setters.fetchMetadata(url);
            if (success) {
                if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
            }
        } else {
            toast.error('No veo un link válido. Asegúrate que empiece con http...');
        }
    };

    const placeholderText = selectedPlatformName
        ? `Pega link de ${selectedPlatformName}...`
        : "Pega link de Amazon/Shein...";

    return (
        <section className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 mt-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                    <Calculator size={14} strokeWidth={2.5} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estructura de Costos</p>
            </div>

            <div className="space-y-3">
                {/* Currency Selector */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <label className="text-[10px] text-slate-400 block mb-1">Moneda de Compra</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setters.setCurrency('USD')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${formState.currency === 'USD'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                        >
                            💵 USD
                        </button>
                        <button
                            type="button"
                            onClick={() => setters.setCurrency('DOP')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${formState.currency === 'DOP'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                        >
                            🇩🇴 DOP
                        </button>
                    </div>
                </div>

                {/* 1. Purchase Price */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Precio Compra</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <span className="text-slate-400 text-sm mr-2 font-bold">
                                {formState.currency === 'DOP' ? 'RD$' : '$'}
                            </span>
                            <input
                                type="number"
                                value={formState.buyPrice || ''}
                                onChange={(e) => setters.setBuyPrice(Number(e.target.value))}
                                className="w-full bg-transparent text-sm font-black text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-300"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* 2. Shipping */}
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                            Envío {formState.currency === 'USD' ? '(USA)' : ''}
                        </label>
                        <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <span className="text-slate-400 text-sm mr-2 font-bold">
                                {formState.currency === 'DOP' ? 'RD$' : '$'}
                            </span>
                            <input
                                type="number"
                                value={formState.shippingCost || ''}
                                onChange={(e) => setters.setShippingCost(Number(e.target.value))}
                                className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:font-medium placeholder:text-slate-300"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Helper Row... (Skipped in this chunk, doing contiguous block edits)*/}
                <div className="grid grid-cols-[1fr_auto] gap-3">
                    {/* Product URL (Magic Paste) */}
                    <div className="relative">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Link (Auto-Imagen) 📸</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formState.productUrl}
                                onChange={(e) => setters.setProductUrl(e.target.value)}
                                onPaste={handlePaste}
                                className={`w-full pl-3 pr-9 py-2.5 bg-slate-50 border rounded-lg text-xs text-slate-600 outline-none focus:border-blue-400 placeholder:italic transition-colors ${showSuccess ? 'border-green-400 bg-green-50' : 'border-slate-200'}`}
                                placeholder={placeholderText}
                            />
                            <button
                                onClick={handleManualFetch}
                                disabled={formState.isScraping}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-transparent disabled:opacity-50"
                            >
                                {formState.isScraping ? (
                                    <Loader2 size={16} className="text-blue-500 animate-spin" />
                                ) : showSuccess ? (
                                    <CheckCircle size={18} className="text-green-500 transition-all scale-110" />
                                ) : (
                                    <Zap size={16} className="text-slate-400 hover:text-blue-500 transition-colors" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Tax USA (Optional Checkbox) - Solo si currency es USD */}
                {formState.currency === 'USD' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="applyUSATax"
                                checked={formState.applyUSATax || false}
                                onChange={(e) => {
                                    setters.setApplyUSATax(e.target.checked);
                                    if (e.target.checked && formState.buyPrice > 0) {
                                        setters.setOriginTax(formState.buyPrice * 0.07);
                                    } else {
                                        setters.setOriginTax(0);
                                    }
                                }}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor="applyUSATax" className="text-xs font-bold text-blue-700 cursor-pointer">
                                Aplicar Tax USA (7%)
                            </label>
                        </div>

                        {formState.applyUSATax && (
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-400 block mb-0.5">Tax USA</label>
                                <div className="flex items-center bg-white border border-blue-200 rounded-lg px-3 py-2.5">
                                    <span className="text-slate-400 text-sm mr-2">$</span>
                                    <input
                                        type="number"
                                        value={formState.originTax || ''}
                                        onChange={(e) => setters.setOriginTax(Number(e.target.value))}
                                        className="w-full bg-transparent text-sm text-slate-700 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 5. Logistics (Optional) - Tracking */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Logística y SKU</p>

                    {/* SKU Field with Generator & Scanner */}
                    <div className="relative mb-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg focus-within:border-blue-500 overflow-hidden transition-colors shadow-sm relative z-20">
                            <span className="text-slate-400 text-xs shrink-0 pl-3">🏷️</span>
                            <input
                                type="text"
                                placeholder="Código / SKU del producto"
                                value={formState.sku || ''}
                                onChange={(e) => setters.setSku(e.target.value.toUpperCase())}
                                onFocus={() => setShowSkuDropdown(true)}
                                onBlur={() => setShowSkuDropdown(false)}
                                className="w-full text-xs bg-transparent outline-none px-2 py-2 text-slate-700 placeholder:text-slate-400 font-bold uppercase"
                            />
                            <button
                                onClick={handleSuggestSku}
                                className="px-3 py-2 bg-slate-50 border-l border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center shrink-0"
                                title="Generar SKU Inteligente"
                                type="button"
                            >
                                <Wand2 size={16} />
                            </button>
                            <button
                                onClick={() => setActiveScanner(activeScanner === 'SKU' ? null : 'SKU')}
                                className={`px-3 py-2 border-l border-slate-200 transition-colors flex items-center justify-center shrink-0 ${activeScanner === 'SKU' ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
                                title="Escanear Código de Barras"
                                type="button"
                            >
                                <ScanBarcode size={16} />
                            </button>
                        </div>

                        {/* Historical SKU Suggestions */}
                        {showSkuDropdown && historicalSkus.length > 0 && formState.name.trim().length >= 3 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                        Historial Sugerido
                                    </span>
                                    {isLoadingSkus && <Loader2 size={12} className="text-slate-400 animate-spin" />}
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {historicalSkus.map(sku => (
                                        <button
                                            key={sku}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                setters.setSku(sku);
                                                setShowSkuDropdown(false);
                                            }}
                                            className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-colors border-b border-slate-50 last:border-0 flex items-center gap-2
                                                ${formState.sku === sku
                                                    ? 'bg-blue-50/50 text-blue-700'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                            type="button"
                                        >
                                            <span className="opacity-50 text-[10px]">🔖</span> {sku}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {activeScanner && (
                        <div className="mb-2 overflow-hidden rounded-lg border border-slate-200">
                            <BarcodeScanner
                                onScan={(code) => {
                                    if (activeScanner === 'SKU') setters.setSku(code);
                                    else if (activeScanner === 'TRACKING_USA') setters.setTrackingNumber(code);
                                    else if (activeScanner === 'TRACKING_RD') setters.setCourierTracking(code);
                                    setActiveScanner(null);
                                }}
                                onClose={() => setActiveScanner(null)}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg focus-within:border-blue-500 px-3 py-1.5 transition-colors overflow-hidden relative">
                            <span className="text-slate-400 text-xs shrink-0">📦</span>
                            <input
                                type="text"
                                placeholder="Tracking USA"
                                value={formState.trackingNumber || ''}
                                onChange={(e) => setters.setTrackingNumber(e.target.value)}
                                className="w-full text-xs bg-transparent outline-none ml-2 text-slate-700 placeholder:text-slate-400 font-medium"
                            />
                            <button
                                onClick={() => setActiveScanner(activeScanner === 'TRACKING_USA' ? null : 'TRACKING_USA')}
                                className={`absolute right-0 top-0 bottom-0 px-2 border-l border-slate-200 transition-colors flex items-center justify-center ${activeScanner === 'TRACKING_USA' ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-400 hover:text-blue-600'}`}
                                type="button"
                                title="Escanear Tracking"
                            >
                                <ScanBarcode size={14} />
                            </button>
                        </div>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg focus-within:border-blue-500 px-3 py-1.5 transition-colors overflow-hidden relative">
                            <span className="text-slate-400 text-xs shrink-0">🚚</span>
                            <input
                                type="text"
                                placeholder="Tracking Local"
                                value={formState.courierTracking || ''}
                                onChange={(e) => setters.setCourierTracking(e.target.value)}
                                className="w-full text-xs bg-transparent outline-none ml-2 text-slate-700 placeholder:text-slate-400 font-medium"
                            />
                            <button
                                onClick={() => setActiveScanner(activeScanner === 'TRACKING_RD' ? null : 'TRACKING_RD')}
                                className={`absolute right-0 top-0 bottom-0 px-2 border-l border-slate-200 transition-colors flex items-center justify-center ${activeScanner === 'TRACKING_RD' ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-400 hover:text-blue-600'}`}
                                type="button"
                                title="Escanear Tracking"
                            >
                                <ScanBarcode size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Import Tax (DOP) -> Renamed to Pago Courier */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                        <div className="flex font-mono text-[10px] items-center gap-1">
                            <label className="text-slate-400 block mb-0.5">Pago Courier (RD$)</label>
                            {courierDiscount > 0 && (
                                <button
                                    onClick={() => {
                                        if (formState.taxCost > 0 && !isDiscountApplied) {
                                            const discounted = formState.taxCost * (1 - (courierDiscount / 100));
                                            setters.setTaxCost(Math.round(discounted));
                                            setIsDiscountApplied(true);
                                        }
                                    }}
                                    disabled={isDiscountApplied}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-0.5 transition-colors ${isDiscountApplied
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                                        : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                                        }`}
                                    title={isDiscountApplied ? 'Descuento aplicado' : `Descontar ${courierDiscount}% (o click fuera)`}
                                >
                                    {isDiscountApplied ? <CheckCircle size={8} /> : <Zap size={8} />}
                                    {isDiscountApplied ? 'Aplicado' : `-${courierDiscount}%`}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Libras */}
                        <div className="flex-1 flex items-center bg-slate-50 border border-slate-200/60 rounded-xl px-2 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <input
                                type="number"
                                value={weightLbs}
                                onChange={(e) => {
                                    const w = e.target.value;
                                    setWeightLbs(w);
                                    if(w && ratePerLb) {
                                        setters.setTaxCost(Math.round(Number(w) * Number(ratePerLb)));
                                        setIsDiscountApplied(false);
                                    }
                                }}
                                className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                                placeholder="Lbs"
                                step="0.1"
                            />
                            <span className="text-slate-400 font-bold text-[10px] ml-1">LBS</span>
                        </div>
                        {/* Rate */}
                        <div className="flex-1 flex items-center bg-slate-50 border border-slate-200/60 rounded-xl px-2 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <span className="text-slate-400 font-bold text-[10px] mr-1">TASA</span>
                            <input
                                type="number"
                                value={ratePerLb}
                                onChange={(e) => {
                                    const r = e.target.value;
                                    setRatePerLb(r);
                                    if(weightLbs && r) {
                                        setters.setTaxCost(Math.round(Number(weightLbs) * Number(r)));
                                        setIsDiscountApplied(false);
                                    }
                                }}
                                className="w-full bg-transparent text-sm text-slate-700 outline-none"
                                placeholder="280"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-400 text-xs">Total:</span>
                        <div className={`flex-1 flex items-center bg-white border rounded-lg px-3 py-1.5 transition-all ${isDiscountApplied ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200 focus-within:border-blue-400'}`}>
                            <span className="text-slate-400 text-sm font-bold mr-2">RD$</span>
                            <input
                                type="number"
                                value={formState.taxCost || ''}
                                onChange={(e) => {
                                    setters.setTaxCost(Number(e.target.value));
                                    setIsDiscountApplied(false);
                                    setWeightLbs(''); // Clear weight if manually overridden
                                }}
                                onBlur={() => {
                                    if (courierDiscount > 0 && formState.taxCost > 0 && !isDiscountApplied) {
                                        const discounted = formState.taxCost * (1 - (courierDiscount / 100));
                                        setters.setTaxCost(Math.round(discounted));
                                        setIsDiscountApplied(true);
                                    }
                                }}
                                className="w-full bg-transparent text-sm text-slate-700 font-bold outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
