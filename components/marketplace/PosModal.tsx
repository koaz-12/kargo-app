import { useState } from 'react';
import { X, DollarSign, Truck, ShoppingBag, Loader2 } from 'lucide-react';
import { useSales } from '../../hooks/useSales';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface PosModalProps {
    isOpen: boolean;
    onClose: () => void;
    skus: string[];
    title: string;
}

export default function PosModal({ isOpen, onClose, skus, title }: PosModalProps) {
    const [salePrice, setSalePrice] = useState('');
    const [shippingCost, setShippingCost] = useState('');
    const { createSale, isProcessing } = useSales();
    const queryClient = useQueryClient();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numSalePrice = Number(salePrice);
        
        if (!numSalePrice || numSalePrice <= 0) {
            return toast.error('Debes ingresar un precio de venta válido.');
        }

        try {
            await createSale({
                skus,
                totalAmount: numSalePrice,
                shippingCost: Number(shippingCost) || 0,
                notes: `Venta rápida de: ${title}`
            });
            
            toast.success('¡Venta registrada exitosamente! 🎉');
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace_listings'] });
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="bg-emerald-600 p-5 pb-8 text-white relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-emerald-200 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 rounded-full p-1.5 transition-colors"
                        disabled={isProcessing}
                    >
                        <X size={18} strokeWidth={3} />
                    </button>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md">
                        <ShoppingBag size={24} className="text-white" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight">Nueva Venta</h2>
                    <p className="text-emerald-100 text-xs mt-1 font-medium line-clamp-1">{title}</p>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-5 -mt-4 relative bg-white rounded-t-3xl">
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">SKUs a descontar</label>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{skus.length} Artículos</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {skus.map((sku, idx) => (
                                <span key={idx} className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200/60">
                                    {sku}
                                </span>
                            ))}
                        </div>
                        {skus.length === 0 && (
                            <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 mt-2">
                                Esta plantilla no tiene SKUs vinculados. Debes vincular al menos un producto para registrar una venta.
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Sale Price */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Precio Cobrado al Cliente</label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700">
                                    <DollarSign size={16} strokeWidth={2.5} />
                                </div>
                                <input
                                    type="number"
                                    required
                                    value={salePrice}
                                    onChange={e => setSalePrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-13 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-lg outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                                    disabled={isProcessing}
                                />
                            </div>
                        </div>

                        {/* Shipping Cost */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Costo de Envío / Delivery <span className="text-slate-400 font-normal">(Opcional)</span></label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                    <Truck size={16} strokeWidth={2.5} />
                                </div>
                                <input
                                    type="number"
                                    value={shippingCost}
                                    onChange={e => setShippingCost(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-13 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                                    disabled={isProcessing}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Si pagaste un delivery de tu ganancia, ingrésalo aquí.</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isProcessing || skus.length === 0}
                        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm py-4 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Procesando Venta...
                            </>
                        ) : (
                            <>
                                Registrar Venta <ShoppingBag size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
