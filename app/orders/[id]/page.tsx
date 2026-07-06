'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle2, DollarSign, Package, Loader2, RefreshCcw } from 'lucide-react';
import { Order, OrderPayment, Product } from '../../../types';
import { toast } from 'sonner';
import { ReturnModal } from '../../../components/modals/ReturnModal';

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [payments, setPayments] = useState<OrderPayment[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Return Modal State
    const [productToReturn, setProductToReturn] = useState<Product | null>(null);

    useEffect(() => {
        loadData();
    }, [params.id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Fetch order and client
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select(`
                    *,
                    client:clients(*)
                `)
                .eq('id', params.id)
                .single();
            if (orderError) throw orderError;
            setOrder(orderData);

            // Fetch payments
            const { data: paymentsData } = await supabase
                .from('order_payments')
                .select('*')
                .eq('order_id', params.id)
                .order('created_at', { ascending: true });
            setPayments(paymentsData || []);

            // Fetch products
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('order_id', params.id);
            setProducts(productsData || []);
        } catch (error: any) {
            console.error('Error loading order:', error);
            toast.error('Error al cargar detalles del pedido');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentAmount || Number(paymentAmount) <= 0) return;

        setIsSubmitting(true);
        try {
            const amountNum = Number(paymentAmount);
            await supabase.from('order_payments').insert([{
                order_id: params.id,
                amount: amountNum,
                payment_method: 'CASH',
                notes: 'Abono manual'
            }]);

            // Check if fully paid
            const newTotalPaid = totalPaid + amountNum;
            if (newTotalPaid >= (order?.total_amount || 0) && order?.status === 'LAYAWAY') {
                await supabase.from('orders').update({ status: 'COMPLETED' }).eq('id', params.id);
            }

            toast.success('Abono registrado');
            setIsPaymentModalOpen(false);
            setPaymentAmount('');
            loadData();
        } catch (error) {
            toast.error('Error al guardar el abono');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center text-slate-400 bg-slate-50"><Loader2 className="animate-spin" size={32} /></div>;
    }

    if (!order) {
        return <div className="min-h-screen flex items-center justify-center text-slate-400 bg-slate-50 text-sm font-bold">Pedido no encontrado</div>;
    }

    const totalPaid = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const balanceDue = Math.max(0, Number(order.total_amount) - totalPaid);
    const isCompleted = order.status === 'COMPLETED' || balanceDue === 0;

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 px-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center gap-3">
                <button
                    onClick={() => router.push('/orders')}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-700 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Detalles del Pedido</h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">ID: {order.id.slice(0, 8)}</p>
                </div>
            </header>

            <div className="px-4 mt-6 space-y-4">
                {/* Status Card */}
                <div className={`p-5 rounded-3xl ${isCompleted ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-xl' : 'bg-amber-500 text-white shadow-amber-200 shadow-xl'}`}>
                    <div className="flex items-center gap-2 mb-4">
                        {isCompleted ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        <span className="font-black text-lg tracking-tight uppercase">
                            {isCompleted ? 'PAGO COMPLETO' : 'APARTADO ACTIVO'}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/20">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80 mb-1">Total</span>
                            <span className="font-black">${Number(order.total_amount).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80 mb-1">Pagado</span>
                            <span className="font-black">${totalPaid.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80 mb-1">Restante</span>
                            <span className="font-black">${balanceDue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {!isCompleted && (
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black transition-colors shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                    >
                        <DollarSign size={20} /> Registrar Abono
                    </button>
                )}

                {/* Client Info */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Cliente</h3>
                    {order.client ? (
                        <div>
                            <p className="font-black text-slate-800 text-sm">{(order.client as any).name}</p>
                            {(order.client as any).instagram && <p className="text-xs text-slate-500 mt-1">@{(order.client as any).instagram}</p>}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">Cliente eliminado</p>
                    )}
                </div>

                {/* Products */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Productos Incluidos ({products.length})</h3>
                    <div className="space-y-2">
                        {products.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                        <Package size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 line-clamp-1">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="font-bold text-slate-900">${Number(p.sale_price).toLocaleString()}</span>
                                    <button 
                                        onClick={() => setProductToReturn(p)}
                                        className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded border border-rose-100 font-bold uppercase hover:bg-rose-100 transition-colors"
                                    >
                                        Devolver
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Historial de Pagos</h3>
                    {payments.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No hay abonos registrados</p>
                    ) : (
                        <div className="space-y-2">
                            {payments.map(pay => (
                                <div key={pay.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-emerald-600">+{Number(pay.amount).toLocaleString()}</span>
                                        <span className="text-[10px] font-medium text-slate-400">{new Date(pay.created_at).toLocaleString()}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{pay.payment_method}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
                        <h2 className="text-lg font-black text-slate-800 mb-4">Registrar Abono</h2>
                        <form onSubmit={handleAddPayment}>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Monto del Abono</label>
                            <div className="relative mb-4">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={balanceDue}
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    className="w-full pl-8 text-lg font-black text-slate-800 border border-slate-200/60 bg-slate-50/50 rounded-xl pr-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                />
                                <button type="button" onClick={() => setPaymentAmount(balanceDue.toString())} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                    Todo
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !paymentAmount}
                                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Guardando...' : 'Guardar Abono'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            <ReturnModal 
                isOpen={!!productToReturn}
                onClose={() => setProductToReturn(null)}
                orderId={params.id}
                product={productToReturn as Product}
                onReturnProcessed={loadData}
            />
        </div>
    );
}
