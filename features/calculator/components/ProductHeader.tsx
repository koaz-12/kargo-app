import { Edit2, PlusCircle } from 'lucide-react';

interface ProductHeaderProps {
    isEditing: boolean;
    exchangeRate: number;
    onRateChange: (val: number) => void;
}

export default function ProductHeader({ isEditing, exchangeRate, onRateChange }: ProductHeaderProps) {
    return (
        <header className="bg-white px-4 py-3 sticky top-0 z-[100] border-b border-slate-100 flex items-center justify-between shadow-sm mb-4 gap-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    {isEditing ? <Edit2 size={18} /> : <PlusCircle size={18} />}
                </div>
                <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none pt-0.5">
                    {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                </h1>
            </div>

            {/* Exchange Rate Input (Top Right) */}
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Tasa USD</span>
                <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-400">$</span>
                    <input
                        type="number"
                        value={exchangeRate}
                        onChange={(e) => onRateChange(Number(e.target.value))}
                        className="w-12 text-right font-bold text-slate-800 border-b border-slate-200 focus:border-blue-500 outline-none p-0 text-sm bg-transparent"
                        placeholder="60.0"
                    />
                </div>
            </div>
        </header>
    );
}
