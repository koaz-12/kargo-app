'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Order } from '../../types';
import { toast } from 'sonner';

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    client:clients(name)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setOrders(data || []);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            toast.error('Error al cargar pedidos');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'COMPLETED': return <CheckCircle2 className="text-emerald-500" size={16} />;
            case 'CANCELLED': return <XCircle className="text-red-500" size={16} />;
            case 'LAYAWAY': return <Clock className="text-amber-500" size={16} />;
            default: return <Package size={16} />;
        }
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'COMPLETED': return 'Pagado';
            case 'CANCELLED': return 'Cancelado';
            case 'LAYAWAY': return 'Apartado';
            default: return status;
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 pl-4 pr-16 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center gap-3">
                <button
                    onClick={() => router.push('/')}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-700 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Pedidos</h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Historial de Ventas</p>
                </div>
            </header>

            <div className="px-4 mt-6">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse"></div>)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 border-dashed">
                        <Package size={48} className="mb-4 text-slate-300" strokeWidth={1.5} />
                        <p className="text-sm font-bold text-slate-500">No hay pedidos</p>
                        <p className="text-xs mt-1 text-center px-8">Crea pedidos seleccionando productos desde el Inventario.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <div 
                                key={order.id} 
                                onClick={() => router.push(`/orders/${order.id}`)}
                                className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer active:scale-[0.98] transition-transform"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">{(order.client as any)?.name || 'Cliente Eliminado'}</h3>
                                        <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                        {getStatusIcon(order.status)}
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">{getStatusText(order.status)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-50">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                                    <span className="font-black text-lg text-indigo-600">RD$ {Number(order.total_amount).toLocaleString('es-DO')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
