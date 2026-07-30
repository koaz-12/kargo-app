import { Edit2, PlusCircle } from 'lucide-react';

interface ProductHeaderProps {
    isEditing: boolean;
    exchangeRate: number;
    onRateChange: (val: number) => void;
}

export default function ProductHeader({ isEditing, exchangeRate, onRateChange }: ProductHeaderProps) {
    return (
        <header className="sticky top-0 z-50 pt-6 pb-4 pl-4 pr-16 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                    {isEditing ? <Edit2 size={20} strokeWidth={2.5} /> : <PlusCircle size={20} strokeWidth={2.5} />}
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none pt-0.5">
                        {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                    </h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Calculadora</p>
                </div>
            </div>

            {/* Exchange Rate Input (Top Right) */}
            <div className="flex flex-col items-end bg-white border border-slate-200/60 p-2 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Tasa USD</span>
                <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-slate-400">$</span>
                    <input
                        type="number"
                        value={exchangeRate}
                        onChange={(e) => onRateChange(Number(e.target.value))}
                        className="w-12 text-right font-black text-slate-800 outline-none p-0 text-sm bg-transparent"
                        placeholder="60.0"
                    />
                </div>
            </div>
        </header>
    );
}
