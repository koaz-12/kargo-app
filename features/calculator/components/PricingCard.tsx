import { Trash2 } from 'lucide-react';
import { FormState, FormSetters } from '../../../types';

interface PricingCardProps {
    formState: FormState;
    setters: FormSetters;
    isVisible: boolean;
}

export default function PricingCard({ formState, setters, isVisible }: PricingCardProps) {
    if (!isVisible) return null;

    return (
        <div className="space-y-3">
            {/* 5. SALE PHASE */}
            <section className="bg-white p-3 rounded-2xl shadow-sm border-l-4 border-l-purple-500 relative">
                <p className="text-[10px] font-bold text-purple-600 mb-2 uppercase tracking-wide">Fase 3: Venta (RD)</p>

                <div className="grid grid-cols-[1.5fr_1fr] gap-3 items-end">
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Precio Venta</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-700 font-bold text-sm">RD$</span>
                            <input
                                type="number"
                                value={formState.salePrice || ''}
                                onChange={(e) => setters.setSalePrice(Number(e.target.value))}
                                className="w-full pl-12 pr-3 py-2 bg-purple-50/50 border border-purple-100 rounded-lg text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-200"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Envío Local</label>
                        <input
                            type="number"
                            value={formState.localShipping || ''}
                            onChange={(e) => setters.setLocalShipping(Number(e.target.value))}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none"
                            placeholder="0"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
