import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabaseClient';
import { X, RefreshCcw, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { toast } from 'sonner';

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    product: Product;
    onReturnProcessed: () => void;
}

export function ReturnModal({ isOpen, onClose, orderId, product, onReturnProcessed }: ReturnModalProps) {
    const [reason, setReason] = useState('');
    const [refundAmount, setRefundAmount] = useState(product?.sale_price?.toString() || '0');
    const [returnToInventory, setReturnToInventory] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !product) return null;

    const handleProcessReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // 1. Register Return in DB
            const { error: returnError } = await supabase.from('returns').insert([{
                order_id: orderId,
                product_id: product.id,
                reason,
                refund_amount: Number(refundAmount),
                returned_to_inventory: returnToInventory
            }]);
            
            if (returnError) throw returnError;

            // 2. Adjust Product (nullify order_id, optionally mark as returned/lost)
            const newStatus = returnToInventory ? 'RECEIVED' : 'RETURNED'; // If RETURNED, it's effectively written off (damaged)
            
            await supabase.from('products').update({
                order_id: null,
                status: newStatus
            }).eq('id', product.id);

            // 3. Register negative payment on the order to reflect the refund (if they returned money)
            if (Number(refundAmount) > 0) {
                await supabase.from('order_payments').insert([{
                    order_id: orderId,
                    amount: -Number(refundAmount), // Negative amount
                    payment_method: 'REFUND',
                    notes: `Devolución de ${product.name}`
                }]);
            }

            toast.success('Devolución procesada');
            onReturnProcessed();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Error al procesar devolución');
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
                <div className="bg-amber-500 p-5 flex items-center justify-between text-white">
                    <h2 className="text-lg font-black flex items-center gap-2">
                        <RefreshCcw size={20} /> Procesar Devolución
                    </h2>
                    <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-4 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Producto a devolver</span>
                        <p className="text-sm font-black text-slate-800 line-clamp-2">{product.name}</p>
                    </div>

                    <form onSubmit={handleProcessReturn} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Motivo</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej: No le sirvió, Defectuoso"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full text-sm border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Monto a Reembolsar (RD$)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={refundAmount}
                                onChange={e => setRefundAmount(e.target.value)}
                                className="w-full text-lg font-black border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Este monto se registrará como un abono negativo (Reembolso) en el pedido.</p>
                        </div>

                        <label className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={returnToInventory}
                                onChange={e => setReturnToInventory(e.target.checked)}
                                className="mt-1 text-amber-600 focus:ring-amber-500 rounded"
                            />
                            <div>
                                <span className="block text-sm font-bold text-amber-900">Devolver al inventario</span>
                                <span className="block text-xs text-amber-700/80 mt-0.5">Desmárcalo si el artículo está roto o perdido.</span>
                            </div>
                        </label>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar Devolución'}
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
