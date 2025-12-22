import { Calculator, Zap } from 'lucide-react';
import { FormState, FormSetters } from '../../../types';

interface CostInputsProps {
    formState: FormState;
    setters: FormSetters;
    onApplyDiscount?: (percent: number) => void;
    selectedPlatformName?: string;
}

export default function CostInputs({ formState, setters, onApplyDiscount, selectedPlatformName }: CostInputsProps) {
    const extractUrl = (text: string) => {
        // More robust URL extraction: Find http/https and grab everything until whitespace
        const match = text.match(/(https?:\/\/[^\s]+)/i);
        return match ? match[0] : null;
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text');
        const url = extractUrl(text);
        if (url) {
            setTimeout(() => {
                // Show tiny feedback if possible, or just rely on spinner
                setters.fetchMetadata(url);
            }, 100);
        }
    };

    const handleManualFetch = () => {
        const url = extractUrl(formState.productUrl);
        if (url) {
            // Force feedback for mobile users
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
            setters.fetchMetadata(url);
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
                        <label className="text-[10px] text-slate-400 block mb-0.5">Link del Producto (Magia 🪄)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formState.productUrl}
                                onChange={(e) => setters.setProductUrl(e.target.value)}
                                onPaste={handlePaste}
                                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 outline-none focus:border-blue-400 placeholder:italic"
                                placeholder={placeholderText}
                            />
                            <button
                                onClick={handleManualFetch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 p-1 bg-transparent"
                                title="Buscar imagen"
                            >
                                <Zap size={16} className={formState.isScraping ? "animate-spin text-blue-500" : ""} />
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

                    {/* Import Tax (DOP) */}
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-0.5">
                            <label className="text-[10px] text-slate-400">Aduanas (RD$)</label>
                            {/* Zero Tax Helper */}
                            <button
                                onClick={() => setters.setTaxCost(0)}
                                className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5 hover:bg-emerald-100"
                                title="Exento (0%)"
                            >
                                <Zap size={8} /> 0%
                            </button>
                        </div>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-blue-400 transition-colors">
                            <span className="text-slate-400 text-sm font-bold mr-2">RD$</span>
                            <input
                                type="number"
                                value={formState.taxCost || ''}
                                onChange={(e) => setters.setTaxCost(Number(e.target.value))}
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
