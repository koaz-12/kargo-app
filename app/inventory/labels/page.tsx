'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer, Loader2, QrCode } from 'lucide-react';
import { Product } from '../../../types';
import { toast } from 'sonner';
import Barcode from 'react-barcode';

export default function LabelsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSkus = searchParams.get('skus')?.split(',') || [];
    
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            let query = supabase.from('products').select('*');
            
            // If specific SKUs were passed in URL, filter by them. Otherwise load all RECEIVED.
            if (initialSkus.length > 0) {
                query = query.in('sku', initialSkus);
            } else {
                query = query.eq('status', 'RECEIVED');
            }

            const { data, error } = await query;
            if (error) throw error;
            
            // Only keep products that actually have a SKU
            const validProducts = (data || []).filter(p => p.sku);
            setProducts(validProducts);

            if (validProducts.length === 0) {
                toast.info('No hay productos con SKU para imprimir');
            }
        } catch (error: any) {
            console.error('Error loading products:', error);
            toast.error('Error al cargar productos');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white print:min-h-0">
            {/* Screen-only Header */}
            <header className="print:hidden sticky top-0 z-20 pt-6 pb-4 px-4 bg-slate-900 text-white flex items-center gap-3">
                <button
                    onClick={() => router.push('/inventory')}
                    className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <QrCode size={22} className="text-indigo-400" /> Etiquetas
                    </h1>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Impresora Térmica
                    </p>
                </div>
                <button
                    onClick={handlePrint}
                    disabled={products.length === 0}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                    <Printer size={18} /> <span className="hidden sm:inline">Imprimir</span>
                </button>
            </header>

            <div className="p-4 print:p-0">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 print:hidden">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="text-sm font-bold">Cargando etiquetas...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 font-bold print:hidden">
                        No hay productos con SKU para imprimir.
                    </div>
                ) : (
                    /* Print Grid: Formatted for thermal printers or standard paper */
                    /* Note: Actual dimensions depend on the printer. This creates a grid that wraps. */
                    <div className="flex flex-wrap gap-4 justify-center print:block print:w-full print:m-0 print:p-0">
                        {products.map((p, index) => (
                            <div 
                                key={`${p.id}-${index}`} 
                                className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-4 w-[60mm] h-[40mm] flex flex-col items-center justify-center text-center overflow-hidden
                                           print:border-none print:w-full print:h-auto print:mb-[10mm] print:page-break-inside-avoid print:p-0"
                            >
                                <span className="text-[10px] font-bold text-slate-800 line-clamp-1 mb-1 max-w-[90%] leading-tight">
                                    {p.name}
                                </span>
                                <div className="scale-75 origin-top mb-1">
                                    <Barcode 
                                        value={p.sku as string} 
                                        width={1.5} 
                                        height={40} 
                                        fontSize={12} 
                                        margin={0} 
                                        displayValue={true} 
                                        background="transparent"
                                    />
                                </div>
                                <span className="text-xs font-black text-slate-900">
                                    ${Number(p.sale_price || 0).toLocaleString()} DOP
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Print CSS Injection */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 0; }
                    body { -webkit-print-color-adjust: exact; margin: 0; padding: 10px; }
                    /* Hide everything except the labels container */
                    body > *:not(.print\\:bg-white) { display: none; }
                }
            `}} />
        </div>
    );
}
