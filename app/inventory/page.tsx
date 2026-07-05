import ProductList from "../../components/products/ProductList";
import { Package } from 'lucide-react';

export default function InventoryPage() {
    return (

        <main className="min-h-screen bg-slate-50/50 pb-28 max-w-md mx-auto relative">
            <header className="sticky top-0 z-20 pt-6 pb-4 px-4 bg-slate-50/80 backdrop-blur-xl mb-2 border-b border-slate-200/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Package size={22} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Mi Inventario</h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Historial General</p>
                </div>
            </header>
            <ProductList />
        </main>
    );
}
