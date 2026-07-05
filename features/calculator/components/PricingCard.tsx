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
            {/* 5. SALE PHASE */}
            <section className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-purple-200/50 relative overflow-hidden text-white mt-4">
                <p className="text-[10px] font-bold text-purple-100 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-white/50"></span>
                    Fase 3: Venta (RD)
                </p>

                <div className="grid grid-cols-[1.5fr_1fr] gap-4 items-end">
                    <div>
                        <label className="text-[10px] font-bold text-purple-100 block mb-1">Precio Venta</label>
                        <div className="flex items-center bg-white/20 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-white/50 transition-all">
                            <span className="text-purple-100 text-sm font-bold mr-2">RD$</span>
                            <input
                                type="number"
                                value={formState.salePrice || ''}
                                onChange={(e) => setters.setSalePrice(Number(e.target.value))}
                                className="w-full bg-transparent text-xl font-black text-white outline-none placeholder:text-white/30"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-purple-100 block mb-1">Envío Local</label>
                        <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-white/30 transition-all">
                            <span className="text-purple-100/50 text-sm font-bold mr-2">RD$</span>
                            <input
                                type="number"
                                value={formState.localShipping || ''}
                                onChange={(e) => setters.setLocalShipping(Number(e.target.value))}
                                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/30"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
