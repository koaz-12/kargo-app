import { Calculator, Zap } from 'lucide-react';
import { FormState, FormSetters } from '../../../types';

interface CostInputsProps {
    formState: FormState;
    setters: FormSetters;
    onApplyDiscount?: (percent: number) => void;
    selectedPlatformName?: string;
}

export default function CostInputs({ formState, setters, onApplyDiscount, selectedPlatformName }: CostInputsProps) {
    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text');
        if (text && text.startsWith('http')) {
            setTimeout(() => setters.fetchMetadata(text), 100);
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
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <input
                                type="number"
                                value={formState.buyPrice || ''}
                                onChange={(e) => setters.setBuyPrice(Number(e.target.value))}
                                className="w-full pl-6 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* 2. Shipping */}
                    <div className="w-1/3">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Envío (USA)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <input
                                type="number"
                                value={formState.shippingCost || ''}
                                onChange={(e) => setters.setShippingCost(Number(e.target.value))}
                                className="w-full pl-6 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Helper Row: Product Link & Shipping Markup */}
                <div className="grid grid-cols-[1fr_auto] gap-3">
                    {/* Product URL (Magic Paste) */}
                    <div className="relative">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Link del Producto (Magia 🪄)</label>
                        <input
                            type="text"
                            value={formState.productUrl}
                            onChange={(e) => setters.setProductUrl(e.target.value)}
                            onPaste={handlePaste}
                            className="w-full pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 outline-none focus:border-blue-400 placeholder:italic"
                            placeholder={placeholderText}
                        />
                    </div>
                </div>

                {/* 4. Tax (USA) & Import (Two Cols) */}
                <div className="flex gap-3">
                    {/* Tax USA (7%) */}
                    <div className="flex-1">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Tax USA (7%)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <input
                                type="number"
                                value={formState.originTax || ''}
                                onChange={(e) => setters.setOriginTax(Number(e.target.value))}
                                className="w-full pl-6 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none"
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
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">RD$</span>
                            <input
                                type="number"
                                value={formState.taxCost || ''}
                                onChange={(e) => setters.setTaxCost(Number(e.target.value))}
                                className="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
