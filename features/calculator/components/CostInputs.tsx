import { useState } from 'react';
import { Calculator, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { FormState, FormSetters } from '../../../types';

interface CostInputsProps {
    formState: FormState;
    setters: FormSetters;
    onApplyDiscount?: (percent: number) => void;
    selectedPlatformName?: string;
    courierDiscount?: number;
}

export default function CostInputs({ formState, setters, onApplyDiscount, selectedPlatformName, courierDiscount = 0 }: CostInputsProps) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [isDiscountApplied, setIsDiscountApplied] = useState(false);

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
            alert('No veo un link válido. Asegúrate que empiece con http...');
        }
    };

    const placeholderText = selectedPlatformName
        ? `Pega link de ${selectedPlatformName}...`
        : "Pega link de Amazon/Shein...";

    return (
        <section className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
                <Calculator size={14} className="text-blue-500" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Estructura de Costos (USD)</p>
            </div>

            <div className="space-y-3">
                {/* 1. Purchase Price */}
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Precio Compra</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                            <span className="text-slate-400 text-sm mr-2">$</span>
                            <input
                                type="number"
                                value={formState.buyPrice || ''}
                                onChange={(e) => setters.setBuyPrice(Number(e.target.value))}
                                className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* 2. Shipping */}
                    <div className="flex-1">
                        <label className="text-[10px] text-slate-400 block mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Envío (USA)</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                            <span className="text-slate-400 text-sm mr-2">$</span>
                            <input
                                type="number"
                                value={formState.shippingCost || ''}
                                onChange={(e) => setters.setShippingCost(Number(e.target.value))}
                                className="w-full bg-transparent text-sm text-slate-700 outline-none"
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

                {/* 4. Tax (USA) & Import (Two Cols) */}
                <div className="flex gap-3">
                    {/* Tax USA (7%) */}
                    <div className="flex-1">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Tax USA (7%)</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
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
                        <div className={`flex items-center bg-slate-50 border rounded-lg px-3 py-2.5 transition-all ${isDiscountApplied ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200 focus-within:border-blue-400'}`}>
                            <span className="text-slate-400 text-sm font-bold mr-2">RD$</span>
                            <input
                                type="number"
                                value={formState.taxCost || ''}
                                onChange={(e) => {
                                    setters.setTaxCost(Number(e.target.value));
                                    setIsDiscountApplied(false);
                                }}
                                onBlur={() => {
                                    if (courierDiscount > 0 && formState.taxCost > 0 && !isDiscountApplied) {
                                        const discounted = formState.taxCost * (1 - (courierDiscount / 100));
                                        setters.setTaxCost(Math.round(discounted));
                                        setIsDiscountApplied(true);
                                    }
                                }}
                                className="w-full bg-transparent text-sm text-slate-700 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
