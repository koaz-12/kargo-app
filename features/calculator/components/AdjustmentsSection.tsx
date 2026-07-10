import { Trash2, Plus } from 'lucide-react';
import { FormState, FormSetters } from '../../../types';
import { useAdjustmentTypes } from '../../../hooks/useAdjustmentTypes';

interface AdjustmentsSectionProps {
    formState: FormState;
    setters: FormSetters;
}

export default function AdjustmentsSection({ formState, setters }: AdjustmentsSectionProps) {
    const { types, loading } = useAdjustmentTypes();

    const firstType = types[0]?.key || 'CREDIT_CLAIM';

    return (
        <section className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 mt-4">
            <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    AJUSTES / CRÉDITOS
                </p>
                <button
                    onClick={() => setters.addAdjustment(firstType, 0)}
                    className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1.5 rounded-lg font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 active:scale-95"
                >
                    <Plus size={12} strokeWidth={2.5} /> Agregar
                </button>
            </div>

            {formState.adjustments.length === 0 && <p className="text-[10px] text-slate-300 py-2 text-center">Sin ajustes aplicados.</p>}

            <div className="space-y-3">
                {formState.adjustments.map((adj) => (
                    <div key={adj.id} className="flex gap-1.5 items-center animate-in fade-in slide-in-from-left-2">
                        <div className="flex-1 min-w-0">
                            <select
                                className="w-full text-xs font-semibold border border-slate-200/60 rounded-xl px-2 py-2 bg-slate-50 text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all truncate"
                                value={adj.type}
                                onChange={(e) => setters.updateAdjustment(adj.id, 'type', e.target.value)}
                            >
                                {loading && <option>Cargando...</option>}
                                {types.map(t => (
                                    <option key={t.key} value={t.key}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-14 shrink-0 flex items-center border border-slate-200/60 rounded-xl px-1 py-2 bg-slate-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <input
                                type="number"
                                placeholder="%"
                                className="w-full text-xs outline-none text-center bg-transparent p-0 font-bold text-slate-700"
                                value={adj.percentage || ''}
                                onChange={(e) => setters.updateAdjustment(adj.id, 'percentage', Number(e.target.value))}
                            />
                            <span className="text-[10px] font-bold text-slate-400 pr-1">%</span>
                        </div>
                        <div className="flex-[1.2] min-w-0 flex items-center border border-slate-200/60 rounded-xl px-2 py-2 bg-slate-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <span className="text-xs font-bold text-slate-400 mr-1">$</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full text-xs outline-none font-black text-slate-800 bg-transparent p-0"
                                value={adj.amount || ''}
                                onChange={(e) => setters.updateAdjustment(adj.id, 'amount', Number(e.target.value))}
                            />
                        </div>
                        <button onClick={() => setters.removeAdjustment(adj.id)} className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
