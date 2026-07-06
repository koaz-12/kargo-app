import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabaseClient';
import { X, Search, Loader2, CheckCircle, Package } from 'lucide-react';
import { Client } from '../../types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProductIds: string[];
    onOrderCreated: () => void;
}

export function CreateOrderModal({ isOpen, onClose, selectedProductIds, onOrderCreated }: CreateOrderModalProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    
    const [status, setStatus] = useState<'LAYAWAY' | 'COMPLETED'>('LAYAWAY');
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [amountPaid, setAmountPaid] = useState<number>(0);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            loadClients();
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const loadClients = async () => {
        setIsLoadingClients(true);
        const { data } = await supabase.from('clients').select('*').order('name');
        setClients(data || []);
        setIsLoadingClients(false);
    };

    if (!mounted || !isOpen) return null;

    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    const handleCreateOrder = async () => {
        if (!selectedClient) {
            toast.error('Debes seleccionar un cliente');
            return;
        }
        if (selectedProductIds.length === 0) {
            toast.error('No hay productos seleccionados');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Fetch total sale_price of products
            const { data: productsData } = await supabase
                .from('products')
                .select('sale_price')
                .in('id', selectedProductIds);
            
            const totalAmount = productsData?.reduce((acc, curr) => acc + (curr.sale_price || 0), 0) || 0;
            const finalTotal = totalAmount + Number(shippingCost) - Number(discount);

            // 2. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    client_id: selectedClient.id,
                    status,
                    total_amount: finalTotal,
                    shipping_cost: Number(shippingCost),
                    discount: Number(discount)
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 3. Register initial payment if any
            if (Number(amountPaid) > 0) {
                await supabase.from('order_payments').insert([{
                    order_id: orderData.id,
                    amount: Number(amountPaid),
                    payment_method: 'CASH', // Default
                    notes: 'Abono inicial'
                }]);
            }

            // 4. Update products (Link to order and change status to SOLD)
            await supabase
                .from('products')
                .update({ 
                    order_id: orderData.id,
                    status: 'SOLD'
                })
                .in('id', selectedProductIds);

            toast.success('Pedido creado exitosamente');
            onOrderCreated();
            onClose();
        } catch (error: any) {
            console.error('Error creating order:', error);
            toast.error('Hubo un error al crear el pedido');
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-10 sm:slide-in-from-bottom-0 duration-200 max-h-[90vh] flex flex-col">
                
                <div className="bg-indigo-600 p-5 flex items-center justify-between text-white shrink-0">
                    <div>
                        <h3 className="text-lg font-black flex items-center gap-2">
                            <Package size={20} /> Crear Pedido
                        </h3>
                        <p className="text-xs text-indigo-200 mt-1">{selectedProductIds.length} productos seleccionados</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    {/* Client Selection */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">1. Seleccionar Cliente</label>
                        {!selectedClient ? (
                            <div>
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="max-h-[150px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
                                    {isLoadingClients ? (
                                        <div className="p-4 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" size={18} /></div>
                                    ) : filteredClients.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedClient(c)}
                                            className="w-full text-left p-3 hover:bg-indigo-50 transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">{c.name.charAt(0)}</div>
                                            <div>
                                                <span className="block font-bold text-slate-800 text-sm">{c.name}</span>
                                                {c.instagram && <span className="block text-[10px] text-slate-500">@{c.instagram}</span>}
                                            </div>
                                        </button>
                                    ))}
                                    {filteredClients.length === 0 && !isLoadingClients && (
                                        <div className="p-4 text-center text-sm text-slate-500">
                                            No se encontró. <button onClick={() => { onClose(); router.push('/clients'); }} className="text-indigo-600 font-bold underline">Crear nuevo</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">{selectedClient.name.charAt(0)}</div>
                                    <span className="font-bold text-indigo-900 text-sm">{selectedClient.name}</span>
                                </div>
                                <button onClick={() => setSelectedClient(null)} className="text-xs font-bold text-indigo-600 hover:underline">Cambiar</button>
                            </div>
                        )}
                    </div>

                    {/* Order Details */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">2. Detalles Financieros</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 mb-1 block">Costo de Envío</label>
                                <input type="number" min="0" value={shippingCost} onChange={e => setShippingCost(Number(e.target.value))} className="w-full text-sm border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 mb-1 block">Descuento Global</label>
                                <input type="number" min="0" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full text-sm border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                            </div>
                        </div>
                    </div>

                    {/* Status & Payment */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">3. Estado del Pedido</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 mb-4">
                            <button
                                onClick={() => { setStatus('LAYAWAY'); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${status === 'LAYAWAY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Apartado
                            </button>
                            <button
                                onClick={() => { setStatus('COMPLETED'); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${status === 'COMPLETED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                Pago Completo
                            </button>
                        </div>

                        {status === 'LAYAWAY' && (
                            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl animate-in fade-in">
                                <label className="text-[11px] font-bold text-amber-700 mb-1 block">Abono Inicial (Opcional)</label>
                                <input type="number" min="0" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} className="w-full text-sm border border-amber-200/50 bg-white rounded-lg px-3 py-2 outline-none focus:border-amber-400" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                    <button
                        onClick={handleCreateOrder}
                        disabled={!selectedClient || isSubmitting}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:shadow-none shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle size={20} /> Finalizar Pedido</>}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
