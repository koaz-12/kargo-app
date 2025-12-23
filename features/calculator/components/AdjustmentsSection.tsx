import { Trash2 } from 'lucide-react';
import { FormState, FormSetters } from '../../../types';

interface AdjustmentsSectionProps {
    formState: FormState;
    setters: FormSetters;
}

export default function AdjustmentsSection({ formState, setters }: AdjustmentsSectionProps) {
    return (
        <section className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">AJUSTES/CREDITOS</p>
                <div className="flex gap-1">
                    <button
                        onClick={() => setters.addAdjustment('CREDIT_CLAIM', 0)}
                        className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded font-bold hover:bg-emerald-100"
                    >
                        + Credit
                    </button>
                    <button
                        onClick={() => setters.addAdjustment('REWARD_BACK', 0)}
                        className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded font-bold hover:bg-amber-100"
                    >
                        + RewardBack
                    </button>
                </div>
            </div>

            {formState.adjustments.length === 0 && <p className="text-[10px] text-slate-300 py-2 text-center">Sin ajustes aplicados.</p>}

            <div className="space-y-2">
                {formState.adjustments.map((adj) => (
                    <div key={adj.id} className="flex gap-0.5 items-center animate-in fade-in slide-in-from-left-2">
                        <select
                            className="flex-1 w-0 min-w-[40px] text-[10px] border border-slate-200 rounded px-0.5 py-1.5 bg-slate-50 text-slate-700 outline-none truncate"
                            value={adj.type}
                            onChange={(e) => setters.updateAdjustment(adj.id, 'type', e.target.value)}
                        >
                            <option value="CREDIT_CLAIM">CreditClaim</option>
                            <option value="REWARD_BACK">RewardBack</option>
                            <option value="COUPON">Cupón</option>
                            <option value="PRICE_ADJUSTMENT">Ajuste</option>
                            {/* Removed Invalid/Duplicate Options: PRICE_PROTECTION, REWARD_BACK (old label) */}
                        </select>
                        <div className="w-10 shrink-0 flex items-center border border-slate-200 rounded px-0 py-1.5 bg-white focus-within:border-blue-500 transition-colors">
                            <input
                                type="number"
                                placeholder="%"
                                className="w-full text-xs outline-none text-center bg-transparent p-0"
                                value={adj.percentage || ''}
                                onChange={(e) => setters.updateAdjustment(adj.id, 'percentage', Number(e.target.value))}
                            />
                            <span className="text-[9px] text-slate-400">%</span>
                        </div>
                        <div className="flex-[1.5] w-0 min-w-[60px] flex items-center border border-slate-200 rounded px-1.5 py-1.5 bg-white focus-within:border-blue-500 transition-colors">
                            <span className="text-[10px] text-slate-400 mr-0.5">$</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full text-xs outline-none font-medium bg-transparent p-0"
                                value={adj.amount || ''}
                                onChange={(e) => setters.updateAdjustment(adj.id, 'amount', Number(e.target.value))}
                            />
                        </div>
                        <button onClick={() => setters.removeAdjustment(adj.id)} className="text-slate-400 hover:text-red-500 p-1 shrink-0">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
