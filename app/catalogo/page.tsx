import { createClient } from '@/lib/supabase/server';
import PublicProductCard from '@/components/catalogo/PublicProductCard';
import { PackageOpen } from 'lucide-react';

// Force dynamic rendering since inventory changes frequently
export const dynamic = 'force-dynamic';

export default async function CatalogoPage() {
    const supabase = await createClient();

    // Fetch only RECEIVED products, order by newest.
    // Assuming RLS allows anonymous read or we are bypassing it via server role (we will need to verify RLS later).
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, image_url, sale_price')
        .eq('status', 'RECEIVED')
        .order('created_at', { ascending: false });

    let errorMessage = null;
    if (error) {
        console.error("Error fetching catalog:", error);
        errorMessage = "Lo sentimos, hubo un problema técnico al cargar el catálogo. Por favor, intenta más tarde.";
    }

    const availableProducts = products || [];

    return (
        <main className="min-h-screen bg-slate-50 pb-20 max-w-md mx-auto shadow-2xl shadow-slate-200">
            {/* Header */}
            <header className="bg-white px-4 py-5 sticky top-0 z-20 border-b border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-3 rotate-3 shadow-inner">
                    <PackageOpen size={24} strokeWidth={2.5} />
                </div>
                <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Catálogo Disponible</h1>
                <p className="text-xs text-slate-500 mt-1 max-w-[250px] leading-relaxed">
                    Productos listos para entrega inmediata.
                </p>
            </header>

            {/* Content */}
            <div className="p-4">
                {errorMessage ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-400">
                            <PackageOpen size={32} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-700">Error de conexión</h2>
                        <p className="text-sm text-red-500 mt-2 max-w-[250px]">
                            {errorMessage}
                        </p>
                    </div>
                ) : availableProducts.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                            <PackageOpen size={32} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-700">Sin stock disponible</h2>
                        <p className="text-sm text-slate-400 mt-2 max-w-[200px]">
                            Actualmente no tenemos productos marcados como listos para entrega.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {availableProducts.map((product) => (
                            <PublicProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Contact/Footer info */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pointer-events-none">
                <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between pointer-events-auto">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock Actual</p>
                        <p className="text-sm font-bold">{availableProducts.length} Artículos</p>
                    </div>
                    {/* WhatsApp link */}
                    <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/30">
                        Contactar
                    </a>
                </div>
            </div>
        </main>
    );
}
