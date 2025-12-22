import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Save, Loader2 } from 'lucide-react';

interface CalculationResults {
    net_cost: number;
    gross_profit: number;
}

interface ActionToolbarProps {
    results: CalculationResults;
    hasPrice: boolean; // formState.buyPrice > 0
    saving: boolean;
    isEditing: boolean;
    onAddToQueue: () => void;
    onSave: (clone: boolean) => void;
}

export default function ActionToolbar({
    results,
    hasPrice,
    saving,
    isEditing,
    onAddToQueue,
    onSave
}: ActionToolbarProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Use Portal to escape any overflow/stacking context issues in Layout
    return createPortal(
        <div className="fixed bottom-[65px] left-0 right-0 z-[9999] pointer-events-none">
            {/* pointer-events-none on wrapper to let clicks pass through on sides if needed, 
                but visual bar needs pointer-events-auto */}
            <div className="max-w-md mx-auto bg-white border-t border-slate-100 px-4 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pointer-events-auto">
                <div className="flex items-center justify-between">

                    {/* 1. Stats (Compact Left) */}
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Costo</span>
                            <span className="text-xs font-bold text-slate-700">RD${Math.round(results.net_cost).toLocaleString()}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Ganancia</span>
                            <span className={`text-xs font-bold ${results.gross_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                RD${Math.round(results.gross_profit).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* 2. Actions (Icon Row) */}
                    <div className="flex items-center gap-2">
                        {/* Queue (Icon) */}
                        <button
                            onClick={onAddToQueue}
                            disabled={!hasPrice}
                            className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
                            title="Agregar a cola"
                        >
                            <span className="text-xl leading-none mb-0.5">+</span>
                        </button>

                        {/* Clone (Icon Only) */}
                        {!isEditing && (
                            <button
                                onClick={() => onSave(true)}
                                disabled={saving}
                                className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center hover:bg-blue-100 active:scale-95 transition-all"
                                title="Clonar"
                            >
                                <Copy size={18} />
                            </button>
                        )}

                        {/* Save (Compact) */}
                        <button
                            onClick={() => onSave(false)}
                            disabled={saving}
                            className={`h-10 px-6 rounded-full font-bold text-sm shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center gap-2 
                                ${saving ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>Guardar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
